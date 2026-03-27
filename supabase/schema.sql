-- ─── Harmony Rides Transportation LLC — Supabase Schema ───────────────────

-- Drivers
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
  status      text check (status in ('on-duty','off-duty','suspended')),
  rating      numeric(3,1),
  trips       int default 0,
  join_date   date,
  photo       text,
  created_at  timestamptz default now()
);

-- Patients
create table if not exists patients (
  id          text primary key,
  name        text not null,
  dob         date,
  phone       text,
  email       text,
  address     text,
  insurance   text,
  member_id   text,
  transport   text check (transport in ('ambulatory','wheelchair','stretcher','bariatric')),
  conditions  text[],
  notes       text,
  total_trips int default 0,
  last_trip   date,
  status      text check (status in ('active','inactive','flagged')),
  created_at  timestamptz default now()
);

-- Vehicles
create table if not exists vehicles (
  id           text primary key,
  type         text,
  make         text,
  year         int,
  plate        text,
  vin          text,
  capacity     text,
  mileage      int,
  last_service date,
  next_service date,
  inspection   date,
  status       text check (status in ('available','in-use','maintenance')),
  driver       text,
  features     text[],
  created_at   timestamptz default now()
);

-- Trips
create table if not exists trips (
  id          text primary key,
  patient     text,
  dob         date,
  phone       text,
  pickup      text,
  destination text,
  date        date,
  time        time,
  return_time time,
  type        text check (type in ('oneway','roundtrip')),
  transport   text check (transport in ('ambulatory','wheelchair','stretcher','bariatric')),
  driver      text,
  vehicle     text,
  insurance   text,
  status      text check (status in ('confirmed','pending','in-transit','completed','no-show','cancelled')),
  notes       text,
  created_at  timestamptz default now()
);

-- Invoices
create table if not exists invoices (
  id            text primary key,
  invoice_date  date,
  due_date      date,
  bill_to       text,
  status        text check (status in ('pending','submitted','paid','denied')),
  paid_date     date,
  denial_reason text,
  payment_terms text default 'Net 15',
  created_at    timestamptz default now()
);

-- Invoice line items
create table if not exists invoice_line_items (
  id         bigint generated always as identity primary key,
  invoice_id text references invoices(id) on delete cascade,
  num        int,
  date       date,
  service    text,
  description text,
  qty        numeric(8,2),
  rate       numeric(10,2),
  amount     numeric(10,2),
  created_at timestamptz default now()
);

-- ─── Row Level Security (read-only for anon, full for service_role) ──────────
alter table drivers           enable row level security;
alter table patients          enable row level security;
alter table vehicles          enable row level security;
alter table trips             enable row level security;
alter table invoices          enable row level security;
alter table invoice_line_items enable row level security;

create policy "anon read drivers"            on drivers            for select using (true);
create policy "anon read patients"           on patients           for select using (true);
create policy "anon read vehicles"           on vehicles           for select using (true);
create policy "anon read trips"              on trips              for select using (true);
create policy "anon read invoices"           on invoices           for select using (true);
create policy "anon read invoice_line_items" on invoice_line_items for select using (true);

-- No seed data — all records are entered through the admin UI.
