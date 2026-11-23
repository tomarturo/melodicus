import { expect, test, type Page } from '@playwright/test';
import { USER_ID, mockSupabase, mockYouTube, signIn } from './fixtures';

const RPC = 'https://e2e.supabase.co/rest/v1/rpc/delete_own_account';

const seedAccount = async (page: Page) => {
  const db = await mockSupabase(page);
  db.tables.saved_songs = [{ id: 's1', user_id: USER_ID, video_id: 'aaa', title: 'Little Wing', created_at: '2026-01-02T00:00:00Z' }];
  db.tables.saved_sections = [
    { id: 'x1', user_id: USER_ID, saved_song_id: 's1', name: 'Intro', start_time: 0, end_time: 12, created_at: '2026-01-02T00:00:01Z' },
    { id: 'x2', user_id: USER_ID, saved_song_id: 's1', name: 'Solo', start_time: 80, end_time: 110, created_at: '2026-01-02T00:00:02Z' },
  ];
  await signIn(page);
};

/** Answers the delete call, and counts the calls. */
const mockDelete = async (page: Page, { works = true } = {}) => {
  const calls: string[] = [];
  await page.route(RPC, async (route) => {
    calls.push(route.request().method());
    await route.fulfill(works ? { status: 204 } : { status: 500, json: { message: 'Something went wrong on our side' } });
  });
  return calls;
};

test.beforeEach(async ({ page }) => {
  await mockYouTube(page);
});

test('the sidebar leads to the account page, which says what deleting would take', async ({ page }) => {
  await seedAccount(page);
  await page.goto('/');
  await page.mouse.move(700, 300);
  await page.getByRole('navigation', { name: 'Main' }).hover();
  await page.getByRole('link', { name: 'Account: e2e@example.com' }).click();

  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole('heading', { name: 'Account', level: 1 })).toBeVisible();
  await expect(page.getByText('Signed in as').locator('..')).toContainText('e2e@example.com');
  await expect(page.getByText('Deletes your account and your 1 song and 2 loops. This can’t be undone.')).toBeVisible();
});

test('deleting takes typing DELETE, then signs out, clears this browser and goes home', async ({ page }) => {
  await seedAccount(page);
  const calls = await mockDelete(page);
  // Guest songs from before logging in, which must not come back.
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('melodicus:v1:songs', JSON.stringify([{ videoId: 'bbb', title: 'Guest song', savedAt: '2026-01-01T00:00:00Z' }]));
  });
  await page.goto('/account');
  await page.getByRole('button', { name: 'Delete account' }).click();

  const dialog = page.getByRole('dialog', { name: 'Delete your account?' });
  await expect(dialog).toContainText('This deletes your account and your 1 song and 2 loops, for good.');
  const confirm = dialog.getByRole('button', { name: 'Delete account' });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel('Type DELETE to confirm').fill('delet');
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel('Type DELETE to confirm').fill('delete');
  await confirm.click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Your account was deleted')).toBeVisible();
  expect(calls).toEqual(['POST']);
  await expect(page.getByRole('button', { name: 'Log in' })).toBeAttached();
  expect(await page.evaluate(() => [localStorage.getItem('sb-e2e-auth-token'), localStorage.getItem('melodicus:v1:songs')])).toEqual([
    null,
    null,
  ]);
});

test('if deleting fails, the dialog stays open with the reason, and nothing changes', async ({ page }) => {
  await seedAccount(page);
  await mockDelete(page, { works: false });
  await page.goto('/account');
  await page.getByRole('button', { name: 'Delete account' }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete your account?' });
  await dialog.getByLabel('Type DELETE to confirm').fill('DELETE');
  await dialog.getByRole('button', { name: 'Delete account' }).click();

  await expect(dialog.getByRole('alert')).toContainText('Couldn’t delete your account.');
  await expect(page).toHaveURL(/\/account$/);
  expect(await page.evaluate(() => localStorage.getItem('sb-e2e-auth-token'))).not.toBeNull();
});

test('Log out is on the account page, not in the sidebar, and leads home', async ({ page }) => {
  await seedAccount(page);
  await page.goto('/account');
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Log out' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Logged out')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log in' })).toBeAttached();
});

test('signed out, the account page sends you home', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/account');
  await expect(page).toHaveURL(/\/$/);
});
