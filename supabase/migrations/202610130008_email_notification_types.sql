-- ============================================================================
-- Migration: 202610130008_email_notification_types.sql
-- Description: Additive migration extending notification_type check constraint
-- Supports INTERVIEW_SCHEDULED and STATUS_DECISION notification types
-- ============================================================================

alter table public.application_notifications
  drop constraint if exists application_notifications_notification_type_check;

alter table public.application_notifications
  add constraint application_notifications_notification_type_check
  check (notification_type in ('REGISTRATION_RECEIPT', 'ACCEPTANCE_INVITATION', 'INTERVIEW_SCHEDULED', 'STATUS_DECISION'));
