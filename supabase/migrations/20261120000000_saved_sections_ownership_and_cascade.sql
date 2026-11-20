-- 1. The saved_sections insert policy allowed every row (with check (true)), so
--    a signed-in user could insert a loop with another user's user_id, or
--    attach one to another user's song. Require both to belong to the caller.
drop policy "Enable insert for authenticated users only" on public.saved_sections;

create policy "Users can insert their own saved sections" on public.saved_sections
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.saved_songs s
      where s.id = saved_song_id and s.user_id = (select auth.uid())
    )
  );

-- 2. saved_sections referenced saved_songs without on delete cascade, so
--    removing a song that had loops failed with a foreign key violation.
alter table public.saved_sections
  drop constraint saved_sections_saved_song_id_fkey,
  add constraint saved_sections_saved_song_id_fkey
    foreign key (saved_song_id) references public.saved_songs (id) on delete cascade;
