-- Auto-create a profiles row when a new auth user is created, seeding display fields
-- from the metadata passed at sign-up (options.data on signUp / user_metadata on admin
-- createUser). This is atomic with the auth.users insert: if the profile can't be created
-- (e.g. missing/invalid fields) the whole sign-up fails, so there are never orphaned users.
--
-- SECURITY DEFINER is required so the trigger can insert past RLS. It is hardened per the
-- Supabase guidance: pinned empty search_path (all names schema-qualified) and EXECUTE
-- revoked from the API roles so it can't be called directly as a public endpoint. The
-- metadata only seeds profile display fields — it is never used for authorization.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, age, sex)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.email,
    (new.raw_user_meta_data ->> 'age')::int,
    new.raw_user_meta_data ->> 'sex'
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
