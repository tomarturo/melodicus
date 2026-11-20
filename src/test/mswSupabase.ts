import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { FakePostgrest } from './fakePostgrest';

export const TEST_SUPABASE_URL = 'https://test.supabase.co';

/** An MSW server that answers Supabase REST calls from a FakePostgrest. */
export function setupFakeSupabase(fake: FakePostgrest) {
  return setupServer(
    http.all(`${TEST_SUPABASE_URL}/rest/v1/*`, async ({ request }) => {
      const text = request.method === 'GET' || request.method === 'HEAD' ? '' : await request.text();
      const response = fake.handle({
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        body: text ? JSON.parse(text) : null,
      });
      return response.body === null
        ? new HttpResponse(null, { status: response.status })
        : HttpResponse.json(response.body, { status: response.status });
    }),
  );
}
