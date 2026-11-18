-- Additive security repair for policies introduced by historical migrations.
-- PostgreSQL combines permissive policies with OR, so each broad historical
-- policy is dropped by its actual deployed name before its restricted form is created.
-- This migration is not applied automatically by application code.

alter table public.applications enable row level security;
-- Registration currently falls back to the publishable/anon key when the
-- service-role key is not configured. Preserve its historical RLS-checked
-- INSERT path while explicitly denying anonymous reads and mutations.
revoke select, update, delete on table public.applications from anon;
grant insert on table public.applications to anon;
grant select on table public.applications to authenticated;

-- Historical policy from 202610130001 / 202610200001 allowed all staff to read
-- every application. Replace that exact policy name; keep the independent,
-- status-limited applications_student_self_select policy intact.
drop policy if exists applications_staff_select on public.applications;
create policy applications_staff_select on public.applications
  for select to authenticated
  using (
    exists (
      select 1
      from public.staff_members staff
      where staff.user_id = (select auth.uid())
        and coalesce(staff.password_change_required, false) = false
        and (
          staff.role = 'owner'
          or (
            staff.role in ('admin', 'interviewer')
            and staff.committee is not null
            and staff.committee = applications.primary_track
          )
        )
    )
  );

-- Historical policy from 202610130003 allowed all owners/admins to read every
-- student account. Replace the actual policy name with committee-scoped access;
-- students retain their separate student_accounts_self_read policy.
alter table public.student_accounts enable row level security;
drop policy if exists student_accounts_staff_read on public.student_accounts;
create policy student_accounts_staff_read on public.student_accounts
  for select to authenticated
  using (
    exists (
      select 1
      from public.staff_members staff
      join public.applications app on app.id = student_accounts.application_id
      where staff.user_id = (select auth.uid())
        and coalesce(staff.password_change_required, false) = false
        and (
          staff.role = 'owner'
          or (
            staff.role in ('admin', 'interviewer')
            and staff.committee is not null
            and staff.committee = app.primary_track
          )
        )
    )
  );

-- Historical policies named interview_qr_tokens_staff_manage from 202610130004
-- and 202610130007 were global for staff. Replace the deployed policy name and
-- scope direct access to the committee attached to the linked application.
drop policy if exists interview_qr_tokens_staff_manage on public.interview_qr_tokens;
create policy interview_qr_tokens_staff_manage on public.interview_qr_tokens
  for all to authenticated
  using (
    exists (
      select 1
      from public.staff_members staff
      join public.applications app on app.id = interview_qr_tokens.application_id
      where staff.user_id = (select auth.uid())
        and coalesce(staff.password_change_required, false) = false
        and (
          staff.role = 'owner'
          or (
            staff.role in ('admin', 'interviewer')
            and staff.committee is not null
            and staff.committee = app.primary_track
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.staff_members staff
      join public.applications app on app.id = interview_qr_tokens.application_id
      where staff.user_id = (select auth.uid())
        and coalesce(staff.password_change_required, false) = false
        and (
          staff.role = 'owner'
          or (
            staff.role in ('admin', 'interviewer')
            and staff.committee is not null
            and staff.committee = app.primary_track
          )
        )
    )
  );

-- Evaluation reads remain limited to the candidate's committee. Interviewers
-- can read only their own records; owners and committee admins can review all.
drop policy if exists interview_evaluations_select on public.interview_evaluations;
create policy interview_evaluations_select on public.interview_evaluations
  for select to authenticated
  using (
    exists (
      select 1
      from public.staff_members staff
      join public.applications app on app.id = interview_evaluations.application_id
      where staff.user_id = (select auth.uid())
        and coalesce(staff.password_change_required, false) = false
        and (
          staff.role = 'owner'
          or (
            staff.role in ('admin', 'interviewer')
            and staff.committee is not null
            and staff.committee = app.primary_track
          )
        )
        and (
          interview_evaluations.interviewer_id = (select auth.uid())
          or staff.role in ('owner', 'admin')
        )
    )
  );

-- Direct authenticated inserts must be the caller's own evaluation, in their
-- committee, for an allowed status and a linked, non-expired checked-in QR.
drop policy if exists interview_evaluations_insert on public.interview_evaluations;
create policy interview_evaluations_insert on public.interview_evaluations
  for insert to authenticated
  with check (
    interviewer_id = (select auth.uid())
    and exists (
      select 1
      from public.staff_members staff
      join public.applications app on app.id = interview_evaluations.application_id
      join public.interview_qr_tokens qr on qr.application_id = app.id
      where staff.user_id = (select auth.uid())
        and coalesce(staff.password_change_required, false) = false
        and (
          staff.role = 'owner'
          or (
            staff.role in ('admin', 'interviewer')
            and staff.committee is not null
            and staff.committee = app.primary_track
          )
        )
        and app.status in ('SHORTLISTED', 'INTERVIEW_SCHEDULED', 'ACCEPTED')
        and qr.status = 'CHECKED_IN'
        and qr.checked_in_at is not null
        and qr.expires_at > now()
    )
  );

-- Direct updates enforce the same state on both the old and new row, preventing
-- reassignment to another candidate, committee, or unchecked/expired QR record.
drop policy if exists interview_evaluations_update on public.interview_evaluations;
create policy interview_evaluations_update on public.interview_evaluations
  for update to authenticated
  using (
    interviewer_id = (select auth.uid())
    and exists (
      select 1
      from public.staff_members staff
      join public.applications app on app.id = interview_evaluations.application_id
      join public.interview_qr_tokens qr on qr.application_id = app.id
      where staff.user_id = (select auth.uid())
        and coalesce(staff.password_change_required, false) = false
        and (
          staff.role = 'owner'
          or (
            staff.role in ('admin', 'interviewer')
            and staff.committee is not null
            and staff.committee = app.primary_track
          )
        )
        and app.status in ('SHORTLISTED', 'INTERVIEW_SCHEDULED', 'ACCEPTED')
        and qr.status = 'CHECKED_IN'
        and qr.checked_in_at is not null
        and qr.expires_at > now()
    )
  )
  with check (
    interviewer_id = (select auth.uid())
    and exists (
      select 1
      from public.staff_members staff
      join public.applications app on app.id = interview_evaluations.application_id
      join public.interview_qr_tokens qr on qr.application_id = app.id
      where staff.user_id = (select auth.uid())
        and coalesce(staff.password_change_required, false) = false
        and (
          staff.role = 'owner'
          or (
            staff.role in ('admin', 'interviewer')
            and staff.committee is not null
            and staff.committee = app.primary_track
          )
        )
        and app.status in ('SHORTLISTED', 'INTERVIEW_SCHEDULED', 'ACCEPTED')
        and qr.status = 'CHECKED_IN'
        and qr.checked_in_at is not null
        and qr.expires_at > now()
    )
  );
