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
const isExpanded = (page: Page, value: boolean) => expect(sidebar(page)).toHaveAttribute('data-expanded', String(value));
// Behind an open dialog the rest of the page is hidden from the accessibility
// tree, so these find the rail and its toggle by their markup instead.
const railBehindDialog = (page: Page) => page.locator('nav[data-expanded]');
const toggleBehindDialog = (page: Page) => page.locator('button[aria-expanded][aria-label$="sidebar"]');

test.describe('sidebar rail', () => {
  test('replaces the top bar, and expands on hover to list saved songs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByPlaceholder('Search')).toHaveCount(0);
    // With a mouse, hover opens it, so there's no toggle button.
    await expect(toggle(page)).toHaveCount(0);
    await isExpanded(page, false);
    await expect(sidebar(page).getByText('Little Wing')).toHaveCount(0);

    await page.mouse.move(700, 300);
    await sidebar(page).hover();
    await isExpanded(page, true);
    await sidebar(page).getByText('Little Wing').click();

    await expect(page).toHaveURL(/\/video\/otherVideo1$/);
    await isExpanded(page, false);
  });

  test('closes when the mouse leaves', async ({ page }) => {
    await page.goto('/');
    await page.mouse.move(700, 300);
    await sidebar(page).hover();
    await isExpanded(page, true);
    await page.mouse.move(900, 300);
    await isExpanded(page, false);
  });

  test('Log in closes the rail, then opens the login dialog', async ({ page }) => {
    await page.goto('/');
    await page.mouse.move(700, 300);
    await sidebar(page).hover();
    await isExpanded(page, true);
    await sidebar(page).getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('dialog', { name: 'Log in or sign up' })).toBeVisible();
    await expect(railBehindDialog(page)).toHaveAttribute('data-expanded', 'false');
  });

  test('the foot of the rail: Support, then a © row whose links show when the rail opens', async ({ page }) => {
    await page.goto('/');
    const support = sidebar(page).getByRole('link', { name: 'Email support: support@melodicus.xyz' });
    await expect(support).toHaveAttribute('href', 'mailto:support@melodicus.xyz');
    const iconSize = (name: string | RegExp) =>
      sidebar(page).getByRole('link', { name }).locator('svg').first().evaluate((svg) => svg.getBoundingClientRect().width);
    expect(await iconSize('My songs')).toBe(22);
    expect(await iconSize(/Email support/)).toBe(18);

    // Collapsed, the rail ends at Support; open, a line of links follows it,
    // in space kept for it all along, so nothing above moves.
    const footer = page.getByRole('navigation', { name: 'About Melodicus' });
    await expect(footer.getByRole('link')).toHaveCount(0);
    const supportTop = () => support.locator('svg').evaluate((svg) => svg.getBoundingClientRect().top);
    const collapsedTop = await supportTop();
    await page.mouse.move(700, 300);
    await sidebar(page).hover();
    await expect(footer.getByRole('link')).toHaveText(['2026 Tom Kurzeka', 'Privacy', 'Source']);
    expect(await supportTop()).toBe(collapsedTop);
    await footer.getByRole('link', { name: 'Privacy' }).click();
    await expect(page).toHaveURL(/\/privacy$/);
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

    test('Log in closes the opened rail, then opens the login dialog', async ({ page }) => {
      await page.goto('/');
      await toggle(page).tap();
      await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
      await sidebar(page).getByRole('button', { name: 'Log in' }).tap();
      await expect(page.getByRole('dialog', { name: 'Log in or sign up' })).toBeVisible();
      await expect(toggleBehindDialog(page)).toHaveAttribute('aria-expanded', 'false');
      await expect(page.getByTestId('sidebar-backdrop')).toHaveCount(0);
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

  test('Log in closes the drawer, then opens the login dialog', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('dialog', { name: 'Log in or sign up' })).toBeVisible();
    // One dialog in the page, the login: the drawer has gone. Counted in the
    // markup, since an open dialog hides any other from the accessibility tree.
    await expect(page.locator('[role="dialog"]')).toHaveCount(1);
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

  test('opens from the rail, offers a YouTube search first, then matching saved songs', async ({ page }) => {
    await page.goto('/');
    await sidebar(page).getByRole('button', { name: 'Search' }).click();
    await expect(dialog(page)).toBeVisible();

    await input(page).fill('wing');
    await expect(dialog(page).getByRole('option')).toHaveText(['Find songs for “wing”', 'Little Wing']);
    await expect(dialog(page).getByRole('option', { selected: true })).toHaveText('Find songs for “wing”');
    await input(page).press('ArrowDown');
    await input(page).press('Enter');
    await expect(page).toHaveURL(/\/video\/otherVideo1$/);
    await expect(dialog(page)).toHaveCount(0);
  });

  test('opens with the keyboard shortcut, and Enter on a typed title searches YouTube even when a saved song matches', async ({ page }) => {
    await page.goto(`/video/${VIDEO_ID}`);
    await pressShortcut(page);
    await input(page).fill('little wing');
    await expect(dialog(page).getByRole('option', { name: 'Little Wing', exact: true })).toBeVisible();
    await input(page).press('Enter');
    await expect(page).toHaveURL(/\/search\/little%20wing$/);
  });

  test('arrow keys move the highlight', async ({ page }) => {
    await page.goto('/');
    await pressShortcut(page);
    await input(page).fill('e');
    await input(page).press('ArrowDown');
    await input(page).press('ArrowDown');
    await expect(dialog(page).getByRole('option', { selected: true })).toHaveText('Little Wing');
    await input(page).press('ArrowUp');
    await expect(dialog(page).getByRole('option', { selected: true })).toHaveText('E2E song');
  });

  test('opens a pasted YouTube link directly', async ({ page }) => {
    await page.goto('/');
    await pressShortcut(page);
    await input(page).fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await expect(dialog(page).getByRole('option')).toHaveText(['Open in Melodicus']);
    await input(page).press('Enter');
    await expect(page).toHaveURL(/\/video\/dQw4w9WgXcQ$/);
  });
});
