import { expect, test, type Page } from '@playwright/test';
import { VIDEO_ID, dragSelection, mockSupabase, mockYouTube } from './fixtures';

const SOLO = { id: 'solo', name: 'Solo', start_time: 30, end_time: 45 };

const storedLoops = (page: Page) =>
  page.evaluate(
    (videoId) => JSON.parse(localStorage.getItem(`melodicus:v1:sections:${videoId}`) ?? '[]') as Array<typeof SOLO>,
    VIDEO_ID,
  );

const row = (page: Page) => page.getByTestId('loop-selection');

test.beforeEach(async ({ page }) => {
  await mockYouTube(page, { player: true });
  await mockSupabase(page);
});

const openWith = async (page: Page, loops: unknown[]) => {
  await page.addInitScript(
    ([videoId, stored]) => {
      if (!localStorage.getItem(`melodicus:v1:sections:${videoId}`)) {
        localStorage.setItem(`melodicus:v1:sections:${videoId}`, JSON.stringify(stored));
      }
    },
    [VIDEO_ID, loops] as const,
  );
  await page.goto(`/video/${VIDEO_ID}`);
  await expect(page.locator('[part~="canvases"]')).toBeVisible();
};

/** Drags the current loop's right edge by some pixels. */
const dragRightEdge = async (page: Page, dx: number) => {
  const handle = await page.locator('[part~="region-handle-right"]').first().boundingBox();
  const track = await page.locator('[part~="canvases"]').first().boundingBox();
  if (!handle || !track) throw new Error('no loop handle');
  const y = track.y + track.height / 2;
  await page.mouse.move(handle.x + handle.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 + dx, y, { steps: 8 });
  await page.mouse.up();
};

const activePill = (page: Page) => page.locator('[aria-current="true"]');

test('the row under the track hints, then offers Save loop for a new selection', async ({ page }) => {
  await openWith(page, []);
  await expect(row(page)).toHaveText('Drag on the track to make a loop');
  await expect(page.getByRole('button', { name: 'Save loop', exact: true })).toHaveCount(0);

  await dragSelection(page, 0.5, 0.6);
  await page.getByRole('button', { name: 'Save loop', exact: true }).click();
  await page.getByPlaceholder('Loop name (optional)').fill('Bridge');
  await page.getByRole('button', { name: 'Save Loop', exact: true }).click();

  // Once saved, the selection is that loop: its pill is selected, and the row says how to change it.
  await expect(activePill(page)).toHaveText('Bridge');
  await expect(row(page)).toHaveText('Drag the edges to adjust this loop');
  await expect(page.getByRole('button', { name: 'Save loop', exact: true })).toHaveCount(0);
  expect(await storedLoops(page)).toHaveLength(1);
});

const loopFill = (page: Page) =>
  page.locator('[part~="region"][part~="loop"]').first().evaluate((el) => getComputedStyle(el).backgroundColor);

test('with no saved loops, the Add a loop pill selects the first ten seconds to save or cancel', async ({ page }) => {
  await openWith(page, []);
  const addLoop = page.getByRole('button', { name: 'Add a loop' });
  await addLoop.click();
  await expect(page.getByRole('button', { name: 'Save loop', exact: true })).toBeVisible();
  await expect.poll(() => loopFill(page)).not.toBe('rgba(0, 0, 0, 0)');

  await page.getByRole('button', { name: 'Save loop', exact: true }).click();
  await page.getByPlaceholder('Loop name (optional)').fill('Intro');
  await page.getByRole('button', { name: 'Save Loop', exact: true }).click();
  // Closed first: the dialog's own suggestions include an "Intro" button too.
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Its place goes to the saved loop's pill.
  await expect(page.getByRole('button', { name: 'Intro', exact: true })).toBeVisible();
  await expect(addLoop).toHaveCount(0);
  expect(await storedLoops(page)).toEqual([expect.objectContaining({ name: 'Intro', start_time: 0, end_time: 10 })]);
});

