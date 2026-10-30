-- Run once in Supabase SQL Editor before publishing a guide sales page.
-- Ordered cover/page previews displayed in the guide-specific carousel.
alter table public.courses
  add column if not exists guide_preview_gallery text[] not null default '{}';
