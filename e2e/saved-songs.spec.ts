import { expect, test, type Page } from '@playwright/test';
import { USER_ID, mockSupabase, mockYouTube, signIn } from './fixtures';

const SONGS = [
  { videoId: 'aaa', title: 'Little Wing', savedAt: '2026-01-02T00:00:00Z' },
  { videoId: 'bbb', title: 'Hotel California', savedAt: '2026-01-01T00:00:00Z' },
];
const LOOPS = {
  aaa: [
    { id: 'a2', name: 'Solo', start_time: 80, end_time: 110 },
    { id: 'a1', name: 'Intro', start_time: 0, end_time: 12 },
  ],
  bbb: ['Intro', 'Verse riff', 'Chorus', 'Bridge', 'Solo', 'Outro'].map((name, i) => ({
    id: `b${i}`,
    name,
    start_time: i * 30,
    end_time: i * 30 + 10,
  })),
};

const seedGuest = (page: Page) =>
  page.addInitScript(
    ([songs, loops]) => {
      localStorage.setItem('melodicus:v1:songs', JSON.stringify(songs));
      for (const [videoId, sections] of Object.entries(loops)) {
        localStorage.setItem(`melodicus:v1:sections:${videoId}`, JSON.stringify(sections));
      }
    },
    [SONGS, LOOPS] as const,
  );

const songRow = (page: Page, title: string) => page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: title }) });

test.beforeEach(async ({ page }) => {
  await mockYouTube(page);
});

test('each song lists its loops in playing order, the rest summed up', async ({ page }) => {
  await mockSupabase(page);
  await seedGuest(page);
  await page.goto('/saved-songs');

  await expect(page.getByRole('heading', { name: 'My songs' })).toBeVisible();
  await expect(page.getByText('2 songs')).toBeVisible();
  const wing = songRow(page, 'Little Wing');
  await expect(wing.getByText('2 loops · Saved')).toBeVisible();
  await expect(wing.getByRole('list', { name: 'Loops' }).getByRole('listitem')).toHaveText(['Intro', 'Solo']);
  const hotel = songRow(page, 'Hotel California');
  await expect(hotel.getByRole('list', { name: 'Loops' }).getByRole('listitem')).toHaveText([
    'Intro',
    'Verse riff',
    'Chorus',
    'Bridge',
    '+2 more',
  ]);
});

test('Remove hides a song with an Undo, and Undo brings it back', async ({ page }) => {
  await mockSupabase(page);
  await seedGuest(page);
  await page.goto('/saved-songs');

  await page.getByRole('button', { name: 'Options for Little Wing' }).click();
  await page.getByRole('menuitem', { name: 'Remove' }).click();
  await expect(page.getByRole('heading', { name: 'Little Wing' })).toHaveCount(0);
  await expect(page.getByText('1 song', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('heading', { name: 'Little Wing' })).toBeVisible();
  // Nothing was deleted.
  await page.waitForTimeout(5500);
  expect(await page.evaluate(() => localStorage.getItem('melodicus:v1:sections:aaa'))).not.toBeNull();
});

test('a removed song is deleted once its Undo runs out', async ({ page }) => {
  await mockSupabase(page);
  await seedGuest(page);
  await page.goto('/saved-songs');

  await page.getByRole('button', { name: 'Options for Little Wing' }).click();
  await page.getByRole('menuitem', { name: 'Remove' }).click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('melodicus:v1:sections:aaa')), { timeout: 8000 })
    .toBeNull();
  const songs = await page.evaluate(() => JSON.parse(localStorage.getItem('melodicus:v1:songs') ?? '[]'));
  expect(songs.map((song: { title: string }) => song.title)).toEqual(['Hotel California']);
  await expect(page.getByRole('heading', { name: 'Little Wing' })).toHaveCount(0);
});

test('guests see the temporarily saved banner, whose Log in opens the login dialog', async ({ page }) => {
  await mockSupabase(page);
  await seedGuest(page);
  await page.goto('/saved-songs');
  await expect(page.getByText('Temporarily saved')).toBeVisible();
  await page.getByRole('button', { name: 'Log in' }).last().click();
  await expect(page.getByRole('dialog', { name: 'Log in' })).toBeVisible();
});

test('signed in, there is no banner and the loops come from the account', async ({ page }) => {
  const db = await mockSupabase(page);
  db.tables.saved_songs = [{ id: 's1', user_id: USER_ID, video_id: 'aaa', title: 'Little Wing', created_at: '2026-01-02T00:00:00Z' }];
  db.tables.saved_sections = [
    { id: 'x2', user_id: USER_ID, saved_song_id: 's1', name: 'Solo', start_time: 80, end_time: 110, created_at: '2026-01-02T00:00:02Z' },
    { id: 'x1', user_id: USER_ID, saved_song_id: 's1', name: 'Intro', start_time: 0, end_time: 12, created_at: '2026-01-02T00:00:01Z' },
  ];
  await signIn(page);
  await page.goto('/saved-songs');
  await expect(songRow(page, 'Little Wing').getByRole('list', { name: 'Loops' }).getByRole('listitem')).toHaveText([
    'Intro',
    'Solo',
  ]);
  await expect(page.getByText('Temporarily saved')).toHaveCount(0);
});

test('a failed login keeps the dialog open, with the reason under the fields', async ({ page }) => {
  await mockSupabase(page);
  await page.route('https://e2e.supabase.co/auth/v1/token**', (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials' }),
    }),
  );
  await page.goto('/saved-songs');
  await page.getByRole('button', { name: 'Log in' }).last().click();
  const dialog = page.getByRole('dialog', { name: 'Log in' });
  await dialog.getByLabel('Email').fill('someone@example.com');
  await dialog.getByLabel('Password').fill('wrong-password');
  await dialog.getByLabel('Password').press('Enter');

  await expect(dialog.getByRole('alert')).toContainText('Couldn’t log in. Invalid login credentials');
  await expect(dialog.getByLabel('Email')).toHaveValue('someone@example.com');

  await dialog.getByRole('button', { name: 'Create an account' }).click();
  await expect(page.getByRole('dialog', { name: 'Create an account' })).toBeVisible();
  await expect(page.getByText('At least 6 characters')).toBeVisible();
});
