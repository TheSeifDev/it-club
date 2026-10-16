-- ============================================================================
-- Migration: 202610130011_admin_invitation_password_lifecycle.sql
-- Description: Owner-only admin invitations & 24-hour mandatory password lifecycle
-- 1. Add email, password lifecycle tracking columns to public.staff_members
-- 2. Populate email for existing staff members from auth.users
-- 3. Add index for checking active or expired temporary credentials
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'staff_members' and column_name = 'email'
  ) then
    alter table public.staff_members
      add column email text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'staff_members' and column_name = 'password_change_required'
  ) then
    alter table public.staff_members
      add column password_change_required boolean not null default false;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'staff_members' and column_name = 'temporary_password_issued_at'
  ) then
    alter table public.staff_members
      add column temporary_password_issued_at timestamptz;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'staff_members' and column_name = 'temporary_password_expires_at'
  ) then
    alter table public.staff_members
      add column temporary_password_expires_at timestamptz;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'staff_members' and column_name = 'password_changed_at'
  ) then
    alter table public.staff_members
      add column password_changed_at timestamptz;
  end if;
end $$;

-- Populate email for existing staff members from auth.users
update public.staff_members sm
set email = u.email
from auth.users u
where sm.user_id = u.id and sm.email is null;

-- Index for checking active or expired temporary credentials
create index if not exists staff_members_temp_pwd_idx
  on public.staff_members (password_change_required, temporary_password_expires_at)
  where password_change_required = true;
