import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchVideoDetails } from './youtube';

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

    await expect(fetchVideoDetails('abc', 'key')).resolves.toEqual({
      duration: 'PT4M13S',
      title: 'A song',
      thumbnailUrl: 'https://img/1.jpg',
    });
  });

  it('rejects when the API returns an error status, such as an exhausted quota', async () => {
    mockFetch(403, { error: { errors: [{ reason: 'quotaExceeded' }] } });
    await expect(fetchVideoDetails('abc', 'key')).rejects.toThrow('status 403');
  });

  it('rejects when the video does not exist', async () => {
    mockFetch(200, { items: [] });
    await expect(fetchVideoDetails('missing', 'key')).rejects.toThrow('no video with ID missing');
  });
});
