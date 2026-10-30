-- Run once in the Supabase SQL Editor before deploying this update.
-- Separate crop for the compact course card on the My programs page.
alter table public.courses
  add column if not exists cover_dashboard_focus_x smallint not null default 50 check (cover_dashboard_focus_x between 0 and 100),
  add column if not exists cover_dashboard_focus_y smallint not null default 50 check (cover_dashboard_focus_y between 0 and 100),
  add column if not exists cover_dashboard_zoom numeric(4,2) not null default 1 check (cover_dashboard_zoom between 1 and 3);

update public.courses
set
  cover_dashboard_focus_x = cover_cabinet_focus_x,
  cover_dashboard_focus_y = cover_cabinet_focus_y,
  cover_dashboard_zoom = cover_cabinet_zoom
where cover_dashboard_focus_x = 50
  and cover_dashboard_focus_y = 50
  and cover_dashboard_zoom = 1;
