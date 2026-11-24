-- An activity log, for usage metrics: every account, song and loop created,
-- loop renamed or retimed, and anything deleted. The tables themselves can't
-- answer those questions: they have no updated_at, and deleted rows are gone.
--
-- It lives in its own schema, analytics, which Supabase's API doesn't serve
-- (it only serves public), and the app's roles get no access to it. Only the
-- dashboard's SQL Editor and roles granted it later can read it.
--
-- Rows are written by triggers, so every write counts, whichever part of the
-- app made it: guest loops copied in at login, and loops saved from a share
-- link, count as creates.

create schema if not exists analytics;
revoke all on schema analytics from public, anon, authenticated;

create table analytics.activity_events (
  id          bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  -- Set to null when the account is deleted: what they did stays counted,
  -- but no longer points at anyone.
  user_id     uuid references auth.users (id) on delete set null,
  entity      text not null check (entity in ('account', 'song', 'loop')),
  action      text not null check (action in ('create', 'rename', 'retime', 'delete')),
  -- The song's or loop's id. Null for account events, so a deleted account's
  -- id isn't kept anywhere.
  entity_id   uuid,
  -- True for a delete that came with another one: a song's loops going with
  -- it, or everything going with an account. Leave these out to count what
  -- people deleted themselves.
  cascaded    boolean not null default false,
  -- True for rows written by this migration from created_at, before the log
  -- existed.
  backfilled  boolean not null default false
);

create index activity_events_occurred_at_idx on analytics.activity_events (occurred_at);
create index activity_events_user_id_idx on analytics.activity_events (user_id);

alter table analytics.activity_events enable row level security;
revoke all on analytics.activity_events from public, anon, authenticated;

-- Runs as its owner (security definer), because the signed-in user whose
-- write fires it has no access to the log. One function for all three tables:
-- they differ only in the entity name and where the owner is.
create or replace function analytics.log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ent text := case tg_table_name
    when 'users' then 'account'
    when 'saved_songs' then 'song'
    else 'loop'
  end;
  row_owner uuid;
  owner_exists boolean;
  song_exists boolean := true;
begin
  if tg_op = 'INSERT' then
    if ent = 'account' then
      insert into analytics.activity_events (user_id, entity, action) values (new.id, ent, 'create');
    else
      insert into analytics.activity_events (user_id, entity, action, entity_id) values (new.user_id, ent, 'create', new.id);
    end if;

  elsif tg_op = 'UPDATE' then
    -- Only loops are edited in the app; songs are only created and deleted.
    if new.name is distinct from old.name then
      insert into analytics.activity_events (user_id, entity, action, entity_id) values (new.user_id, ent, 'rename', new.id);
    end if;
    if new.start_time is distinct from old.start_time or new.end_time is distinct from old.end_time then
      insert into analytics.activity_events (user_id, entity, action, entity_id) values (new.user_id, ent, 'retime', new.id);
    end if;

  elsif tg_op = 'DELETE' then
    if ent = 'account' then
      -- No user_id: the account is gone, and the foreign key would refuse it.
      insert into analytics.activity_events (entity, action) values (ent, 'delete');
    else
      -- A delete cascading from an account's deletion runs after the account's
      -- row is gone, and one cascading from a song's after the song's.
      row_owner := old.user_id;
      owner_exists := exists (select 1 from auth.users u where u.id = row_owner);
      if ent = 'loop' then
        song_exists := exists (select 1 from public.saved_songs s where s.id = old.saved_song_id);
      end if;
      insert into analytics.activity_events (user_id, entity, action, entity_id, cascaded)
      values (
        case when owner_exists then row_owner end,
        ent,
        'delete',
        old.id,
        not owner_exists or not song_exists
      );
    end if;
  end if;
  return null;
end;
$$;

revoke all on function analytics.log_activity() from public, anon, authenticated;

create trigger log_account_activity
  after insert or delete on auth.users
  for each row execute function analytics.log_activity();

create trigger log_song_activity
  after insert or delete on public.saved_songs
  for each row execute function analytics.log_activity();

create trigger log_loop_activity
  after insert or update of name, start_time, end_time or delete on public.saved_sections
  for each row execute function analytics.log_activity();

-- When a loop last changed, kept by the database rather than the app.
alter table public.saved_sections add column updated_at timestamptz;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_saved_sections_updated_at
  before update on public.saved_sections
  for each row execute function public.set_updated_at();

-- Creates from before the log, dated when they happened. Earlier edits and
-- deletions left no trace, so they can't be recovered.
insert into analytics.activity_events (occurred_at, user_id, entity, action, backfilled)
select created_at, id, 'account', 'create', true from auth.users;

-- A song or loop whose account no longer exists still counts, with no user.
insert into analytics.activity_events (occurred_at, user_id, entity, action, entity_id, backfilled)
select s.created_at, u.id, 'song', 'create', s.id, true
from public.saved_songs s
left join auth.users u on u.id = s.user_id;

insert into analytics.activity_events (occurred_at, user_id, entity, action, entity_id, backfilled)
select l.created_at, u.id, 'loop', 'create', l.id, true
from public.saved_sections l
left join auth.users u on u.id = l.user_id;
