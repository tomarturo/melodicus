import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import HoverPlugin from 'wavesurfer.js/dist/plugins/hover.esm.js';
import { formatSecondsToDuration } from '../utils/formatTime';

// Chakra token equivalents, so the track keeps the look of the slider it replaces.
const TRACK_COLOR = 'rgba(0, 0, 0, 0.36)'; // blackAlpha.500
const PLAYED_COLOR = 'rgba(0, 0, 0, 0.80)'; // blackAlpha.800
const PLAYHEAD_COLOR = '#C53030'; // red.600
const LOOP_COLOR = 'rgba(0, 0, 0, 0.18)';
const LOOP_REGION_ID = 'loop';

// Shortest loop the region is allowed to become. Shared with the save gate in
// VideoPage so the UI can't produce a loop that saving would then reject.
export const MIN_LOOP = 0.25;

// A region drag reports positions continuously, and those land back here as
// props a tick later. Only push React's value into the region when it differs
// by more than this, otherwise the round trip never settles.
const SYNC_EPSILON = 0.01;

// We never have real audio for a YouTube video, so the waveform band is painted
// as a solid bar instead. wavesurfer pre-sets fillStyle to waveColor before
// calling this, then clones the canvas and composites it with progressColor, so
// filling the whole rect gives us the played/unplayed split for free. Filling
// per-canvas also stays correct once zoom splits the waveform into chunks.
const renderTrackBar = (peaks, ctx) => {
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

// wavesurfer needs *some* channel data to build its buffer; the values are
// irrelevant because renderTrackBar ignores them.
const PLACEHOLDER_PEAKS = [[0, 0]];

// A region body swallows drag-to-create: every region wires up its own
// makeDraggable, whose pointermove calls preventDefault, and the wrapper-level
// handler that enableDragSelection installs bails out on defaultPrevented.
// Making the body inert while leaving the two resize handles live keeps the
// whole track available for drawing a new loop, which matters most when the
// loop still spans the entire video and covers every pixel of the track.
const makeBodyInert = (region) => {
  const element = region.element;
  if (!element) return;
  element.style.pointerEvents = 'none';
  element.querySelectorAll('[part~="region-handle"]').forEach((handle) => {
    handle.style.pointerEvents = 'auto';
  });
};

const useWaveformTimeline = ({
  duration,
  currentTime,
  loopStart,
  loopEnd,
  onSeek,
  onLoopChange,
  onLoopChangeEnd,
}) => {
  const containerRef = useRef(null);
  const timelineRef = useRef(null);
  const wavesurferRef = useRef(null);
  const loopRegionRef = useRef(null);

  // Callbacks and loop bounds get a new identity every render. Holding them in
  // a ref keeps them out of the instance effect's deps, so a re-render never
  // tears down and rebuilds the waveform.
  const latest = useRef({});
  useEffect(() => {
    latest.current = { onSeek, onLoopChange, onLoopChangeEnd, loopStart, loopEnd };
  });

  // Create the instance once per duration. No url and no media: wavesurfer's
  // load() runs on (peaks && duration) alone, skipping fetch and decode.
  useEffect(() => {
    if (!containerRef.current || !duration) return undefined;

    const regions = RegionsPlugin.create();

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      peaks: PLACEHOLDER_PEAKS,
      duration,
      height: 28,
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
        // Without an explicit container the ruler is inserted inside the
        // renderer's shadow root, where it overlaps the waveform band. Its own
        // element above the track keeps the two legible and lets Chakra own
        // the spacing between them.
        TimelinePlugin.create({
          height: 20,
          container: timelineRef.current,
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
      if (region.id === LOOP_REGION_ID) return;
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
      if (loopRegionRef.current) return;
      loopRegionRef.current = regions.addRegion({
        id: LOOP_REGION_ID,
        start: latest.current.loopStart || 0,
        end: latest.current.loopEnd || duration,
        color: LOOP_COLOR,
        // The body stays inert so a drag anywhere on the track starts a new
        // loop selection instead of sliding the existing one.
        drag: false,
        resize: true,
        minLength: MIN_LOOP,
      });
      makeBodyInert(loopRegionRef.current);
    });

    return () => {
      wavesurferRef.current = null;
      loopRegionRef.current = null;
      wavesurfer.destroy();
      if (timelineRef.current) timelineRef.current.replaceChildren();
    };
  }, [duration]);

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

  return { containerRef, timelineRef };
};

export default useWaveformTimeline;
