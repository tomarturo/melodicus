# Analytics plan: Google Analytics + Supabase metrics

Two kinds of data, two sources. Each answers questions the other can't.

| Question | Source |
| --- | --- |
| How many people visit, from where, on what device, and do they come back? | Google Analytics 4 |
| What do guests do? (Guest loops live in `localStorage` and never reach Supabase.) | Google Analytics 4 |
| Where do people drop off: home → video → first loop → sign up? | Google Analytics 4 |
| How many accounts, songs and loops exist, and how fast is that growing? | Supabase |
| How often are loops renamed, retimed or deleted? | Supabase (needs the event log in Part 2) |
| How many accounts are actually active? | Supabase |

GA counts what happens in the browser and is undercounted by ad blockers (often
15–30% for a musician and developer audience). Supabase is the exact record of
saved data, but only for signed-in users. Use GA for trends and funnels and
Supabase for exact totals, and don't expect the two to match.

---

## Part 1: Google Analytics 4

### 1.1 Setup

1. Create a GA4 property and a web data stream for `melodicus.xyz`. In the
   stream's Enhanced Measurement settings, **turn off "Page changes based on
   browser history events"**. The app sends its own page views (1.3), and
   leaving both on counts every page twice.
2. Add an **optional** `VITE_GA_MEASUREMENT_ID` to `.env.example` and to
   Vercel's **Production** environment only. Preview deploys and local dev then
   send nothing, so test traffic stays out of the numbers.
3. In `src/lib/env.ts`, add it as `z.string().regex(/^G-/).optional()`. It must
   not be required: a deploy without it should still run, just without tracking.

### 1.2 `src/lib/analytics.ts`: one small module

Every call site goes through this module, never through `gtag` directly:

- `initAnalytics()`: if the ID is set, sets the consent defaults (1.6), injects
  `https://www.googletagmanager.com/gtag/js?id=…`, defines `gtag`, and calls
  `gtag('config', id, { send_page_view: false })`. Otherwise it does nothing.
  Called once from `src/index.tsx`, and only when `envError` is null.
- `trackPageView(path)` and `track(event, params)`: typed wrappers. An
  `AnalyticsEvent` union type lists the allowed event names and their
  parameters, so a typo fails `npm run typecheck`.
