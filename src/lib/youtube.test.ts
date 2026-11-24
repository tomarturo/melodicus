import { afterEach, describe, expect, it, vi } from 'vitest';
import { SearchQuotaExceededError, decodeHtml, fetchVideoDetails, normalizeQuery, searchPath, searchVideos } from './youtube';

const mockFetch = (status: number, body: unknown) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  );

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchVideoDetails', () => {
  it('returns the fields the app uses', async () => {
    mockFetch(200, {
      items: [
        {
          contentDetails: { duration: 'PT4M13S' },
          snippet: { title: 'A song', thumbnails: { medium: { url: 'https://img/1.jpg' } } },
        },
      ],
    });

    await expect(fetchVideoDetails('abc')).resolves.toEqual({
      duration: 'PT4M13S',
      title: 'A song',
      thumbnailUrl: 'https://img/1.jpg',
    });
  });

  it('rejects when the API returns an error status, such as an exhausted quota', async () => {
    mockFetch(403, { error: { errors: [{ reason: 'quotaExceeded' }] } });
    await expect(fetchVideoDetails('abc')).rejects.toThrow('status 403');
  });

  it('rejects when the video does not exist', async () => {
    mockFetch(200, { items: [] });
    await expect(fetchVideoDetails('missing')).rejects.toThrow('no video with ID missing');
  });
});

describe('decodeHtml', () => {
  it('turns YouTube’s escaped titles back into text', () => {
    expect(decodeHtml('Hendrix&#39;s intro &amp; outro')).toBe("Hendrix's intro & outro");
    expect(decodeHtml('Plain title')).toBe('Plain title');
  });
});

describe('searchPath', () => {
  it('escapes the query', () => {
    expect(searchPath(' AC/DC #1? ')).toBe('/search/AC%2FDC%20%231%3F');
  });
});

describe('the app’s own routes', () => {
  it('asks /api for video details and searches, never Google, and sends no key', async () => {
    const fetchSpy = mockFetch(200, { items: [] });
    await searchVideos('  Little   Wing ');
    await fetchVideoDetails('abc12345678').catch(() => {});
    expect(fetchSpy.mock.calls.map(([url]) => String(url))).toEqual([
      '/api/youtube-search?q=little+wing',
      '/api/youtube-video?id=abc12345678',
    ]);
  });

  it('sends queries trimmed, single-spaced and lowercase, so the edge cache matches more', () => {
    expect(normalizeQuery('  Little   WING  ')).toBe('little wing');
  });
});

describe('searchVideos', () => {
  it('returns decoded results, skipping items without a video ID', async () => {
    mockFetch(200, {
      items: [
        {
          id: { videoId: 'abc' },
          snippet: { title: 'Hendrix&#39;s intro', description: 'd', channelTitle: 'Tom &amp; Co', thumbnails: { medium: { url: 'u' } } },
        },
        { id: {}, snippet: { title: 'A channel', description: '', thumbnails: { medium: { url: 'u' } } } },
      ],
    });
    const results = await searchVideos('q');
    expect(results).toHaveLength(1);
    expect(results[0]!.snippet).toMatchObject({ title: "Hendrix's intro", channelTitle: 'Tom & Co' });
  });

  it('tells a used-up quota apart from other failures', async () => {
    mockFetch(403, { error: { errors: [{ reason: 'quotaExceeded' }] } });
    await expect(searchVideos('q')).rejects.toBeInstanceOf(SearchQuotaExceededError);
    mockFetch(500, {});
    await expect(searchVideos('q')).rejects.toThrow('status 500');
  });
});
