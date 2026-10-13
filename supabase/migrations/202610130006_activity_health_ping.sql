-- ============================================================================
-- Migration: 202610130006_activity_health_ping.sql
-- Description: External Activity Health Check (Inactivity Pause Mitigation)
-- 
-- 1. Create public.health_ping() returning fixed jsonb: {"ok": true}
-- 2. Pure read-only, zero-storage function (0 INSERT, 0 UPDATE, 0 DELETE, 0 DDL)
-- 3. Reads 0 application, student, staff, audit, or notification records
-- 4. Creates no heartbeat tables or event rows
-- 5. Marked IMMUTABLE with SECURITY INVOKER and empty search_path
-- 6. Revoke broad PUBLIC execution and grant explicitly to API roles (anon, authenticated, service_role)
-- ============================================================================

create or replace function public.health_ping()
returns jsonb
language sql
immutable
security invoker
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object('ok', true);
$$;

comment on function public.health_ping() is
  'Lightweight read-only health check function intended for external activity verification to reduce inactivity pause risk without storing state or reading application records.';

-- Revoke default public execution privileges
revoke all on function public.health_ping() from public;

-- Grant execution to API roles for public health verification
grant execute on function public.health_ping() to anon, authenticated, service_role;
