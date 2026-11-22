import { useCallback, useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { type Region } from 'wavesurfer.js/plugins/regions';
import TimelinePlugin from 'wavesurfer.js/plugins/timeline';
import HoverPlugin from 'wavesurfer.js/plugins/hover';
import { formatSecondsToDuration } from '../../../utils/formatTime';
import type { Section } from '../../sections/types';
import { MIN_LOOP } from '../loopLogic';
import type { PlayerController } from '../playerController';
import { drawableSections, followScrollLeft, isHorizontalWheel, pixelsPerSecond, tickIntervals } from './timelineLogic';

// The track is quiet so the loop leads. Light warm greys, flattened against
// the #FAF9F6 panel rather than left translucent. They have to be opaque: the
// progress canvas is the main canvas recomposited with 'source-in', which
// multiplies the two alphas, so a translucent waveColor drags progressColor
// down with it.
// Both are tokens flattened onto the panel: the track matches the pill buttons
// at rest, and the played part is the same neutral two steps darker.
const TRACK_COLOR = '#EBEAE7'; // bg.muted (blackAlpha.100) over #FAF9F6
const PLAYED_COLOR = '#D2D1CE'; // border.strong (blackAlpha.300) over #FAF9F6
const PLAYHEAD_COLOR = '#161719'; // ink
const HOVER_LINE_COLOR = 'rgba(22, 23, 25, 0.35)'; // ink, faint
const LOOP_COLOR = 'rgba(128, 90, 213, 0.28)'; // purple.500
const LOOP_EDGE_COLOR = '#553C9A'; // purple.700
/** The grip on each edge of a loop, in px. Shared with the homepage's pictures of the timeline. */
export const LOOP_GRIP = { width: 8, height: 20, border: 1.5 } as const;
const SECTION_COLOR = 'rgba(85, 60, 154, 0.12)'; // purple.700, well under the loop
// A saved loop's span while its pill is hovered.
const SECTION_HIGHLIGHT_COLOR = 'rgba(85, 60, 154, 0.28)';
const LOOP_REGION_ID = 'loop';
const SECTION_ID_PREFIX = 'section-';

// Saved loops are named in a list of pills above the timeline (LoopPills),
// not on the track, so the band stays free for dragging out a loop.
const TRACK_HEIGHT = 68;
const RULER_HEIGHT = 20;
const TRACK_RADIUS = 8;

/**
 * Styles for wavesurfer's own elements, which live in its shadow DOM and only
 * take inline styles through their options. Hence the !important.
 */
const TRACK_STYLES = `
  /* A rounded track. The overlays are clipped to it, so they never spill onto
     the ruler and the loop's corners follow the track's. */
  [part~="canvases"] { border-radius: ${TRACK_RADIUS}px; overflow: hidden; }
  /* The played part ends square at the playhead. */
  [part="progress"] {
    height: ${TRACK_HEIGHT}px !important;
    border-radius: ${TRACK_RADIUS}px 0 0 ${TRACK_RADIUS}px;
    overflow: hidden;
  }
  [part="regions-container"] {
    height: ${TRACK_HEIGHT}px !important;
    border-radius: ${TRACK_RADIUS}px;
    overflow: hidden;
  }
  [part="cursor"], [part="hover"] { height: ${TRACK_HEIGHT}px !important; }
  /* Above the track's fill, under the loop and saved loops. */
  [part="ticks"] {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: ${TRACK_HEIGHT}px;
    z-index: 3;
    pointer-events: none;
  }
  [part="cursor"] { border-radius: 1px; }
  [part="hover-label"] { border-radius: 4px; padding: 1px 5px !important; font-variant-numeric: tabular-nums; }

  /* The loop's edges get a grip, so they read as something to drag. */
  [part~="loop"] [part~="region-handle"]::after {
    content: '';
    position: absolute;
    top: 50%;
    width: ${LOOP_GRIP.width}px;
    height: ${LOOP_GRIP.height}px;
    transform: translateY(-50%);
    background: #FFFFFF;
    border: ${LOOP_GRIP.border}px solid ${LOOP_EDGE_COLOR};
    border-radius: 9999px;
    box-sizing: border-box;
  }
  [part~="loop"] [part~="region-handle-left"]::after { left: -5px; }
  [part~="loop"] [part~="region-handle-right"]::after { right: -5px; }

  /* A small gap between the track and the ruler. */
  [part="timeline-wrapper"] { margin-top: 4px; }

  /* Until a loop is picked it spans the whole song, and isn't drawn: no fill,
     no edges, no grips. Hidden handles also leave the track's ends free for
     dragging out a selection. */
  [part~="loop"][data-whole-song] { background-color: transparent !important; }
  [part~="loop"][data-whole-song] [part~="region-handle"] { visibility: hidden; }
`;

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
// every region gets an inert body, and only its resize handles get pointer
// events back.
const styleRegion = (region: Region, edgeColor?: string) => {
  const element = region.element;
  if (!element) return;
  element.style.pointerEvents = 'none';
  element.style.borderRadius = '0';
  element.querySelectorAll<HTMLElement>('[part~="region-handle"]').forEach((handle) => {
    handle.style.pointerEvents = 'auto';
    // A wider hit area than the 2px edge it draws, for fingers.
    handle.style.width = '12px';
    if (!edgeColor) return;
    const isLeft = handle.getAttribute('part')?.includes('handle-left');
    handle.style[isLeft ? 'borderLeft' : 'borderRight'] = `2px solid ${edgeColor}`;
    handle.style.borderRadius = '0';
  });
};

// Lines on the track, spaced like the ruler: short at each tick, medium at
// the in-between labels, tall at the labelled times, on a faint midline.
const TICK_COLOR = 'rgba(22, 23, 25, 0.14)'; // ink, faint
const TICK_HEIGHTS = { tick: 0.2, secondary: 0.4, primary: 0.72 }; // of the track

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Draws the tick lines across the track at the current zoom, as an SVG of
 * crisp 1px lines snapped to whole pixels (background gradients blur them
 * whenever the spacing isn't a whole number of pixels).
 */
const drawTicks = (svg: SVGSVGElement, widthPx: number, duration: number) => {
  const pxPerSec = widthPx / duration;
  const { tick, secondary, primary } = tickIntervals(pxPerSec);
  const mid = TRACK_HEIGHT / 2;
  const isMultiple = (time: number, step: number) => Math.abs(time / step - Math.round(time / step)) < 1e-6;
  let path = `M0 ${mid + 0.5}H${widthPx}`; // the midline
  // Skips 0 and the very end, where a line would sit on the track's rounded edge.
  for (let time = tick; time < duration; time += tick) {
    const fraction = isMultiple(time, primary)
      ? TICK_HEIGHTS.primary
      : isMultiple(time, secondary)
        ? TICK_HEIGHTS.secondary
        : TICK_HEIGHTS.tick;
    const half = Math.round((TRACK_HEIGHT * fraction) / 2);
    const x = Math.round(time * pxPerSec) + 0.5;
    path += `M${x} ${mid - half}V${mid + half}`;
  }
  svg.setAttribute('viewBox', `0 0 ${widthPx} ${TRACK_HEIGHT}`);
  svg.firstElementChild?.setAttribute('d', path);
};

/** Flags the loop region while it spans the whole song, before any selection, so it isn't drawn. */
const markWholeSong = (region: Region, wholeSong: boolean) => {
  region.element?.toggleAttribute('data-whole-song', wholeSong);
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

interface UseWaveformTimelineOptions {
  controller: PlayerController;
  duration: number;
  sections: Section[];
  /** A saved loop to emphasise on the track, such as the one whose pill is hovered. */
  highlightedSectionId?: string | null;
}


const useWaveformTimeline = ({ controller, duration, sections, highlightedSectionId = null }: UseWaveformTimelineOptions) => {
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
      waveColor: TRACK_COLOR,
      progressColor: PLAYED_COLOR,
      cursorColor: PLAYHEAD_COLOR,
      cursorWidth: 2,
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
          lineColor: HOVER_LINE_COLOR,
          lineWidth: 1,
          labelBackground: PLAYHEAD_COLOR,
          labelColor: '#FFFFFF',
          labelSize: 11,
          formatTimeCallback: formatSecondsToDuration,
        }),
      ],
    });
    wavesurferRef.current = wavesurfer;

    const wrapper = wavesurfer.getWrapper();
    const scroller = wrapper.parentElement;
    disableNativeTouchGestures(wrapper);
    const root = wrapper.getRootNode();
    if (root instanceof ShadowRoot) {
      const style = document.createElement('style');
      style.textContent = TRACK_STYLES;
      root.appendChild(style);
    }

    // 'interaction' fires only for real clicks on the waveform. Not
    // 'timeupdate': setTime() emits that too, which would loop back into a seek.
    wavesurfer.on('interaction', (time) => controller.seek(time));

    // Dragging across the track redefines the loop. enableDragSelection builds
    // a throwaway region per drag; once the gesture ends its bounds are folded
    // into the persistent loop region. Its 3px threshold keeps a tap a seek.
    regions.enableDragSelection({ color: LOOP_COLOR });

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
      // A fresh drag replaces the selection, whatever saved loop it came from.
      controller.startNewLoop(start, end);
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
          color: LOOP_COLOR,
          drag: false,
          resize: true,
          minLength: MIN_LOOP,
        });
        styleRegion(loopRegionRef.current, LOOP_EDGE_COLOR);
        markWholeSong(loopRegionRef.current, !controller.getState().hasCustomLoop);
      }
      wavesurfer.setTime(controller.getTime());
      readyCount.current += 1;
      setReadyInstance(readyCount.current);
    });

    wavesurfer.on('resize', applyZoom);

    // The tick lines, redrawn whenever the zoom (and so the spacing) changes.
    const ticks = document.createElementNS(SVG_NS, 'svg');
    ticks.setAttribute('part', 'ticks');
    ticks.setAttribute('height', String(TRACK_HEIGHT));
    ticks.setAttribute('shape-rendering', 'crispEdges');
    // Sized by CSS to the wrapper, never by its own width: anything wider than
    // the wrapper would stretch the scroll area past the end of the song.
    ticks.setAttribute('preserveAspectRatio', 'none');
    const tickPath = document.createElementNS(SVG_NS, 'path');
    tickPath.setAttribute('stroke', TICK_COLOR);
    tickPath.setAttribute('stroke-width', '1');
    ticks.appendChild(tickPath);
    wrapper.appendChild(ticks);
    const redrawTicks = () => {
      const total = wavesurfer.getDuration();
      // The wrapper's own width (wavesurfer sets it to the zoomed width), not
      // its scrollWidth, which would count anything overflowing it.
      if (total > 0 && wrapper.clientWidth > 0) drawTicks(ticks, wrapper.clientWidth, total);
    };
    wavesurfer.on('redrawcomplete', redrawTicks);
    wavesurfer.on('ready', redrawTicks);


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
  }, [duration, applyZoom, controller, setFollowing]);

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
      if (loop) markWholeSong(loop, !state.hasCustomLoop);
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

  // Saved loops are shaded spans on the same track, diffed rather than
  // rebuilt so untouched regions keep their DOM.
  useEffect(() => {
    const regions = regionsRef.current;
    if (!regions || !isReady) return;

    const live = sectionRegionsRef.current;
    const seen = new Set<string>();

    drawableSections(sections).forEach((section) => {
      const id = `${SECTION_ID_PREFIX}${section.id}`;
      const color = section.id === highlightedSectionId ? SECTION_HIGHLIGHT_COLOR : SECTION_COLOR;
      seen.add(id);
      const existing = live.get(id);

      if (existing) {
        if (
          Math.abs(existing.start - section.start_time) > SYNC_EPSILON ||
          Math.abs(existing.end - section.end_time) > SYNC_EPSILON
        ) {
          existing.setOptions({ start: section.start_time, end: section.end_time });
        }
        if (existing.color !== color) existing.setOptions({ color });
        return;
      }

      const region = regions.addRegion({
        id,
        start: section.start_time,
        end: section.end_time,
        color,
        drag: false,
        resize: false,
      });
      styleRegion(region);
      live.set(id, region);
    });

    live.forEach((region, id) => {
      if (seen.has(id)) return;
      region.remove();
      live.delete(id);
    });
  }, [sections, highlightedSectionId, isReady, readyInstance]);

  return {
    containerRef,
    zoomIndex,
    setZoomIndex,
  };
};

export default useWaveformTimeline;
