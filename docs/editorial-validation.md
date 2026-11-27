# Editorial redesign validation — 27 Nov 2026

**Scope:** Read-only source trace against `docs/editorial-reference.md` and the final 27-Nov sections of `plan.md` / `TODO.md`. No source changes, browser run, integration/database/auth test, or duplicate TypeScript/lint/pure-test run. The observations below are confirmed from code; the preview-seed finding is conditional on the documented no-Supabase fallback being active.

## Confirmed blockers

1. **Events list and detail bypass the shared public shell.** `app/events/page.tsx:58` and `app/events/[slug]/page.tsx:90` return their own `.canvas` directly instead of using `SiteFrame`. Consequently these routes omit the common `SiteHeader`, `SiteFooter`, skip link, `site-root` theme/motion scope, and SiteFrame’s main landmark; the list’s local CTA footer (`app/events/page.tsx:215`) is not the site footer. This breaks the requirement that Events and event details use the shared public identity/navigation. **Smallest fix:** wrap each route’s canvas in `SiteFrame` (imported from `src/components/site/SiteUI`).

2. **The committed preview fallback promotes member rows that its own seed policy says must remain drafts.** `lib/site-content/seed.ts:45-74` creates member records with only a generated `Committee mission: …` summary and explicitly assigns draft status pending an actual individual responsibility. Yet `seed.ts:157-163` copies nearly all such records into `previewMemberSeeds` with status `published`; `lib/site-content/public.ts:15-19` selects that fallback whenever Supabase URL/key are absent. `content-utils.ts:53-70` then accepts the generic summary as sufficient scope, making the people appear on Home/Community/profile (and Alumni where applicable). The rendered text is labeled as team scope/focus, not an invented personal task, but the publish gate still contradicts the stated owner-approval/draft rule. **Smallest fix:** do not feed these rows to public reads as published; keep them draft/omit them until an owner publishes an approved individual duty or approved track remit. Do not replace the summary with invented text.

## Other confirmed issues

3. **Home carousel omits the remaining tracks from server-rendered/no-JS markup.** `src/components/site/EditorialHome.tsx:38` constructs at most three entries, and `:70-78` renders only those two adjacent cards plus the featured card. The other published tracks exist only after client state advances; the controls are React handlers. This conflicts with the final requirement that all published track data remain in the DOM/readable without JS, even though the interactive carousel can reach each track when hydrated. **Smallest fix:** provide a no-JS/static list of all published track links (or render every track in the DOM and progressively enhance the carousel).

4. **Community nests a `<main>` inside SiteFrame’s `<main>`.** `src/components/site/SiteUI.tsx:17-29` owns the main landmark; `app/community/page.tsx:62-64` adds another. Nested main landmarks are invalid and can confuse assistive navigation. **Smallest fix:** change the inner wrapper to a `div` or `section` (preserve its class).

5. **Hero video toggle state is misreported to assistive technology, and a live reduced-motion change does not stop a manually started film.** `src/components/site/HeroVideo.tsx:80-81` exposes `aria-pressed={!playing}` although the “Pause background video” state is the active/pressed state; set it to `playing` or omit `aria-pressed` for the changing-label button. At `:21-27`, `manuallyStarted.current` overrides `motion.matches`; therefore if the OS preference changes to reduced motion during manual playback, the `change` listener (`:35-36`) calls `synchronize` but playback continues. **Smallest fix:** on a transition to reduced motion, clear the manual-start override and pause (while retaining explicit play behavior if that is the intended opt-in policy).

## Checks that passed by source trace

- Public CMS reads use published/visibility filtering (`lib/site-content/public.ts:28-56`; `content-utils.ts:35-50`). Event seed records are explicitly draft (`lib/site-content/seed.ts:124-141`), and the Home/Events routes classify dated upcoming/archive/undated content rather than inventing dates (`content-utils.ts:112-145`; `app/page.tsx:55-63`; `app/events/page.tsx:52-56`).
- Profile links from Home/Community/Alumni resolve through `/community/[slug]`, which looks up published members and alumni (`app/community/[slug]/page.tsx:17-24`). Event links target the published event detail route. Community filters/search and its profile cards are wired to the published member list.
- No unintended non-brand photos were found in the current rendered public routes: Home uses the actual video asset/poster, the logo remains the brand asset, and other media slots are Lucide/icon surfaces. Older photo-oriented components found by search are not imported by the current routes; the custom page currently renders an icon, not its CMS image.
- No confirmed global CSS cascade/root-width defect: `public-design.css` overrides the legacy `.site-root` tokens; `public-layout.css` and later `public-editorial.css` reset `.site-container` to the shared fluid gutter with `max-width:none`. The Home modules use that token, feature-route modules use fluid gutters, and their local class names avoid the legacy `.site-*` selectors. Interview/Admin/Student files were not modified in this change set; public styles are scoped to `.site-root`.
- No Home old/new GSAP double-init found: `motion/scenes.ts:524-535` selects the editorial Home setup instead of legacy Home scenes when `[data-editorial-home]` exists. Tracks uses the shared stack engine with its distinct `[data-exhibition-stack]` selector (`TracksExperienceMotion.tsx:111-115`), while the general setup defaults to `[data-track-stack]`.

