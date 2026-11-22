import { expect, test } from '@playwright/test';
import { mockSupabase, mockYouTube } from './fixtures';

test.beforeEach(async ({ page }) => {
  await mockYouTube(page);
  await mockSupabase(page);
});

test('a new visitor sees how it works, the demo and what they get', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Practice the part you’re stuck on' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What you get' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pick up where you left off' })).toHaveCount(0);

  // The demo opens as a share link, so its loops come with it.
  await page.getByRole('link', { name: 'Open the demo' }).click();
  await expect(page).toHaveURL(/\/video\/b00h8iKaklQ$/);
  await expect(page.getByRole('dialog')).toContainText('8 loops');
});

test('someone with saved songs sees their recent songs instead', async ({ page }) => {
  await page.addInitScript(() => {
    const songs = ['Little Wing', 'Hotel California', 'Blackbird', 'Wonderwall'].map((title, i) => ({
      videoId: `vid${i}`,
      title,
      savedAt: `2026-01-0${4 - i}T00:00:00Z`,
    }));
    localStorage.setItem('melodicus:v1:songs', JSON.stringify(songs));
    localStorage.setItem(
      'melodicus:v1:sections:vid0',
      JSON.stringify([{ id: 'a', name: 'Solo', start_time: 80, end_time: 110 }]),
    );
  });
  await page.goto('/');
  const recent = page.getByRole('region', { name: 'Pick up where you left off' });
  await expect(recent.getByRole('heading', { level: 3 })).toHaveText(['Little Wing', 'Hotel California', 'Blackbird']);
  await expect(recent.getByText('Solo')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What you get' })).toHaveCount(0);

  await recent.getByRole('link', { name: 'All my songs' }).click();
  await expect(page).toHaveURL(/\/saved-songs$/);
});
