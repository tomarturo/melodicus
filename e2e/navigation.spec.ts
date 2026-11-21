import { expect, test, type Page } from '@playwright/test';
import { VIDEO_ID, mockSupabase, mockYouTube } from './fixtures';

const SONGS = [
  { videoId: VIDEO_ID, title: 'E2E song', savedAt: '2026-01-02T00:00:00Z' },
  { videoId: 'otherVideo1', title: 'Little Wing', savedAt: '2026-01-01T00:00:00Z' },
];

test.beforeEach(async ({ page }) => {
  await mockYouTube(page);
  await mockSupabase(page);
  await page.addInitScript((songs) => localStorage.setItem('melodicus:v1:songs', JSON.stringify(songs)), SONGS);
});

const sidebar = (page: Page) => page.getByRole('navigation', { name: 'Main' });
const toggle = (page: Page) => page.getByRole('button', { name: /sidebar/ });

test.describe('sidebar rail', () => {
  test('replaces the top bar, and expands on hover to list saved songs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByPlaceholder('Search')).toHaveCount(0);
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(sidebar(page).getByText('Little Wing')).toHaveCount(0);

    await page.mouse.move(700, 300);
    await sidebar(page).hover();
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
    await sidebar(page).getByText('Little Wing').click();

    await expect(page).toHaveURL(/\/video\/otherVideo1$/);
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('closes when the mouse leaves', async ({ page }) => {
    await page.goto('/');
    await page.mouse.move(700, 300);
    await sidebar(page).hover();
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
    await page.mouse.move(900, 300);
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('My songs leads to the saved songs page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'My songs' }).click();
    await expect(page).toHaveURL(/\/saved-songs$/);
    await expect(page.getByRole('heading', { name: 'Little Wing' })).toBeVisible();
  });

  test.describe('on a touch screen', () => {
    test.use({ hasTouch: true });

    test('the toggle opens it, and a tap outside closes it', async ({ page }) => {
      await page.goto('/');
      await toggle(page).tap();
      await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
      await expect(sidebar(page).getByText('E2E song')).toBeVisible();

      await page.getByTestId('sidebar-backdrop').tap({ position: { x: 900, y: 400 } });
      await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
    });
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('a menu button opens the sidebar as a drawer', async ({ page }) => {
    await page.goto('/');
    await expect(toggle(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Open menu' }).click();
    const drawer = page.getByRole('dialog');
    await drawer.getByText('Little Wing').click();
    await expect(page).toHaveURL(/\/video\/otherVideo1$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('search dialog', () => {
  const dialog = (page: Page) => page.getByRole('dialog', { name: 'Search' });
  const input = (page: Page) => dialog(page).getByRole('combobox');
  // The shortcut listener is attached in an effect, just after the first
  // paint, so retry until the dialog opens.
  const pressShortcut = async (page: Page) => {
    await expect(async () => {
      if ((await dialog(page).count()) === 0) await page.keyboard.press('Control+k');
      await expect(dialog(page)).toBeVisible({ timeout: 500 });
    }).toPass();
  };

  test('opens from the rail, filters saved songs, and Enter opens the highlighted one', async ({ page }) => {
    await page.goto('/');
    await sidebar(page).getByRole('button', { name: 'Search' }).click();
    await expect(dialog(page)).toBeVisible();

    await input(page).fill('wing');
    await expect(dialog(page).getByRole('option')).toHaveText(['Little Wing', 'Search YouTube for “wing”']);
    await input(page).press('Enter');
    await expect(page).toHaveURL(/\/video\/otherVideo1$/);
    await expect(dialog(page)).toHaveCount(0);
  });

  test('opens with the keyboard shortcut and searches YouTube on request', async ({ page }) => {
    await page.goto(`/video/${VIDEO_ID}`);
    await pressShortcut(page);
    await input(page).fill('bohemian rhapsody');
    await input(page).press('Enter');
    await expect(page).toHaveURL(/\/search\/bohemian%20rhapsody$/);
  });

  test('arrow keys move the highlight', async ({ page }) => {
    await page.goto('/');
    await pressShortcut(page);
    await input(page).fill('e');
    await input(page).press('ArrowDown');
    await expect(dialog(page).getByRole('option', { selected: true })).toHaveText('Little Wing');
  });

  test('opens a pasted YouTube link directly', async ({ page }) => {
    await page.goto('/');
    await pressShortcut(page);
    await input(page).fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await expect(dialog(page).getByRole('option')).toHaveText(['Open this YouTube video']);
    await input(page).press('Enter');
    await expect(page).toHaveURL(/\/video\/dQw4w9WgXcQ$/);
  });
});
