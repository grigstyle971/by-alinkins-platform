-- Adds an optional crossed-out “old price” to a course sales page.
-- Safe to run once in Supabase SQL Editor.
alter table public.courses add column if not exists old_price numeric;
