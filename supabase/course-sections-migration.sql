-- Add editable sale-page sections to every course.
-- Run this ONCE in Supabase: SQL Editor -> New query -> Run.
-- It is safe to run alongside the existing admin-migration.sql.

create table if not exists public.course_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  content text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.course_sections enable row level security;

drop policy if exists "Admins manage course sections" on public.course_sections;
create policy "Admins manage course sections"
on public.course_sections for all
using (public.is_admin()) with check (public.is_admin());
