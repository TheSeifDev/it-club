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

## Follow-up dark-glass and scroll-motion verification — 27 November 2026

The latest visual instruction replaces the light editorial palette for the public site with scoped dark glass. The first live inspection found an About defect: every word's computed `--word-fill` stayed at `100%` at the top even after `gsap.set(..., 0%)`; screenshots alone could not prove the motion. About word tweens now state both endpoints explicitly with `fromTo`, while the stylesheet retains its `100%` baseline for no-JS and reduced-motion. Filtering whitespace split tokens also removes an empty word span without removing the readable SSR sentence.

### Direct Preview measurements

- On the live Preview at `1280×1100`, About contains 38 nonempty word spans and 3 inline chips. At `scrollY=0`, all 38 words measured `0%` fill and all chips `opacity:0`; this confirms the gray starting state rather than the former all-white baseline bug.
- At `scrollY=950`, five words were fully filled, two were between 0–100%, and the code chip was visible. At `scrollY=1155`, thirteen words were filled, the next was partially filled, and code plus BATU were visible. At `scrollY=1450`, 24 were filled, one was in progress, and all three chips were visible.
- At `scrollY=1900`, all 38 words measured `100%`. Scrolling back to `1155` returned the later words to gray and hid the book chip; returning to `0` restored all 38 to `0%` and hid all three chips. The About pin held at viewport top `106px` while active. This is direct runtime progress/reversal evidence, not an entrance-frozen screenshot.
- SSR visible page text remains present before client motion; CSS initializes words at `100%` and chips have visible defaults, so no-JS/reduced-motion retain content. Reduced-motion was source-checked, not toggled in this browser session.
- Hero video remained muted, readyState `4`, and playing before navigation; no forms were submitted.

### Contrast and responsive notes

Track identifiers, category labels, profile links/icons, and Tracks scene labels on translucent dark surfaces now use the bright per-track hue; the dark `--track-ink` remains where text sits on a filled filter/button background. Track hues themselves are unchanged. Desktop screenshot review of Partners, Alumni, Contact, and Register found the expected full-width night canvas and readable editorial hierarchy; their no-data states remain honest rather than fabricated. Fresh mobile captures at `390×844` show current Home, Community, Tracks, and Register layouts.

