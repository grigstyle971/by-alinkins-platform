-- Run once in Supabase SQL Editor before deploying the calorie calculator.
alter table public.courses
  add column if not exists grants_calorie_calculator boolean not null default false;
