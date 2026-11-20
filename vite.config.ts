import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    // e2e/ holds Playwright tests, which run in a real browser instead.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // Placeholder values so modules that read configuration can load in tests.
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      VITE_YOUTUBE_API_KEY: 'test-youtube-key',
    },
  },
});
