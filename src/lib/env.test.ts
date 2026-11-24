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
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    vi.stubEnv('VITE_SUPABASE_URL', 'not a url');
    const { envError } = await import('./env');
    expect(envError).toContain('VITE_SUPABASE_ANON_KEY');
    expect(envError).toContain('VITE_SUPABASE_URL');
  });

  it('leaves analytics off when the measurement ID is unset or empty', async () => {
    expect((await import('./env')).gaMeasurementId).toBeNull();
    vi.resetModules();
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '');
    expect((await import('./env')).gaMeasurementId).toBeNull();
  });

  it('reads a measurement ID, trimming stray spaces', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', ' G-ABC123XYZ ');
    const { gaMeasurementId, envError } = await import('./env');
    expect(gaMeasurementId).toBe('G-ABC123XYZ');
    expect(envError).toBeNull();
  });

  it('turns analytics off, without breaking the app, for a malformed ID', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'UA-12345-1');
    const { gaMeasurementId, envError } = await import('./env');
    expect(gaMeasurementId).toBeNull();
    expect(envError).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
  });
});
