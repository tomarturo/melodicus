// Convert a YouTube video duration string to seconds
export const convertDurationToSeconds = (duration: string): number => {
    const matches = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!matches) return 0;
    const hours = parseInt(matches[1] ?? '') || 0;
    const minutes = parseInt(matches[2] ?? '') || 0;
    const seconds = parseInt(matches[3] ?? '') || 0;
    return hours * 3600 + minutes * 60 + seconds;
  };
  
  // Format a duration in seconds to a human-readable format (HH:MM:SS)
  export const formatSecondsToDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const pad = (value: number) => (value < 10 ? `0${value}` : value);

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
    } else {
      return `${pad(minutes)}:${pad(remainingSeconds)}`;
    }
  };

  // Loop boundaries come off the timeline as raw floats (166.61218337538818).
  // Sub-millisecond precision means nothing for a practice loop and only bloats
  // the base64 sharing URL, so round before anything is persisted.
  export const roundSeconds = (seconds: number | string): number => Math.round(Number(seconds) * 1000) / 1000;

/**
 * A loop bound to the tenth of a second: 0:30.2, 4:05.0, 1:02:03.4. Minutes
 * aren't padded, unlike formatSecondsToDuration, since these sit in running
 * text.
 */
export const formatLoopTime = (seconds: number): string => {
  const tenths = Math.round(Math.max(0, seconds) * 10);
  const hours = Math.floor(tenths / 36000);
  const minutes = Math.floor((tenths % 36000) / 600);
  const secs = (tenths % 600) / 10;
  const secText = secs.toFixed(1).padStart(4, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${secText}` : `${minutes}:${secText}`;
};

/** A loop's length: 15.6s under a minute, otherwise as a loop time (1:05.3). */
export const formatLoopLength = (seconds: number): string =>
  seconds < 59.95 ? `${(Math.round(seconds * 10) / 10).toFixed(1)}s` : formatLoopTime(seconds);
