-- ── Restrict all write operations to authenticated users only ────────────────
-- Run this in the Supabase SQL Editor to replace the open anon write policies.
-- Reads remain public (anon) so the landing page can still work if needed.
-- Writes now require a valid Supabase Auth session (signed-in admin).

-- Drivers
drop policy if exists "anon insert drivers" on drivers;
drop policy if exists "anon update drivers" on drivers;
drop policy if exists "anon delete drivers" on drivers;
create policy "auth insert drivers" on drivers for insert to authenticated with check (true);
create policy "auth update drivers" on drivers for update to authenticated using (true) with check (true);
create policy "auth delete drivers" on drivers for delete to authenticated using (true);

-- Patients
drop policy if exists "anon insert patients" on patients;
drop policy if exists "anon update patients" on patients;
drop policy if exists "anon delete patients" on patients;
create policy "auth insert patients" on patients for insert to authenticated with check (true);
create policy "auth update patients" on patients for update to authenticated using (true) with check (true);
create policy "auth delete patients" on patients for delete to authenticated using (true);

-- Vehicles
drop policy if exists "anon insert vehicles" on vehicles;
drop policy if exists "anon update vehicles" on vehicles;
drop policy if exists "anon delete vehicles" on vehicles;
create policy "auth insert vehicles" on vehicles for insert to authenticated with check (true);
create policy "auth update vehicles" on vehicles for update to authenticated using (true) with check (true);
create policy "auth delete vehicles" on vehicles for delete to authenticated using (true);

-- Trips
drop policy if exists "anon insert trips" on trips;
drop policy if exists "anon update trips" on trips;
drop policy if exists "anon delete trips" on trips;
create policy "auth insert trips" on trips for insert to authenticated with check (true);
create policy "auth update trips" on trips for update to authenticated using (true) with check (true);
create policy "auth delete trips" on trips for delete to authenticated using (true);

-- Invoices
drop policy if exists "anon insert invoices" on invoices;
drop policy if exists "anon update invoices" on invoices;
drop policy if exists "anon delete invoices" on invoices;
create policy "auth insert invoices" on invoices for insert to authenticated with check (true);
create policy "auth update invoices" on invoices for update to authenticated using (true) with check (true);
create policy "auth delete invoices" on invoices for delete to authenticated using (true);

-- Invoice line items
drop policy if exists "anon insert invoice_line_items" on invoice_line_items;
drop policy if exists "anon update invoice_line_items" on invoice_line_items;
drop policy if exists "anon delete invoice_line_items" on invoice_line_items;
create policy "auth insert invoice_line_items" on invoice_line_items for insert to authenticated with check (true);
create policy "auth update invoice_line_items" on invoice_line_items for update to authenticated using (true) with check (true);
create policy "auth delete invoice_line_items" on invoice_line_items for delete to authenticated using (true);

-- Settings
drop policy if exists "anon insert settings" on settings;
drop policy if exists "anon update settings" on settings;
create policy "auth insert settings" on settings for insert to authenticated with check (true);
create policy "auth update settings" on settings for update to authenticated using (true) with check (true);
