import { useCallback, useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import HoverPlugin from 'wavesurfer.js/dist/plugins/hover.esm.js';
import { formatSecondsToDuration } from '../utils/formatTime';

// blackAlpha.500 and blackAlpha.800 from the slider this replaces, but flattened
// against the #FAF9F6 panel rather than left translucent. They have to be opaque:
// the progress canvas is the main canvas recomposited with 'source-in', which
// multiplies the two alphas, so a translucent waveColor drags progressColor down
// with it - at 0.36 and 0.80 the played portion came out at 0.29, lighter than
// the track it is supposed to darken.
const TRACK_COLOR = '#A09F9D'; // blackAlpha.500 over #FAF9F6
const PLAYED_COLOR = '#323231'; // blackAlpha.800 over #FAF9F6
const PLAYHEAD_COLOR = '#C53030'; // red.600
// Chakra's default purple scale (the app uses ChakraProvider's default theme,
// same palette as the purple Badges on the home and search pages). The loop
// needs its own hue: as another shade of black it was indistinguishable from
// the played-portion darkening it overlaps.
const LOOP_COLOR = 'rgba(128, 90, 213, 0.30)'; // purple.500
const LOOP_EDGE_COLOR = '#553C9A'; // purple.700
const SECTION_COLOR = 'rgba(85, 60, 154, 0.13)'; // purple.700, well under the loop
const SECTION_CHIP_COLOR = '#553C9A'; // purple.700
const LOOP_REGION_ID = 'loop';
const SECTION_ID_PREFIX = 'section-';

// Tall enough to hold two staggered rows of section labels inside the band.
// Labels have to live inside it: the renderer's scroll container is
// overflow-x: auto, which makes the cross axis clip too, so a chip hung above
// or below the band would be cut off.
const TRACK_HEIGHT = 48;
const CHIP_ROWS = 2;

// Multipliers of fit-to-width. zoom() just sets minPxPerSec and re-renders, so
// level 1 (clientWidth / duration) is exactly the non-scrolling fit.
export const ZOOM_LEVELS = [1, 2, 4, 8];

// Shortest loop the region is allowed to become. Shared with the save gate in
// VideoPage so the UI can't produce a loop that saving would then reject.
export const MIN_LOOP = 0.25;

// A region drag reports positions continuously, and those land back here as
// props a tick later. Only push React's value into the region when it differs
// by more than this, otherwise the round trip never settles.
const SYNC_EPSILON = 0.01;

// We never have real audio for a YouTube video, so the waveform band is painted
// as a solid bar instead. wavesurfer pre-sets fillStyle to waveColor before
// calling this, then clones the canvas and recolors the copy with progressColor,
// so one fill yields both the played and unplayed halves. Filling per-canvas also
// stays correct once zoom splits the waveform into chunks.
const renderTrackBar = (peaks, ctx) => {
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

// wavesurfer needs *some* channel data to build its buffer; the values are
// irrelevant because renderTrackBar ignores them.
const PLACEHOLDER_PEAKS = [[0, 0]];

// Region bodies swallow drag-to-create: every region wires up its own
// makeDraggable, whose pointermove calls preventDefault, and the wrapper-level
// handler that enableDragSelection installs bails out on defaultPrevented.
// (drag: false does not help - the listener is attached either way.) So every
// region we add gets an inert body, and only the parts that genuinely need
// clicks - resize handles, section labels - get pointer events back. Without
// this the loop alone would block the whole track while it still spans the
// entire video.
const styleRegion = (region, edgeColor) => {
  const element = region.element;
  if (!element) return;
  element.style.pointerEvents = 'none';
  element.querySelectorAll('[part~="region-handle"]').forEach((handle) => {
    handle.style.pointerEvents = 'auto';
    if (!edgeColor) return;
    const side = handle.getAttribute('part').includes('handle-left') ? 'Left' : 'Right';
    handle.style[`border${side}`] = `3px solid ${edgeColor}`;
  });
  element.querySelectorAll('[data-interactive]').forEach((node) => {
    node.style.pointerEvents = 'auto';
  });
};

// Number(null) and Number('') are both 0, which passes a plain isFinite check,
// so blank bounds have to be rejected before the coercion.
const toSeconds = (value) =>
  value === null || value === undefined || value === '' ? NaN : Number(value);

// Region content is handed to setContent as an HTMLElement and lands inside the
// renderer's shadow root, where Chakra's class names do not reach - hence plain
// DOM and inline styles. The caret defers to a real Chakra menu rendered outside
// the shadow root by WaveformTimeline.
const buildSectionChip = (section, row, handlers) => {
  const chip = document.createElement('div');
  chip.dataset.interactive = 'true';
  Object.assign(chip.style, {
    position: 'absolute',
    top: `${4 + row * 20}px`,
    left: '0',
    display: 'inline-flex',
    alignItems: 'center',
    background: SECTION_CHIP_COLOR,
    color: '#FAF9F6',
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

const useWaveformTimeline = ({
  duration,
  currentTime,
  loopStart,
  loopEnd,
  sections,
  onSeek,
  onLoopChange,
  onLoopChangeEnd,
  onJumpToSection,
  onSectionMenu,
}) => {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const regionsRef = useRef(null);
  const loopRegionRef = useRef(null);
  const sectionRegionsRef = useRef(new Map());
  const zoomIndexRef = useRef(0);
  const [zoomIndex, setZoomIndex] = useState(0);
  // Regions can only be added once the plugin knows the duration, so the
  // sections effect has to wait for 'ready' rather than just for `duration`.
  const [isReady, setIsReady] = useState(false);

  // Callbacks and loop bounds get a new identity every render. Holding them in
  // a ref keeps them out of the instance effect's deps, so a re-render never
  // tears down and rebuilds the waveform.
  const latest = useRef({});
  useEffect(() => {
    latest.current = {
      onSeek,
      onLoopChange,
      onLoopChangeEnd,
      onJumpToSection,
      onSectionMenu,
      loopStart,
      loopEnd,
    };
  });

  // Re-applied on every zoom change and whenever the container resizes: the
  // fit-to-width baseline depends on clientWidth, so a stale minPxPerSec would
  // make a narrowed window scroll at level 1.
  const applyZoom = useCallback(() => {
    const wavesurfer = wavesurferRef.current;
    const container = containerRef.current;
    if (!wavesurfer || !container || !duration) return;
    const base = container.clientWidth / duration;
    if (!base) return;
    const target = base * ZOOM_LEVELS[zoomIndexRef.current];
    if (Math.abs((wavesurfer.options.minPxPerSec || 0) - target) < 0.01) return;
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
      cursorWidth: 3,
      renderFunction: renderTrackBar,
      interact: true,
      dragToSeek: false,
      fillParent: true,
      autoScroll: true,
      autoCenter: true,
      plugins: [
        regions,
        // Left to its default the ruler is appended inside the renderer's
        // wrapper, below the band - which is what we want, because the wrapper
        // is the element that gets the zoomed width. Given its own container in
        // the light DOM it would size to that container instead and keep
        // rendering fit-to-width ticks under a track scrolled to 4x, so ruler
        // and track would disagree about where a given second is.
        TimelinePlugin.create({
          height: 20,
          formatTimeCallback: formatSecondsToDuration,
        }),
        HoverPlugin.create({
          lineColor: PLAYHEAD_COLOR,
          lineWidth: 1,
          labelBackground: 'rgba(0, 0, 0, 0.80)',
          labelColor: '#FAF9F6',
          labelSize: 11,
          formatTimeCallback: formatSecondsToDuration,
        }),
      ],
    });

    wavesurferRef.current = wavesurfer;

    // 'interaction' fires only for real user clicks on the waveform. Do NOT
    // listen to 'timeupdate' here: our own setTime() emits it, which would loop
    // the cursor back into a seek.
    wavesurfer.on('interaction', (time) => {
      latest.current.onSeek(time);
    });

    // Dragging across the track redefines the loop. enableDragSelection builds
    // its own throwaway region per drag; we let that gesture finish and then
    // fold its bounds into the persistent loop region. Removing the throwaway
    // any earlier would cancel the drag the user is still performing. Its 3px
    // threshold is what keeps a plain click a seek rather than a region.
    regions.enableDragSelection({ color: LOOP_COLOR });

    // Live feedback while the loop's own handles are dragged.
    regions.on('region-update', (region) => {
      if (region.id !== LOOP_REGION_ID) return;
      latest.current.onLoopChange(region.start, region.end);
    });

    regions.on('region-updated', (region) => {
      if (region.id !== LOOP_REGION_ID) return;
      latest.current.onLoopChange(region.start, region.end);
      latest.current.onLoopChangeEnd();
    });

    // enableDragSelection only calls saveRegion once the gesture ends, so a
    // throwaway region reaches us here fully formed. Fold its bounds into the
    // loop and drop it, ignoring stray flicks shorter than a usable loop.
    regions.on('region-created', (region) => {
      if (region.id === LOOP_REGION_ID || region.id.startsWith(SECTION_ID_PREFIX)) return;
      const { start, end } = region;
      region.remove();
      const loop = loopRegionRef.current;
      if (!loop || end - start < MIN_LOOP) return;
      loop.setOptions({ start, end });
      latest.current.onLoopChange(start, end);
      latest.current.onLoopChangeEnd();
    });

    // Regions clamp their bounds against the plugin's totalDuration, which is
    // only populated on 'ready'. Adding the loop before then collapses it to
    // zero length, which renders it as a marker with no resize handles.
    wavesurfer.on('ready', () => {
      if (!loopRegionRef.current) {
        loopRegionRef.current = regions.addRegion({
          id: LOOP_REGION_ID,
          start: latest.current.loopStart || 0,
          end: latest.current.loopEnd || duration,
          color: LOOP_COLOR,
          drag: false,
          resize: true,
          minLength: MIN_LOOP,
        });
        styleRegion(loopRegionRef.current, LOOP_EDGE_COLOR);
      }
      setIsReady(true);
    });

    wavesurfer.on('resize', applyZoom);

    return () => {
      wavesurferRef.current = null;
      regionsRef.current = null;
      loopRegionRef.current = null;
      sectionRegionsRef.current = new Map();
      setIsReady(false);
      wavesurfer.destroy();
    };
  }, [duration, applyZoom]);

  // Zooming in on a long video is the difference between a 3-second loop being
  // half a percent of the track and being workable. Scroll back to the loop
  // afterwards so the view lands somewhere meaningful rather than wherever the
  // previous scroll offset happened to be.
  useEffect(() => {
    zoomIndexRef.current = zoomIndex;
    const wavesurfer = wavesurferRef.current;
    if (!wavesurfer || !isReady) return;
    applyZoom();
    wavesurfer.setScrollTime(latest.current.loopStart || 0);
  }, [zoomIndex, isReady, applyZoom]);

  // YouTube owns the clock; we just push its position into the renderer.
  // setTime() passes the time explicitly to updateProgress(), so the cursor
  // moves even though the internal <audio> element has no source.
  useEffect(() => {
    const wavesurfer = wavesurferRef.current;
    if (!wavesurfer || !duration) return;
    wavesurfer.setTime(currentTime);
  }, [currentTime, duration]);

  // Loop changes that came from elsewhere (jumping to a saved section) have to
  // be reflected on the track.
  useEffect(() => {
    const loop = loopRegionRef.current;
    if (!loop || !duration) return;
    if (
      Math.abs(loop.start - loopStart) > SYNC_EPSILON ||
      Math.abs(loop.end - loopEnd) > SYNC_EPSILON
    ) {
      loop.setOptions({ start: loopStart, end: loopEnd });
    }
  }, [loopStart, loopEnd, duration]);

  // Saved sections become their own regions on the same track, which is the
  // point of the exercise: the pills they replace were positioned against the
  // full container width while the track had horizontal padding, so the two
  // never lined up. Diffed rather than rebuilt so untouched regions keep their
  // DOM (and a rebuild doesn't fight an in-flight click on a chip).
  useEffect(() => {
    const regions = regionsRef.current;
    if (!regions || !isReady) return;

    const live = sectionRegionsRef.current;
    const seen = new Set();

    // Sections reach us from three places - localStorage, Supabase, and a
    // base64 query param - so one unusable row should be skipped rather than
    // take the whole timeline down with it.
    const usable = (sections || []).filter((section) => {
      if (!section || section.id == null) return false;
      const start = toSeconds(section.start_time);
      const end = toSeconds(section.end_time);
      return Number.isFinite(start) && Number.isFinite(end) && end > start;
    });

    // Chips are staggered across rows so neighbours don't cover each other.
    // Rows have to come from time order, not array order: sections arrive in
    // creation order from both backends, so two loops adjacent on the track can
    // otherwise land on the same row.
    const rowById = new Map(
      [...usable]
        .sort((a, b) => a.start_time - b.start_time)
        .map((section, order) => [section.id, order % CHIP_ROWS]),
    );

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
        // Renaming is the only edit either backend supports, so it is the one
        // change that has to be pushed into existing content.
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
        color: SECTION_COLOR,
        drag: false,
        resize: false,
        content: buildSectionChip(section, rowById.get(section.id) || 0, latest),
      });
      styleRegion(region);
      live.set(id, region);
    });

    live.forEach((region, id) => {
      if (seen.has(id)) return;
      region.remove();
      live.delete(id);
    });
  }, [sections, isReady]);

  return { containerRef, zoomIndex, setZoomIndex };
};

export default useWaveformTimeline;