**Validation limitation:** source-only review; no browser/visual measurement. The parent is running the global TypeScript/lint/pure-test checks separately.

## Resolution and final parent checks

All five findings above were addressed before the final build:

1. Events list and detail now use `SiteFrame`, including the common header, footer, skip link, and theme/motion scope.
2. Preview fallback no longer promotes draft member records. Members remain private until approved responsibilities are published; the updated public-content/seed tests pass. Empty people sections honestly state that the published directory is being prepared rather than inventing profiles.
3. Home includes an SSR-rendered index linking all six published tracks, in addition to the interactive featured/adjacent cards.
4. Community's inner wrapper is a `div`; `SiteFrame` owns the single main landmark.
5. Hero uses a changing-label play/pause button without misleading `aria-pressed`. A switch to reduced motion clears the manual override and stops playback. Intersection/visibility cleanup remains in place.

### Layout and public pages

- Mobile captures at 390×844 confirmed that Events, Partners, and Alumni section markers are below the fixed header after increasing their top offsets. Community, Contact, Tracks, Privacy, Terms, and Register were also checked for their affected top-of-page layout; no header/title overlap or horizontal clipping was visible.
- The updated Home mobile capture shows all three headline lines over the real video/poster, the Meet us CTA, and video control. The normal Preview browser also showed the completed desktop entrance with the video running. Screenshot-tool captures freeze entrance animation at its final state and are not evidence of live frame timing or FPS.
- `/register` now uses `SiteFrame` and the light editorial system. October 2026/interview-season statements were removed; future interview details are stated neutrally. The registration subagent compared the initial state, validation, navigation, submission handler, `/api/register` payload, duplicate-submission guard, and email flow with HEAD and confirmed they were unchanged. No test application was submitted.
- All non-Hero rendered media remain icons on gray surfaces; the actual club logo is retained. The current public CSS is fluid/full-width and scoped to `.site-root`. A Git path check found no modifications under Admin, Interview, Student, API, Auth, or Supabase migration directories in this redesign batch.

### Final command evidence

On 27 November 2026, after the registration and mobile-spacing edits:

- `npx tsc --noEmit`: passed.
- `npm run lint`: passed with no errors; the existing anonymous default export of the literal logo config produces one advisory warning.
- `npm run test:pure`: 29 passed, 0 failed. Node reports existing module-type performance notices; no module-system change was made for unrelated tests.
- `npm run build`: passed, including compilation, TypeScript, route collection, and static generation.
- `git diff --check`: passed.
- Preview HTTP checks returned 200 for Home, Register, Events, Partners, Alumni, Community, Contact, Tracks, `/media/club-hero.mp4`, and `/manus-routes.json`. The MP4 is served as `video/mp4` and is 402,977 bytes; the route manifest is JSON with 29 declared page routes. Home HTML includes meaningful headline content and public links before client JavaScript.
- Browser DOM inspection after the entrance reported all three Hero lines at opacity 1 with identity transforms, a running video (`readyState: 4`, `paused: false`), and no horizontal overflow at 1280×1100.
- The active Webdev project uses Manus-managed Git, with `publishing.auto_publish: false`. The validated frontend code was saved as Preview checkpoint `1eef1bb`; subsequent handoff-document updates do not change application code. The same redesign files are synchronized only to the existing GitHub work branch `refactor/club-main-site-20261118`, never GitHub `main`. The patch applies cleanly to its original worktree, preserving previous commits and the user's separate main history. No publish command, database mutation, migration, or authentication-flow test was performed.

**Remaining launch dependencies:** approved individual member duties/content and isolated Supabase/RLS/CRUD/account integration checks remain open in the earlier handoff. These are not filled with invented content or claimed complete by the frontend redesign.
