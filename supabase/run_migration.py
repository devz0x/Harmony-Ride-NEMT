#!/usr/bin/env python3
"""Run Supabase migration via Management API."""
import json
import urllib.request
import urllib.error
import sys

PAT = "sbp_e22867ad37f18f94172b69ceb6f4edd066e2c176"
PROJECT = "nxraigfxeofzlnnafkak"
URL = f"https://api.supabase.com/v1/projects/{PROJECT}/database/query"

def run(sql, label=""):
    payload = json.dumps({"query": sql}).encode()
    req = urllib.request.Request(
        URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {PAT}",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    try:
        res = urllib.request.urlopen(req)
        body = res.read().decode()
        print(f"  ✓ {label}")
        return True
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"  ✗ {label}: {err}")
        return False

# ─── 1. Create tables ────────────────────────────────────────────────────────
print("Creating tables...")

run("""
create table if not exists drivers (
  id text primary key, name text not null, phone text, email text,
  license text, license_exp date, background date, training text, vehicle text,
  status text check (status in ('on-duty','off-duty','suspended')),
  rating numeric(3,1), trips int default 0, join_date date, photo text,
  created_at timestamptz default now()
)
""", "drivers table")

run("""
create table if not exists patients (
  id text primary key, name text not null, dob date, phone text, email text,
  address text, insurance text, member_id text,
  transport text check (transport in ('ambulatory','wheelchair','stretcher','bariatric')),
  conditions text[], notes text, total_trips int default 0, last_trip date,
  status text check (status in ('active','inactive','flagged')),
  created_at timestamptz default now()
)
""", "patients table")

run("""
create table if not exists vehicles (
  id text primary key, type text, make text, year int, plate text, vin text,
  capacity text, mileage int, last_service date, next_service date, inspection date,
  status text check (status in ('available','in-use','maintenance')),
  driver text, features text[], created_at timestamptz default now()
)
""", "vehicles table")

run("""
create table if not exists trips (
  id text primary key, patient text, dob date, phone text, pickup text, destination text,
  date date, time time, return_time time,
  type text check (type in ('oneway','roundtrip')),
  transport text check (transport in ('ambulatory','wheelchair','stretcher','bariatric')),
  driver text, vehicle text, insurance text,
  status text check (status in ('confirmed','pending','in-transit','completed','no-show','cancelled')),
  notes text, created_at timestamptz default now()
)
""", "trips table")

run("""
create table if not exists invoices (
  id text primary key, invoice_date date, due_date date, bill_to text,
  status text check (status in ('pending','submitted','paid','denied')),
  paid_date date, denial_reason text, payment_terms text default 'Net 15',
  created_at timestamptz default now()
)
""", "invoices table")

run("""
create table if not exists invoice_line_items (
  id bigint generated always as identity primary key,
  invoice_id text references invoices(id) on delete cascade,
  num int, date date, service text, description text,
  qty numeric(8,2), rate numeric(10,2), amount numeric(10,2),
  created_at timestamptz default now()
)
""", "invoice_line_items table")

# ─── 2. Enable RLS ────────────────────────────────────────────────────────────
print("Enabling RLS...")
for table in ["drivers","patients","vehicles","trips","invoices","invoice_line_items"]:
    run(f"alter table {table} enable row level security", f"RLS on {table}")

print("Creating read policies...")
for table in ["drivers","patients","vehicles","trips","invoices","invoice_line_items"]:
    run(f"""
        do $$ begin
          if not exists (
            select 1 from pg_policies where tablename='{table}' and policyname='anon read {table}'
          ) then
            execute 'create policy "anon read {table}" on {table} for select using (true)';
          end if;
        end $$
    """, f"policy on {table}")

