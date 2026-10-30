-- Run once in Supabase SQL Editor before using the "Баннер недели" block.
alter table public.lesson_blocks drop constraint if exists lesson_blocks_kind_check;
alter table public.lesson_blocks
  add constraint lesson_blocks_kind_check
  check (kind in ('text', 'heading', 'callout', 'checklist', 'quote', 'label', 'image', 'centered_image', 'week_banner', 'video', 'pdf', 'separator'));
