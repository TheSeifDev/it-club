# Shared implementation contract

This document coordinates disjoint implementation ownership; `plan.md` and `TODO.md` remain approved requirements.

## Types — owned by CMS backend

`lib/site-content/types.ts` exports `ContentKind = 'member' | 'board' | 'track' | 'event' | 'sponsor' | 'announcement' | 'page'`, `ContentStatus = 'draft' | 'published' | 'archived'`.

`ContentData` has required `title: string` and optional `subtitle, summary, body, arabicTitle, image, href, committee, role, date, time, location, email, category` strings; optional `responsibilities: string[]`, `tags: string[]`, `links: {label: string; href: string}[]`, `alumni: boolean`.

`ContentEntry` has `id: string`, `kind: ContentKind`, `slug: string`, `status: ContentStatus`, `sort_order: number`, `featured: boolean`, `publish_at: string | null`, `unpublish_at: string | null`, `revision: number`, `data: ContentData`.

`PublicSiteContent` has `members, boards, tracks, events, sponsors, announcements, pages` each `ContentEntry[]`.

`lib/site-content/public.ts` exports server-side `getPublicSiteContent(): Promise<PublicSiteContent>`. Configured database reads are publication-snapshot-only, never editor drafts. Before DB setup, use truthful committed public seed of members/tracks and documented sponsors. Never fallback after database errors in a way that resurrects archived content. No invented campaigns or upcoming dates. Events with unverified historical/seasonal content stay draft.

## CMS API — owned by CMS backend

- `GET /api/site-admin/content?kind=member&limit=50&offset=0` -> `{ok:true, entries:ContentEntry[], total:number, configured:boolean}`. Without DB: return truthful seed for owner read-only with `configured:false`, no fake saves.
- `POST /api/site-admin/content` -> accepts `{kind, slug, sort_order, featured, publish_at, unpublish_at, data}`; creates draft. -> `{ok:true, entry:ContentEntry}`.
- `PATCH /api/site-admin/content/:id` -> accepts `{revision, slug?, sort_order?, featured?, publish_at?, unpublish_at?, data?, action?:'save'|'publish'|'archive'|'unpublish'}`; defaults save. Optimistic revision conflict 409. Saving draft of a published item must NOT change public content until explicit Publish. Publishing validates readiness and updates public snapshot. Archive/unpublish removes public snapshot visibility.
- `POST /api/site-admin/seed` -> imports vetted committed seed idempotently without overwriting editor changes. Owner only. Explicit user UI action, never automatic.
- `POST /api/site-admin/upload` -> multipart file; validates PNG/JPEG/WebP, size max 5 MiB, owner verified; returns `{ok:true,url:string}`. If storage not ready: 503 with no simulated success.
- `POST /api/site-contact` -> `{kind:'contact'|'partnership',name,email,subject,message,website?}`. Server validation, honeypot, rate-limit; real storage/email or honest unavailable response.

All CMS APIs owner only through DB-verified staff guard, no preview auth bypass, no default/demo owner. `configured:false` or 503 when missing secrets/schema; do not expose runtime details or sensitive records in public errors.

## Ownership

Routing/auth agent: move app/admin to app/interview, app/login alias + app/interview/login, lib/auth security, operations/API security, Supabase session helpers, proxy.ts, next.config.ts, invitation services/templates, related security migration/tests. Leave app/admin empty for CMS frontend agent. Preserve API namespace /api/admin.

CMS backend agent: lib/site-content/**, app/api/site-admin/**, app/api/site-contact/**, additive CMS migrations, content seed, CMS unit tests.

Public frontend agent: app/page.tsx and public about/community/tracks/events/sponsors/alumni/contact/privacy/terms pages and detail routes, src/components/site/**, app/globals.css, app/layout.tsx, public visual assets if required. Leave register/student/auth/interview/admin files to others.

CMS frontend agent: NEW app/admin/**, src/components/admin-content/**. Coordinate only through types/APIs above. No other app/admin legacy files may be changed until routing agent has moved them; write UI first under src/components/admin-content and create app/admin only after migration confirmation.

Parent: package manager/install, runtime config, route manifest, Dockerfile/health, integration fixes, safe checks, checkpoint, source diff delivery. Agents never commit, push, deploy or connect to production DB.
