-- ============================================================================
-- Migration: 202610130002_application_notifications.sql
-- Description: Transactional notification tracking for recruitment applications
-- 1. Table public.application_notifications with delivery status and idempotency
-- 2. Foreign key relationship to public.applications
-- 3. Strict RLS lockdown (service_role management, staff read access)
-- ============================================================================

create table if not exists public.application_notifications (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  notification_type text not null check (notification_type in ('REGISTRATION_RECEIPT')),
  idempotency_key text not null unique,
  recipient_email text not null,
  delivery_status text not null default 'PENDING'
    check (delivery_status in ('PENDING', 'SENT', 'FAILED')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  provider_message_id text,
  safe_error_category text,
  error_message text,
  created_at timestamptz not null default now(),
  attempted_at timestamptz,
  completed_at timestamptz
);

-- Foreign key index to prevent full-table scans
create index if not exists application_notifications_application_id_idx
  on public.application_notifications (application_id);

-- Operational index for querying pending or failed notifications for retry
create index if not exists application_notifications_delivery_status_idx
  on public.application_notifications (delivery_status, created_at desc);

-- Enable Row-Level Security
alter table public.application_notifications enable row level security;

-- Revoke default public access from anon and authenticated
revoke all on table public.application_notifications from anon;
revoke all on table public.application_notifications from authenticated;

-- Full management access exclusively to service_role
grant all on table public.application_notifications to service_role;

-- Allow authenticated staff members (owner or admin) to inspect notification records
grant select on table public.application_notifications to authenticated;

drop policy if exists application_notifications_staff_select on public.application_notifications;
create policy application_notifications_staff_select on public.application_notifications
  for select to authenticated
  using (
    exists (
      select 1 from public.staff_members
      where staff_members.user_id = (select auth.uid())
        and staff_members.role in ('owner', 'admin')
    )
  );
