/**
 * Keeps the Supabase project from pausing on the free plan, which happens
 * after about a week without activity. Vercel Cron calls this once a day
 * (vercel.json); .github/workflows/keep-alive.yml does the same from GitHub
 * as a backup, so either can miss a day.
 *
 * It reads one row of saved_songs through Supabase's REST API, so the request
 * reaches the database itself, not just a health check. Row-level security
 * means the public key gets back an empty list: no one's data is read.
 */

// The same table and query as the GitHub workflow.
export const KEEP_ALIVE_PATH = '/rest/v1/saved_songs?select=id&limit=1';

export interface PingResult {
  ok: boolean;
  status: number;
}

/** Makes the keep-alive request. */
export async function pingSupabase(url: string, anonKey: string, fetchImpl: typeof fetch = fetch): Promise<PingResult> {
  const response = await fetchImpl(`${url.replace(/\/$/, '')}${KEEP_ALIVE_PATH}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  return { ok: response.ok, status: response.status };
}

type Env = Record<string, string | undefined>;

/**
 * The function Vercel Cron calls. Uses the app's own Supabase settings, which
 * Vercel already has for the build. If CRON_SECRET is set in Vercel, only
 * calls carrying it (as Vercel Cron's do) are accepted.
 */
export async function handleKeepAlive(request: Request, env: Env, fetchImpl: typeof fetch = fetch): Promise<Response> {
  const secret = env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const url = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return Response.json({ ok: false, error: 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set' }, { status: 500 });
  }
  try {
    const result = await pingSupabase(url, anonKey, fetchImpl);
    // A failed ping is an error, so it shows as one in Vercel's logs.
    return Response.json(result, { status: result.ok ? 200 : 502 });
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 502 });
  }
}

export function GET(request: Request): Promise<Response> {
  return handleKeepAlive(request, process.env);
}
