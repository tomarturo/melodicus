import { z } from 'zod';

const EnvSchema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
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
    };

const MeasurementIdSchema = z.string().trim().regex(/^G-[A-Z0-9]+$/);

/**
 * Google Analytics' measurement ID, or null to send nothing. It's optional, so
 * it isn't in EnvSchema: local dev, tests and preview deploys leave it unset,
 * and a malformed one turns analytics off rather than taking the app down.
 */
export const gaMeasurementId: string | null = (() => {
  const raw: unknown = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (raw === undefined || raw === '') return null;
  const parsed = MeasurementIdSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  console.warn('VITE_GA_MEASUREMENT_ID should look like G-XXXXXXXXXX. Analytics is off.');
  return null;
})();
