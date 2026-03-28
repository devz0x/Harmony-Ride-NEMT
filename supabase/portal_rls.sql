-- Run this in Supabase SQL Editor after running rls_auth.sql
-- Safe to re-run — all statements are idempotent.

-- ── 1. Schema additions ───────────────────────────────────────────────────────
alter table patients add column if not exists portal_user_id uuid references auth.users(id);
alter table patients add column if not exists email text;

create index if not exists patients_portal_idx on patients(portal_user_id);
create index if not exists patients_email_idx on patients(email);

-- ── 2. Remove anonymous read access from PHI tables ───────────────────────────
-- The original schema.sql created "anon read" policies with using (true) on all
-- tables. Those override any row-level filter because PostgreSQL ORs permissive
-- policies together. Drop them here for the three tables that contain PHI.
drop policy if exists "anon read patients"            on patients;
drop policy if exists "anon read trips"               on trips;
drop policy if exists "anon read invoices"            on invoices;
drop policy if exists "anon read invoice_line_items"  on invoice_line_items;

-- ── 3. Authenticated (admin) read — all records ───────────────────────────────
-- Replaces the dropped anon policies. Admins are authenticated users, so they
-- can still read everything. Portal patients are also authenticated, but the
-- self-read policy below is the more specific filter for their own record.
-- NOTE: without full RBAC this still allows any authenticated user to read all
-- patients. Implement custom JWT roles to lock this down further.
drop policy if exists "auth read patients"           on patients;
drop policy if exists "auth read trips"              on trips;
drop policy if exists "auth read invoices"           on invoices;
drop policy if exists "auth read invoice_line_items" on invoice_line_items;

create policy "auth read patients"           on patients            for select to authenticated using (true);
create policy "auth read trips"              on trips               for select to authenticated using (true);
create policy "auth read invoices"           on invoices            for select to authenticated using (true);
create policy "auth read invoice_line_items" on invoice_line_items  for select to authenticated using (true);

-- ── 4. Portal patient self-read ───────────────────────────────────────────────
-- Kept for clarity and future RBAC: when you add a "portal" role, change the
-- policy above to restrict admins only, and rely on this one for portal users.
drop policy if exists "portal patient self read" on patients;
create policy "portal patient self read" on patients
  for select to authenticated
  using (portal_user_id = auth.uid());

-- ── 5. Portal patient self-update ────────────────────────────────────────────
drop policy if exists "portal patient self update" on patients;
create policy "portal patient self update" on patients
  for update to authenticated
  using (portal_user_id = auth.uid())
  with check (portal_user_id = auth.uid());

