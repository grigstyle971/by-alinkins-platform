-- By Alinkins: admin studio, course content and private file storage.
-- Run this whole file once in Supabase: SQL Editor -> New query -> Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_profile();

insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do update set email = excluded.email;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
for select using (auth.uid() = id);

alter table public.courses add column if not exists image_path text;
alter table public.courses add column if not exists price numeric;
alter table public.courses add column if not exists old_price numeric;
alter table public.courses add column if not exists status text not null default 'available';
alter table public.courses add column if not exists created_at timestamptz not null default now();
alter table public.courses add column if not exists updated_at timestamptz not null default now();
-- Controls the card position on the public programs page: 0 is first.
alter table public.courses add column if not exists display_order integer not null default 0;

with numbered_courses as (
  select id, row_number() over (order by slug) - 1 as position
  from public.courses
)
update public.courses as course
set display_order = numbered_courses.position
from numbered_courses
where course.id = numbered_courses.id
  and course.display_order = 0
  and numbered_courses.position <> 0;

alter table public.lessons add column if not exists section text not null default 'The Basics';
alter table public.lessons add column if not exists kind text not null default 'text';
alter table public.lessons add column if not exists image_path text;
alter table public.lessons add column if not exists pdf_path text;
alter table public.lessons add column if not exists duration text;
alter table public.lessons add column if not exists updated_at timestamptz not null default now();

-- Ordered pieces inside one lesson: text, image, external video or PDF.
create table if not exists public.lesson_blocks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  kind text not null check (kind in ('text', 'image', 'video', 'pdf')),
  content text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lesson_blocks enable row level security;
drop policy if exists "Admins manage lesson blocks" on public.lesson_blocks;
create policy "Admins manage lesson blocks" on public.lesson_blocks
for all using (public.is_admin()) with check (public.is_admin());

-- Sale-page cards shown below the course cover (Training, Nutrition,
-- Equipment, or any other section an admin creates).
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
create policy "Admins manage course sections" on public.course_sections
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage courses" on public.courses;
create policy "Admins manage courses" on public.courses
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage lessons" on public.lessons;
create policy "Admins manage lessons" on public.lessons
for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('course-files', 'course-files', false)
on conflict (id) do update set public = false;

drop policy if exists "Admins manage course files" on storage.objects;
create policy "Admins manage course files" on storage.objects
for all to authenticated
using (bucket_id = 'course-files' and public.is_admin())
with check (bucket_id = 'course-files' and public.is_admin());

-- IMPORTANT: replace the email below with the email you use to sign in to the site,
-- then run this one line too. This is what makes /admin visible only to you.
-- update public.profiles set is_admin = true where email = 'YOUR-EMAIL@example.com';