# ─── 3. Seed drivers ─────────────────────────────────────────────────────────
print("Seeding drivers...")
run("""
insert into drivers (id,name,phone,email,license,license_exp,background,training,vehicle,status,rating,trips,join_date,photo) values
('D-01','Marcus Johnson','(813) 555-1001','marcus.j@harmonyrides.com','FL-CDL-882941','2026-08-15','2024-01-10','NEMT, CPR, First Aid, Passenger Assistance','VAN-04','on-duty',4.9,1842,'2021-03-15','MJ'),
('D-02','Lisa Ramirez','(813) 555-1002','lisa.r@harmonyrides.com','FL-DL-774512','2027-02-20','2024-03-22','NEMT, CPR, Spanish Bilingual','SED-02','on-duty',4.8,1231,'2022-07-01','LR'),
('D-03','James Okafor','(813) 555-1003','james.o@harmonyrides.com','FL-CDL-993021','2025-11-30','2023-12-01','NEMT, CPR, Stretcher, Bariatric','VAN-07','on-duty',4.7,987,'2022-01-20','JO'),
('D-04','Angela Morris','(813) 555-1004','angela.m@harmonyrides.com','FL-CDL-661893','2026-05-10','2024-02-14','NEMT, EMT-Basic, Stretcher, CPR','STR-01','on-duty',4.9,744,'2023-06-12','AM'),
('D-05','David Kim','(813) 555-1005','david.k@harmonyrides.com','FL-DL-882113','2026-12-01','2024-04-01','NEMT, CPR','SED-05','off-duty',4.6,412,'2023-11-08','DK'),
('D-06','Patricia Owens','(813) 555-1006','patricia.o@harmonyrides.com','FL-CDL-554772','2027-03-15','2024-01-30','NEMT, CPR, First Aid, Wheelchair','VAN-02','off-duty',4.8,623,'2022-09-05','PO'),
('D-07','Kevin Smith','(813) 555-1007','kevin.s@harmonyrides.com','FL-DL-990234','2025-09-20','2023-08-15','NEMT, CPR',null,'suspended',3.9,188,'2023-08-01','KS')
on conflict (id) do nothing
""", "drivers seed")

# ─── 4. Seed patients ─────────────────────────────────────────────────────────
print("Seeding patients...")
run("""
insert into patients (id,name,dob,phone,email,address,insurance,member_id,transport,conditions,notes,total_trips,last_trip,status) values
('P-101','Margaret Torres','1948-03-12','(813) 555-0192','mtorres@email.com','2210 N Dale Mabry Hwy, Tampa, FL 33607','Medicaid','MCD-8821930','wheelchair',array['Kidney Disease','Hypertension'],'Needs oxygen during transport. Spanish speaking.',48,'2025-04-02','active'),
('P-102','Robert Chen','1955-07-22','(727) 555-0344','rchen@email.com','1440 2nd Ave N, St. Petersburg, FL 33713','Medicare','MCR-7710234','ambulatory',array['Renal Failure (Dialysis)'],'MWF dialysis schedule. Very punctual.',156,'2025-04-02','active'),
('P-103','Dorothy Williams','1942-11-05','(813) 555-0781',null,'4523 W Kennedy Blvd, Tampa, FL 33609','BlueCross','BCB-4490122','wheelchair',array['Breast Cancer','Diabetes'],'Chemotherapy Tuesdays. Needs extra time.',22,'2025-04-02','active'),
('P-104','Frank Delgado','1950-01-30','(813) 555-0522','fdelgado@email.com','HCA Florida South Tampa','Humana','HUM-3302918','stretcher',array['Hip Fracture','Post-op'],'Facility transfer patient. Escort required by facility.',3,'2025-04-02','active'),
('P-105','George Hernandez','1947-08-03','(813) 555-0457','ghernandez@email.com','4010 Gandy Blvd, Tampa, FL 33611','Medicare','MCR-8841023','wheelchair',array['COPD','Heart Disease'],'No-show history. Confirm 2hrs before pickup.',14,'2025-04-01','flagged'),
('P-106','Harold Mason','1938-06-08','(813) 555-0103',null,'3300 E Fletcher Ave, Tampa, FL 33613','Medicaid','MCD-9923011','bariatric',array['Morbid Obesity','Diabetes','Heart Failure'],'Weight 420lbs. Bariatric stretcher only. 2 staff required.',7,'2025-04-03','active')
on conflict (id) do nothing
""", "patients seed")

