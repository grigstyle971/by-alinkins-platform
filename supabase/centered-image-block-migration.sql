-- Run once in the Supabase SQL Editor after deploying the app changes.
-- It adds the centred, full-width lesson image block type.
alter table public.lesson_blocks drop constraint if exists lesson_blocks_kind_check;
alter table public.lesson_blocks
  add constraint lesson_blocks_kind_check
  check (kind in ('text', 'image', 'centered_image', 'video', 'pdf', 'separator'));
