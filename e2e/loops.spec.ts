import { expect, test } from '@playwright/test';
import { VIDEO_ID, VIDEO_TITLE, dragSelection, mockSupabase, mockYouTube, signIn } from './fixtures';

test('a guest saves, renames and deletes a loop, and the song shows under My songs', async ({ page }) => {
  await mockYouTube(page);
  await mockSupabase(page);
  await page.goto(`/video/${VIDEO_ID}`);

  await expect(page.locator('[part~="canvases"]')).toBeVisible();
  await dragSelection(page, 0.3, 0.5);
  await page.getByRole('button', { name: 'Save loop', exact: true }).click();
  await page.getByPlaceholder('Loop name (optional)').fill('Chorus');
  await page.getByRole('button', { name: 'Save Loop', exact: true }).click();
  // No toast: the new loop's pill is the confirmation.
  await expect(page.getByText('Chorus', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Options for Chorus' }).click();
  await page.getByRole('menuitem', { name: 'Rename' }).click();
  await page.getByPlaceholder('Loop name (optional)').fill('Last chorus');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Last chorus', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'My songs' }).click();
  await expect(page.getByRole('heading', { name: VIDEO_TITLE })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Build your repertoire.' })).toBeVisible();

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

  await expect(page.locator('[part~="canvases"]')).toBeVisible();
  await dragSelection(page, 0.3, 0.5);
  await page.getByRole('button', { name: 'Save loop', exact: true }).click();
  await page.getByPlaceholder('Loop name (optional)').fill('Once');
  // Both clicks land before React can re-render the button as busy.
  await page.getByRole('button', { name: 'Save Loop', exact: true }).evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect(page.getByRole('button', { name: /Saving/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Once', exact: true })).toBeVisible();

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

test('saved loops are listed in start-time order, and the playing one is marked', async ({ page }) => {
  await mockYouTube(page, { player: true });
  await mockSupabase(page);
  await page.addInitScript(
    (videoId) =>
      localStorage.setItem(
        `melodicus:v1:sections:${videoId}`,
        JSON.stringify([
          { id: 'c', name: 'Outro', start_time: 190, end_time: 209 },
          { id: 'a', name: 'Intro', start_time: 0, end_time: 12 },
          { id: 'b', name: 'Solo', start_time: 30, end_time: 45 },
        ]),
      ),
    VIDEO_ID,
  );
  await page.goto(`/video/${VIDEO_ID}`);

  const pills = page.getByRole('list', { name: 'Saved loops' }).getByRole('listitem');
  await expect(pills).toHaveText(['Intro', 'Solo', 'Outro']);

  await page.getByText('Solo', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Solo', exact: true })).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('[aria-current="true"]')).toHaveCount(1);
});

test('deleting a loop offers Undo, which brings it back', async ({ page }) => {
  await mockYouTube(page);
  await mockSupabase(page);
  await page.addInitScript(
    (videoId) =>
      localStorage.setItem(`melodicus:v1:sections:${videoId}`, JSON.stringify([{ id: 'r1', name: 'Riff', start_time: 10, end_time: 20 }])),
    VIDEO_ID,
  );
  await page.goto(`/video/${VIDEO_ID}`);
  await page.getByRole('button', { name: 'Options for Riff' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(page.getByRole('button', { name: 'Riff', exact: true })).toHaveCount(0);

  await expect(page.getByText('Deleted “Riff”')).toBeVisible();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('button', { name: 'Riff', exact: true })).toBeVisible();
  const stored = await page.evaluate((videoId) => JSON.parse(localStorage.getItem(`melodicus:v1:sections:${videoId}`) ?? '[]'), VIDEO_ID);
  expect(stored).toEqual([expect.objectContaining({ name: 'Riff', start_time: 10, end_time: 20 })]);
});

test('a failed save shows an error that stays until it is closed', async ({ page }) => {
  await mockYouTube(page);
  await mockSupabase(page);
  await signIn(page);
  // Loops can't be written.
  await page.route('https://e2e.supabase.co/rest/v1/saved_sections**', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'database is down' }) })
      : route.fallback(),
  );
  await page.goto(`/video/${VIDEO_ID}`);
  await expect(page.locator('[part~="canvases"]')).toBeVisible();
  await dragSelection(page, 0.3, 0.5);
  await page.getByRole('button', { name: 'Save loop', exact: true }).click();
  await page.getByRole('button', { name: 'Save Loop', exact: true }).click();

  const alert = page.getByRole('alert').filter({ hasText: 'Couldn’t save the loop' });
  await expect(alert).toBeVisible();
  await page.waitForTimeout(5000);
  await expect(alert).toBeVisible();
  await alert.getByRole('button', { name: 'Close' }).click();
  await expect(alert).toHaveCount(0);
});
