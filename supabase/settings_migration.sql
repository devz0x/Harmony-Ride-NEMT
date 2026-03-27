-- ── Settings table (singleton row, id always = 1) ────────────────────────────
-- Run this in the Supabase SQL Editor

create table if not exists settings (
  id               int primary key default 1,
  company_name     text,
  operating_states text,
  primary_phone    text,
  dispatch_phone   text,
  support_email    text,
  billing_email    text,
  address          text,
  npi              text,
  medicaid_id      text,
  medicare_id      text,
  business_hours   jsonb not null default '{}',
  notifications    jsonb not null default '{}',
  dispatch_rules   jsonb not null default '{}',
  updated_at       timestamptz default now(),
  constraint single_row check (id = 1)
);

-- RLS
alter table settings enable row level security;

create policy "anon read settings"   on settings for select using (true);
create policy "anon insert settings" on settings for insert with check (true);
create policy "anon update settings" on settings for update using (true) with check (true);

-- Seed default row (safe to re-run — skips if row already exists)
insert into settings (
  id, company_name, operating_states,
  primary_phone, dispatch_phone,
  support_email, billing_email,
  address, npi, medicaid_id, medicare_id,
  business_hours, notifications, dispatch_rules
) values (
  1,
  'Harmony Rides Transportation LLC',
  'MA, FL, GA, TX',
  '+1 (978) 225-0802',
  '+1 (978) 225-0802',
  'infoharmonyrides@gmail.com',
  'infoharmonyrides@gmail.com',
  '92 White St, Haverhill, MA 01830',
  '', '', '',
  '{
    "Monday":    {"open": true,  "start": "06:00", "end": "22:00"},
    "Tuesday":   {"open": true,  "start": "06:00", "end": "22:00"},
    "Wednesday": {"open": true,  "start": "06:00", "end": "22:00"},
    "Thursday":  {"open": true,  "start": "06:00", "end": "22:00"},
    "Friday":    {"open": true,  "start": "06:00", "end": "22:00"},
    "Saturday":  {"open": true,  "start": "08:00", "end": "18:00"},
    "Sunday":    {"open": false, "start": "08:00", "end": "18:00"}
  }',
  '{
    "new_trip": true, "unassigned_warning": true, "driver_late": true,
    "no_show": true,  "denial": true,             "maintenance": true,
    "license_expiry": true, "daily_summary": false
  }',
  '{
    "pickup_buffer": 15, "same_day_cutoff": "18:00",
    "max_trips_per_driver": 10, "auto_confirm_hours": 24,
    "auto_assign_proximity": false, "strict_transport_match": true,
    "prefer_usual_driver": true,   "allow_overtime": false
  }'
) on conflict (id) do nothing;
