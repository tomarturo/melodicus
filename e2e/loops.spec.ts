import { expect, test } from '@playwright/test';
import { VIDEO_ID, VIDEO_TITLE, mockSupabase, mockYouTube } from './fixtures';

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