- `identify(userId | null)`: sets `user_id` to the Supabase user UUID (a random
  ID, not personal data, and allowed by GA's rules) and sets the user property
  `signed_in`. This lets GA link one person's sessions across their iPad and
  laptop.
- With no ID, all of these do nothing, so Vitest and Playwright need no mocks.
  Unit-test the module against a fake `window.gtag`.

No new npm dependency is needed: the gtag snippet is about 10 lines.
(`react-ga4` would also work, but it adds nothing here.)

### 1.3 Page views (the app is a single-page app)

Add a `<RouteTracker />` next to `<GuestLoopsSync />` in `src/App.tsx`. It
calls `useLocation()` and runs `trackPageView` whenever `pathname` changes.

**Privacy rules for URLs:**
- **Never send the hash.** Share links put the loop data in `#…`
  (`shareFormat.ts`). Send `page_location` as `origin + pathname` only.
- **Remove the query string.** Legacy share links (`decodeLegacyShare`) put loops in `?…`.
- `/search/:query` puts what the user typed in the path. Send it as
  `/search/:query` and put the term in a `search` event (1.4), or leave it out
  completely if you'd rather not collect search terms.
- `/video/:videoId` is fine to send as is: it's a public YouTube ID and is
  how you'll see which songs people learn.

Also set `page_title` from a route-name map (`home`, `video`, `search`,
`saved_songs`), because `document.title` doesn't change between routes.

### 1.4 Events

GA4 recommended event names are marked ★. Everything else is a custom event.
Every loop event has `storage: 'guest' | 'account'`, from `repo.kind` in
`useSectionsRepository`.

| Event | Fired from | Parameters |
| --- | --- | --- |
| `sign_up` ★ | `AuthModal.tsx` after `signup()` succeeds | `method: 'email'` |
| `login` ★ | `AuthModal.tsx` after `login()` succeeds | `method: 'email'` |
| `logout` | `AuthContext.logout` | — |
| `search` ★ | `SearchResults.tsx` / `CommandSearch.tsx` | `search_term` (optional, see 1.3) |
| `video_open` | `VideoPage.tsx` once the player is ready | `video_id`, `source: 'link' \| 'search' \| 'saved' \| 'recent' \| 'share'` |
| `loop_create` | `useSectionMutations().create` `onSuccess` | `storage`, `duration_s` (rounded), `named: boolean` |
| `loop_rename` | `rename` `onSuccess` | `storage` |
| `loop_retime` | `retime` `onSuccess` | `storage` |
| `loop_delete` | `remove` `onSuccess` | `storage` |
| `loop_play` | wherever a loop pill is selected | `storage` (sample if noisy) |
| `playback_rate_change` | `VideoPage.tsx` `onPlaybackRateChange` | `rate` |
| `share` ★ | `ShareButton.tsx` after the clipboard write succeeds | `method: 'link'`, `loop_count` |
| `share_import` | `VideoPage.tsx` after `importLoops` | `added` |
| `song_delete` | `useDeleteSavedSong` `onSuccess` | — |
| `guest_loops_synced` | `GuestLoopsSync.tsx` | `added`, `failed` |

Put the loop and song events in the `onSuccess` callbacks in
`src/features/sections/queries.ts`, not in the components. That way every place
that triggers a mutation is counted once, and failed writes aren't counted.

In the GA admin, register `storage`, `source` and `rate` as custom dimensions,
and mark `sign_up`, `loop_create` and `share` as **key events**.

### 1.5 Funnels to build in GA Explore

1. **Activation:** `page_view (home)` → `video_open` → `loop_create` → `sign_up`
2. **Guest to account:** users with a `loop_create` where `storage=guest` who later have a `sign_up`
3. **Sharing:** `share` → `video_open (source=share)` → `share_import`

### 1.6 Consent and privacy

**Decision: no consent banner.** GA sets no cookies for visitors in the EEA,
UK and Switzerland, so there's nothing to ask their consent for. Everyone else
is tracked normally.

`initAnalytics()` sets the Consent Mode v2 defaults **before** the `config`
call. The defaults for a specific region override the global ones, and gtag
works out each visitor's region from their IP address:

```ts
const COOKIE_FREE_REGIONS = [
  // EU
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
  'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // rest of the EEA, then the UK and Switzerland
  'IS', 'LI', 'NO', 'GB', 'CH',
];
const ADS_OFF = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };

gtag('consent', 'default', { ...ADS_OFF, analytics_storage: 'denied', region: COOKIE_FREE_REGIONS });
gtag('consent', 'default', { ...ADS_OFF, analytics_storage: 'granted' });
gtag('config', id, { send_page_view: false });
```

- **What this costs:** for visitors in those regions, GA sends only cookieless
  pings with no client ID. They count toward totals, but they don't show up as
  users, sessions or funnels. GA can estimate the missing data, but only above
  about 1,000 daily users, which Melodicus won't reach. So in practice those
  visitors are left out of GA reports. Supabase still counts the ones who sign up.
- `identify()` sets `user_id` the same way everywhere. When cookies are off,
  GA doesn't use it to link sessions.
- Ads stay off for everyone. Melodicus shows no ads, and this keeps GA from
  using ad features without anyone deciding to.
- Add a short privacy note (a footer link) that says GA is used and that
  visitors in the EEA, UK and Switzerland aren't sent cookies.
- **Add a consent banner later if:** EU visitors become a meaningful share of
  your users and you want their data, or someone complains. Then add a small
  Chakra bar for those regions, which calls `gtag('consent', 'update', { analytics_storage: 'granted' })`
  and remembers the choice in `localStorage`. Nothing else needs to change.
- Turn on IP-based location only at country level and leave Google Signals off
  (the default), so no extra consent rules apply.

### 1.7 Tests

- Vitest: `analytics.ts` with and without an ID, and that both `consent default`
  calls happen before `config`; `RouteTracker` sends paths
  with the hash and query removed.
- Playwright: one test that stubs `window.gtag`, creates a loop as a guest, and
  checks that `loop_create` was sent with `storage: 'guest'`.

---

## Part 2: Supabase metrics

### 2.1 What the current schema can and can't tell you

| Metric | Available now? |
| --- | --- |
| Accounts created (per day) | ✅ `auth.users.created_at` |
| Confirmed accounts / last sign-in | ✅ `auth.users.email_confirmed_at`, `last_sign_in_at` |
| Songs saved, loops created (per day) | ✅ `created_at` on both tables, **net of deletions** |
| Loops / songs per user, named vs unnamed loops | ✅ |
| Most-saved videos | ✅ `saved_songs.video_id` |
| **Loops edited** (renamed or retimed) | ❌ no `updated_at`, and updates leave no trace |
| **Deletions** | ❌ hard deletes, and the cascade removes loops with their song |
| Guest activity | ❌ never reaches the database (use GA) |

### 2.2 Migration: an activity log written by triggers

New migration `supabase/migrations/2026112xxxxxxx_activity_events.sql`:

```sql
create table public.activity_events (
  id          bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  user_id     uuid,
  entity      text not null check (entity in ('song', 'loop')),
  action      text not null check (action in ('create', 'rename', 'retime', 'delete')),
  entity_id   uuid not null
);
create index on public.activity_events (occurred_at);

-- RLS on, no policies: the app's anon and authenticated roles can't read or
-- write it. Only the dashboard (service role / SQL editor) can.
alter table public.activity_events enable row level security;

create function public.log_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ent text := case tg_table_name when 'saved_songs' then 'song' else 'loop' end;
begin
  if tg_op = 'INSERT' then
    insert into activity_events (user_id, entity, action, entity_id) values (new.user_id, ent, 'create', new.id);
  elsif tg_op = 'DELETE' then
    insert into activity_events (user_id, entity, action, entity_id) values (old.user_id, ent, 'delete', old.id);
  elsif tg_op = 'UPDATE' and ent = 'loop' then
    if new.name is distinct from old.name then
      insert into activity_events (user_id, entity, action, entity_id) values (new.user_id, ent, 'rename', new.id);
    end if;
    if (new.start_time, new.end_time) is distinct from (old.start_time, old.end_time) then
      insert into activity_events (user_id, entity, action, entity_id) values (new.user_id, ent, 'retime', new.id);
    end if;
  end if;
  return null;
end $$;

create trigger saved_songs_activity    after insert or delete            on saved_songs    for each row execute function log_activity();
create trigger saved_sections_activity after insert or update or delete on saved_sections for each row execute function log_activity();
```

Also worth adding in the same migration: `updated_at timestamptz` on
`saved_sections`, with a trigger that sets it on update.

Notes:
- The triggers record every write, including cascaded loop deletions and
  loops copied over by `GuestLoopsSync` / `importSections`. To tell imported
  loops apart, add a `source` column to `saved_sections` (`'manual' | 'import' | 'guest_sync'`)
  later. Until then, GA's `share_import` and `guest_loops_synced` cover it.
- History starts on the day the migration runs. Earlier creates can be
  backfilled from `created_at`; earlier edits and deletions are gone.
- As with the other migrations, run it in the Supabase SQL Editor, then run `npm run db:types`.
- Space use is tiny: one short row per write.

### 2.3 Reporting views

A second migration adds a private `analytics` schema with views, so the
queries live in the repo and not just in someone's saved snippets:

- `analytics.daily_signups`: per day, accounts created and accounts confirmed
- `analytics.daily_activity`: per day and per `entity`/`action`, from `activity_events`
- `analytics.totals`: users, confirmed users, songs, loops, loops per song, % of loops named
- `analytics.active_users`: users with any `activity_events` row in the last 1, 7 and 30 days
- `analytics.top_videos`: the most-saved `video_id`s with titles and loop counts
- `analytics.retention_weekly`: weekly signup cohort × weeks with activity

Revoke `analytics` from `anon` and `authenticated` so the public API never exposes it.

### 2.4 Does Supabase have a dashboard for this?

Partly. Supabase has no product-analytics dashboard. What it does have:

- **Reports** (in the Supabase dashboard): API requests, auth, storage and
  database performance. These are infrastructure numbers, not songs or loops.
- **Authentication → Users**: a list of accounts you can browse, but no chart.
- **SQL Editor**: run `select * from analytics.daily_activity`, switch the
  result to **Chart**, and save it as a snippet. This is free and works today,
  but it's just a few saved charts, not a dashboard.

### 2.5 Dashboard options

| Option | Effort | Cost | Notes |
| --- | --- | --- | --- |
| **A. SQL Editor saved snippets + chart view** | ~1 hour | Free | Fine to start with. Only you can see it, and nothing refreshes on its own. |
| **B. Looker Studio** | ~half a day | Free | Connects to **GA4 natively** and to Postgres (Supabase connection string, read-only role). **One dashboard for both sources.** Recommended. |
| C. Metabase / Grafana (hosted) | ~half a day | Free tier, or ~$0–20/mo | More powerful SQL dashboards. More than a project this size needs. |
| D. In-app `/admin` page | 1–2 days | Free | A route guarded by an `is_admin` check that calls a `security definer` RPC returning the `analytics.*` views. Most work to build and maintain, but matches the app. |

**Recommendation:** start with **A** the same day the migration runs, then set
up **B (Looker Studio)** once GA has a couple of weeks of data. For B,
create a dedicated read-only Postgres role:

```sql
create role analytics_reader login password '…' ;
grant usage on schema analytics to analytics_reader;
grant select on all tables in schema analytics to analytics_reader;
```

Connect with the **session pooler** connection string, and turn on SSL. Store
the password in Looker Studio's data-source credentials only, never in the repo.
The role can read only the aggregated views, not emails or raw rows.

Note: the free Supabase project pauses when idle, and `keep-alive.yml` pings
it to prevent that. A scheduled Looker Studio refresh also keeps it awake.

---

## Rollout order

1. **PR 1: GA foundation.** `analytics.ts`, env var, `RouteTracker`, URL privacy rules, tests. Deploy and check in GA **Realtime / DebugView**.
2. **PR 2: GA events.** The event table in 1.4, custom dimensions, key events.
3. **PR 3: Supabase activity log.** Migration 2.2 (+ `updated_at`), regenerated types. Run in the SQL Editor.
4. **PR 4: Analytics views.** Migration 2.3, plus saved SQL Editor charts (option A).
5. **Looker Studio dashboard** (option B), once there are ~2 weeks of data.

The consent defaults (1.6) and the privacy note go in PR 1, so no visitor in
the EEA, UK or Switzerland is ever sent a cookie.

## Open decisions

- Do we collect search terms (`search_term`) at all?
- Do we want a `source` column on `saved_sections` now, so imported and synced loops can be told apart from hand-made ones?
- Looker Studio (recommended), or an in-app admin page?
