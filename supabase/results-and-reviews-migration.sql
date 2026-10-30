-- Content for the public "Before / after" and "Reviews" sections.
-- Run this file once in Supabase: SQL Editor -> New query -> Run.

create table if not exists public.site_results (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  caption text,
  position integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.site_reviews (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  body text not null,
  position integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists site_results_position_idx on public.site_results (position);
create index if not exists site_reviews_position_idx on public.site_reviews (position);

alter table public.site_results enable row level security;
alter table public.site_reviews enable row level security;

drop policy if exists "Published site results are readable" on public.site_results;
create policy "Published site results are readable" on public.site_results
  for select using (published = true);

drop policy if exists "Published site reviews are readable" on public.site_reviews;
create policy "Published site reviews are readable" on public.site_reviews
  for select using (published = true);
