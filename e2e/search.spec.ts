import { expect, test, type Page } from '@playwright/test';
import { mockSupabase, mockYouTube } from './fixtures';

const item = (videoId: string, title: string, channelTitle = 'A channel') => ({
  id: { videoId },
  snippet: { title, description: 'Noise', channelTitle, thumbnails: { medium: { url: '' } } },
});

const mockSearch = (page: Page, respond: Parameters<Page['route']>[1]) => page.route('**/youtube/v3/search**', respond);

test.beforeEach(async ({ page }) => {
  await mockYouTube(page);
  await mockSupabase(page);
});

test('results lead with the query, read cleanly, and mark songs already saved', async ({ page }) => {
  await mockSearch(page, (route) =>
    route.fulfill({ json: { items: [item('saved1', 'Little Wing'), item('new1', 'Hendrix&#39;s intro &amp; outro', 'Guitar &amp; Co')] } }),
  );
  await page.addInitScript(() => {
    localStorage.setItem('melodicus:v1:songs', JSON.stringify([{ videoId: 'saved1', title: 'Little Wing', savedAt: '2026-01-01T00:00:00Z' }]));
    localStorage.setItem(
      'melodicus:v1:sections:saved1',
      JSON.stringify([
        { id: 'a', name: 'Intro', start_time: 0, end_time: 5 },
        { id: 'b', name: 'Solo', start_time: 9, end_time: 20 },
      ]),
    );
  });
  await page.goto('/search/little%20wing');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Results for little wing');
  await expect(page.getByRole('heading', { name: 'Hendrix\'s intro & outro' })).toBeVisible();
  await expect(page.getByText('Guitar & Co')).toBeVisible();
  await expect(page.getByText('Noise')).toHaveCount(0);
  await expect(page.getByText('Saved · 2 loops')).toBeVisible();
  // Only the saved song is marked.
  await expect(page.getByText(/^Saved ·/)).toHaveCount(1);
});

test('searching again stays in the app and escapes the query', async ({ page }) => {
  await mockSearch(page, (route) => route.fulfill({ json: { items: [item('v1', 'A song')] } }));
  await page.goto('/search/first');
  await expect(page.getByRole('heading', { name: 'A song' })).toBeVisible();
  await page.evaluate(() => ((window as unknown as { stayedInApp: boolean }).stayedInApp = true));

  const field = page.getByRole('searchbox', { name: 'Search YouTube' });
  await field.fill('AC/DC #1');
  await field.press('Enter');
  await expect(page).toHaveURL(/\/search\/AC%2FDC%20%231$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Results for AC/DC #1');
  expect(await page.evaluate(() => (window as unknown as { stayedInApp?: boolean }).stayedInApp)).toBe(true);
});

test('an empty search turns the pro tip into an error', async ({ page }) => {
  await mockSearch(page, (route) => route.fulfill({ json: { items: [] } }));
  await page.goto('/search/something');
  await page.getByRole('searchbox', { name: 'Search YouTube' }).fill('   ');
  await page.getByRole('button', { name: 'Search YouTube' }).click();
  await expect(page.getByText('try again')).toBeVisible();
  await expect(page.getByText('Please enter a song title & artist')).toBeVisible();
});

test('no results and a failed search each say so, and a failure can be retried', async ({ page }) => {
  let calls = 0;
  await mockSearch(page, (route) => {
    calls += 1;
    return calls === 1 ? route.fulfill({ status: 500, json: {} }) : route.fulfill({ json: { items: [] } });
  });
  await page.goto('/search/zzzz');
  await expect(page.getByText('Couldn’t load results from YouTube.')).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('No videos found.', { exact: false })).toBeVisible();
});

test('with the quota used up, a pasted link opens the video and a bad one is caught', async ({ page }) => {
  await mockSearch(page, (route) =>
    route.fulfill({ status: 403, json: { error: { errors: [{ reason: 'quotaExceeded' }] } } }),
  );
  await page.goto('/search/little%20wing');
  await expect(page.getByRole('heading', { name: 'We can’t search YouTube right now' })).toBeVisible();

  const link = page.getByRole('textbox', { name: 'YouTube link' });
  await link.fill('not a link');
  await page.getByRole('button', { name: 'Open video' }).click();
  await expect(page.getByRole('alert')).toContainText('doesn’t look like a YouTube link');
  await expect(page).toHaveURL(/\/search\//);

  await link.fill('https://youtu.be/abcdefghijk');
  await page.getByRole('button', { name: 'Open video' }).click();
  await expect(page).toHaveURL(/\/video\/abcdefghijk$/);
});