# ─── 5. Seed vehicles ─────────────────────────────────────────────────────────
print("Seeding vehicles...")
run("""
insert into vehicles (id,type,make,year,plate,vin,capacity,mileage,last_service,next_service,inspection,status,driver,features) values
('VAN-01','Wheelchair Van','Ford Transit',2023,'HRNY-001','1FTBF2C82NKA12345','2 WC + 3 ambulatory',28400,'2025-02-10','2025-05-10','2025-09-01','available',null,array['Hydraulic Lift','ADA','O2 Ready']),
('VAN-02','Wheelchair Van','Ram ProMaster',2022,'HRNY-002','3C6TRVDG4NE234567','2 WC + 2 ambulatory',44100,'2025-01-22','2025-04-22','2025-08-15','available','Patricia Owens',array['Hydraulic Lift','ADA']),
('VAN-04','Wheelchair Van','Ford Transit',2022,'HRNY-004','1FTBF2C89NKA67890','2 WC + 3 ambulatory',51200,'2025-03-01','2025-06-01','2025-09-01','in-use','Marcus Johnson',array['Hydraulic Lift','ADA','O2 Ready','GPS']),
('VAN-07','Wheelchair Van','Chevrolet Express',2021,'HRNY-007','1GCZGTFGXM1123456','1 WC + 4 ambulatory',67800,'2025-02-28','2025-05-28','2025-07-15','in-use','James Okafor',array['Ramp','ADA']),
('STR-01','Stretcher Van','Ford Transit Extended',2023,'HRNY-S01','1FTBW2CM5NKA99001','1 stretcher + 1 escort',19300,'2025-03-15','2025-06-15','2025-10-01','in-use','Angela Morris',array['Powered Stretcher','O2','Suction','AED']),
('SED-02','Sedan','Toyota Camry',2024,'HRNY-S02','4T1B11HK5NU123456','3 ambulatory',11200,'2025-01-10','2025-07-10','2025-12-01','in-use','Lisa Ramirez',array['GPS','Dash Cam']),
('SED-05','SUV','Honda Pilot',2023,'HRNY-S05','5FNYF6H59PB123456','5 ambulatory',22100,'2025-02-20','2025-05-20','2025-11-01','available','David Kim',array['GPS','Dash Cam','Child Seat Ready']),
('VAN-09','Wheelchair Van','Ford Transit',2020,'HRNY-009','1FTBF2C84LKA55512','2 WC + 2 ambulatory',89300,'2025-03-20','2025-04-20','2025-06-01','maintenance',null,array['Hydraulic Lift','ADA'])
on conflict (id) do nothing
""", "vehicles seed")

# ─── 6. Seed trips ────────────────────────────────────────────────────────────
print("Seeding trips...")
run("""
insert into trips (id,patient,dob,phone,pickup,destination,date,time,return_time,type,transport,driver,vehicle,insurance,status,notes) values
('T-1042','Margaret Torres','1948-03-12','(813) 555-0192','2210 N Dale Mabry Hwy, Tampa, FL','Tampa General Hospital','2025-04-02','08:30',null,'roundtrip','wheelchair','Marcus Johnson','VAN-04','Medicaid','confirmed','Patient requires oxygen. Slow loader.'),
('T-1043','Robert Chen','1955-07-22','(727) 555-0344','1440 2nd Ave N, St. Petersburg, FL','BayCare Dialysis Center','2025-04-02','06:00','10:30','roundtrip','ambulatory','Lisa Ramirez','SED-02','Medicare','in-transit',''),
('T-1044','Dorothy Williams','1942-11-05','(813) 555-0781','4523 W Kennedy Blvd, Tampa, FL','Moffitt Cancer Center','2025-04-02','09:15',null,'oneway','wheelchair','James Okafor','VAN-07','BlueCross','pending','First visit. Needs extra time for setup.'),
('T-1045','Frank Delgado','1950-01-30','(813) 555-0522','HCA Florida South Tampa Hospital','Kindred Rehab Hospital','2025-04-02','13:00',null,'oneway','stretcher','Angela Morris','STR-01','Humana','confirmed','Facility transfer. Escort required.'),
('T-1046','Susan Park','1963-09-17','(727) 555-0998','8920 Sunset Blvd, Clearwater, FL','Morton Plant Hospital','2025-04-02','10:45','13:00','roundtrip','ambulatory','David Kim','SED-05','Aetna','completed',''),
('T-1047','Harold Mason','1938-06-08','(813) 555-0103','3300 E Fletcher Ave, Tampa, FL','USF Health Morsani','2025-04-03','07:30','12:00','roundtrip','bariatric',null,null,'Medicaid','pending','Bariatric stretcher required. Weight 420lbs.'),
('T-1048','Carol Nguyen','1971-12-19','(813) 555-0674','5020 W Cypress St, Tampa, FL','Tampa Bay Dialysis','2025-04-03','05:45','09:30','roundtrip','wheelchair','Marcus Johnson','VAN-04','Medicaid','confirmed','Recurring Monday/Wednesday/Friday.'),
('T-1049','Albert Thompson','1944-02-28','(727) 555-0211','221 Pinellas Ave, Tarpon Springs, FL','Florida Hospital Carrollwood','2025-04-03','11:00',null,'oneway','ambulatory',null,null,'UnitedHealth','pending',''),
('T-1050','Mary Johnson','1958-04-14','(813) 555-0890','1800 E Hillsborough Ave, Tampa, FL','Advent Health','2025-04-01','14:00','16:30','roundtrip','ambulatory','Lisa Ramirez','SED-02','Cigna','completed',''),
('T-1051','George Hernandez','1947-08-03','(813) 555-0457','4010 Gandy Blvd, Tampa, FL','VA Hospital Tampa','2025-04-01','08:00','12:00','roundtrip','wheelchair','James Okafor','VAN-07','Medicare','no-show','Called no answer x3.')
on conflict (id) do nothing
""", "trips seed")

