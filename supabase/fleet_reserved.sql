-- Allow 'reserved' as a valid vehicle status
-- Run this in the Supabase SQL Editor

alter table vehicles drop constraint if exists vehicles_status_check;
alter table vehicles add constraint vehicles_status_check
  check (status in ('available', 'in-use', 'maintenance', 'reserved'));
