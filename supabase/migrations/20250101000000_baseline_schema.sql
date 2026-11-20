-- Baseline: the schema as it existed in production before this repo tracked
-- migrations, reconstructed from information_schema and pg_policies on
-- 2026-11-20. start_time and end_time were integers until
-- 20260905000000_saved_sections_fractional_times.sql widened them.
--
-- Production already has all of this. Do not run it there.

create table public.saved_songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  video_id text not null,
  title text not null,
  created_at timestamptz not null default now()
);

create table public.saved_sections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id),
  saved_song_id uuid not null references public.saved_songs (id),
  start_time integer not null,
  end_time integer not null,
  name text,
  created_at timestamptz not null default now()
);

alter table public.saved_songs enable row level security;
alter table public.saved_sections enable row level security;

create policy "Enable users to view their own songs" on public.saved_songs
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Enable insert for authenticated users only" on public.saved_songs
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Enable update for users based on user_id" on public.saved_songs
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Enable delete for users based on user_id" on public.saved_songs
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view their own saved sections" on public.saved_sections
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Enable insert for authenticated users only" on public.saved_sections
  for insert to authenticated
  with check (true);

create policy "Users can update their own saved sections" on public.saved_sections
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own saved sections" on public.saved_sections
  for delete to authenticated
  using ((select auth.uid()) = user_id);
