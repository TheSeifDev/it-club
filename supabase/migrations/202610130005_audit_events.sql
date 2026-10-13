-- ============================================================================
-- Migration: 202610130005_audit_events.sql
-- Description: Phase 5B Comprehensive Audit Logging
-- 1. Create public.audit_events table for secure audit trails
-- 2. Practical indexes for timestamp, actor, action, entity, outcome
-- 3. Strict append-only RLS policies:
--    - Owner-only SELECT access (restricted to staff_members with role = 'owner')
--    - No UPDATE or DELETE policies for any role (immutable audit trail)
--    - Denied to anonymous users and regular student accounts
--    - Service-role grant for trusted server-side logging
-- ============================================================================

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  actor_role text not null check (actor_role in ('owner', 'admin', 'student', 'applicant', 'system', 'anonymous')),
  action text not null,
  entity_type text not null check (entity_type in ('application', 'notification', 'student_account', 'interview_qr', 'staff_member', 'system')),
  entity_id text,
  entity_reference text,
  previous_status text,
  new_status text,
  metadata jsonb not null default '{}'::jsonb,
  request_id text,
  outcome text not null check (outcome in ('SUCCESS', 'FAILURE')),
  error_category text,
  ip_address text
);

-- Practical indexes for high-throughput querying and filtering
create index if not exists audit_events_created_at_idx on public.audit_events (created_at desc);
create index if not exists audit_events_actor_id_idx on public.audit_events (actor_id);
create index if not exists audit_events_action_idx on public.audit_events (action);
create index if not exists audit_events_entity_type_idx on public.audit_events (entity_type);
create index if not exists audit_events_entity_reference_idx on public.audit_events (entity_reference);
create index if not exists audit_events_outcome_idx on public.audit_events (outcome);
create index if not exists audit_events_action_outcome_idx on public.audit_events (action, outcome);

-- Enable Row-Level Security
alter table public.audit_events enable row level security;

-- Revoke default public access
revoke all on table public.audit_events from anon;
revoke all on table public.audit_events from authenticated;

-- Grant select to authenticated (strictly gated by policy to owner role)
grant select on table public.audit_events to authenticated;

-- Owner-only SELECT policy (admins and students cannot read audit history)
drop policy if exists audit_events_owner_select on public.audit_events;
create policy audit_events_owner_select on public.audit_events
  for select to authenticated
  using (
    exists (
      select 1 from public.staff_members
      where staff_members.user_id = (select auth.uid())
        and staff_members.role = 'owner'
    )
  );

-- Service-role full access (used by server actions and queries)
grant all on table public.audit_events to service_role;
