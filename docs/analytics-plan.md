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
  `/search/:query`, and send the term in the `search` event instead (1.4),
  where it's filtered first.
- `/video/:videoId` is fine to send as is: it's a public YouTube ID and is
  how you'll see which songs people learn.

Also set `page_title` from a route-name map (`home`, `video`, `search`,
`saved_songs`), because `document.title` doesn't change between routes.

### 1.4 Events

**Built.** The list lives in the `AnalyticsEvent` type in `src/lib/analytics.ts`,
so an unknown event name or a wrong parameter fails `npm run typecheck`. GA4
recommended event names are marked ★. Loop and song events carry
`storage: 'guest' | 'account'`.

| Event | Sent when | Parameters |
| --- | --- | --- |
| `sign_up` ★ | A login code is verified for a new account | `method: 'email_code'` |
| `login` ★ | A login code is verified for an existing account | `method: 'email_code'` |
| `logout` | Logging out succeeds | — |
| `account_delete` | An account is deleted | — |
| `search` ★ | Search results show (once per query) | `search_term` (filtered, see below), `result_count` |
| `video_open` | A video page has loaded the video's title | `video_id`, `video_title`, `from_page`, `from_share_link` |
| `loop_create` | A new loop is saved | `storage`, `duration_s`, `named` |
| `loop_rename` | A loop is renamed | `storage` |
| `loop_retime` | A loop's start and end are updated | `storage` |
| `loop_delete` | A loop is deleted | `storage` |
| `loop_delete_undo` | Undo brings a deleted loop back | `storage` |
| `loop_play` | A loop pill is tapped | — |
| `playback_rate_change` | The speed is changed | `rate` |
| `share` ★ | A share link is copied | `method: 'link'`, `content_type: 'song'`, `loop_count` |
| `share_import` | Loops from a share link are saved to My songs | `storage`, `loop_count` |
| `song_delete` | A song is removed from My songs | `storage` |
| `guest_loops_synced` | Guest loops are copied into an account at login | `added`, `failed` |

Notes:
- **Events are sent where the person acts** (mostly `VideoPage.tsx`), not from
  the save functions in `queries.ts`. A song from a share link is saved in one
  write that holds all its loops, even when someone only added, renamed or
  deleted one of them. Counting writes would mislabel those actions.
- **New or returning account.** One login code works for both, so `sign_up`
  versus `login` is worked out in `isNewAccount` (`AuthContext.tsx`).
  Verifying a code confirms a new person's email, so for a new account the
  confirmation and sign-in times are seconds apart.
- **Search terms** go through `searchTermForAnalytics`: lowercased, spaces
  tidied, cut at GA's 100-character limit. A term that looks like an email
  address, a link or domain, or a phone number is sent as `(not recorded)`,
  because GA's terms forbid personal data and its values can't be deleted one
  by one. Searches with `result_count` 0 show what Melodicus fails to find.