- A live `390×844` same-origin mobile viewport had the pin eligibility query `false`, document horizontal overflow `0`, and no out-of-viewport About word spans. At the settled middle sample, 18 words were filled, 19 gray and one partial with code/BATU visible; at the settled end all 38 words were filled and all three chips visible; reversing returned the middle state, then `scrollY=0` restored 38 gray words and hid all chips.
- The desktop Tracks `h1` at `scrollY=0` measured `top=221`, `bottom=581`, `height=360`, `overflow:visible`, `clip-path:none`, `opacity:1`, and `transform:none`; the former partial appearance was a screenshot-frozen animation artifact, not text clipped by the page. Direct `#hr`, `#it`, `#rnd`, and return-to-`#hr` navigation placed each panel at approximately `72–96px` below the header. Horizontal overflow remained `0` (the tool's `-10` value is extra layout width unavailable, i.e. no positive overflow).
- Home interaction test: the muted MP4 changed from playing to paused with the button relabeled “Play background video”, then resumed and relabeled “Pause background video”. The track carousel changed Human Resources → Public Relations → Human Resources using Next/Previous. No form was submitted.

### Final commands

After the explicit word endpoints and track-label contrast edits, `npx tsc --noEmit` passed; `npm run lint` had 0 errors and the same existing `app.config.ts` anonymous-export warning; `npm run test:pure` passed 29/29 (with existing Node module-type performance notices); `npm run build` succeeded with Next.js 16.3.8; and `git diff --check` passed. Preview HTTP returned 200 for `/`, `/register`, `/community`, `/tracks`, `/events`, `/sponsors`, `/alumni`, `/contact`, `/privacy`, `/terms`, and `/manus-routes.json`. No API POST, database operation, or form submission was performed. Reduced-motion behavior was source-checked, not toggled in the live browser.

## Tailwind / performance / media — 27 November 2026

Before the latest motion changes, a controlled 2.2-second rAF-driven scroll on Preview at `1280×1100` recorded 131 samples, mean interval16.93ms, p95 16.90ms, one interval above33.4ms and no observed main-thread Long Tasks. This development/cloud-browser sample did not reproduce severe lag and is not a GPU paint/compositor profile or an FPS guarantee. Source inspection found scroll-time chip blur, reveal clip-path and large overlapping backdrop-filter surfaces; these are targeted for removal/reduction without changing About's requested word-gradient fill or reverse timeline.

For future16-second media, native MP4/WebM is the default for time-based autoplay/loop. Image sequences can be appropriate for exact scroll-linked frame selection, with decoded-image memory and request/loading costs. `64 / 16 = 4` frames per second only if64 images are played uniformly over16seconds; this is not the frame rate of a scroll-driven sequence. No future media is generated in this update.

Sources read: [web.dev — Video performance](https://web.dev/learn/performance/video-performance), supporting native video efficiency for animated playback; [web.dev — High-performance CSS animations](https://web.dev/articles/animations-guide), supporting transform/opacity and limited will-change rather than paint/layout-heavy animation. Lossless optimization means unchanged decoded pixels/frames, not a visually acceptable lossy quality setting.

### After motion-property reduction

After removing chip `filter:blur()` and Home reveal `clip-path` tweens, the same 2.2-second Preview scroll probe recorded 129 samples, mean interval17.20ms, p95 16.90ms, three intervals above33.4ms, and no observed Long Tasks. Relative to the prior sample (131,16.93ms, p95 16.90ms, one interval above33.4ms, no Long Tasks), this repeat does **not** establish a measurable frame-time improvement; those frame-gap outliers are affected by cloud-browser scheduling and aren't a controlled GPU trace. The code change does remove the identified filter/clip animations and large moving glass blur, but device-level smoothness remains unverified. After the Home utility migration, a live mobile DOM check at390×844 found the three-line hero title ends at802px inside the844px hero, no horizontal overflow, and all lines at opacity1/identity transform after entrance.

Post-change functional spot checks confirmed the Hero play/pause button pauses then resumes the video. The About DOM retained38 word spans and3 chips. The first word had begun reversing from100% after scrolling back but was still44% at a250ms sample during scrub catch-up; this is not recorded as a fully completed reverse test in the current round.

### Third repeat after transform/opacity-only reveal edits

The same2.2-second Preview `requestAnimationFrame` probe recorded131 samples, mean16.80ms, p95 16.90ms, zero gaps above33.4ms, zero above50ms, and no Long Tasks. Across the three latest comparisons, slow-gap counts varied between1,3,0 while p95 remained16.90ms; therefore this sample alone cannot prove a causal or device-general smoothness improvement. The persistent implementation changes avoid the identified `filter:blur()`/`clip-path` reveals and large moving glass blur, leaving the existing GSAP composition intact.

### Lossless media and final command checks

`docs/media-optimization.json` records82 PNG/WebP/MP4 candidates:22 smaller encodings were adopted only after pixel/frame equality checks, saving147,268 bytes total;60 candidates remained unchanged, and there were zero optimizer errors. The22 replaced originals are backed up outside the project under `/home/ubuntu/itclub-media-originals-20261127`. The current Hero MP4 was not re-encoded or modified. Two unreferenced legacy JPEGs (`spotlight-stage.jpg`, `images/auth-building-night.jpg`) and the small ICO favicon remained byte-for-byte unchanged because no pixel-safe JPEG optimizer is installed; no lossy fallback was used.

After the public UI edits and CSS utility correction, `npx tsc --noEmit`, `npm run lint` (zero errors; existing advisory `app.config.ts` warning), `npm run test:pure` (29/29), `npm run build` (Next.js16.3.8), and `git diff --check` passed. The utility-map issue `overflow-wrap-anywhere` was corrected to `[overflow-wrap:anywhere]` before this build.

## About inline gaps opening on scroll — 27 November 2026

The user's clarification is that the paragraph should not be vertically compressed as a whole: only the spaces occupied by inline chips should disappear at the closed start, with text closing over those places; scrolling then opens each gap as its chip emerges. The GSAP sequence now measures four one-time, hidden-clone layouts (all chips collapsed, then each chip opened in reading order). Word transforms interpolate between those layouts alongside their chip entrances; the existing color fill remains independent. The icon tile, inline chips and footer seal use CSS perspective with GSAP rotationX/rotationY/Z. No new library or WebGL scene was added. A `ResizeObserver` re-runs the matchMedia context after the heading's rendered width changes, so the measured line wrapping is refreshed on responsive resize. Per-scroll animation uses transforms/opacity rather than width or other layout properties.

### Direct Preview state measurements

- Desktop `1280×1100`: at the closed state (`scrollY=771`, three pixels before the trigger) all38 words measured `0%`, all3 chips were `opacity:0`, and the tile/seal were hidden. At `scrollY=1331`, 20 words were filled and18 were gray; chips1–2 were visible and chip3 was `opacity≈0.627`. At `scrollY=1790`, all38 words measured `100%` and all3 chips plus the seal were visible. Reversing to771 restored all38 words to0% and all chips/tile/seal to hidden.
- Mobile `390×844`, tested in a same-origin iframe: the desktop pin query remained `false`. At `scrollY=293`, all38 words were0% and all3 chips hidden; at489, 20 were filled and18 gray with the first two chips visible; at651 all38 were filled and all chips/seal visible. Reversing to293 restored the closed state.
- At all measured states, word boxes stayed within the viewport, document width did not exceed the viewport (`scrollWidth-innerWidth=-10`), and the tile/chips/seal computed 3D transforms included `matrix3d`. Reduced-motion/SSR remains source-checked rather than emulated live: CSS keeps the content and chips visible by default; the scrub setup runs only for `prefers-reduced-motion: no-preference`.
- A live iframe resize from390px to800px changed the heading content width from340px to662px and updated the closed word offset; returning to390px restored the original measured transform exactly. This verifies width-triggered remeasurement rather than reusing stale offsets.

After these changes, `npx tsc --noEmit`, focused ESLint, 29/29 pure tests, production build and `git diff --check` passed. Existing `app.config.ts` anonymous-export ESLint warning remains unchanged. No Admin/Interview/Student/Auth/API/data files, database, or production deployment were changed.

## About tile removal and public motion pass — 27 November 2026

The floating square CPU tile has been removed from the About markup and its GSAP 3D tween, while the inline Code/BATU/Book chips, FLIP word gaps, word-color fill, reversible scrub, and 3D footer seal remain. The statement's top padding was reduced so removing the tile does not leave an empty slot. The chips now use static layered dark/teal gradients, a restrained rim, inset highlight, and soft shadow; they do not add backdrop blur or a scroll-time filter.

The read-only route audit found two small redundant work sources: nested `data-line-heading` elements could receive a second scrubbed trigger inside an already-revealed parent, and the Tracks progress indicator rewrote `aria-valuenow` on every timeline update. Nested heading triggers are now suppressed when a parent reveal already covers them, and the accessibility value is written only when the rounded percentage changes. The visual progress `scaleX` and About's per-word gradient fill are retained; the latter remains paint-bound by design to preserve the explicit requested ink-fill effect. These code-level reductions are not a GPU trace and do not establish universal smoothness on other devices.


### Live verification after removal and motion review — 27 November 2026

- Desktop Preview `1280×1100`: About closed at `scrollY=771` with first/last word fill `0%`, all three chips and the seal at opacity `0`, no CPU tile, and `scrollWidth-innerWidth=-10`. At `1300`, the first two chips were visible while later copy remained unfilled; at `1798`, all words/chips/seal were visible; returning to `771` restored the closed state.
- Mobile Preview `390×844`: at `scrollY=261`, the first word was `0%` and all chips hidden; at `422`, the first two were visible; at `630`, all were visible; returning to `261` restored the closed state. No CPU tile or horizontal overflow appeared (`scrollWidth-innerWidth=-10`). The compact icon chips measured about `51px` wide when open.
- Tracks Preview `1280×1100`: the live six-panel stack remained pinned and reached `aria-valuenow=100`; the observer saw84 distinct `aria-valuenow` mutations (no repeated same-value writes), and the 2.1-second scroll probe recorded125 rAF intervals, mean16.94ms, p95 16.90ms, one interval above33.4ms, and no newly recorded Long Tasks.
- Home Preview `1280×1100`: a fresh 2.2-second scroll probe recorded120 intervals, mean18.34ms, p95 33.60ms,10 intervals above33.4ms, one above50ms, and no newly recorded Long Tasks. This differs from earlier probes and cannot establish a causal improvement or a device-general guarantee; the per-word gradient fill remains a deliberate paint-bound effect to preserve the requested visual behavior. The site smoothness item remains open in `TODO.md` pending a more representative device-level trace.
- Final checks: `npx tsc --noEmit` passed; `npm run lint` had0 errors and the existing `app.config.ts` anonymous-export warning; `npm run test:pure` passed29/29; `npm run build` succeeded on Next.js16.3.8; `git diff --check` passed. Webdev config confirms `auto_publish:false`; no production publish was requested or performed.

## About row-lock and slower scrub — 27 November 2026

The clean-reload geometry test exposed a real issue in the previous horizontal-offset calculation: collapsed-clone line wrapping could move a later row's X back to the start of an earlier row. Since vertical offsets were intentionally removed to stop text dropping, that could place words from separate clone rows over one another. The layout helper now measures natural fully-open word rows, inserts temporary `<br>` boundaries in the hidden measurement clone only, then measures every collapsed/open chip state within those same row boundaries. The visible statement has no added row breaks; words receive horizontal transforms only.

- Desktop Preview `1280×1100`: 5 natural rows remained the same at closed `scrollY=771`, middle `1467`, near-end `2299`, and reverse `771`. Same-row comparisons found zero overlaps/reordering in all states; all word Y transforms were `0px`; fill/capsule states progressed from `0%`/hidden to visible and returned to `0%`/hidden. `scrollWidth-innerWidth=-10`.
- Mobile Preview `390×844`: 10 natural rows stayed fixed at closed `261`, middle `597`, near-end `992`, and reverse `261`. Same-row comparisons found zero overlaps/reordering in all states; word Y transforms stayed `0px`; all three chips were visible near the end and hidden again on reverse. `scrollWidth-innerWidth=-10`.
- Desktop scroll range is now1540px (`1.4 × 1100`) with `scrub:0.85`, compared with the prior approximately1012px (`0.92 × 1100`) and `scrub:0.55`; the compact range measures740px. This verifies the targeted slower/reversible About motion, not a general FPS improvement. The broader site-smoothness TODO remains open because existing preview timing samples vary and are not representative device traces.
