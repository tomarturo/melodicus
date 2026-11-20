import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('env', () => {
  it('accepts a complete configuration', async () => {
    const { env, envError } = await import('./env');
    expect(envError).toBeNull();
    expect(env.VITE_SUPABASE_URL).toBe('https://test.supabase.co');
  });

  it('reports missing variables by name', async () => {
    vi.stubEnv('VITE_YOUTUBE_API_KEY', '');
    vi.stubEnv('VITE_SUPABASE_URL', 'not a url');
    const { envError } = await import('./env');
    expect(envError).toContain('VITE_YOUTUBE_API_KEY');
    expect(envError).toContain('VITE_SUPABASE_URL');
  });
});
