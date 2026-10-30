-- Run once in Supabase SQL Editor to allow divider blocks inside lessons.
alter table public.lesson_blocks drop constraint if exists lesson_blocks_kind_check;
alter table public.lesson_blocks
  add constraint lesson_blocks_kind_check
  check (kind in ('text', 'image', 'video', 'pdf', 'separator'));
