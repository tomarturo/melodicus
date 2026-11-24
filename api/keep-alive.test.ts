import { describe, expect, it, vi } from 'vitest';
import { KEEP_ALIVE_PATH, handleKeepAlive } from './keep-alive.js';

const ENV = { VITE_SUPABASE_URL: 'https://example.supabase.co/', VITE_SUPABASE_ANON_KEY: 'anon-key' };
const request = (headers: Record<string, string> = {}) => new Request('https://melodicus.xyz/api/keep-alive', { headers });
const answering = (status: number) => vi.fn<typeof fetch>(async () => new Response('[]', { status }));

describe('keep-alive', () => {
  it('reads one row through the REST API with the public key, and reports success', async () => {
    const fetchImpl = answering(200);
    const response = await handleKeepAlive(request(), ENV, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(`https://example.supabase.co${KEEP_ALIVE_PATH}`, {
      headers: { apikey: 'anon-key', Authorization: 'Bearer anon-key' },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, status: 200 });
  });

  it('fails visibly when Supabase answers with an error, or cannot be reached', async () => {
    const refused = await handleKeepAlive(request(), ENV, answering(503));
    expect(refused.status).toBe(502);
    expect(await refused.json()).toEqual({ ok: false, status: 503 });

    const unreachable = await handleKeepAlive(request(), ENV, vi.fn<typeof fetch>(async () => {
      throw new TypeError('fetch failed');
    }));
    expect(unreachable.status).toBe(502);
  });

  it('says which setting is missing instead of calling an empty address', async () => {
    const fetchImpl = answering(200);
    const response = await handleKeepAlive(request(), {}, fetchImpl);
    expect(response.status).toBe(500);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('with CRON_SECRET set, only accepts calls that carry it', async () => {
    const env = { ...ENV, CRON_SECRET: 's3cret' };
    const fetchImpl = answering(200);
    expect((await handleKeepAlive(request(), env, fetchImpl)).status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect((await handleKeepAlive(request({ authorization: 'Bearer s3cret' }), env, fetchImpl)).status).toBe(200);
  });
});
