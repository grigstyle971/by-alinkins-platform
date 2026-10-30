-- Run once in Supabase: SQL Editor -> New query -> Run.
-- Adds optional customer profile fields and permits each signed-in user to edit only their own row.
-- `is_admin` is intentionally excluded: it must never be writable by a customer.

alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists age integer check (age is null or age between 14 and 120);

revoke update on table public.profiles from anon, authenticated;
grant update (first_name, last_name, age) on table public.profiles to authenticated;

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);
