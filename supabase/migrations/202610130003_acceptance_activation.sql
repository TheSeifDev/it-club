-- ============================================================================
-- Migration: 202610130003_acceptance_activation.sql
-- Description: Student account activation and application linkage foundation
-- 1. Add user_id and activated_at columns to public.applications
-- 2. Create public.student_accounts table for durable identity mapping
-- 3. Extend public.application_notifications constraint for ACCEPTANCE_INVITATION
-- 4. RLS policies granting students read access only to their own accepted application
-- ============================================================================

-- 1. Extend applications table with user link and activation timestamp
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'applications' and column_name = 'user_id'
  ) then
    alter table public.applications
      add column user_id uuid references auth.users(id) on delete set null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'applications' and column_name = 'activated_at'
  ) then
    alter table public.applications
      add column activated_at timestamptz;
  end if;
end $$;

-- Ensure one user cannot claim multiple applications
create unique index if not exists applications_user_id_unique
  on public.applications (user_id)
  where user_id is not null;

-- 2. Create durable student accounts mapping table
create table if not exists public.student_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  application_id uuid not null unique references public.applications(id) on delete cascade,
  university_email text not null,
  activated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Index for email lookups
create index if not exists student_accounts_university_email_idx
  on public.student_accounts (lower(trim(university_email)));

-- Enable RLS on student_accounts
alter table public.student_accounts enable row level security;

-- Revoke default access from anon and authenticated
revoke all on table public.student_accounts from anon;
revoke all on table public.student_accounts from authenticated;

-- Service role has full management
grant all on table public.student_accounts to service_role;

-- Allow students to read only their own account record
grant select on table public.student_accounts to authenticated;

drop policy if exists student_accounts_self_read on public.student_accounts;
create policy student_accounts_self_read on public.student_accounts
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Allow staff members to inspect student accounts
drop policy if exists student_accounts_staff_read on public.student_accounts;
create policy student_accounts_staff_read on public.student_accounts
  for select to authenticated
  using (
    exists (
      select 1 from public.staff_members
      where staff_members.user_id = (select auth.uid())
        and staff_members.role in ('owner', 'admin')
    )
  );

-- 3. Extend application_notifications check constraint
alter table public.application_notifications
  drop constraint if exists application_notifications_notification_type_check;

alter table public.application_notifications
  add constraint application_notifications_notification_type_check
  check (notification_type in ('REGISTRATION_RECEIPT', 'ACCEPTANCE_INVITATION'));

-- 4. Allow accepted students to read only their own application
drop policy if exists applications_student_self_select on public.applications;
create policy applications_student_self_select on public.applications
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    and status = 'ACCEPTED'
  );
