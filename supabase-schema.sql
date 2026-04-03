-- ============================================================
-- NEMT Platform — Supabase Schema
-- Run this in the Supabase SQL Editor (once)
-- ============================================================

-- ── Tables ───────────────────────────────────────────────────

create table if not exists drivers (
  id          text primary key,
  name        text not null,
  phone       text,
  email       text,
  license     text,
  license_exp date,
  background  date,
  training    text,
  vehicle     text,
  status      text default 'off-duty',
  rating      numeric(3,1) default 5.0,
  photo       text,
  join_date   date,
  trips       integer default 0
);

create table if not exists vehicles (
  id           text primary key,
  type         text,
  make         text,
  year         integer,
  plate        text,
  vin          text,
  capacity     text,
  mileage      integer default 0,
  last_service date,
  next_service date,
  inspection   date,
  status       text default 'available',
  driver       text,
  features     text[] default '{}'
);

create table if not exists patients (
  id          text primary key,
  name        text not null,
  dob         date,
  phone       text,
  email       text,
  address     text,
  insurance   text,
  member_id   text,
  transport   text default 'ambulatory',
  conditions  text[] default '{}',
  notes       text,
  status      text default 'active',
  total_trips integer default 0,
  last_trip   date
);

create table if not exists trips (
  id          text primary key,
  patient     text not null,
  dob         date,
  phone       text,
  pickup      text,
  destination text,
  date        date,
  time        time,
  return_time time,
  type        text default 'oneway',
  transport   text default 'ambulatory',
  driver      text,
  vehicle     text,
  insurance   text,
  status      text default 'pending',
  notes       text,
  created_at  timestamptz default now()
);

create table if not exists invoices (
  id            text primary key,
  bill_to       text,
  invoice_date  date,
  due_date      date,
  payment_terms text default 'Net 15',
  status        text default 'pending',
  paid_date     date,
  denial_reason text
);

create table if not exists invoice_line_items (
  id          uuid default gen_random_uuid() primary key,
  invoice_id  text references invoices(id) on delete cascade,
  num         integer,
  date        date,
  service     text,
  description text,
  qty         numeric(8,2) default 1,
  rate        numeric(10,2) default 0,
  amount      numeric(10,2) default 0
);

create table if not exists settings (
  id               integer primary key default 1,
  company_name     text    default 'Harmony Rides Transportation LLC',
  operating_states text    default 'MA, NH, RI, CT',
  primary_phone    text    default '(978) 225-0802',
  dispatch_phone   text    default '(978) 225-0802',
  support_email    text    default 'infoharmonyrides@gmail.com',
  billing_email    text    default 'infoharmonyrides@gmail.com',
  address          text    default '92 White St, Haverhill, MA 01830',
  npi              text    default '1234567890',
  medicaid_id      text    default 'MCD-MA-88221',
  medicare_id      text    default 'MCR-88221-A',
  business_hours   jsonb   default '{
    "Monday":    {"open": true, "start": "06:00", "end": "22:00"},
    "Tuesday":   {"open": true, "start": "06:00", "end": "22:00"},
    "Wednesday": {"open": true, "start": "06:00", "end": "22:00"},
    "Thursday":  {"open": true, "start": "06:00", "end": "22:00"},
    "Friday":    {"open": true, "start": "06:00", "end": "22:00"},
    "Saturday":  {"open": true, "start": "06:00", "end": "14:00"},
    "Sunday":    {"open": true, "start": "06:00", "end": "14:00"}
  }',
  notifications    jsonb   default '{
    "new_trip":           true,
    "unassigned_warning": true,
    "driver_late":        true,
    "no_show":            true,
    "denial":             true,
    "maintenance":        false,
    "license_expiry":     false,
    "daily_summary":      false
  }',
  dispatch_rules   jsonb   default '{
    "pickup_buffer":          15,
    "same_day_cutoff":        "18:00",
    "max_trips_per_driver":   10,
    "auto_confirm_hours":     24,
    "auto_assign_proximity":  true,
    "strict_transport_match": true,
    "prefer_usual_driver":    true,
    "allow_overtime":         false
  }',
  constraint settings_singleton check (id = 1)
);

create table if not exists activity_logs (
  id           bigint generated always as identity primary key,
  created_at   timestamptz default now(),
  action       text not null,
  entity_type  text,
  entity_id    text,
  entity_label text,
  details      jsonb
);

-- ── Disable RLS (anon key access for admin panel) ─────────────

alter table drivers            disable row level security;
alter table vehicles           disable row level security;
alter table patients           disable row level security;
alter table trips              disable row level security;
alter table invoices           disable row level security;
alter table invoice_line_items disable row level security;
alter table settings           disable row level security;
alter table activity_logs      disable row level security;

-- ── Settings singleton row (required for Settings tab) ────────
-- Only inserts if the row doesn't already exist.

insert into settings (id) values (1) on conflict (id) do nothing;
