-- Add full billing address to invoices table
-- Run in Supabase SQL Editor

alter table invoices add column if not exists bill_to_address text;
