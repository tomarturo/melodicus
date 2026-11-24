import { expect, test } from '@playwright/test';
import { mockSupabase, mockYouTube } from './fixtures';

test('the Privacy page sends questions, bugs and ideas to the support address, with GitHub as an option', async ({ page }) => {
  await mockYouTube(page);
  await mockSupabase(page);
  await page.goto('/privacy');
  const questions = page.getByRole('heading', { name: 'Questions' }).locator('..');
  await expect(questions.getByRole('link', { name: 'support@melodicus.xyz' })).toHaveAttribute('href', 'mailto:support@melodicus.xyz');
  await expect(questions.getByRole('link', { name: 'Melodicus’s public code' })).toHaveAttribute('href', 'https://github.com/tomarturo/melodicus/issues');
  // The code is public, not open source: the repository has no license.
  await expect(page.getByText(/open source/i)).toHaveCount(0);
});
