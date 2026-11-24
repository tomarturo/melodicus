import { z } from 'zod';

// Only the fields the app reads. Anything else in the response is ignored.
const VideoDetailsResponseSchema = z.object({
  items: z
    .array(
      z.object({
        contentDetails: z.object({ duration: z.string() }).optional(),
        snippet: z
          .object({
            title: z.string().optional(),
            thumbnails: z.object({ medium: z.object({ url: z.string() }).optional() }).optional(),
          })
          .optional(),
      }),
    )
    .default([]),
});

export interface VideoDetails {
  duration: string | null;
  title: string | null;
  thumbnailUrl: string | null;
}

/**
 * Fetches title, duration and thumbnail for one video, through the app's own
 * /api/youtube-video, which holds the YouTube API key (api/_youtube.ts).
 */
export async function fetchVideoDetails(videoId: string): Promise<VideoDetails> {
  const response = await fetch(`/api/youtube-video?${new URLSearchParams({ id: videoId })}`);
  if (!response.ok) {
    throw new Error(`YouTube video details request failed with status ${response.status}`);
  }
  const { items } = VideoDetailsResponseSchema.parse(await response.json());
  const item = items[0];
  if (!item) throw new Error(`YouTube has no video with ID ${videoId}`);
  return {
    duration: item.contentDetails?.duration ?? null,
    title: item.snippet?.title ?? null,
    thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? null,
  };
}

/** One result from the YouTube search endpoint, as the search list renders it. */
export interface SearchResult {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelTitle?: string;
    thumbnails: { medium: { url: string } };
  };
}

/** The app's URL for a YouTube search, with the query escaped. */
export const searchPath = (query: string) => `/search/${encodeURIComponent(query.trim())}`;

/**
 * YouTube's search API returns titles HTML-escaped ("Hendrix&#39;s"). This
 * turns them back into plain text. DOMParser reads the entities without
 * running anything.
 */
export function decodeHtml(text: string): string {
  return new DOMParser().parseFromString(text, 'text/html').documentElement.textContent ?? text;
}

/** The daily search quota is used up; the search page offers a way around it. */
export class SearchQuotaExceededError extends Error {
  constructor() {
    super('The YouTube search quota is used up for today.');
    this.name = 'SearchQuotaExceededError';
  }
}

const SearchResponseSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.object({ videoId: z.string().optional() }),
        snippet: z.object({
          title: z.string(),
          description: z.string().default(''),
          channelTitle: z.string().optional(),
          thumbnails: z.object({ medium: z.object({ url: z.string() }) }),
        }),
      }),
    )
    .default([]),
});

/**
 * The query as sent: trimmed, single-spaced and lowercase, which YouTube treats
 * the same, so more searches match one already cached at the edge.
 */
export const normalizeQuery = (query: string) => query.trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Searches YouTube for videos, through the app's own /api/youtube-search,
 * which holds the API key and caches results (api/_youtube.ts). Titles and
 * channel names come back decoded.
 */
export async function searchVideos(query: string): Promise<SearchResult[]> {
  const response = await fetch(`/api/youtube-search?${new URLSearchParams({ q: normalizeQuery(query) })}`);
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const reason = (data as { error?: { errors?: Array<{ reason?: string }> } } | null)?.error?.errors?.[0]?.reason;
    if (response.status === 403 && reason === 'quotaExceeded') throw new SearchQuotaExceededError();
    throw new Error(`YouTube search failed with status ${response.status}`);
  }
  return SearchResponseSchema.parse(data).items.flatMap((item) =>
    item.id.videoId
      ? [
          {
            id: { videoId: item.id.videoId },
            snippet: {
              ...item.snippet,
              title: decodeHtml(item.snippet.title),
              channelTitle: item.snippet.channelTitle && decodeHtml(item.snippet.channelTitle),
            },
          },
        ]
      : [],
  );
}
