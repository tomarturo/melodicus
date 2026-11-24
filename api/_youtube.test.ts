import { describe, expect, it, vi } from 'vitest';
import { MAX_QUERY_LENGTH, youtubeSearch, youtubeVideo } from './_youtube.js';

const ENV = { YOUTUBE_API_KEY: 'server-key' };
const get = (path: string) => new Request(`https://melodicus.xyz${path}`);
const youTubeAnswers = (status: number, body: unknown) =>
  vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

const searchItem = (videoId: string | undefined, title: string) => ({
  kind: 'youtube#searchResult',
  etag: 'x',
  id: videoId ? { kind: 'youtube#video', videoId } : { kind: 'youtube#channel' },
  snippet: {
    title,
    description: 'd',
    channelTitle: 'Tom &amp; Co',
    publishedAt: '2026-01-01',
    thumbnails: { default: { url: 'small' }, medium: { url: 'medium' } },
  },
});

describe('youtubeSearch', () => {
  it('calls YouTube with the server key and answers with only what the app reads, cached at the edge', async () => {
    const fetchImpl = youTubeAnswers(200, { items: [searchItem('abc12345678', 'Hendrix&#39;s intro'), searchItem(undefined, 'A channel')] });
    const response = await youtubeSearch(get('/api/youtube-search?q=%20little%20wing%20'), ENV, fetchImpl);

    const called = new URL(String(fetchImpl.mock.calls[0]![0]));
    expect(called.origin + called.pathname).toBe('https://www.googleapis.com/youtube/v3/search');
    expect(Object.fromEntries(called.searchParams)).toEqual({ q: 'little wing', type: 'video', part: 'snippet', key: 'server-key' });

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=21600');
    // Still escaped: the app decodes titles. Channels and extra fields are dropped.
    expect(await response.json()).toEqual({
      items: [
        {
          id: { videoId: 'abc12345678' },
          snippet: { title: 'Hendrix&#39;s intro', description: 'd', channelTitle: 'Tom &amp; Co', thumbnails: { medium: { url: 'medium' } } },
        },
      ],
    });
  });

  it('never sends the key back to the browser', async () => {
    const response = await youtubeSearch(get('/api/youtube-search?q=x'), ENV, youTubeAnswers(200, { items: [searchItem('abc12345678', 't')] }));
    expect(await response.text()).not.toContain('server-key');
  });

  it('keeps a used-up quota recognisable, and other failures apart, without caching either', async () => {
    const quota = await youtubeSearch(get('/api/youtube-search?q=x'), ENV, youTubeAnswers(403, { error: { errors: [{ reason: 'quotaExceeded' }] } }));
    expect(quota.status).toBe(403);
    expect(await quota.json()).toEqual({ error: { errors: [{ reason: 'quotaExceeded' }] } });
    expect(quota.headers.get('Cache-Control')).toBe('no-store');

    const other = await youtubeSearch(get('/api/youtube-search?q=x'), ENV, youTubeAnswers(500, {}));
    expect(other.status).toBe(502);
    expect(other.headers.get('Cache-Control')).toBe('no-store');

    const unreachable = await youtubeSearch(get('/api/youtube-search?q=x'), ENV, vi.fn<typeof fetch>(async () => {
      throw new TypeError('fetch failed');
    }));
    expect(unreachable.status).toBe(502);
  });

  it('refuses empty and overlong searches without spending quota', async () => {
    const fetchImpl = youTubeAnswers(200, { items: [] });
    expect((await youtubeSearch(get('/api/youtube-search?q=%20%20'), ENV, fetchImpl)).status).toBe(400);
    expect((await youtubeSearch(get(`/api/youtube-search?q=${'a'.repeat(MAX_QUERY_LENGTH + 1)}`), ENV, fetchImpl)).status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('says the key is missing rather than calling YouTube without one', async () => {
    const fetchImpl = youTubeAnswers(200, { items: [] });
    const response = await youtubeSearch(get('/api/youtube-search?q=x'), {}, fetchImpl);
    expect(response.status).toBe(500);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('youtubeVideo', () => {
  it('answers with the title, length and thumbnail, cached for a day', async () => {
    const fetchImpl = youTubeAnswers(200, {
      items: [{ id: 'abc12345678', contentDetails: { duration: 'PT4M13S', definition: 'hd' }, snippet: { title: 'A song', tags: ['x'], thumbnails: { medium: { url: 'm' } } } }],
    });
    const response = await youtubeVideo(get('/api/youtube-video?id=abc12345678'), ENV, fetchImpl);

    const called = new URL(String(fetchImpl.mock.calls[0]![0]));
    expect(Object.fromEntries(called.searchParams)).toEqual({ id: 'abc12345678', part: 'contentDetails,snippet', key: 'server-key' });
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=86400');
    expect(await response.json()).toEqual({
      items: [{ contentDetails: { duration: 'PT4M13S' }, snippet: { title: 'A song', thumbnails: { medium: { url: 'm' } } } }],
    });
  });

  it('refuses anything that isn’t a YouTube video ID', async () => {
    const fetchImpl = youTubeAnswers(200, { items: [] });
    for (const id of ['', 'short', 'abc12345678&key=x', '../../etc']) {
      expect((await youtubeVideo(get(`/api/youtube-video?id=${encodeURIComponent(id)}`), ENV, fetchImpl)).status).toBe(400);
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
