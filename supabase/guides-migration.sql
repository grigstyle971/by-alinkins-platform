-- Run once in Supabase SQL Editor before publishing standalone guides.
-- Guides reuse the course purchase/enrollment flow. Their PDF files are
-- attached to individual guide sections (the existing lessons table).
alter table public.courses
  add column if not exists product_type text not null default 'course'
    check (product_type in ('course', 'guide'));

create index if not exists courses_product_type_display_order_idx
  on public.courses (product_type, display_order);
