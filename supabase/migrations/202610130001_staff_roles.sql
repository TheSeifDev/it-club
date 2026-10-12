-- ============================================================================
-- Migration: 202610130001_staff_roles.sql
-- Description: Staff role model and authorization foundation for IT Club
-- 1. Table public.staff_members linking Supabase Auth users to roles ('owner', 'admin')
-- 2. Strict constraints ensuring one role record per user
-- 3. RLS policies allowing authenticated staff to inspect only their own role
-- 4. Authorized staff read access for public.applications
-- ============================================================================

create table if not exists public.staff_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Index for role lookup performance
create index if not exists staff_members_role_idx on public.staff_members (role);

-- Enable Row-Level Security
alter table public.staff_members enable row level security;

-- Revoke default public access from anon
revoke all on table public.staff_members from anon;
revoke all on table public.staff_members from authenticated;

-- Allow authenticated users to view only their own staff role row
grant select on table public.staff_members to authenticated;

drop policy if exists staff_members_self_read on public.staff_members;
create policy staff_members_self_read on public.staff_members
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Full management access exclusively to service_role (used by server-side bootstrap and admin mutations)
grant all on table public.staff_members to service_role;

-- Allow authenticated staff members (owner or admin) to read recruitment applications
grant select on table public.applications to authenticated;

drop policy if exists applications_staff_select on public.applications;
create policy applications_staff_select on public.applications
  for select to authenticated
  using (
    exists (
      select 1 from public.staff_members
      where staff_members.user_id = (select auth.uid())
        and staff_members.role in ('owner', 'admin')
    )
  );
