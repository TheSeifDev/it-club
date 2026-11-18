-- Additive IT Club public-site CMS. This migration is intentionally not applied here.

create table if not exists public.site_content_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('member', 'board', 'track', 'event', 'sponsor', 'announcement', 'page')),
  slug text not null check (length(slug) between 1 and 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0 check (sort_order between 0 and 100000),
  featured boolean not null default false,
  publish_at timestamptz,
  unpublish_at timestamptz,
  revision integer not null default 1 check (revision > 0),
  draft_data jsonb not null check (jsonb_typeof(draft_data) = 'object' and jsonb_typeof(draft_data->'title') = 'string'),
  seed_key text unique,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_content_entries_window_check check (publish_at is null or unpublish_at is null or unpublish_at > publish_at),
  constraint site_content_entries_kind_slug_unique unique (kind, slug)
);

create index if not exists site_content_entries_kind_order_idx on public.site_content_entries (kind, sort_order, slug);
create index if not exists site_content_entries_status_idx on public.site_content_entries (status, kind);

-- This table is the only public read surface. It deliberately has no draft_data or editor metadata.
create table if not exists public.site_content_publications (
  entry_id uuid primary key references public.site_content_entries(id) on delete cascade,
  kind text not null check (kind in ('member', 'board', 'track', 'event', 'sponsor', 'announcement', 'page')),
  slug text not null,
  sort_order integer not null,
  featured boolean not null default false,
  publish_at timestamptz,
  unpublish_at timestamptz,
  revision integer not null,
  data jsonb not null check (jsonb_typeof(data) = 'object' and jsonb_typeof(data->'title') = 'string'),
  published_at timestamptz not null default now(),
  constraint site_content_publications_window_check check (publish_at is null or unpublish_at is null or unpublish_at > publish_at),
  constraint site_content_publications_kind_slug_unique unique (kind, slug)
);

create index if not exists site_content_publications_order_idx on public.site_content_publications (kind, sort_order, slug);

