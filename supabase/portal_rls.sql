-- Run this in Supabase SQL Editor after running rls_auth.sql

-- Add portal user link to patients table
alter table patients add column if not exists portal_user_id uuid references auth.users(id);
alter table patients add column if not exists email text;

create index if not exists patients_portal_idx on patients(portal_user_id);
create index if not exists patients_email_idx on patients(email);

-- Allow portal patients to update their own record
create policy "portal patient self update" on patients
  for update to authenticated
  using (portal_user_id = auth.uid())
  with check (portal_user_id = auth.uid());
