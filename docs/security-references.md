# Security references used for the IT Club redesign

This note records the external security guidance applied to the CMS and staff-data policy changes. It is not a substitute for reviewing the exact deployed schema and policies in the selected development project.

## Supabase Row Level Security

Source: [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

- RLS controls which rows can be accessed; SQL privileges still determine whether a role may reach a table or operation at all. Both grants/revokes and policies must be reviewed together.
- Policies in the same permissive policy set can combine as OR, so a new restricted policy does not narrow access if an older broad policy remains. Replace the exact historical policy rather than merely adding another one.
- A server `service_role` credential bypasses RLS and must remain server-only. Owner APIs still verify the application session and owner record before using it.
- Public website reads are limited to the CMS publication snapshot; drafts and archived editor rows remain inaccessible to anonymous clients.

## Supabase project changes

Source: [Supabase Changelog](https://supabase.com/changelog.md) (reviewed during implementation)

- New CMS tables are introduced additively and use explicit access grants/policies; no migration was applied during this implementation.
- Staff-table RLS changes are isolated in a separate migration and preserve the existing registration API's anon INSERT path while denying anon reads/updates/deletes.
- Apply and exercise migrations only on an isolated development project before considering any production migration. The test runner blocks outbound HTTP by default; Supabase integration testing requires an explicit opt-in and separate development credentials.
