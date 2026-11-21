import { useCallback, useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { type Region } from 'wavesurfer.js/plugins/regions';
import TimelinePlugin from 'wavesurfer.js/plugins/timeline';
import HoverPlugin from 'wavesurfer.js/plugins/hover';
import { formatSecondsToDuration } from '../../../utils/formatTime';
import type { Section } from '../../sections/types';
import { MIN_LOOP } from '../loopLogic';
import type { PlayerController } from '../playerController';
import { chipRows, drawableSections, followScrollLeft, isHorizontalWheel, pixelsPerSecond } from './timelineLogic';
import type { TimelinePalette } from './timelinePalette';

const LOOP_REGION_ID = 'loop';
const SECTION_ID_PREFIX = 'section-';

// Tall enough to hold two staggered rows of section labels inside the band.
// Labels have to live inside it: the renderer's scroll container is
// overflow-x: auto, which makes the cross axis clip too.
const TRACK_HEIGHT = 48;
const CHIP_ROWS = 2;
const RULER_HEIGHT = 20;

// A region drag reports positions continuously, and those come back from the
// controller a moment later. Only push the controller's value into the region
// when it differs by more than this, otherwise the round trip never settles.
const SYNC_EPSILON = 0.01;

// A ruler drag shorter than this is a tap, which seeks like a tap on the track.
const RULER_DRAG_THRESHOLD = 4;

// We never have real audio for a YouTube video, so the waveform band is painted
// as a solid bar. wavesurfer sets fillStyle to waveColor before calling this,
// then clones the canvas and recolours the copy with progressColor, so one fill
// yields both the played and unplayed halves.
const renderTrackBar = (_peaks: Array<Float32Array | number[]>, ctx: CanvasRenderingContext2D) => {
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

// wavesurfer needs some channel data to build its buffer; renderTrackBar ignores it.
const PLACEHOLDER_PEAKS = [[0, 0]];

// Region bodies swallow drag-to-create: every region wires up its own
// makeDraggable, whose pointermove calls preventDefault, and the wrapper-level
// handler that enableDragSelection installs bails out on defaultPrevented. So
// every region gets an inert body, and only the parts that need clicks
// (resize handles, section labels) get pointer events back.
const styleRegion = (region: Region, edgeColor?: string) => {
  const element = region.element;
  if (!element) return;
  element.style.pointerEvents = 'none';
  element.querySelectorAll<HTMLElement>('[part~="region-handle"]').forEach((handle) => {
    handle.style.pointerEvents = 'auto';
    if (!edgeColor) return;
    const isLeft = handle.getAttribute('part')?.includes('handle-left');
    handle.style[isLeft ? 'borderLeft' : 'borderRight'] = `3px solid ${edgeColor}`;
  });
  element.querySelectorAll<HTMLElement>('[data-interactive]').forEach((node) => {
    node.style.pointerEvents = 'auto';
  });
};

interface Handlers {
  onJumpToSection: (start: number, end: number) => void;
  onSectionMenu: (section: Section, x: number, y: number) => void;
}

// Region content lands inside the renderer's shadow root, where Chakra's class
// names don't reach, hence plain DOM and inline styles. The caret defers to a
// Chakra menu rendered outside the shadow root by WaveformTimeline.
const buildSectionChip = (section: Section, row: number, handlers: { current: Handlers }, palette: TimelinePalette) => {
  const chip = document.createElement('div');
  chip.dataset.interactive = 'true';
  Object.assign(chip.style, {
    position: 'absolute',
    top: `${4 + row * 20}px`,
    left: '0',
    display: 'inline-flex',
    alignItems: 'center',
    background: palette.chip,
    color: palette.chipText,
    font: '500 11px/1 system-ui, -apple-system, sans-serif',
    borderRadius: '9999px',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
  });

  const name = document.createElement('span');
  name.textContent = section.name || 'Unnamed';
  name.title = `${formatSecondsToDuration(section.start_time)} – ${formatSecondsToDuration(section.end_time)}`;
  Object.assign(name.style, { padding: '4px 2px 4px 9px', cursor: 'pointer' });
  name.addEventListener('click', (event) => {
    event.stopPropagation();
    handlers.current.onJumpToSection(section.start_time, section.end_time);
  });

  const caret = document.createElement('button');
  caret.type = 'button';
  caret.setAttribute('aria-label', `Options for ${section.name || 'Unnamed'}`);
  caret.textContent = '⌄';
  Object.assign(caret.style, {
    background: 'none',
    border: 'none',
    color: 'inherit',
    font: 'inherit',
    lineHeight: '1',
    padding: '2px 8px 6px 4px',
    cursor: 'pointer',
  });
  caret.addEventListener('click', (event) => {
    event.stopPropagation();
    handlers.current.onSectionMenu(section, event.clientX, event.clientY);
  });

  chip.append(name, caret);
  return chip;
};

/**
 * Touch: a drag on the track has to reach wavesurfer as a drag, not become
 * text selection or native scrolling (which is what Safari on iPad did). The
 * ruler underneath scrolls the zoomed track instead, by hand, so both work.
 */
const disableNativeTouchGestures = (wrapper: HTMLElement) => {
  Object.assign(wrapper.style, {
    touchAction: 'none',
    userSelect: 'none',
    webkitUserSelect: 'none',
    webkitTouchCallout: 'none',
  });
};

interface UseWaveformTimelineOptions extends Handlers {
  controller: PlayerController;
  duration: number;
  sections: Section[];
  /** Colors for the current color mode. A change rebuilds the timeline. */
  palette: TimelinePalette;
}

const useWaveformTimeline = ({
  controller,
  duration,
  sections,
  palette,
  onJumpToSection,
  onSectionMenu,
}: UseWaveformTimelineOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const loopRegionRef = useRef<Region | null>(null);
  const sectionRegionsRef = useRef(new Map<string, Region>());
  const zoomIndexRef = useRef(0);
  const [zoomIndex, setZoomIndex] = useState(0);
  // Regions can only be added once the plugin knows the duration, so the
  // effects below wait for 'ready'. A counter rather than a boolean: the
  // instance is rebuilt when the duration is refined, and "not ready" then
  // "ready" can land in one render, which a boolean wouldn't register as a
  // change, leaving the new instance without its saved loops.
  const readyCount = useRef(0);
  const [readyInstance, setReadyInstance] = useState(0);
  const isReady = readyInstance > 0;
  const followingRef = useRef(true);
  const [isFollowing, setIsFollowing] = useState(true);

  // Callbacks get a new identity every render. Holding them in a ref keeps
  // them out of the instance effect's deps, so a re-render never rebuilds the
  // waveform.
  const handlers = useRef<Handlers>({ onJumpToSection, onSectionMenu });
  useEffect(() => {
    handlers.current = { onJumpToSection, onSectionMenu };
  });

  /** Scrolls so the playhead is in view, if following and it isn't. */
  const keepPlayheadInView = useCallback((time: number) => {
    const wavesurfer = wavesurferRef.current;
    if (!wavesurfer || !followingRef.current) return;
    const wrapper = wavesurfer.getWrapper();
    const scroller = wrapper.parentElement;
    const total = wavesurfer.getDuration();
    if (!scroller || !(total > 0)) return;
    const target = followScrollLeft({
      playheadPx: (time / total) * wrapper.scrollWidth,
      scrollLeft: wavesurfer.getScroll(),
      viewWidth: scroller.clientWidth,
      contentWidth: wrapper.scrollWidth,
    });
    if (target !== null) wavesurfer.setScroll(target);
  }, []);

  const setFollowing = useCallback(
    (following: boolean) => {
      followingRef.current = following;
      setIsFollowing(following);
      if (following) keepPlayheadInView(controller.getTime());
    },
    [controller, keepPlayheadInView],
  );

  // Re-applied on every zoom change and whenever the container resizes: the
  // fit-to-width baseline depends on clientWidth, so a stale minPxPerSec would
  // make a narrowed window scroll at level 1.
  const applyZoom = useCallback(() => {
    const wavesurfer = wavesurferRef.current;
    const container = containerRef.current;
    // zoom() throws until the instance has loaded, and the instance is rebuilt
    // whenever the duration is refined, so this can run against a new one.
    if (!wavesurfer || !container || !wavesurfer.getDecodedData()) return;
    const target = pixelsPerSecond(container.clientWidth, duration, zoomIndexRef.current);
    if (target === null || Math.abs((wavesurfer.options.minPxPerSec || 0) - target) < 0.01) return;
    wavesurfer.zoom(target);
  }, [duration]);

  // Create the instance once per duration. No url and no media: wavesurfer's
  // load() runs on (peaks && duration) alone, skipping fetch and decode.
  useEffect(() => {
    if (!containerRef.current || !duration) return undefined;

    const regions = RegionsPlugin.create();
    regionsRef.current = regions;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      peaks: PLACEHOLDER_PEAKS,
      duration,
      height: TRACK_HEIGHT,
      waveColor: palette.track,
      progressColor: palette.played,
      cursorColor: palette.playhead,
      cursorWidth: 3,
      renderFunction: renderTrackBar,
      interact: true,
      dragToSeek: false,
      fillParent: true,
      // Following the playhead is handled here, so that scrolling by hand can
      // turn it off. wavesurfer's own autoScroll snapped back on every tick.
      autoScroll: false,
      autoCenter: false,
      plugins: [
        regions,
        // Left to its default the ruler is appended inside the renderer's
        // wrapper, below the band, which is the element that gets the zoomed
        // width, so ruler and track always agree about where a second is.
        TimelinePlugin.create({
          height: RULER_HEIGHT,
          formatTimeCallback: formatSecondsToDuration,
        }),
        HoverPlugin.create({
          lineColor: palette.playhead,
          lineWidth: 1,
          labelBackground: palette.hoverLabel,
          labelColor: palette.hoverLabelText,
          labelSize: 11,
          formatTimeCallback: formatSecondsToDuration,
        }),
      ],
    });
    wavesurferRef.current = wavesurfer;

    const wrapper = wavesurfer.getWrapper();
    const scroller = wrapper.parentElement;
    disableNativeTouchGestures(wrapper);

    // 'interaction' fires only for real clicks on the waveform. Not
    // 'timeupdate': setTime() emits that too, which would loop back into a seek.
    wavesurfer.on('interaction', (time) => controller.seek(time));

    // Dragging across the track redefines the loop. enableDragSelection builds
    // a throwaway region per drag; once the gesture ends its bounds are folded
    // into the persistent loop region. Its 3px threshold keeps a tap a seek.
    regions.enableDragSelection({ color: palette.loop });

    regions.on('region-update', (region) => {
      if (region.id === LOOP_REGION_ID) controller.previewLoop(region.start, region.end);
    });
    regions.on('region-updated', (region) => {
      if (region.id !== LOOP_REGION_ID) return;
      controller.previewLoop(region.start, region.end);
      controller.endLoopPreview();
    });
    regions.on('region-created', (region) => {
      if (region.id === LOOP_REGION_ID || region.id.startsWith(SECTION_ID_PREFIX)) return;
      const { start, end } = region;
      region.remove();
      const loop = loopRegionRef.current;
      if (!loop || end - start < MIN_LOOP) return;
      loop.setOptions({ start, end });
      controller.previewLoop(start, end);
      controller.endLoopPreview();
    });

    // Regions clamp their bounds against the plugin's duration, which is only
    // known on 'ready'. Adding the loop earlier collapses it to zero length.
    wavesurfer.on('ready', () => {
      if (!loopRegionRef.current) {
        const { loop } = controller.getState();
        loopRegionRef.current = regions.addRegion({
          id: LOOP_REGION_ID,
          start: loop.start,
          end: loop.end || duration,
          color: palette.loop,
          drag: false,
          resize: true,
          minLength: MIN_LOOP,
        });
        styleRegion(loopRegionRef.current, palette.loopEdge);
      }
      wavesurfer.setTime(controller.getTime());
      readyCount.current += 1;
      setReadyInstance(readyCount.current);
    });

    wavesurfer.on('resize', applyZoom);

    // Dragging the ruler scrolls the track. A short press is still a tap,
    // which falls through to wavesurfer's click-to-seek.
    let rulerDrag: { pointerId: number; startX: number; startScroll: number; moved: boolean } | null = null;
    // The ruler doesn't take pointer events itself (they fall through to the
    // track), so it's recognised by position: the band below the track.
    const rulerOf = (event: PointerEvent) => {
      const ruler = wrapper.querySelector('[part="timeline-wrapper"]');
      if (!ruler) return false;
      const { top, bottom } = ruler.getBoundingClientRect();
      return event.clientY >= top && event.clientY <= bottom;
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rulerOf(event)) return;
      // Keep wavesurfer's drag-to-make-a-loop from starting on the ruler.
      event.stopPropagation();
      rulerDrag = { pointerId: event.pointerId, startX: event.clientX, startScroll: wavesurfer.getScroll(), moved: false };
      wrapper.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!rulerDrag || event.pointerId !== rulerDrag.pointerId) return;
      const dx = event.clientX - rulerDrag.startX;
      if (!rulerDrag.moved && Math.abs(dx) < RULER_DRAG_THRESHOLD) return;
      if (!rulerDrag.moved) {
        rulerDrag.moved = true;
        setFollowing(false);
      }
      wavesurfer.setScroll(rulerDrag.startScroll - dx);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!rulerDrag || event.pointerId !== rulerDrag.pointerId) return;
      const { moved } = rulerDrag;
      rulerDrag = null;
      wrapper.releasePointerCapture?.(event.pointerId);
      // A drag isn't a seek: swallow the click that may follow it. Touch drags
      // often produce no click, so the blocker expires right after this gesture.
      if (moved) {
        const swallow = (click: Event) => click.stopPropagation();
        wrapper.addEventListener('click', swallow, { capture: true, once: true });
        setTimeout(() => wrapper.removeEventListener('click', swallow, { capture: true }), 0);
      }
    };
    // Sideways wheel and trackpad gestures scroll natively; they just stop following.
    const onWheel = (event: WheelEvent) => {
      if (isHorizontalWheel(event)) setFollowing(false);
    };
    wrapper.addEventListener('pointerdown', onPointerDown, { capture: true });
    wrapper.addEventListener('pointermove', onPointerMove);
    wrapper.addEventListener('pointerup', onPointerUp);
    wrapper.addEventListener('pointercancel', onPointerUp);
    scroller?.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      scroller?.removeEventListener('wheel', onWheel);
      wavesurferRef.current = null;
      regionsRef.current = null;
      loopRegionRef.current = null;
      sectionRegionsRef.current = new Map();
      setReadyInstance(0);
      wavesurfer.destroy();
    };
  }, [duration, palette, applyZoom, controller, setFollowing]);

  // Playback time goes straight from the controller to the renderer, without
  // passing through React state.
  useEffect(() => {
    if (!isReady) return undefined;
    return controller.subscribeTime((time) => {
      wavesurferRef.current?.setTime(time);
      keepPlayheadInView(time);
    });
  }, [controller, isReady, readyInstance, keepPlayheadInView]);

  // Loop changes made elsewhere (jumping to a saved loop) are reflected on the
  // track, and play, restart or a jump turn following back on.
  useEffect(() => {
    if (!isReady) return undefined;
    let lastFollowRequest = controller.getState().followRequest;
    const sync = () => {
      const state = controller.getState();
      const loop = loopRegionRef.current;
      if (
        loop &&
        (Math.abs(loop.start - state.loop.start) > SYNC_EPSILON || Math.abs(loop.end - state.loop.end) > SYNC_EPSILON)
      ) {
        loop.setOptions({ start: state.loop.start, end: state.loop.end });
      }
      if (state.followRequest !== lastFollowRequest) {
        lastFollowRequest = state.followRequest;
        setFollowing(true);
      }
    };
    sync();
    return controller.subscribe(sync);
  }, [controller, isReady, readyInstance, setFollowing]);

  // Zooming in on a long video is the difference between a 3-second loop being
  // half a percent of the track and being workable. Afterwards, land on the
  // loop rather than wherever the previous scroll offset happened to be.
  useEffect(() => {
    zoomIndexRef.current = zoomIndex;
    const wavesurfer = wavesurferRef.current;
    if (!wavesurfer || !isReady) return;
    applyZoom();
    wavesurfer.setScrollTime(controller.getState().loop.start);
  }, [zoomIndex, isReady, readyInstance, applyZoom, controller]);

  // Saved loops are their own regions on the same track, diffed rather than
  // rebuilt so untouched regions keep their DOM and a rebuild doesn't fight an
  // in-flight tap on a chip.
  useEffect(() => {
    const regions = regionsRef.current;
    if (!regions || !isReady) return;

    const live = sectionRegionsRef.current;
    const seen = new Set<string>();
    const usable = drawableSections(sections);
    const rowById = chipRows(usable, CHIP_ROWS);

    usable.forEach((section) => {
      const id = `${SECTION_ID_PREFIX}${section.id}`;
      seen.add(id);
      const existing = live.get(id);

      if (existing) {
        if (
          Math.abs(existing.start - section.start_time) > SYNC_EPSILON ||
          Math.abs(existing.end - section.end_time) > SYNC_EPSILON
        ) {
          existing.setOptions({ start: section.start_time, end: section.end_time });
        }
        // Renaming is the only edit either backend supports.
        const label = existing.element?.querySelector('span');
        if (label && label.textContent !== (section.name || 'Unnamed')) {
          label.textContent = section.name || 'Unnamed';
        }
        return;
      }

      const region = regions.addRegion({
        id,
        start: section.start_time,
        end: section.end_time,
        color: palette.section,
        drag: false,
        resize: false,
        content: buildSectionChip(section, rowById.get(section.id) ?? 0, handlers, palette),
      });
      styleRegion(region);
      live.set(id, region);
    });

    live.forEach((region, id) => {
      if (seen.has(id)) return;
      region.remove();
      live.delete(id);
    });
  }, [sections, palette, isReady, readyInstance]);

  return { containerRef, zoomIndex, setZoomIndex, isFollowing, follow: () => setFollowing(true) };
};

export default useWaveformTimeline;