# ─── 7. Seed invoices ─────────────────────────────────────────────────────────
print("Seeding invoices...")
run("""
insert into invoices (id,invoice_date,due_date,bill_to,status,paid_date,denial_reason,payment_terms) values
('INV-1003','2026-03-25','2026-04-09','Mary Immaculate Healthcare Services','submitted',null,null,'Net 15'),
('INV-1004','2026-03-01','2026-03-16','AdventHealth Medical Group','paid','2026-03-14',null,'Net 15'),
('INV-1005','2026-03-10','2026-03-25','BayCare Health System','paid','2026-03-22',null,'Net 15'),
('INV-1006','2026-03-18','2026-04-02','Tampa General Hospital','pending',null,null,'Net 15'),
('INV-1007','2026-03-20','2026-04-04','Moffitt Cancer Center','denied',null,'Missing prior authorization number. Resubmit with auth code.','Net 15')
on conflict (id) do nothing
""", "invoices seed")

# ─── 8. Seed line items ───────────────────────────────────────────────────────
print("Seeding invoice line items...")
run("""
insert into invoice_line_items (invoice_id,num,date,service,description,qty,rate,amount) values
('INV-1003',1,'2026-01-27','Pick-Up Fee','Wheelchair transportation service for MARGARET TORRES on 01/26/2026',2,90.00,180.00),
('INV-1003',2,'2026-01-27','Mileage Fee','Wheelchair transportation service for MARGARET TORRES on 01/26/2026',24,4.00,96.00),
('INV-1003',3,'2026-01-28','Pick-Up Fee','Wheelchair transportation service for ROBERT CHEN on 01/27/2026',2,90.00,180.00),
('INV-1003',4,'2026-01-28','Mileage Fee','Wheelchair transportation service for ROBERT CHEN on 01/27/2026',52,4.00,208.00),
('INV-1003',5,'2026-01-29','Pick-Up Fee','Wheelchair transportation service for DOROTHY WILLIAMS on 01/28/2026',2,90.00,180.00),
('INV-1003',6,'2026-01-29','Mileage Fee','Wheelchair transportation service for DOROTHY WILLIAMS on 01/28/2026',8,4.00,32.00),
('INV-1003',7,'2026-01-30','Pick-Up Fee','Wheelchair transportation service for CAROL NGUYEN on 01/29/2026',2,90.00,180.00),
('INV-1003',8,'2026-01-30','Mileage Fee','Wheelchair transportation service for CAROL NGUYEN on 01/29/2026',4,4.00,16.00),
('INV-1003',9,'2026-02-02','After Hour ST Pick-Up Fee','Stretcher transportation service for FRANK DELGADO on 02/01/2026',1,350.00,350.00),
('INV-1003',10,'2026-02-02','After Hour ST Mileage Fee','Stretcher transportation service for FRANK DELGADO on 02/01/2026',2,9.50,19.00),
('INV-1003',11,'2026-02-02','After Hour ST Waiting Fee','Stretcher transportation service for FRANK DELGADO on 02/01/2026',1,150.00,150.00),
('INV-1003',12,'2026-02-05','Pick-Up Fee','Wheelchair transportation service for GEORGE HERNANDEZ on 02/04/2026',2,90.00,180.00),
('INV-1003',13,'2026-02-05','Mileage Fee','Wheelchair transportation service for GEORGE HERNANDEZ on 02/04/2026',12,4.00,48.00),
('INV-1003',14,'2026-02-12','After Hours Pick-Up Fee','Wheelchair transportation service for HAROLD MASON on 02/11/2026',2,125.00,250.00),
('INV-1003',15,'2026-02-12','After Hours Mileage Fee','Wheelchair transportation service for HAROLD MASON on 02/11/2026',22,6.50,143.00),
('INV-1003',16,'2026-02-12','After Hours Waiting Fee','Wheelchair transportation service for HAROLD MASON on 02/11/2026',2,150.00,300.00),
('INV-1004',1,'2026-02-03','Pick-Up Fee','Wheelchair transportation service for SUSAN PARK on 02/02/2026',2,90.00,180.00),
('INV-1004',2,'2026-02-03','Mileage Fee','Wheelchair transportation service for SUSAN PARK on 02/02/2026',18,4.00,72.00),
('INV-1004',3,'2026-02-10','Pick-Up Fee','Ambulatory transportation service for MARY JOHNSON on 02/09/2026',2,90.00,180.00),
('INV-1004',4,'2026-02-10','Mileage Fee','Ambulatory transportation service for MARY JOHNSON on 02/09/2026',10,4.00,40.00),
('INV-1004',5,'2026-02-17','Pick-Up Fee','Wheelchair transportation service for ALBERT THOMPSON on 02/16/2026',2,90.00,180.00),
('INV-1004',6,'2026-02-17','Mileage Fee','Wheelchair transportation service for ALBERT THOMPSON on 02/16/2026',30,4.00,120.00),
('INV-1005',1,'2026-02-14','Pick-Up Fee','Wheelchair transportation service for ROBERT CHEN on 02/13/2026',2,90.00,180.00),
('INV-1005',2,'2026-02-14','Mileage Fee','Wheelchair transportation service for ROBERT CHEN on 02/13/2026',20,4.00,80.00),
('INV-1005',3,'2026-02-21','Pick-Up Fee','Wheelchair transportation service for CAROL NGUYEN on 02/20/2026',2,90.00,180.00),
('INV-1005',4,'2026-02-21','Mileage Fee','Wheelchair transportation service for CAROL NGUYEN on 02/20/2026',16,4.00,64.00),
('INV-1005',5,'2026-02-28','Pick-Up Fee','Ambulatory transportation service for MARGARET TORRES on 02/27/2026',2,90.00,180.00),
('INV-1005',6,'2026-02-28','Mileage Fee','Ambulatory transportation service for MARGARET TORRES on 02/27/2026',14,4.00,56.00),
('INV-1006',1,'2026-03-01','Pick-Up Fee','Wheelchair transportation service for DOROTHY WILLIAMS on 02/28/2026',2,90.00,180.00),
('INV-1006',2,'2026-03-01','Mileage Fee','Wheelchair transportation service for DOROTHY WILLIAMS on 02/28/2026',22,4.00,88.00),
('INV-1006',3,'2026-03-05','After Hours Pick-Up Fee','Wheelchair transportation service for HAROLD MASON on 03/04/2026',2,125.00,250.00),
('INV-1006',4,'2026-03-05','After Hours Mileage Fee','Wheelchair transportation service for HAROLD MASON on 03/04/2026',18,6.50,117.00),
('INV-1006',5,'2026-03-05','After Hours Waiting Fee','Wheelchair transportation service for HAROLD MASON on 03/04/2026',1,150.00,150.00),
('INV-1007',1,'2026-03-10','Pick-Up Fee','Wheelchair transportation service for GEORGE HERNANDEZ on 03/09/2026',2,90.00,180.00),
('INV-1007',2,'2026-03-10','Mileage Fee','Wheelchair transportation service for GEORGE HERNANDEZ on 03/09/2026',16,4.00,64.00)
on conflict do nothing
""", "line items seed")

print("\nDone! Verifying row counts...")
run("select 'drivers' as t, count(*) from drivers union all select 'patients', count(*) from patients union all select 'vehicles', count(*) from vehicles union all select 'trips', count(*) from trips union all select 'invoices', count(*) from invoices union all select 'invoice_line_items', count(*) from invoice_line_items", "row counts")
