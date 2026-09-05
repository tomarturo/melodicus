// Utilities.js

// Convert a YouTube video duration string to seconds
export const convertDurationToSeconds = (duration) => {
    const matches = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = parseInt(matches[1]) || 0;
    const minutes = parseInt(matches[2]) || 0;
    const seconds = parseInt(matches[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  };
  
  // Format a duration in seconds to a human-readable format (HH:MM:SS)
  export const formatSecondsToDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const pad = (value) => (value < 10 ? `0${value}` : value);

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
    } else {
      return `${pad(minutes)}:${pad(remainingSeconds)}`;
    }
  };

  // Loop boundaries come off the timeline as raw floats (166.61218337538818).
  // Sub-millisecond precision means nothing for a practice loop and only bloats
  // the base64 sharing URL, so round before anything is persisted.
  export const roundSeconds = (seconds) => Math.round(Number(seconds) * 1000) / 1000;
