import { expect, test } from '@playwright/test';
import { VIDEO_ID, VIDEO_TITLE, mockSupabase, mockYouTube, signIn } from './fixtures';

test('a guest saves, renames and deletes a loop, and the song shows under My songs', async ({ page }) => {
  await mockYouTube(page);
  await mockSupabase(page);
  await page.goto(`/video/${VIDEO_ID}`);

  // The loop starts out spanning the whole video, which is a valid loop to save.
  await page.getByRole('button', { name: 'Add loop' }).click();
  await page.getByPlaceholder('Loop name (optional)').fill('Chorus');
  await page.getByRole('button', { name: 'Save Loop' }).click();
  await expect(page.getByText('Loop saved!')).toBeVisible();
  await expect(page.getByText('Chorus', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Options for Chorus' }).click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  await page.getByPlaceholder('Loop name (optional)').fill('Last chorus');
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page.getByText('Last chorus', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'My songs' }).click();
  await expect(page.getByRole('heading', { name: VIDEO_TITLE })).toBeVisible();
  await expect(page.getByText('saved in this browser')).toBeVisible();

  await page.goBack();
  await page.getByRole('button', { name: 'Options for Last chorus' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(page.getByText('Last chorus', { exact: true })).toHaveCount(0);
});

test('tapping Save twice while a slow save is in flight saves the loop once', async ({ page }) => {
  await mockYouTube(page);
  const db = await mockSupabase(page, undefined, { writeDelayMs: 800 });
  await signIn(page);
  await page.goto(`/video/${VIDEO_ID}`);

  await page.getByRole('button', { name: 'Add loop' }).click();
  await page.getByPlaceholder('Loop name (optional)').fill('Once');
  // Both clicks land before React can re-render the button as busy.
  await page.getByRole('button', { name: 'Save Loop' }).evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect(page.getByRole('button', { name: /Saving/ })).toBeVisible();
  await expect(page.getByText('Loop saved!')).toBeVisible();

  expect(db.tables.saved_sections).toHaveLength(1);
  expect(db.tables.saved_songs).toHaveLength(1);
});

test('loop name pills sit above the track, leaving all of it free for dragging', async ({ page }) => {
  await mockYouTube(page);
  await mockSupabase(page);
  await page.addInitScript(
    (videoId) =>
      localStorage.setItem(
        `melodicus:v1:sections:${videoId}`,
        JSON.stringify([
          { id: 'a', name: 'Intro', start_time: 0, end_time: 12 },
          { id: 'b', name: 'Verse', start_time: 14, end_time: 40 },
        ]),
      ),
    VIDEO_ID,
  );
  await page.goto(`/video/${VIDEO_ID}`);

  const track = await page.locator('[part~="canvases"]').boundingBox();
  for (const name of ['Intro', 'Verse']) {
    const pill = await page.getByRole('button', { name: `Options for ${name}` }).boundingBox();
    expect(pill, name).not.toBeNull();
    expect(track).not.toBeNull();
    expect(pill!.y + pill!.height, `${name} pill bottom`).toBeLessThanOrEqual(track!.y);
  }
});
