import getYoutubeID from 'get-youtube-id';

// Watch, youtu.be, embed and Shorts links, with an 11-character video ID.
const PATTERNS = [
  /^https?:\/\/(www\.|m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(&.*)?$/,
  /^https?:\/\/(www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(\?.*)?$/,
  /^https?:\/\/(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(\?.*)?$/,
  /^https?:\/\/(www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(\?.*)?$/,
];

/** The video ID from a YouTube link, or null if the text isn't one. */
export function videoIdFromUrl(text: string): string | null {
  const trimmed = text.trim();
  if (!PATTERNS.some((pattern) => pattern.test(trimmed))) return null;
  return getYoutubeID(trimmed) || null;
}
