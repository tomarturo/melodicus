import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { VIDEO_ID, mockSupabase, mockYouTube } from './fixtures';

const FRAME = { light: 'rgb(233, 232, 228)', dark: 'rgb(20, 21, 23)' };

test.beforeEach(async ({ page }) => {
  await mockYouTube(page);
  await mockSupabase(page);
  await page.addInitScript((videoId) => {
    localStorage.setItem(`melodicus:v1:sections:${videoId}`, JSON.stringify([{ id: 'a', name: 'Solo', start_time: 30, end_time: 45 }]));
    localStorage.setItem('melodicus:v1:songs', JSON.stringify([{ videoId, title: 'E2E song', savedAt: '2026-01-01T00:00:00Z' }]));
  }, VIDEO_ID);
});

const theme = (page: Page) => page.evaluate(() => document.documentElement.dataset.theme);
const frameColor = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const expandRail = async (page: Page) => {
  await page.getByRole('button', { name: 'Expand sidebar' }).click();
  await expect(page.getByRole('radiogroup', { name: 'Appearance' })).toBeVisible();
};

/** Fails with every element whose text is below WCAG AA contrast. */
const expectReadable = async (page: Page, where: string) => {
  const { violations } = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  const problems = violations.flatMap((violation) =>
    violation.nodes.map((node) => `${where}: ${node.target.join(' ')} — ${node.any[0]?.message ?? ''}`),
  );
  expect(problems).toEqual([]);
};

for (const scheme of ['light', 'dark'] as const) {
  test(`text meets contrast requirements in ${scheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    for (const path of ['/', `/video/${VIDEO_ID}`, '/saved-songs', '/search/test']) {
      await page.goto(path);
      await expect.poll(() => theme(page)).toBe(scheme);
      await expectReadable(page, path);
    }

    await page.goto(`/video/${VIDEO_ID}`);
    await page.getByRole('button', { name: 'Add loop' }).click();
    await expect(page.getByRole('dialog')).toHaveCSS('opacity', '1');
    await expectReadable(page, 'loop name dialog');
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Options for Solo' }).click();
    // Measured once the menu has faded in, not through its translucent start.
    await expect(page.getByRole('menu')).toHaveCSS('opacity', '1');
    await expectReadable(page, 'loop menu');
    await page.keyboard.press('Escape');

    await expandRail(page);
    await expectReadable(page, 'expanded sidebar');
  });
}

test('follows the system setting by default, including when it changes', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  expect(await theme(page)).toBe('dark');
  expect(await frameColor(page)).toBe(FRAME.dark);

  // The system listener is attached just after the first paint; flip the
  // setting until the app has seen it.
  await expect(async () => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.emulateMedia({ colorScheme: 'light' });
    expect(await theme(page)).toBe('light');
  }).toPass();
  await expect.poll(() => frameColor(page)).toBe(FRAME.light);
});

test('a chosen mode overrides the system and survives a reload; System hands back control', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expandRail(page);
  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect.poll(() => theme(page)).toBe('dark');
  await expect(page.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');

  await page.reload();
  expect(await theme(page)).toBe('dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.waitForTimeout(200);
  expect(await theme(page)).toBe('dark');

  await expandRail(page);
  await page.getByRole('radio', { name: 'System' }).click();
  await expect.poll(() => theme(page)).toBe('light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(() => theme(page)).toBe('dark');
});

test('the collapsed rail’s appearance button steps through the modes', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Appearance: System. Switch to Light' }).click();
  await page.getByRole('button', { name: 'Appearance: Light. Switch to Dark' }).click();
  await expect.poll(() => theme(page)).toBe('dark');
});

test('a dark-mode visitor never sees a light page while the app loads', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  // Hold the app's JavaScript back, so only index.html has run.
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/assets/*.js', async (route) => {
    await held;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'commit' });
  await page.waitForFunction(() => document.body !== null);

  expect(await theme(page)).toBe('dark');
  expect(await frameColor(page)).toBe(FRAME.dark);
  expect(await page.locator('meta[name="theme-color"]').getAttribute('content')).toBe('#141517');
  release();
});
