import { expect, test, type Page } from '@playwright/test';
import { VIDEO_ID, mockSupabase, mockYouTube } from './fixtures';

const DURATION = 210.5; // the fake player's length

test.beforeEach(async ({ page }) => {
  await mockYouTube(page, { player: true });
  await mockSupabase(page);
});

const openVideo = async (page: Page, sections: unknown[] = []) => {
  if (sections.length > 0) {
    await page.addInitScript(
      ({ videoId, stored }) => {
        localStorage.setItem(`melodicus:v1:sections:${videoId}`, JSON.stringify(stored));
      },
      { videoId: VIDEO_ID, stored: sections },
    );
  }
  await page.goto(`/video/${VIDEO_ID}`);
  await page.waitForFunction(() => (window as unknown as { __fakeYt?: { player: unknown } }).__fakeYt?.player);
  await expect(page.locator('[part~="canvases"]')).toBeVisible();
};

interface FakeYt {
  player: { getCurrentTime(): number; setPlaybackRate(rate: number): void };
  seeks: number[];
}

/** Runs `read` in the page against the fake player (see fakeYouTubeIframeApi.js). */
const fakeYt = <T>(page: Page, read: (fake: FakeYt) => T): Promise<T> =>
  page.evaluate(`(${read.toString()})(window.__fakeYt)`) as Promise<T>;

/** Scroll position of wavesurfer's scroll container, inside its shadow root. */
const timelineScroll = (page: Page) =>
  page.evaluate(() => {
    for (const host of document.querySelectorAll('div')) {
      const scroller = host.shadowRoot?.querySelector<HTMLElement>('[part="scroll"]');
      if (scroller) return { left: scroller.scrollLeft, width: scroller.clientWidth, content: scroller.scrollWidth };
    }
    throw new Error('no timeline on the page');
  });

/** The on-screen part of a timeline element. Zoomed, the track and ruler are wider than the view. */
const visibleBox = async (page: Page, selector: string) => {
  const found = await page.locator(selector).first().boundingBox();
  if (!found) throw new Error(`${selector} has no box`);
  const scroll = await timelineScroll(page);
  return { x: found.x + scroll.left, y: found.y, width: Math.min(found.width, scroll.width), height: found.height };
};

/** A one-finger drag through Chromium's real touch pipeline, so touch-action and text selection apply. */
const touchDrag = async (page: Page, from: { x: number; y: number }, to: { x: number; y: number }) => {
  const cdp = await page.context().newCDPSession(page);
  const point = (x: number, y: number) => [{ x, y, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(from.x, from.y) });
  // Paced like a finger, and held still before lifting. An instant drag reads
  // as a fling, and Chromium spends the next tap on stopping it.
  for (let step = 1; step <= 12; step++) {
    const x = from.x + ((to.x - from.x) * step) / 12;
    const y = from.y + ((to.y - from.y) * step) / 12;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(x, y) });
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(150);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
};

const mouseDrag = async (page: Page, from: { x: number; y: number }, to: { x: number; y: number }) => {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();
};

const zoomTo8x = async (page: Page) => {
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
};

const playheadInView = async (page: Page) => {
  const time = await fakeYt(page, (fake) => fake.player.getCurrentTime());
  const scroll = await timelineScroll(page);
  const px = (time / DURATION) * scroll.content;
  return px >= scroll.left && px <= scroll.left + scroll.width;
};

test('playback jumps back to the loop start at the loop end', async ({ page }) => {
  await openVideo(page, [{ id: 'r1', name: 'Riff', start_time: 10, end_time: 11.5 }]);
  await page.getByText('Riff', { exact: true }).click();
  await page.getByRole('button', { name: 'Play or Pause' }).click();

  await expect.poll(() => fakeYt(page, (fake) => fake.seeks.filter((t) => t === 10).length), { timeout: 6000 }).toBeGreaterThanOrEqual(3);
  const time = await fakeYt(page, (fake) => fake.player.getCurrentTime());
  expect(time).toBeGreaterThanOrEqual(10);
  expect(time).toBeLessThan(11.6);
});

test('dragging the ruler scrolls and stops following; tapping the loop pill brings the playhead back', async ({ page }) => {
  await openVideo(page, [{ id: 'r1', name: 'Riff', start_time: 150, end_time: 200 }]);
  await zoomTo8x(page);
  await page.getByText('Riff', { exact: true }).click();
  await page.getByRole('button', { name: 'Play or Pause' }).click();
  await fakeYt(page, (fake) => fake.player.setPlaybackRate(4));

  const ruler = await visibleBox(page, '[part="timeline-wrapper"]');
  const y = ruler.y + ruler.height / 2;
  const before = await timelineScroll(page);
  // Drag the view back towards the start, away from the loop.
  await mouseDrag(page, { x: ruler.x + ruler.width * 0.2, y }, { x: ruler.x + ruler.width * 0.8, y });
  const afterDrag = await timelineScroll(page);
  expect(afterDrag.left).toBeLessThan(before.left - ruler.width * 0.4);

  // Playback keeps going, but the view stays where it was put.
  await page.waitForTimeout(1500);
  expect((await timelineScroll(page)).left).toBe(afterDrag.left);
  expect(await playheadInView(page)).toBe(false);

  await page.getByText('Riff', { exact: true }).click();
  await expect.poll(() => playheadInView(page)).toBe(true);
});

