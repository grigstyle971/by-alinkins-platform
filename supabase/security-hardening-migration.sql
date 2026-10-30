-- Run once in Supabase SQL Editor. This protects existing customer data.
-- A row-level policy does not restrict columns, so explicitly grant customers
-- access only to the editable profile fields and never to `is_admin`.

revoke update on table public.profiles from anon, authenticated;
grant update (first_name, last_name, age) on table public.profiles to authenticated;

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);
