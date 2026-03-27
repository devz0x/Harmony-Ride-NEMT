-- ── RLS Write Policies for Admin (anon key) ──────────────────────────────────
-- Run this in the Supabase SQL Editor after schema.sql

create policy "anon insert drivers"             on drivers             for insert with check (true);
create policy "anon update drivers"             on drivers             for update using (true) with check (true);
create policy "anon delete drivers"             on drivers             for delete using (true);

create policy "anon insert patients"            on patients            for insert with check (true);
create policy "anon update patients"            on patients            for update using (true) with check (true);
create policy "anon delete patients"            on patients            for delete using (true);

create policy "anon insert vehicles"            on vehicles            for insert with check (true);
create policy "anon update vehicles"            on vehicles            for update using (true) with check (true);
create policy "anon delete vehicles"            on vehicles            for delete using (true);

create policy "anon insert trips"               on trips               for insert with check (true);
create policy "anon update trips"               on trips               for update using (true) with check (true);
create policy "anon delete trips"               on trips               for delete using (true);

create policy "anon insert invoices"            on invoices            for insert with check (true);
create policy "anon update invoices"            on invoices            for update using (true) with check (true);
create policy "anon delete invoices"            on invoices            for delete using (true);

create policy "anon insert invoice_line_items"  on invoice_line_items  for insert with check (true);
create policy "anon update invoice_line_items"  on invoice_line_items  for update using (true) with check (true);
create policy "anon delete invoice_line_items"  on invoice_line_items  for delete using (true);

-- Allow 'recurring' trip type (extend the existing check constraint)
alter table trips drop constraint if exists trips_type_check;
alter table trips add constraint trips_type_check check (type in ('oneway','roundtrip','recurring'));
