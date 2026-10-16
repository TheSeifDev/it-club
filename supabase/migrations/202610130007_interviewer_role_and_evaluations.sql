-- ============================================================================
-- Migration: 202610130007_interviewer_role_and_evaluations.sql
-- Description: Interviewer Role & Dedicated Interview Evaluations Model
-- 1. Update staff_members role constraint to support 'interviewer'
-- 2. Update audit_events check constraints for actor_role ('interviewer') and entity_type ('interview_evaluation')
-- 3. Update interview_qr_tokens policy to permit interviewer role access
-- 4. Create public.interview_evaluations table with strict RLS
-- ============================================================================

-- 1. Allow 'interviewer' in staff_members
alter table public.staff_members
  drop constraint if exists staff_members_role_check;

alter table public.staff_members
  add constraint staff_members_role_check
  check (role in ('owner', 'admin', 'interviewer'));

-- 2. Update audit_events constraints
alter table public.audit_events
  drop constraint if exists audit_events_actor_role_check;

alter table public.audit_events
  add constraint audit_events_actor_role_check
  check (actor_role in ('owner', 'admin', 'interviewer', 'student', 'applicant', 'system', 'anonymous'));

alter table public.audit_events
  drop constraint if exists audit_events_entity_type_check;

alter table public.audit_events
  add constraint audit_events_entity_type_check
  check (entity_type in ('application', 'notification', 'student_account', 'interview_qr', 'staff_member', 'system', 'interview_evaluation'));

-- 3. Update interview_qr_tokens staff manage policy to allow interviewers
drop policy if exists interview_qr_tokens_staff_manage on public.interview_qr_tokens;
create policy interview_qr_tokens_staff_manage on public.interview_qr_tokens
  for all to authenticated
  using (
    exists (
      select 1 from public.staff_members
      where staff_members.user_id = (select auth.uid())
        and staff_members.role in ('owner', 'admin', 'interviewer')
    )
  )
  with check (
    exists (
      select 1 from public.staff_members
      where staff_members.user_id = (select auth.uid())
        and staff_members.role in ('owner', 'admin', 'interviewer')
    )
  );

-- 4. Create dedicated interview_evaluations table
create table if not exists public.interview_evaluations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  interviewer_id uuid not null references auth.users(id) on delete cascade,
  evaluation_notes text not null default '',
  rating text check (rating is null or rating in ('STRONG_HIRE', 'HIRE', 'NEUTRAL', 'NO_HIRE')),
  recommendation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_evaluations_app_interviewer_unique unique (application_id, interviewer_id)
);

create index if not exists interview_evaluations_app_id_idx
  on public.interview_evaluations (application_id);

create index if not exists interview_evaluations_interviewer_id_idx
  on public.interview_evaluations (interviewer_id);

-- Auto-update updated_at timestamp on edit
create or replace function public.set_interview_evaluations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists interview_evaluations_set_updated_at on public.interview_evaluations;
create trigger interview_evaluations_set_updated_at
before update on public.interview_evaluations
for each row execute function public.set_interview_evaluations_updated_at();

-- Enable Row-Level Security
alter table public.interview_evaluations enable row level security;

-- Revoke public access
revoke all on table public.interview_evaluations from anon;
revoke all on table public.interview_evaluations from authenticated;
grant all on table public.interview_evaluations to service_role;

-- Grant DML to authenticated
grant select, insert, update on table public.interview_evaluations to authenticated;

-- Policy 1: Interviewers can read only their own evaluation; Owner and Admin can read all evaluations
drop policy if exists interview_evaluations_select on public.interview_evaluations;
create policy interview_evaluations_select on public.interview_evaluations
  for select to authenticated
  using (
    interviewer_id = (select auth.uid())
    or exists (
      select 1 from public.staff_members
      where staff_members.user_id = (select auth.uid())
        and staff_members.role in ('owner', 'admin')
    )
  );

-- Policy 2: Interviewers, Admins, and Owners can insert their own evaluation
drop policy if exists interview_evaluations_insert on public.interview_evaluations;
create policy interview_evaluations_insert on public.interview_evaluations
  for insert to authenticated
  with check (
    interviewer_id = (select auth.uid())
    and exists (
      select 1 from public.staff_members
      where staff_members.user_id = (select auth.uid())
        and staff_members.role in ('owner', 'admin', 'interviewer')
    )
  );

-- Policy 3: Interviewers can update ONLY their own evaluation
drop policy if exists interview_evaluations_update on public.interview_evaluations;
create policy interview_evaluations_update on public.interview_evaluations
  for update to authenticated
  using (
    interviewer_id = (select auth.uid())
  )
  with check (
    interviewer_id = (select auth.uid())
  );
