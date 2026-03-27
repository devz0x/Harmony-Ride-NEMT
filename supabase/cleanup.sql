-- ─── Run this in your Supabase SQL Editor to wipe all seeded mock data ──────
-- Order matters: delete child tables before parent tables (FK constraints)

delete from invoice_line_items;
delete from invoices;
delete from trips;
delete from vehicles;
delete from patients;
delete from drivers;
