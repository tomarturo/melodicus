import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import HoverPlugin from 'wavesurfer.js/dist/plugins/hover.esm.js';
import { formatSecondsToDuration } from '../utils/formatTime';

// Chakra token equivalents, so the track keeps the look of the slider it replaces.
const TRACK_COLOR = 'rgba(0, 0, 0, 0.36)'; // blackAlpha.500
const PLAYED_COLOR = 'rgba(0, 0, 0, 0.80)'; // blackAlpha.800
const PLAYHEAD_COLOR = '#C53030'; // red.600

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

const useWaveformTimeline = ({ duration, currentTime, onSeek }) => {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);

  // Callbacks get a new identity every render. Holding them in a ref keeps them
  // out of the instance effect's deps, so a re-render never tears down and
  // rebuilds the waveform.
  const latest = useRef({ onSeek });
  useEffect(() => {
    latest.current = { onSeek };
  }, [onSeek]);

  // Create the instance once per duration. No url and no media: wavesurfer's
  // load() runs on (peaks && duration) alone, skipping fetch and decode.
  useEffect(() => {
    if (!containerRef.current || !duration) return undefined;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      peaks: PLACEHOLDER_PEAKS,
      duration,
      height: 8,
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
        TimelinePlugin.create({
          height: 20,
          insertPosition: 'beforebegin',
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

    return () => {
      wavesurferRef.current = null;
      wavesurfer.destroy();
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

  return { containerRef };
};

export default useWaveformTimeline;
