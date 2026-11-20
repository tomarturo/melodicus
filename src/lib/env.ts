import { z } from 'zod';

const EnvSchema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_YOUTUBE_API_KEY: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;

const result = EnvSchema.safeParse(import.meta.env);

/**
 * A readable description of missing or invalid environment variables, or null
 * when they are all present. index.tsx renders this instead of the app, so a
 * misconfigured deploy fails visibly rather than with a blank page.
 */
export const envError: string | null = result.success ? null : z.prettifyError(result.error);

// When envError is set the app never renders, but modules that read env at
// import time (the Supabase client) still need values that won't throw.
export const env: Env = result.success
  ? result.data
  : {
      VITE_SUPABASE_URL: 'http://invalid.localhost',
      VITE_SUPABASE_ANON_KEY: 'missing',
      VITE_YOUTUBE_API_KEY: 'missing',
    };
