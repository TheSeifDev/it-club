-- ============================================================================
-- Migration: 202610130004_student_dashboard_qr.sql
-- Description: Phase 4 Student Dashboard, Information Card & QR Tokens
-- 1. Add optional interview scheduling details to public.applications
-- 2. Create public.interview_qr_tokens table for secure check-in verification
-- 3. RLS policies for interview_qr_tokens (student self-read, staff manage)
-- 4. Update applications_student_self_select policy for post-acceptance statuses
-- ============================================================================

-- 1. Add optional interview details columns to applications (additive)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'applications' and column_name = 'interview_date'
  ) then
    alter table public.applications add column interview_date text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'applications' and column_name = 'interview_time'
  ) then
    alter table public.applications add column interview_time text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'applications' and column_name = 'interview_location'
  ) then
    alter table public.applications add column interview_location text;
  end if;
end $$;

-- 2. Create interview_qr_tokens table
create table if not exists public.interview_qr_tokens (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  token text not null unique,
  token_hash text not null unique,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'CHECKED_IN', 'REVOKED', 'EXPIRED')),
  checked_in_at timestamptz,
  checked_in_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  revoked_reason text,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists interview_qr_tokens_app_id_idx
  on public.interview_qr_tokens (application_id);

create index if not exists interview_qr_tokens_status_idx
  on public.interview_qr_tokens (status);

create index if not exists interview_qr_tokens_token_hash_idx
  on public.interview_qr_tokens (token_hash);

-- 3. Row Level Security on interview_qr_tokens
alter table public.interview_qr_tokens enable row level security;

-- Revoke default privileges
revoke all on table public.interview_qr_tokens from anon;
revoke all on table public.interview_qr_tokens from authenticated;
grant all on table public.interview_qr_tokens to service_role;

-- Grant selective read to authenticated users
grant select on table public.interview_qr_tokens to authenticated;

-- Policy 1: Authenticated student can only read their own application's QR token
drop policy if exists interview_qr_tokens_student_self_select on public.interview_qr_tokens;
create policy interview_qr_tokens_student_self_select on public.interview_qr_tokens
  for select to authenticated
  using (
    application_id in (
      select application_id from public.student_accounts
      where user_id = (select auth.uid())
    )
  );

-- Policy 2: Staff members (Owner/Admin) can manage interview tokens
drop policy if exists interview_qr_tokens_staff_manage on public.interview_qr_tokens;
create policy interview_qr_tokens_staff_manage on public.interview_qr_tokens
  for all to authenticated
  using (
    exists (
      select 1 from public.staff_members
      where staff_members.user_id = (select auth.uid())
        and staff_members.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.staff_members
      where staff_members.user_id = (select auth.uid())
        and staff_members.role in ('owner', 'admin')
    )
  );

-- 4. Update applications student self-read policy to include post-acceptance lifecycle statuses
drop policy if exists applications_student_self_select on public.applications;
create policy applications_student_self_select on public.applications
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    and status in ('ACCEPTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED')
  );
