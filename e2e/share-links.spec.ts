import { expect, test, type Page } from '@playwright/test';
import { VIDEO_ID, VIDEO_TITLE, dragSelection, mockSupabase, mockYouTube, signIn } from './fixtures';

const SHARE_FRAGMENT = 'v1=10-20:Intro,30-45.5:Solo%2C%20part%202';

test.beforeEach(async ({ page }) => {
  await mockYouTube(page);
});

// What this browser has saved for the video, as { name, start, end } per loop.
const savedHere = (page: Page) =>
  page.evaluate((videoId) => {
    const raw = localStorage.getItem(`melodicus:v1:sections:${videoId}`);
    return raw ? (JSON.parse(raw) as Array<{ name: string | null; start_time: number; end_time: number }>).map((loop) => [loop.name, loop.start_time, loop.end_time]) : null;
  }, VIDEO_ID);
const pills = (page: Page) => page.getByRole('list', { name: 'Saved loops' }).getByRole('listitem');

test('a share link opens with its loops showing, saving nothing until asked', async ({ page }) => {
  await mockSupabase(page);
  await page.goto(`/video/${VIDEO_ID}#${SHARE_FRAGMENT}`);

  // No dialog in the way: the loops are on the timeline, ready to play.
  await expect(pills(page)).toHaveText(['Intro', 'Solo, part 2']);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/video/${VIDEO_ID}$`));
  expect(await savedHere(page)).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('melodicus:v1:songs'))).toBeNull();

  // Picking one plays it like any loop.
  await page.getByRole('button', { name: 'Solo, part 2', exact: true }).click();
  await expect(page.getByText('Drag the edges to adjust this loop')).toBeVisible();
});

test('Save song saves the song with all its loops, then goes away', async ({ page }) => {
  await mockSupabase(page);
  await page.goto(`/video/${VIDEO_ID}#${SHARE_FRAGMENT}`);
  await page.getByRole('button', { name: 'Save song' }).click();

  await expect(page.getByText('Saved to My songs')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save song' })).toHaveCount(0);
  expect(await savedHere(page)).toEqual([
    ['Intro', 10, 20],
    ['Solo, part 2', 30, 45.5],
  ]);

  await page.reload();
  await expect(pills(page)).toHaveText(['Intro', 'Solo, part 2']);
  await expect(page.getByRole('button', { name: 'Save song' })).toHaveCount(0);
});

test('renaming one of the link’s loops saves the song, with it renamed', async ({ page }) => {
  await mockSupabase(page);
  await page.goto(`/video/${VIDEO_ID}#${SHARE_FRAGMENT}`);
  await page.getByRole('button', { name: 'Options for Intro' }).click();
  await page.getByRole('menuitem', { name: 'Rename' }).click();
  await page.getByPlaceholder('Loop name (optional)').fill('Count-in');
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(pills(page)).toHaveText(['Count-in', 'Solo, part 2']);
  await expect(page.getByRole('button', { name: 'Save song' })).toHaveCount(0);
  expect(await savedHere(page)).toEqual([
    ['Count-in', 10, 20],
    ['Solo, part 2', 30, 45.5],
  ]);
});

test('deleting one of the link’s loops saves the song with the rest, and Undo brings it back', async ({ page }) => {
  await mockSupabase(page);
  await page.goto(`/video/${VIDEO_ID}#${SHARE_FRAGMENT}`);
  await page.getByRole('button', { name: 'Options for Intro' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();

  await expect(pills(page)).toHaveText(['Solo, part 2']);
  expect(await savedHere(page)).toEqual([['Solo, part 2', 30, 45.5]]);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(pills(page)).toHaveText(['Intro', 'Solo, part 2']);
});

test('moving one of the link’s loops offers Update, which saves the song with it moved', async ({ page }) => {
  await mockSupabase(page);
  await page.goto(`/video/${VIDEO_ID}#${SHARE_FRAGMENT}`);
  await page.getByRole('button', { name: 'Solo, part 2', exact: true }).click();
  const handle = await page.locator('[part~="region-handle-right"]').first().boundingBox();
  const track = await page.locator('[part~="canvases"]').first().boundingBox();
  const y = track!.y + track!.height / 2;
  await page.mouse.move(handle!.x + handle!.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(handle!.x + handle!.width / 2 + 60, y, { steps: 8 });
  await page.mouse.up();

  await page.getByRole('button', { name: 'Update loop' }).click();
  // The selection now points at the saved copy: no Update left to offer.
  await expect(page.getByRole('button', { name: 'Update loop' })).toHaveCount(0);
  const saved = await savedHere(page);
  expect(saved?.map(([name]) => name)).toEqual(['Intro', 'Solo, part 2']);
  expect(saved?.[1]?.[2]).toBeGreaterThan(45.5);
  await expect(page.locator('[aria-current="true"]')).toHaveText('Solo, part 2');
});

test('a new loop on a song from a link saves the song: the link’s loops and the new one', async ({ page }) => {
  await mockSupabase(page);
  await page.goto(`/video/${VIDEO_ID}#${SHARE_FRAGMENT}`);
  await expect(pills(page)).toHaveCount(2);
  await dragSelection(page, 0.6, 0.8);
  await page.getByRole('button', { name: 'Save loop', exact: true }).click();
  await page.getByPlaceholder('Loop name (optional)').fill('Outro');
  await page.getByRole('dialog').getByRole('button', { name: 'Save loop', exact: true }).click();

  await expect(pills(page)).toHaveText(['Intro', 'Solo, part 2', 'Outro']);
  await expect(page.getByRole('button', { name: 'Save song' })).toHaveCount(0);
  expect((await savedHere(page))?.map(([name]) => name)).toEqual(['Intro', 'Solo, part 2', 'Outro']);
});

test('an old ?sections= link still brings its loops', async ({ page }) => {
  await mockSupabase(page);
  const legacy = Buffer.from(
    encodeURIComponent(JSON.stringify([{ id: 1, name: 'Bridge', start_time: 50, end_time: 60 }])),
  ).toString('base64');
  await page.goto(`/video/${VIDEO_ID}?sections=${legacy}`);
  await expect(pills(page)).toHaveText(['Bridge']);
});

test('a signed-in user saves a song from a link into their account', async ({ page }) => {
  const db = await mockSupabase(page);
  await signIn(page);
  await page.goto(`/video/${VIDEO_ID}#${SHARE_FRAGMENT}`);
  await expect(pills(page)).toHaveText(['Intro', 'Solo, part 2']);
  expect(db.tables.saved_songs ?? []).toEqual([]);

  await page.getByRole('button', { name: 'Save song' }).click();
  await expect(page.getByText('Saved to My songs')).toBeVisible();

  expect(db.tables.saved_songs).toMatchObject([{ video_id: VIDEO_ID, title: VIDEO_TITLE }]);
  expect(db.tables.saved_sections?.map((row) => row.name)).toEqual(['Intro', 'Solo, part 2']);
  expect(await page.evaluate(() => localStorage.getItem('melodicus:v1:songs'))).toBeNull();
});

test('loops saved as a guest move into the account on sign-in', async ({ page }) => {
  const db = await mockSupabase(page);
  await page.addInitScript(
    ({ videoId }) => {
      if (localStorage.getItem('melodicus:v1:songs')) return;
      localStorage.setItem('melodicus:v1:songs', JSON.stringify([{ videoId, title: 'Guest song', savedAt: '2026-01-01T00:00:00Z' }]));
      localStorage.setItem(
        `melodicus:v1:sections:${videoId}`,
        JSON.stringify([
          { id: 'g1', name: 'Verse', start_time: 1, end_time: 5 },
          { id: 'g2', name: null, start_time: 6, end_time: 9 },
        ]),
      );
    },
    { videoId: VIDEO_ID },
  );
  await signIn(page);
  await page.goto('/saved-songs');

  await expect(page.getByText('2 loops added to your account')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Guest song' })).toBeVisible();
  expect(db.tables.saved_sections).toHaveLength(2);
  expect(await page.evaluate((id) => localStorage.getItem(`melodicus:v1:sections:${id}`), VIDEO_ID)).toBeNull();
});
