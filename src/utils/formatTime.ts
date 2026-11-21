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

/** A clock time for the timeline: 0:30, 4:05, 1:02:03. Minutes aren't padded. */
export const formatClockTime = (seconds: number): string => {
  const whole = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = String(whole % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${minutes}:${secs}`;
};
