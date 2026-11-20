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

/** Fetches title, duration and thumbnail for one video from the YouTube Data API. */
export async function fetchVideoDetails(videoId: string, apiKey: string): Promise<VideoDetails> {
  const params = new URLSearchParams({ id: videoId, part: 'contentDetails,snippet', key: apiKey });
  const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
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
    thumbnails: { medium: { url: string } };
  };
}
