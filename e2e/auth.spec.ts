import { expect, test, type Page } from '@playwright/test';
import { USER_ID, mockSupabase, mockYouTube } from './fixtures';

const EMAIL = 'player@example.com';

// What Supabase's /verify answers with when a code is right: a session.
const SESSION = {
  access_token: 'e2e.access.token',
  refresh_token: 'e2e-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  user: {
    id: USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email: EMAIL,
    app_metadata: {},
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
  },
};

/** Answers the two auth calls, and records what the app sent to each. */
async function mockCodeLogin(page: Page, { codeWorks = true } = {}) {
  const sent: { otp: unknown[]; verify: unknown[] } = { otp: [], verify: [] };
  await page.route('https://e2e.supabase.co/auth/v1/otp**', async (route) => {
    sent.otp.push(route.request().postDataJSON());
    await route.fulfill({ json: {} });
  });
  await page.route('https://e2e.supabase.co/auth/v1/verify**', async (route) => {
    sent.verify.push(route.request().postDataJSON());
    await route.fulfill(
      codeWorks
        ? { json: SESSION }
        : { status: 403, json: { code: 403, error_code: 'otp_expired', msg: 'Token has expired or is invalid' } },
    );
  });
  return sent;
}

const openLogin = async (page: Page) => {
  await page.goto('/saved-songs');
  await page.getByRole('button', { name: 'Log in' }).last().click();
  return page.getByRole('dialog', { name: 'Log in or sign up' });
};

test.beforeEach(async ({ page }) => {
  await mockYouTube(page);
  await mockSupabase(page);
});

test('logs in with an emailed code: email, then the code, then signed in', async ({ page }) => {
  const sent = await mockCodeLogin(page);
  const dialog = await openLogin(page);
  await expect(dialog.getByLabel('Password')).toHaveCount(0);

  await dialog.getByLabel('Email').fill(EMAIL);
  await dialog.getByRole('button', { name: 'Email me a code' }).click();
  // New emails get an account, so the request allows creating one.
  await expect.poll(() => sent.otp).toEqual([expect.objectContaining({ email: EMAIL, create_user: true })]);

  const codeStep = page.getByRole('dialog', { name: 'Check your email' });
  await expect(codeStep).toContainText(`We sent a code to ${EMAIL}`);
  // Pasted codes keep only their digits.
  await codeStep.getByLabel('Code').fill('123 456');
  await expect(codeStep.getByLabel('Code')).toHaveValue('123456');
  await codeStep.getByRole('button', { name: 'Log in' }).click();

  await expect.poll(() => sent.verify).toEqual([expect.objectContaining({ email: EMAIL, token: '123456', type: 'email' })]);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Log out' })).toBeAttached();
  await expect(page.getByRole('heading', { name: 'Build your repertoire.' })).toHaveCount(0);
});

test('a wrong or expired code keeps the dialog open, with a way to get a new one', async ({ page }) => {
  await mockCodeLogin(page, { codeWorks: false });
  const dialog = await openLogin(page);
  await dialog.getByLabel('Email').fill(EMAIL);
  await dialog.getByRole('button', { name: 'Email me a code' }).click();

  const codeStep = page.getByRole('dialog', { name: 'Check your email' });
  await codeStep.getByLabel('Code').fill('000000');
  await codeStep.getByLabel('Code').press('Enter');
  await expect(codeStep.getByRole('alert')).toContainText('That code didn’t work');
  await expect(codeStep.getByLabel('Code')).toHaveValue('000000');
});

test('a new code can be sent after a minute, and the email can be changed', async ({ page }) => {
  await page.clock.install();
  const sent = await mockCodeLogin(page);
  const dialog = await openLogin(page);
  await dialog.getByLabel('Email').fill(EMAIL);
  await dialog.getByRole('button', { name: 'Email me a code' }).click();

  const codeStep = page.getByRole('dialog', { name: 'Check your email' });
  await expect(codeStep.getByRole('button', { name: /Send a new code in \d+s/ })).toBeDisabled();
  await page.clock.runFor(61_000);
  await codeStep.getByRole('button', { name: 'Send a new code' }).click();
  await expect.poll(() => sent.otp.length).toBe(2);

  await codeStep.getByRole('button', { name: 'Use a different email' }).click();
  const emailStep = page.getByRole('dialog', { name: 'Log in or sign up' });
  await expect(emailStep.getByLabel('Email')).toHaveValue(EMAIL);
});

test('an address Supabase refuses shows why, on the email step', async ({ page }) => {
  await page.route('https://e2e.supabase.co/auth/v1/otp**', (route) =>
    route.fulfill({ status: 429, json: { code: 429, error_code: 'over_email_send_rate_limit', msg: 'Email rate limit exceeded' } }),
  );
  const dialog = await openLogin(page);
  await dialog.getByLabel('Email').fill(EMAIL);
  await dialog.getByRole('button', { name: 'Email me a code' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Couldn’t send a code. Email rate limit exceeded');
  await expect(dialog.getByLabel('Email')).toHaveValue(EMAIL);
});
