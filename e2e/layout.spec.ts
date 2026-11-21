import { expect, test, type Page } from '@playwright/test';
import { VIDEO_ID, mockSupabase, mockYouTube } from './fixtures';

test.beforeEach(async ({ page }) => {
  await mockYouTube(page);
  await mockSupabase(page);
  await page.route('**/youtube/v3/search**', (route) =>
    route.fulfill({
      json: {
        items: Array.from({ length: 20 }, (_, i) => ({
          id: { videoId: `result${i}` },
          snippet: { title: `Result ${i + 1}`, description: 'A video', thumbnails: { medium: { url: '' } } },
        })),
      },
    }),
  );
  await page.addInitScript(() =>
    localStorage.setItem(
      'melodicus:v1:songs',
      JSON.stringify(
        Array.from({ length: 15 }, (_, i) => ({ videoId: `song${i}`, title: `Saved song ${i + 1}`, savedAt: '2026-01-01T00:00:00Z' })),
      ),
    ),
  );
});

/** The page's content panel: the rounded container that should be doing the scrolling. */
const panelMetrics = (page: Page) =>
  page.evaluate(() => {
    const panel = [...document.querySelectorAll<HTMLElement>('div')].find(
      (element) => getComputedStyle(element).overflowY === 'auto' && getComputedStyle(element).borderTopLeftRadius !== '0px',
    );
    if (!panel) throw new Error('no scrolling panel on the page');
    const rect = panel.getBoundingClientRect();
    return {
      windowScrollable: document.documentElement.scrollHeight > window.innerHeight,
      scrollTop: panel.scrollTop,
      overflows: panel.scrollHeight > panel.clientHeight,
      top: rect.top,
      bottom: rect.bottom,
      viewportHeight: window.innerHeight,
    };
  });

for (const [name, path, lastItem] of [
  ['search results', '/search/test', 'Result 20'],
  ['saved songs', '/saved-songs', 'Saved song 15'],
] as const) {
  test(`${name}: the content scrolls inside the panel, keeping its corners and the footer in view`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByText(lastItem)).toBeAttached();

    const before = await panelMetrics(page);
    expect(before.windowScrollable).toBe(false);
    expect(before.overflows).toBe(true);

    await page.mouse.move(700, 300);
    await page.mouse.wheel(0, 5000);
    await expect(page.getByText(lastItem)).toBeInViewport();

    const after = await panelMetrics(page);
    expect(after.scrollTop).toBeGreaterThan(0);
    expect(after.top).toBe(before.top);
    expect(after.bottom).toBeLessThanOrEqual(after.viewportHeight);
    await expect(page.getByRole('link', { name: 'Melodicus on GitHub' }).or(page.getByText('© 2025'))).toBeInViewport();
  });
}

test('home: the panel and footer fit the screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /learn the songs/i })).toBeVisible();
  const metrics = await panelMetrics(page);
  expect(metrics.windowScrollable).toBe(false);
  expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewportHeight);
  await expect(page.getByText('© 2025')).toBeInViewport();
});

test.describe('video page', () => {
  for (const [width, height] of [
    [1280, 600],
    [1280, 720],
    [1536, 864],
    [1920, 1080],
    [1024, 768],
    [820, 1180],
    [390, 844],
  ] as const) {
    test(`fits a ${width}×${height} screen, with the album art inside the video area`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.addInitScript(
        (videoId) =>
          localStorage.setItem(
            `melodicus:v1:sections:${videoId}`,
            JSON.stringify([{ id: 'a', name: 'Intro', start_time: 0, end_time: 12 }]),
          ),
        VIDEO_ID,
      );
      await page.goto(`/video/${VIDEO_ID}`);
      await expect(page.locator('[part~="canvases"]')).toBeVisible();

      expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBe(0);
      await expect(page.getByText('© 2025')).toBeInViewport();

      const display = await page.getByTestId('video-display').boundingBox();
      const art = await page.getByTestId('album-art').boundingBox();
      expect(display && art).toBeTruthy();
      expect(art!.y).toBeGreaterThanOrEqual(display!.y);
      expect(art!.y + art!.height).toBeLessThanOrEqual(display!.y + display!.height + 0.5);
      expect(art!.x).toBeGreaterThanOrEqual(display!.x);
      expect(art!.x + art!.width).toBeLessThanOrEqual(display!.x + display!.width + 0.5);
      expect(Math.abs(art!.width - art!.height)).toBeLessThan(1);
    });
  }
});