create table if not exists public.site_content_audit (
  id bigint generated always as identity primary key,
  entry_id uuid references public.site_content_entries(id) on delete set null,
  actor_id uuid,
  kind text,
  action text not null,
  from_revision integer,
  to_revision integer,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists site_content_audit_entry_created_idx on public.site_content_audit (entry_id, created_at desc);

create table if not exists public.site_inquiries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact', 'partnership')),
  name text not null check (length(name) between 1 and 120),
  email text not null check (length(email) between 3 and 254),
  subject text not null check (length(subject) between 1 and 180),
  message text not null check (length(message) between 1 and 5000),
  status text not null default 'new' check (status in ('new', 'reviewed', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.site_content_entries enable row level security;
alter table public.site_content_publications enable row level security;
alter table public.site_content_audit enable row level security;
alter table public.site_inquiries enable row level security;

revoke all on public.site_content_entries from public, anon, authenticated;
revoke all on public.site_content_publications from public, anon, authenticated;
revoke all on public.site_content_audit from public, anon, authenticated;
revoke all on public.site_inquiries from public, anon, authenticated;
grant all on public.site_content_entries to service_role;
grant all on public.site_content_publications to service_role;
grant all on public.site_content_audit to service_role;
grant all on public.site_inquiries to service_role;
grant usage, select on sequence public.site_content_audit_id_seq to service_role;

grant select (entry_id, kind, slug, sort_order, featured, publish_at, unpublish_at, revision, data)
  on public.site_content_publications to anon, authenticated;
create policy site_content_publications_visible_select
  on public.site_content_publications for select to anon, authenticated
  using ((publish_at is null or publish_at <= now()) and (unpublish_at is null or unpublish_at > now()));

create or replace function public.site_content_create_entry(
  p_kind text,
  p_slug text,
  p_sort_order integer,
  p_featured boolean,
  p_publish_at timestamptz,
  p_unpublish_at timestamptz,
  p_data jsonb,
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entry public.site_content_entries;
begin
  insert into public.site_content_entries (
    kind, slug, status, sort_order, featured, publish_at, unpublish_at,
    revision, draft_data, created_by, updated_by
  ) values (
    p_kind, p_slug, 'draft', p_sort_order, p_featured, p_publish_at, p_unpublish_at,
    1, p_data, p_user_id, p_user_id
  ) returning * into v_entry;

  insert into public.site_content_audit (entry_id, actor_id, kind, action, from_revision, to_revision, details)
  values (v_entry.id, p_user_id, v_entry.kind, 'create', null, v_entry.revision, jsonb_build_object('slug', v_entry.slug));
  return to_jsonb(v_entry);
end;
$$;

create or replace function public.site_content_update_entry(
  p_id uuid,
  p_revision integer,
  p_action text,
  p_patch jsonb,
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entry public.site_content_entries;
begin
  if p_action not in ('save', 'publish', 'archive', 'unpublish', 'restore') then
    raise exception 'invalid site content action' using errcode = '22023';
  end if;
  if jsonb_typeof(p_patch) <> 'object' then
    raise exception 'invalid site content patch' using errcode = '22023';
  end if;

  update public.site_content_entries as current_entry
  set slug = case when p_patch ? 'slug' then p_patch->>'slug' else current_entry.slug end,
      sort_order = case when p_patch ? 'sort_order' then (p_patch->>'sort_order')::integer else current_entry.sort_order end,
      featured = case when p_patch ? 'featured' then (p_patch->>'featured')::boolean else current_entry.featured end,
      publish_at = case when p_patch ? 'publish_at' then nullif(p_patch->>'publish_at', '')::timestamptz else current_entry.publish_at end,
      unpublish_at = case when p_patch ? 'unpublish_at' then nullif(p_patch->>'unpublish_at', '')::timestamptz else current_entry.unpublish_at end,
      draft_data = case when p_patch ? 'data' then p_patch->'data' else current_entry.draft_data end,
      status = case p_action when 'publish' then 'published' when 'archive' then 'archived' when 'unpublish' then 'draft' when 'restore' then 'draft' else current_entry.status end,
      revision = current_entry.revision + 1,
      updated_by = p_user_id,
      updated_at = clock_timestamp()
  where current_entry.id = p_id and current_entry.revision = p_revision
  returning current_entry.* into v_entry;

  if not found then
    return jsonb_build_object('conflict', true);
  end if;

  if p_action = 'publish' then
    insert into public.site_content_publications (
      entry_id, kind, slug, sort_order, featured, publish_at, unpublish_at, revision, data, published_at
    ) values (
      v_entry.id, v_entry.kind, v_entry.slug, v_entry.sort_order, v_entry.featured,
      v_entry.publish_at, v_entry.unpublish_at, v_entry.revision, v_entry.draft_data, clock_timestamp()
    ) on conflict (entry_id) do update set
      kind = excluded.kind,
      slug = excluded.slug,
      sort_order = excluded.sort_order,
      featured = excluded.featured,
      publish_at = excluded.publish_at,
      unpublish_at = excluded.unpublish_at,
      revision = excluded.revision,
      data = excluded.data,
      published_at = excluded.published_at;
  elsif p_action in ('archive', 'unpublish') then
    delete from public.site_content_publications where entry_id = v_entry.id;
  end if;

  insert into public.site_content_audit (entry_id, actor_id, kind, action, from_revision, to_revision, details)
  values (v_entry.id, p_user_id, v_entry.kind, p_action, p_revision, v_entry.revision, jsonb_build_object('slug', v_entry.slug));
  return to_jsonb(v_entry);
end;
$$;

create or replace function public.site_content_seed_import(p_entries jsonb, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seed jsonb;
  v_entry public.site_content_entries;
  v_inserted integer := 0;
  v_skipped integer := 0;
  v_status text;
begin
  if jsonb_typeof(p_entries) <> 'array' then
    raise exception 'invalid site content seed input' using errcode = '22023';
  end if;

  for v_seed in select value from jsonb_array_elements(p_entries) as item(value) loop
    v_status := v_seed->>'status';
    if v_status not in ('draft', 'published', 'archived') then
      raise exception 'invalid seed status' using errcode = '22023';
    end if;
    insert into public.site_content_entries (
      id, kind, slug, status, sort_order, featured, publish_at, unpublish_at,
      revision, draft_data, seed_key, created_by, updated_by
    ) values (
      (v_seed->>'id')::uuid,
      v_seed->>'kind',
      v_seed->>'slug',
      v_status,
      (v_seed->>'sort_order')::integer,
      (v_seed->>'featured')::boolean,
      nullif(v_seed->>'publish_at', '')::timestamptz,
      nullif(v_seed->>'unpublish_at', '')::timestamptz,
      (v_seed->>'revision')::integer,
      v_seed->'data',
      v_seed->>'seed_key',
      p_user_id,
      p_user_id
    ) on conflict do nothing returning * into v_entry;

    if not found then
      v_skipped := v_skipped + 1;
      continue;
    end if;
    v_inserted := v_inserted + 1;
    if v_entry.status = 'published' then
      insert into public.site_content_publications (
        entry_id, kind, slug, sort_order, featured, publish_at, unpublish_at, revision, data
      ) values (
        v_entry.id, v_entry.kind, v_entry.slug, v_entry.sort_order, v_entry.featured,
        v_entry.publish_at, v_entry.unpublish_at, v_entry.revision, v_entry.draft_data
      );
    end if;
    insert into public.site_content_audit (entry_id, actor_id, kind, action, from_revision, to_revision, details)
    values (v_entry.id, p_user_id, v_entry.kind, 'seed_import', null, v_entry.revision, jsonb_build_object('seed_key', v_seed->>'seed_key'));
  end loop;

  return jsonb_build_object('inserted', v_inserted, 'skipped', v_skipped);
end;
$$;

revoke all on function public.site_content_create_entry(text, text, integer, boolean, timestamptz, timestamptz, jsonb, uuid) from public, anon, authenticated;
revoke all on function public.site_content_update_entry(uuid, integer, text, jsonb, uuid) from public, anon, authenticated;
revoke all on function public.site_content_seed_import(jsonb, uuid) from public, anon, authenticated;
grant execute on function public.site_content_create_entry(text, text, integer, boolean, timestamptz, timestamptz, jsonb, uuid) to service_role;
grant execute on function public.site_content_update_entry(uuid, integer, text, jsonb, uuid) to service_role;
grant execute on function public.site_content_seed_import(jsonb, uuid) to service_role;

-- Supabase Storage is optional on some deployments. If present, create the media bucket and
-- allow public reads only; browser uploads require an authenticated owner but this app uploads
-- through the owner-verified server endpoint with service_role credentials.
do $$
begin
  if to_regclass('storage.buckets') is not null and to_regclass('storage.objects') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('site-media', 'site-media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
    on conflict (id) do update set public = true, file_size_limit = 5242880,
      allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

    execute 'drop policy if exists site_media_public_read on storage.objects';
    execute 'create policy site_media_public_read on storage.objects for select to anon, authenticated using (bucket_id = ''site-media'')';
    execute 'drop policy if exists site_media_owner_insert on storage.objects';
    execute 'create policy site_media_owner_insert on storage.objects for insert to authenticated with check (bucket_id = ''site-media'' and exists (select 1 from public.staff_members where staff_members.user_id = (select auth.uid()) and staff_members.role = ''owner'' and staff_members.password_change_required = false))';
    execute 'drop policy if exists site_media_owner_update on storage.objects';
    execute 'create policy site_media_owner_update on storage.objects for update to authenticated using (bucket_id = ''site-media'' and exists (select 1 from public.staff_members where staff_members.user_id = (select auth.uid()) and staff_members.role = ''owner'' and staff_members.password_change_required = false)) with check (bucket_id = ''site-media'' and exists (select 1 from public.staff_members where staff_members.user_id = (select auth.uid()) and staff_members.role = ''owner'' and staff_members.password_change_required = false))';
    execute 'drop policy if exists site_media_owner_delete on storage.objects';
    execute 'create policy site_media_owner_delete on storage.objects for delete to authenticated using (bucket_id = ''site-media'' and exists (select 1 from public.staff_members where staff_members.user_id = (select auth.uid()) and staff_members.role = ''owner'' and staff_members.password_change_required = false))';
  end if;
end $$;
