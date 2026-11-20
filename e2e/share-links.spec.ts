import { expect, test } from '@playwright/test';
import { VIDEO_ID, VIDEO_TITLE, mockSupabase, mockYouTube, signIn } from './fixtures';

const SHARE_FRAGMENT = 'v1=10-20:Intro,30-45.5:Solo%2C%20part%202';

test.beforeEach(async ({ page }) => {
  await mockYouTube(page);
});

test('a guest imports loops from a share link and keeps them after a reload', async ({ page }) => {
  await mockSupabase(page);
  await page.goto(`/video/${VIDEO_ID}#${SHARE_FRAGMENT}`);

  const dialog = page.getByRole('dialog', { name: 'Import 2 loops?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Solo, part 2')).toBeVisible();
  await dialog.getByRole('button', { name: 'Import 2 loops' }).click();

  await expect(page.getByText('2 loops added')).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/video/${VIDEO_ID}$`));
  await expect(page.getByText('Intro', { exact: true })).toBeVisible();
  await expect(page.getByText('Solo, part 2', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText('Intro', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('an old ?sections= link still imports', async ({ page }) => {
  await mockSupabase(page);
  const legacy = Buffer.from(
    encodeURIComponent(JSON.stringify([{ id: 1, name: 'Bridge', start_time: 50, end_time: 60 }])),
  ).toString('base64');
  await page.goto(`/video/${VIDEO_ID}?sections=${legacy}`);

  await page.getByRole('button', { name: 'Import 1 loop' }).click();
  await expect(page.getByText('Bridge', { exact: true })).toBeVisible();
});

test('declining the import saves nothing', async ({ page }) => {
  await mockSupabase(page);
  await page.goto(`/video/${VIDEO_ID}#${SHARE_FRAGMENT}`);
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Intro', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('melodicus:v1:songs'))).toBeNull();
});

test('a signed-in user imports loops into their account', async ({ page }) => {
  const db = await mockSupabase(page);
  await signIn(page);
  await page.goto(`/video/${VIDEO_ID}#${SHARE_FRAGMENT}`);

  await page.getByRole('button', { name: 'Import 2 loops' }).click();
  await expect(page.getByText('2 loops added')).toBeVisible();
  await expect(page.getByText('Intro', { exact: true })).toBeVisible();

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
