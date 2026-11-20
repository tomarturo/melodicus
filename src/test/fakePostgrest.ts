// An in-memory stand-in for the slice of Supabase's REST API (PostgREST) that
// the app uses: select with eq filters, order and limit; insert; update;
// delete; single-object responses; and row-level security that scopes every
// table to the signed-in user. Shared by the MSW unit tests and Playwright.

type Row = Record<string, unknown>;

export interface FakeRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

export interface FakeResponse {
  status: number;
  body: unknown;
}

let counter = 0;
const nextId = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`;
let clock = Date.parse('2026-01-01T00:00:00Z');
const nextTimestamp = () => new Date((clock += 1000)).toISOString();

export class FakePostgrest {
  tables: Record<string, Row[]> = { saved_songs: [], saved_sections: [] };
  /** Requests seen, for assertions. */
  log: Array<{ method: string; table: string }> = [];

  constructor(public userId: string) {}

  handle(request: FakeRequest): FakeResponse {
    const url = new URL(request.url);
    const table = url.pathname.split('/').pop() ?? '';
    const rows = this.tables[table];
    if (!rows) return { status: 404, body: { message: `relation "${table}" does not exist` } };
    this.log.push({ method: request.method, table });

    const accept = Object.entries(request.headers).find(([key]) => key.toLowerCase() === 'accept')?.[1] ?? '';
    const prefer = Object.entries(request.headers).find(([key]) => key.toLowerCase() === 'prefer')?.[1] ?? '';
    const wantsObject = accept.includes('application/vnd.pgrst.object+json');
    const wantsRows = request.method === 'GET' || prefer.includes('return=representation');

    // Row-level security: every table here has a user_id owned by the caller.
    const visible = rows.filter((row) => row.user_id === this.userId);
    const filtered = applyFilters(visible, url.searchParams);
    let result: Row[];

    switch (request.method) {
      case 'GET':
        result = applyOrderAndLimit(filtered, url.searchParams);
        break;
      case 'POST': {
        const inputs = (Array.isArray(request.body) ? request.body : [request.body]) as Row[];
        result = inputs.map((input) => ({
          id: nextId(),
          created_at: nextTimestamp(),
          ...(table === 'saved_sections' ? { name: null } : {}),
          ...input,
          user_id: this.userId,
        }));
        if (table === 'saved_sections') {
          const ownsSong = (row: Row) =>
            this.tables.saved_songs?.some((song) => song.id === row.saved_song_id && song.user_id === this.userId);
          if (!result.every(ownsSong)) {
            return { status: 403, body: { code: '42501', message: 'new row violates row-level security policy' } };
          }
        }
        rows.push(...result);
        break;
      }
      case 'PATCH':
        for (const row of filtered) Object.assign(row, request.body as Row);
        result = filtered;
        break;
      case 'DELETE':
        for (const row of filtered) {
          rows.splice(rows.indexOf(row), 1);
          if (table === 'saved_songs') {
            this.tables.saved_sections = (this.tables.saved_sections ?? []).filter(
              (section) => section.saved_song_id !== row.id,
            );
          }
        }
        result = filtered;
        break;
      default:
        return { status: 405, body: { message: `unsupported method ${request.method}` } };
    }

    const projected = project(result, url.searchParams.get('select'));
    if (!wantsRows) return { status: request.method === 'POST' ? 201 : 204, body: null };
    if (wantsObject) {
      if (projected.length !== 1) {
        return {
          status: 406,
          body: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
        };
      }
      return { status: 200, body: projected[0] };
    }
    return { status: 200, body: projected };
  }
}

const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'columns']);

function applyFilters(rows: Row[], params: URLSearchParams): Row[] {
  return rows.filter((row) =>
    [...params.entries()].every(([column, expression]) => {
      if (RESERVED.has(column)) return true;
      if (!expression.startsWith('eq.')) throw new Error(`fake PostgREST: unsupported filter ${column}=${expression}`);
      return String(row[column]) === expression.slice(3);
    }),
  );
}

function applyOrderAndLimit(rows: Row[], params: URLSearchParams): Row[] {
  let result = [...rows];
  const order = params.get('order');
  if (order) {
    const [column = '', direction] = order.split('.');
    result.sort((a, b) => {
      const comparison = String(a[column]).localeCompare(String(b[column]));
      return direction === 'desc' ? -comparison : comparison;
    });
  }
  const limit = params.get('limit');
  if (limit) result = result.slice(0, Number(limit));
  return result;
}

function project(rows: Row[], select: string | null): Row[] {
  if (!select || select === '*') return rows.map((row) => ({ ...row }));
  const columns = select.split(',').map((column) => column.trim());
  return rows.map((row) => Object.fromEntries(columns.map((column) => [column, row[column]])));
}
