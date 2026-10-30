-- Run once in Supabase SQL Editor after course-cover-focus-migration.sql.
-- Each published location gets an independent zoom level; 1 means the original crop.
alter table public.courses
  add column if not exists cover_card_zoom numeric(4,2) not null default 1 check (cover_card_zoom between 1 and 3),
  add column if not exists cover_sales_zoom numeric(4,2) not null default 1 check (cover_sales_zoom between 1 and 3),
  add column if not exists cover_cabinet_zoom numeric(4,2) not null default 1 check (cover_cabinet_zoom between 1 and 3);
