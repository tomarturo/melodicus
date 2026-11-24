import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Safari's engine, which is what the iPad runs. CI installs it; it can't be
    // downloaded in every development environment, so it runs there only
    // unless PLAYWRIGHT_WEBKIT=1.
    ...(process.env.CI || process.env.PLAYWRIGHT_WEBKIT ? [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }] : []),
  ],
  webServer: {
    // Built against a fake Supabase host; every request to it is intercepted in the tests.
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: 'https://e2e.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'e2e-anon-key',
    },
  },
});
