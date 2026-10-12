-- ============================================================================
-- Migration: 202610120002_security_hardening.sql
-- Description: Security hardening for IT Club Recruitment
-- 1. Shared distributed rate limiting table across instances.
-- 2. Database-level constraints for university email (@batechu.com with digits only).
-- 3. Database-level structural constraints for Egyptian National ID (14 digits, century 2 or 3).
-- 4. Database-level telephone format constraints.
-- 5. RLS audit and privilege lockdown for anon and authenticated roles.
-- ============================================================================

-- 1. Distributed rate limiting table
create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 1,
  reset_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Index for expiring rate limit buckets cleanup
create index if not exists rate_limits_reset_at_idx on public.rate_limits (reset_at);

-- Lock down rate_limits table completely from client roles
alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from anon, authenticated;
grant all on table public.rate_limits to service_role;

-- 2. University email strict pattern constraint (<STUDENT_NUMBER>@batechu.com)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'applications_university_email_format_check'
  ) then
    alter table public.applications
      add constraint applications_university_email_format_check
      check (lower(trim(university_email)) ~ '^[0-9]+@batechu\.com$');
  end if;
end $$;

-- 3. Egyptian National ID century and length constraint
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'applications_national_id_check'
  ) then
    alter table public.applications drop constraint applications_national_id_check;
  end if;

  alter table public.applications
    add constraint applications_national_id_check
    check (national_id ~ '^[23][0-9]{13}$');
end $$;

-- 4. Phone and WhatsApp format constraints
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'applications_phone_format_check'
  ) then
    alter table public.applications
      add constraint applications_phone_format_check
      check (phone ~ '^[+()0-9\s-]{8,30}$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'applications_whatsapp_format_check'
  ) then
    alter table public.applications
      add constraint applications_whatsapp_format_check
      check (whatsapp ~ '^[+()0-9\s-]{8,30}$');
  end if;
end $$;

-- 5. Strict RLS enforcement and privilege verification
alter table public.applications enable row level security;

-- Keep read/update/delete strictly revoked from public/anon roles
revoke select, update, delete on table public.applications from anon, authenticated;

-- Allow write-only insertion for applicant registrations while maintaining total read/update privacy
grant insert on table public.applications to anon;
drop policy if exists applications_anon_insert_policy on public.applications;
create policy applications_anon_insert_policy on public.applications
  for insert to anon
  with check (status = 'PENDING_REVIEW' and consented_at is not null);

-- Grant full administrative management exclusively to service_role
grant all on table public.applications to service_role;
