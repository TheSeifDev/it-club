-- ============================================================================
-- Migration: 202610130010_student_password_lifecycle.sql
-- Description: Password lifecycle state for direct student provisioning and 24-hr temp password enforcement
-- 1. Add password lifecycle tracking columns to public.student_accounts
-- 2. Index for checking active or expired temporary credentials
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'student_accounts' and column_name = 'password_change_required'
  ) then
    alter table public.student_accounts
      add column password_change_required boolean not null default false;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'student_accounts' and column_name = 'temp_password_issued_at'
  ) then
    alter table public.student_accounts
      add column temp_password_issued_at timestamptz;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'student_accounts' and column_name = 'temp_password_expires_at'
  ) then
    alter table public.student_accounts
      add column temp_password_expires_at timestamptz;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'student_accounts' and column_name = 'password_changed_at'
  ) then
    alter table public.student_accounts
      add column password_changed_at timestamptz;
  end if;
end $$;

-- Index for checking active or expired temporary credentials
create index if not exists student_accounts_temp_pwd_idx
  on public.student_accounts (password_change_required, temp_password_expires_at)
  where password_change_required = true;
