-- Lets people delete their own account, and their songs and loops with it.
--
-- 1. saved_songs.user_id wasn't a foreign key at all, so deleting a user left
--    their songs behind. Make it one that deletes them with the user.
--    NOT VALID: it holds for every new and changed row and cascades on delete,
--    without first checking rows already there (any song whose user is already
--    gone would make this migration fail). To check those too once it's in:
--      alter table public.saved_songs validate constraint saved_songs_user_id_fkey;
alter table public.saved_songs
  add constraint saved_songs_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade
    not valid;

-- 2. saved_sections.user_id pointed at the user without on delete cascade, so
--    deleting someone who had loops failed. Delete their loops with them.
alter table public.saved_sections
  drop constraint saved_sections_user_id_fkey,
  add constraint saved_sections_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;

-- 3. Deletes the signed-in caller's account, and through the cascades above
--    their songs and loops. The browser only holds the public key, which can't
--    delete users, so this runs as its owner (security definer); it only ever
--    touches the caller's own row. Callable by signed-in users only.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
