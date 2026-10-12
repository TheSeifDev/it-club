-- IT Club recruitment applications.
-- Run through Supabase SQL Editor or Supabase CLI migration workflow.
-- This table contains sensitive student information. Do not expose it to client-side roles.

create extension if not exists pgcrypto;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  application_reference text not null unique,
  full_name text not null check (char_length(trim(full_name)) >= 3),
  national_id text not null check (national_id ~ '^[0-9]{14}$'),
  academic_id text not null,
  phone text not null,
  whatsapp text not null,
  university_email text not null,
  google_email text,
  academic_year text not null check (academic_year in ('first', 'second', 'third', 'fourth', 'other')),
  department text not null,
  experience_level text not null check (experience_level in ('new', 'beginner', 'computer_skills', 'experienced')),
  skills text,
  experience_details text,
  volunteer_experience text,
  primary_track text not null check (primary_track in ('hr', 'pr', 'sm', 'oc', 'it', 'rnd')),
  secondary_track text check (secondary_track is null or secondary_track in ('hr', 'pr', 'sm', 'oc', 'it', 'rnd')),
  motivation text not null,
  learning_goal text not null,
  contribution text,
  availability text,
  status text not null default 'PENDING_REVIEW'
    check (status in ('PENDING_REVIEW', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'ACCEPTED', 'REJECTED', 'WAITLISTED')),
  reviewer_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  consented_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_distinct_preferences check (
    secondary_track is null or secondary_track <> primary_track
  )
);

-- Duplicate prevention is enforced by PostgreSQL, not just by the browser.
create unique index if not exists applications_national_id_unique
  on public.applications (national_id);

create unique index if not exists applications_academic_id_unique
  on public.applications (lower(trim(academic_id)));

create unique index if not exists applications_university_email_unique
  on public.applications (lower(trim(university_email)));

create index if not exists applications_status_created_at_idx
  on public.applications (status, created_at desc);

create index if not exists applications_primary_track_idx
  on public.applications (primary_track);

create or replace function public.set_applications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
before update on public.applications
for each row execute function public.set_applications_updated_at();

alter table public.applications enable row level security;

-- The unauthenticated registration form writes through a server route using
-- SUPABASE_SERVICE_ROLE_KEY. Never expose that key to the browser.
revoke all on table public.applications from anon, authenticated;
grant all on table public.applications to service_role;

-- No public SELECT/UPDATE/DELETE policy is intentionally created.
-- Add staff-only policies after the staff role model is implemented and tested.
