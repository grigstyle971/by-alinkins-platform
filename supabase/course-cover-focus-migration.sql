-- Run once in Supabase SQL Editor.
-- Stores the focal point for one course cover image, from 0 to 100 percent.
alter table public.courses
  add column if not exists cover_focus_x smallint not null default 50 check (cover_focus_x between 0 and 100),
  add column if not exists cover_focus_y smallint not null default 50 check (cover_focus_y between 0 and 100);

-- Each screen has a different aspect ratio, so it receives its own focal point.
alter table public.courses
  add column if not exists cover_card_focus_x smallint not null default 50 check (cover_card_focus_x between 0 and 100),
  add column if not exists cover_card_focus_y smallint not null default 50 check (cover_card_focus_y between 0 and 100),
  add column if not exists cover_sales_focus_x smallint not null default 50 check (cover_sales_focus_x between 0 and 100),
  add column if not exists cover_sales_focus_y smallint not null default 50 check (cover_sales_focus_y between 0 and 100),
  add column if not exists cover_cabinet_focus_x smallint not null default 50 check (cover_cabinet_focus_x between 0 and 100),
  add column if not exists cover_cabinet_focus_y smallint not null default 50 check (cover_cabinet_focus_y between 0 and 100);

-- Preserve the crop selected earlier as the initial value in all three views.
update public.courses
set
  cover_card_focus_x = cover_focus_x,
  cover_card_focus_y = cover_focus_y,
  cover_sales_focus_x = cover_focus_x,
  cover_sales_focus_y = cover_focus_y,
  cover_cabinet_focus_x = cover_focus_x,
  cover_cabinet_focus_y = cover_focus_y
where cover_card_focus_x = 50 and cover_card_focus_y = 50
  and cover_sales_focus_x = 50 and cover_sales_focus_y = 50
  and cover_cabinet_focus_x = 50 and cover_cabinet_focus_y = 50;
