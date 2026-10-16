-- ============================================================================
-- Migration: 202610130009_shortlisted_activation.sql
-- Description: Shortlisted applicant account activation and notification support
-- 1. Extend application_notifications check constraint to include SHORTLISTED_INVITATION
-- 2. Update applications_student_self_select RLS policy to allow SHORTLISTED status
-- ============================================================================

-- 1. Extend application_notifications check constraint
alter table public.application_notifications
  drop constraint if exists application_notifications_notification_type_check;

alter table public.application_notifications
  add constraint application_notifications_notification_type_check
  check (notification_type in (
    'REGISTRATION_RECEIPT',
    'ACCEPTANCE_INVITATION',
    'SHORTLISTED_INVITATION',
    'INTERVIEW_SCHEDULED',
    'STATUS_DECISION'
  ));

-- 2. Update applications student self-read policy to include SHORTLISTED lifecycle status
drop policy if exists applications_student_self_select on public.applications;
create policy applications_student_self_select on public.applications
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    and status in ('SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'ACCEPTED')
  );
