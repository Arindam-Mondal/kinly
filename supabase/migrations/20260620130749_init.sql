-- Initial schema: profiles + the generic log_entries model, both owner-scoped via RLS.
-- See Kinly_Database_Schema.md and Kinly_Technical_Specification.md §4.

-- Keeps updated_at current on any row update. Pinned search_path guards against
-- search-path injection (now() resolves from pg_catalog regardless).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles: 1:1 extension of auth.users with the registration fields.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  age integer not null check (age >= 13 and age <= 120),
  sex text not null check (sex in ('female', 'male', 'other', 'prefer_not_to_say')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- log_entries: every loggable thing (period | migraine | note) is one row here,
-- distinguished only by `domain`. Domain-specific fields live in `metadata`.
create table public.log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain text not null check (domain in ('period', 'migraine', 'note')),
  start_date date not null,
  end_date date check (end_date is null or end_date >= start_date),
  notes text check (char_length(notes) <= 1000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Supports "this user's period entries by date" (calendar + prediction engine)...
create index idx_log_entries_user_domain_date on public.log_entries (user_id, domain, start_date);
-- ...and the cross-domain chronological Notes/Journal listing.
create index idx_log_entries_user_date on public.log_entries (user_id, start_date);

create trigger log_entries_set_updated_at
before update on public.log_entries
for each row execute function public.set_updated_at();

-- ===== Row Level Security: owner-only on both tables =====
-- RLS governs which ROWS are visible; these GRANTs govern whether the API role can
-- touch the table at all. Both are required. Grant only to `authenticated` (never
-- `anon`) and only the operations each table's policies below actually permit.
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.log_entries to authenticated;

alter table public.profiles enable row level security;
alter table public.log_entries enable row level security;

-- profiles: a user can read/insert/update only their own row. No delete policy —
-- account deletion happens via auth.users and cascades down.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- log_entries: a user can read/write only rows they own. The Phase 2 linked-viewer
-- feature will ADD a select policy here (RLS OR-combines), never edit these.
create policy "log_entries_select_own" on public.log_entries
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "log_entries_insert_own" on public.log_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "log_entries_update_own" on public.log_entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "log_entries_delete_own" on public.log_entries
  for delete to authenticated using ((select auth.uid()) = user_id);
