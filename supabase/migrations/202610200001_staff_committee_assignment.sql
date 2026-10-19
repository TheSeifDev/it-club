-- ============================================================================
-- Migration: 202610200001_staff_committee_assignment.sql
-- Description: Committee assignment for staff members
-- 1. Add nullable `committee` column to public.staff_members
-- 2. Column uses canonical track identifiers matching public.applications.primary_track
-- 3. Constraint validates against allowed committee values
-- 4. Owner row remains NULL (owner has unrestricted cross-committee access)
-- 5. Index for efficient committee-scoped access-check queries
-- NOTE: Existing admin/interviewer rows are intentionally left NULL (no assignment).
--       The Owner must assign committees explicitly. NULL = no access (deny-by-default).
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'staff_members'
      and column_name = 'committee'
  ) then
    alter table public.staff_members
      add column committee text
        check (
          committee is null
          or committee in ('hr', 'pr', 'sm', 'oc', 'it', 'rnd')
        );

    comment on column public.staff_members.committee is
      'Canonical committee track this staff member is authorized to access. '
      'NULL for owner (unrestricted) or unassigned staff (deny-by-default). '
      'Valid values: hr, pr, sm, oc, it, rnd.';
  end if;
end $$;

-- Index for efficient committee-based access checks
create index if not exists staff_members_committee_idx
  on public.staff_members (committee)
  where committee is not null;

-- Update the applications_staff_select RLS policy to also allow interviewers
-- NOTE: Service-role bypasses RLS; committee scoping is enforced in server-side queries.
-- This policy remains as a defense-in-depth layer for direct authenticated client queries.
drop policy if exists applications_staff_select on public.applications;
create policy applications_staff_select on public.applications
  for select to authenticated
  using (
    exists (
      select 1 from public.staff_members
      where staff_members.user_id = (select auth.uid())
        and staff_members.role in ('owner', 'admin', 'interviewer')
    )
  );
