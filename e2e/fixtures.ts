import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { FakePostgrest } from '../src/test/fakePostgrest';

export const VIDEO_ID = 'e2eVideo001';
export const VIDEO_TITLE = 'E2E song';
export const USER_ID = '11111111-1111-4111-8111-111111111111';

const fakeIframeApi = readFileSync(new URL('./fakeYouTubeIframeApi.js', import.meta.url), 'utf8');

/**
 * Answers the YouTube Data API with a 3:30 video. The IFrame player is either
 * blocked (the page runs on the API's details alone) or replaced with a fake
 * that plays on a simulated clock.
 */
export async function mockYouTube(page: Page, { player = false }: { player?: boolean } = {}) {
  await page.route('**/youtube/v3/videos**', (route) =>
    route.fulfill({
      json: {
        items: [
          {
            contentDetails: { duration: 'PT3M30S' },
            snippet: { title: VIDEO_TITLE, thumbnails: { medium: { url: '' } } },
          },
        ],
      },
    }),
  );
  await page.route('**/iframe_api', (route) =>
    player ? route.fulfill({ contentType: 'text/javascript', body: fakeIframeApi }) : route.abort(),
  );
}

/**
 * Routes the app's Supabase traffic to an in-memory database. writeDelayMs
 * holds back inserts and updates, like a slow connection.
 */
export async function mockSupabase(
  page: Page,
  fake = new FakePostgrest(USER_ID),
  { writeDelayMs = 0 }: { writeDelayMs?: number } = {},
) {
  await page.route('https://e2e.supabase.co/rest/v1/**', async (route) => {
    const request = route.request();
    if (writeDelayMs > 0 && request.method() !== 'GET') await new Promise((resolve) => setTimeout(resolve, writeDelayMs));
    const response = fake.handle({
      method: request.method(),
      url: request.url(),
      headers: request.headers(),
      body: request.postData() ? request.postDataJSON() : null,
    });
    await route.fulfill(
      response.body === null ? { status: response.status } : { status: response.status, json: response.body },
    );
  });
  await page.route('https://e2e.supabase.co/auth/v1/**', (route) =>
    route.fulfill({ json: { id: USER_ID, email: 'e2e@example.com', aud: 'authenticated' } }),
  );
  return fake;
}

/** Stores a long-lived session where supabase-js looks for one, so the app starts signed in. */
export async function signIn(page: Page) {
  const session = {
    access_token: 'e2e.access.token',
    refresh_token: 'e2e-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 24 * 3600,
    user: {
      id: USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'e2e@example.com',
      app_metadata: {},
      user_metadata: {},
      created_at: '2026-01-01T00:00:00Z',
    },
  };
  await page.addInitScript((value) => localStorage.setItem('sb-e2e-auth-token', value), JSON.stringify(session));
}
