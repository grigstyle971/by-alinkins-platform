-- Run once in Supabase SQL Editor. It stores a chosen preview image for each video block.
alter table public.lesson_blocks add column if not exists thumbnail_path text;
alter table public.lesson_blocks add column if not exists file_name text;
