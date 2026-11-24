/**
 * The YouTube Data API, called from Vercel functions so the API key stays on
 * the server (YOUTUBE_API_KEY, set in Vercel; never sent to the browser).
 * The routes are api/youtube-search.ts and api/youtube-video.ts; files
 * starting with an underscore aren't routes of their own.
 *
 * Answers keep YouTube's own shape (items, and error.errors[].reason), with
 * only the fields the app reads, so the app parses them as it always has.
 *
 * Successful answers are cached at Vercel's edge, so a search or a video that
 * someone else has just looked up costs no quota.
 */

const API = 'https://www.googleapis.com/youtube/v3';

// Searches: the same query from anyone, within 6 hours, is served from the
// edge. After that a day of serving the old answer while fetching a new one.
const SEARCH_CACHE = 'public, max-age=300, s-maxage=21600, stale-while-revalidate=86400';
// Video titles and lengths hardly change: a day, then a week of the old one.
const VIDEO_CACHE = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';
// Errors are never cached: the next request tries again.
const NO_STORE = 'no-store';

/** Longer than any song title and artist; stops the key paying for junk. */
export const MAX_QUERY_LENGTH = 200;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

type Env = Record<string, string | undefined>;

const answer = (body: unknown, status: number, cache: string) =>
  Response.json(body, { status, headers: { 'Cache-Control': cache } });

/** An error in YouTube's shape, so the app reads it the same way. */
const failure = (status: number, reason: string) => answer({ error: { errors: [{ reason }] } }, status, NO_STORE);

type Json = Record<string, unknown> | undefined;
const obj = (value: unknown): Json => (value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined);
const str = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

/** Calls YouTube, turning its errors into ours: a used-up quota stays recognisable. */
async function callYouTube(
  endpoint: 'search' | 'videos',
  params: Record<string, string>,
  env: Env,
  fetchImpl: typeof fetch,
): Promise<{ items: unknown[] } | Response> {
  const key = env.YOUTUBE_API_KEY;
  if (!key) return failure(500, 'notConfigured');
  let response: Response;
  try {
    response = await fetchImpl(`${API}/${endpoint}?${new URLSearchParams({ ...params, key })}`);
  } catch {
    return failure(502, 'unreachable');
  }
  const data = obj(await response.json().catch(() => null));
  if (!response.ok) {
    const firstError = obj((obj(data?.error)?.errors as unknown[] | undefined)?.[0]);
    if (response.status === 403 && str(firstError?.reason) === 'quotaExceeded') return failure(403, 'quotaExceeded');
    return failure(502, 'upstream');
  }
  return { items: Array.isArray(data?.items) ? data.items : [] };
}

/** GET /api/youtube-search?q=… : video results for a search. */
export async function youtubeSearch(request: Request, env: Env, fetchImpl: typeof fetch = fetch): Promise<Response> {
  const query = (new URL(request.url).searchParams.get('q') ?? '').trim();
  if (!query || query.length > MAX_QUERY_LENGTH) return failure(400, 'badRequest');

  const result = await callYouTube('search', { q: query, type: 'video', part: 'snippet' }, env, fetchImpl);
  if (result instanceof Response) return result;

  const items = result.items.flatMap((item) => {
    const snippet = obj(obj(item)?.snippet);
    const videoId = str(obj(obj(item)?.id)?.videoId);
    const title = str(snippet?.title);
    if (!videoId || title === undefined) return [];
    return [
      {
        id: { videoId },
        snippet: {
          title,
          description: str(snippet?.description) ?? '',
          channelTitle: str(snippet?.channelTitle),
          thumbnails: { medium: { url: str(obj(obj(snippet?.thumbnails)?.medium)?.url) ?? '' } },
        },
      },
    ];
  });
  return answer({ items }, 200, SEARCH_CACHE);
}

/** GET /api/youtube-video?id=… : a video's title, length and thumbnail. */
export async function youtubeVideo(request: Request, env: Env, fetchImpl: typeof fetch = fetch): Promise<Response> {
  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!VIDEO_ID.test(id)) return failure(400, 'badRequest');

  const result = await callYouTube('videos', { id, part: 'contentDetails,snippet' }, env, fetchImpl);
  if (result instanceof Response) return result;

  const items = result.items.slice(0, 1).map((item) => {
    const snippet = obj(obj(item)?.snippet);
    return {
      contentDetails: { duration: str(obj(obj(item)?.contentDetails)?.duration) },
      snippet: {
        title: str(snippet?.title),
        thumbnails: { medium: { url: str(obj(obj(snippet?.thumbnails)?.medium)?.url) } },
      },
    };
  });
  return answer({ items }, 200, VIDEO_CACHE);
}
