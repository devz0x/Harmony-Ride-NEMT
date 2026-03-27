-- ── Billing fields for trips table ──────────────────────────────────────────
-- Adds the extra columns required by the HarmonyRides billing engine.
-- Run in Supabase SQL Editor.

alter table trips add column if not exists mileage            decimal(8,2)  default 0;
alter table trips add column if not exists is_rush            boolean       default false;
alter table trips add column if not exists wait_minutes       integer       default 0;
alter table trips add column if not exists additional_attendant boolean     default false;
alter table trips add column if not exists is_dialysis        boolean       default false;
alter table trips add column if not exists cleaning_fee       decimal(8,2)  default 0;
alter table trips add column if not exists booking_created_at timestamptz   default now();

-- Index to speed up date-range billing queries
create index if not exists trips_date_status_idx on trips(date, status);