test('dragging the ruler scrolls the zoomed track', async ({ page }) => {
  await openVideo(page);
  await zoomTo8x(page);
  await page.getByRole('button', { name: 'Play or Pause' }).click();
  await fakeYt(page, (fake) => fake.player.setPlaybackRate(4));

  const ruler = await visibleBox(page, '[part="timeline-wrapper"]');
  const y = ruler.y + ruler.height / 2;
  const before = await timelineScroll(page);
  await mouseDrag(page, { x: ruler.x + ruler.width * 0.8, y }, { x: ruler.x + ruler.width * 0.2, y });

  expect((await timelineScroll(page)).left).toBeGreaterThan(before.left + ruler.width * 0.4);
});

test('a sideways wheel scroll stops following, and Play brings the playhead back', async ({ page }) => {
  await openVideo(page);
  await zoomTo8x(page);
  const track = await visibleBox(page, '[part~="canvases"]');
  await page.mouse.move(track.x + track.width / 2, track.y + track.height / 2);
  await page.mouse.wheel(2000, 0);
  await expect.poll(() => playheadInView(page)).toBe(false);
  await page.waitForTimeout(500);
  expect(await playheadInView(page)).toBe(false);

  await page.getByRole('button', { name: 'Play or Pause' }).click();
  await expect.poll(() => playheadInView(page)).toBe(true);
});

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true });
  test.skip(({ browserName }) => browserName !== 'chromium', 'Touch is driven through Chromium’s DevTools protocol');

  test('a finger drag on the track makes a loop instead of selecting text', async ({ page }) => {
    await openVideo(page);
    const track = await visibleBox(page, '[part~="canvases"]');
    const y = track.y + track.height / 2;
    await touchDrag(page, { x: track.x + track.width * 0.25, y }, { x: track.x + track.width * 0.5, y });

    expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('');

    await page.getByRole('button', { name: 'Save loop', exact: true }).tap();
    await page.getByPlaceholder('Loop name (optional)').fill('Touch loop');
    await page.getByRole('button', { name: 'Save Loop', exact: true }).tap();
    await expect(page.getByText('Touch loop', { exact: true })).toBeVisible();

    const [saved] = await page.evaluate(
      (videoId) => JSON.parse(localStorage.getItem(`melodicus:v1:sections:${videoId}`) ?? '[]'),
      VIDEO_ID,
    );
    expect(saved.start_time).toBeCloseTo(DURATION * 0.25, -0.5);
    expect(saved.end_time).toBeCloseTo(DURATION * 0.5, -0.5);
  });

  test('a finger drag on the ruler scrolls the zoomed track', async ({ page }) => {
    await openVideo(page);
    await zoomTo8x(page);
    const ruler = await visibleBox(page, '[part="timeline-wrapper"]');
    const y = ruler.y + ruler.height / 2;
    const before = await timelineScroll(page);
    await touchDrag(page, { x: ruler.x + ruler.width * 0.8, y }, { x: ruler.x + ruler.width * 0.2, y });

    expect((await timelineScroll(page)).left).toBeGreaterThan(before.left + ruler.width * 0.4);
    // Scrolling isn't a loop edit.
    expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('');
  });
});

test('the playback speed survives rotating an iPad, and each control exists once', async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await openVideo(page);
  await page.getByRole('combobox', { name: 'Playback rate' }).selectOption('1.5');

  await page.setViewportSize({ width: 820, height: 1180 });
  await expect(page.getByRole('combobox', { name: 'Playback rate' })).toHaveValue('1.5');
  await page.getByRole('button', { name: 'Increase playback rate' }).click();
  await expect(page.getByRole('combobox', { name: 'Playback rate' })).toHaveValue('1.75');
  expect(await page.evaluate(() => (window as unknown as { __fakeYt: { player: { rate: number } } }).__fakeYt.player.rate)).toBe(1.75);

  for (const name of ['Share', 'Play or Pause', 'Restart Loop', 'Increase playback rate', 'Decrease playback rate']) {
    await expect(page.getByRole('button', { name, exact: true }), name).toHaveCount(1);
  }
  await expect(page.getByRole('combobox', { name: 'Playback rate' })).toHaveCount(1);
});

test('zooming back out after making a loop leaves nothing to scroll past the end of the song', async ({ page }) => {
  await openVideo(page);
  await zoomTo8x(page);
  const track = await visibleBox(page, '[part~="canvases"]');
  const y = track.y + track.height / 2;
  await mouseDrag(page, { x: track.x + track.width * 0.3, y }, { x: track.x + track.width * 0.5, y });
  await expect(page.getByRole('button', { name: 'Save loop', exact: true })).toBeVisible();

  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Zoom out' }).click();
  await expect(page.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
  await expect.poll(async () => {
    const scroll = await timelineScroll(page);
    return scroll.content - scroll.width;
  }).toBeLessThanOrEqual(1);
});