- **`from_page`** is the page shown before the video: `home`, `search`,
  `saved_songs`, `video` (from the sidebar's song list on another video), or
  `direct` for the first page of a visit.

**To do in the GA admin (once):**
- **Admin → Custom definitions → Create custom dimension** (scope: Event) for
  `search_term`, `storage`, `from_page`, `from_share_link`, `video_title`, `named` and
  `rate`. Parameters can't be used in reports until they're registered, and
  only from then on, so do this the day this ships.
- **Admin → Key events:** mark `sign_up`, `loop_create` and `share`. Each
  event only appears in that list after it has been received once.

### 1.5 Funnels to build in GA Explore

1. **Activation:** `page_view (home)` → `video_open` → `loop_create` → `sign_up`
2. **Guest to account:** users with a `loop_create` where `storage=guest` who later have a `sign_up`
3. **Sharing:** `share` → `video_open (from_share_link=true)` → `share_import`

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
| **Loops edited** (renamed or retimed) | ❌ before 2.2: no `updated_at`, and updates left no trace. ✅ now |
| **Deletions** | ❌ before 2.2: hard deletes, and the cascade removes loops with their song. ✅ now |
| Guest activity | ❌ never reaches the database (use GA) |

### 2.2 Migration: an activity log written by triggers

**Built** in `supabase/migrations/20261125000000_activity_log.sql`.

- **`analytics.activity_events`** gets one row for each account, song or loop
  created, loop renamed or retimed, and anything deleted. Columns:
  `occurred_at`, `user_id`, `entity` (`account`, `song` or `loop`), `action`
  (`create`, `rename`, `retime` or `delete`), `entity_id`, `cascaded` and
  `backfilled`.
- **It's in a private `analytics` schema, not `public`.** Supabase's API only
  serves `public`, and `anon` and `authenticated` have no access to the
  schema. Only the SQL Editor, and roles granted access later, can read it.
- **Database triggers write the rows** on `auth.users`, `saved_songs` and
  `saved_sections`, so every write counts, whichever part of the app made it.
  The trigger function runs as its owner, because the signed-in user whose
  write fires it can't touch the log.
- **Renames and retimes are logged only when the value actually changes.**
  Saving a loop with the same name writes nothing.
- **`cascaded`** marks deletes that came with another delete: a song's loops
  going with it, or everything going with an account. Leave these rows out to
  count what people deleted themselves.
- **Deleting an account anonymizes its rows.** `user_id` is a foreign key with
  `on delete set null`, so the deleted person's earlier rows stop pointing at
  them. The `account delete` row and the cascaded deletes are written with no
  user. Account rows never store the account's ID as `entity_id`. The Privacy
  page says that counts stay after an account is deleted.
- **Backfill.** Existing accounts, songs and loops get `create` rows dated
  from `created_at`, marked `backfilled`. Edits and deletions from before the
  log left no trace and can't be recovered.
- **`saved_sections.updated_at`** is a new column, set by the database on every update.

Things to know:
- Guest loops copied in at login and loops saved from a share link count as
  `create`. GA's `guest_loops_synced` and `share_import` tell those apart. A
  `source` column on `saved_sections` could do it in the database later.
- It takes very little space: one short row per write.

**Applying it:**
1. In the Supabase dashboard, open the **SQL Editor**, paste in the whole
   migration file and run it once. It runs as `postgres`, which can add
   triggers to `auth.users`.
2. Check it worked: `select entity, action, count(*) from analytics.activity_events group by 1, 2;`
   should list a `create` count for accounts, songs and loops.

`npm run db:types` only generates types for `public`, so the log won't appear
in `database.types.ts`. That's intended: the app never reads it.

**Queries to save in the SQL Editor** (switch the result to **Chart**):

```sql
-- Activity per day, last 30 days, without cascaded deletes.
select date_trunc('day', occurred_at)::date as day, entity, action, count(*)
from analytics.activity_events
where occurred_at > now() - interval '30 days' and not cascaded
group by 1, 2, 3 order by 1, 2, 3;

-- Active accounts: anyone who created, edited or deleted something.
select
  count(distinct user_id) filter (where occurred_at > now() - interval '1 day')   as today,
  count(distinct user_id) filter (where occurred_at > now() - interval '7 days')  as last_7_days,
  count(distinct user_id) filter (where occurred_at > now() - interval '30 days') as last_30_days
from analytics.activity_events
where not backfilled and entity <> 'account';

-- Totals right now.
select
  (select count(*) from auth.users)                 as accounts,
  (select count(*) from public.saved_songs)         as songs,
  (select count(*) from public.saved_sections)      as loops,
  (select round(100.0 * count(name) / nullif(count(*), 0)) from public.saved_sections) as pct_loops_named;
```

### 2.3 Reporting views

A second migration adds views to the `analytics` schema (created in 2.2), so
the queries live in the repo and not just in someone's saved snippets:

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
2. **PR 2: GA events.** The event table in 1.4. Then register the custom dimensions and key events in the GA admin.
3. **PR 3: Supabase activity log.** Migration 2.2 (+ `updated_at`). Run it in the SQL Editor.
4. **PR 4: Analytics views.** Migration 2.3, plus saved SQL Editor charts (option A).
5. **Looker Studio dashboard** (option B), once there are ~2 weeks of data.

The consent defaults (1.6) and the privacy note go in PR 1, so no visitor in
the EEA, UK or Switzerland is ever sent a cookie.

## Open decisions

- Do we want a `source` column on `saved_sections` now, so imported and synced loops can be told apart from hand-made ones?
- Looker Studio (recommended), or an in-app admin page?