test('Cancel after Add a loop goes back to no selection', async ({ page }) => {
  await openWith(page, []);
  await page.getByRole('button', { name: 'Add a loop' }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(row(page)).toHaveText('Drag on the track to make a loop');
  await expect(page.getByRole('button', { name: 'Add a loop' })).toBeVisible();
});

test('the loop isn’t drawn until one is picked', async ({ page }) => {
  await openWith(page, [SOLO]);
  await expect.poll(() => loopFill(page)).toBe('rgba(0, 0, 0, 0)');
  await page.getByRole('button', { name: 'Solo', exact: true }).click();
  await expect.poll(() => loopFill(page)).not.toBe('rgba(0, 0, 0, 0)');
});

test('Cancel drops a new selection, back to the hint', async ({ page }) => {
  await openWith(page, []);
  await dragSelection(page, 0.5, 0.6);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(row(page)).toHaveText('Drag on the track to make a loop');
  await expect.poll(() => loopFill(page)).toBe('rgba(0, 0, 0, 0)');
  // The loop spans the whole video again.
  const region = await page.locator('[part~="region"][part~="loop"]').first().boundingBox();
  const track = await page.locator('[part~="canvases"]').first().boundingBox();
  expect(region!.width).toBeGreaterThan(track!.width * 0.95);
  expect(await storedLoops(page)).toHaveLength(0);
});

test('dragging a saved loop’s edge offers Update, which moves that loop', async ({ page }) => {
  await openWith(page, [SOLO]);
  await page.getByRole('button', { name: 'Solo', exact: true }).click();
  await expect(activePill(page)).toHaveText('Solo');

  await dragRightEdge(page, 60);
  // The pill stays selected while its loop is edited.
  await expect(activePill(page)).toHaveText('Solo');
  await page.getByRole('button', { name: 'Update loop' }).click();
  // Saved: the Update button goes, with no toast.
  await expect(page.getByRole('button', { name: /Update/ })).toHaveCount(0);

  const [loop] = await storedLoops(page);
  expect(await storedLoops(page)).toHaveLength(1);
  expect(loop!.name).toBe('Solo');
  expect(loop!.start_time).toBe(30);
  expect(loop!.end_time).toBeGreaterThan(45);
  await expect(activePill(page)).toHaveText('Solo');
});

test('Cancel puts an edited saved loop back to its saved edges', async ({ page }) => {
  await openWith(page, [SOLO]);
  await page.getByRole('button', { name: 'Solo', exact: true }).click();
  await dragRightEdge(page, 60);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(row(page)).toHaveText('Drag the edges to adjust this loop');
  await expect(activePill(page)).toHaveText('Solo');
  await expect(page.getByRole('button', { name: /Update/ })).toHaveCount(0);
  expect(await storedLoops(page)).toEqual([SOLO]);
});

test('Save as new keeps the original loop and adds another', async ({ page }) => {
  await openWith(page, [SOLO]);
  await page.getByRole('button', { name: 'Solo', exact: true }).click();
  await dragRightEdge(page, 60);

  await page.getByRole('button', { name: 'Save as new loop' }).click();
  await page.getByPlaceholder('Loop name (optional)').fill('Solo, longer');
  await page.getByRole('button', { name: 'Save Loop', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Solo, longer', exact: true })).toBeVisible();

  const loops = await storedLoops(page);
  expect(loops.map((loop) => loop.name).sort()).toEqual(['Solo', 'Solo, longer']);
  expect(loops.find((loop) => loop.name === 'Solo')).toMatchObject({ start_time: 30, end_time: 45 });
});

test('a fresh drag after picking a saved loop is a new selection, not an update', async ({ page }) => {
  await openWith(page, [SOLO]);
  await page.getByRole('button', { name: 'Solo', exact: true }).click();
  await dragSelection(page, 0.7, 0.8);
  await expect(page.getByRole('button', { name: 'Save loop', exact: true })).toBeVisible();
  await expect(activePill(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Update/ })).toHaveCount(0);
});

test('Share opens a copy-link dialog, carrying the saved loops when there are any', async ({ page }) => {
  await openWith(page, [SOLO]);
  await page.getByRole('button', { name: 'Share' }).click();
  await expect(page.getByRole('dialog', { name: 'Share this song and its loops' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Share link' })).toHaveValue(
    new RegExp(`/video/${VIDEO_ID}#v1=30-45:Solo$`),
  );
});

test('Share without loops shares the song on its own', async ({ page }) => {
  await openWith(page, []);
  await page.getByRole('button', { name: 'Share' }).click();
  await expect(page.getByRole('dialog', { name: 'Share this song' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Share link' })).toHaveValue(new RegExp(`/video/${VIDEO_ID}$`));
});

test('on a phone the playback controls fit one row', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWith(page, []);
  const boxes = await Promise.all(
    [
      page.getByRole('button', { name: 'Restart Loop' }),
      page.getByRole('button', { name: 'Play or Pause' }),
      page.getByRole('combobox', { name: 'Playback rate' }),
    ].map((locator) => locator.boundingBox()),
  );
  const centers = boxes.map((box) => box!.y + box!.height / 2);
  for (const center of centers) expect(Math.abs(center - centers[0]!)).toBeLessThan(2);
  const right = boxes[2]!.x + boxes[2]!.width;
  expect(right).toBeLessThanOrEqual(390);
});
