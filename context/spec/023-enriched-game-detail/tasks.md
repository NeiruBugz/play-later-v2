# Tasks — 023 Enriched Game Detail Page

- **Functional Specification:** [`./functional-spec.md`](./functional-spec.md)
- **Technical Considerations:** [`./technical-considerations.md`](./technical-considerations.md)

---

## Methodology (binding)

- Each slice leaves the app in a **runnable, working state**. Verify before checking off.
- Slices with testable TypeScript follow the **TDD policy** (RED tests authored failing first, then GREEN implementation, then refactor) — see `savepoint-tanstack/CLAUDE.md` → TDD policy.
- UI-only changes (layout/visual) gate on a **Chrome-MCP visual pass in both Light and Dark** (desktop + mobile) against the handoff bundle (`Game Detail - Enriched.html` / `FF7 Dashboard - Prototype.html` / `Game Detail - Empty State (spec).html`).
- Component/route tests follow the elements / actions / given-when-then shape and assert **user-observable behavior**, not call-envelope shape (see `.claude/rules/tanstack/testing.md`).
- Respect FSD boundaries + the C2 DAL rules; mind FOOT-GUNS #1 (`.server.ts`), #2 (loader hover-preload), #8 (worker-split). No new `AppError` subclasses.
- Commands: `pnpm --filter savepoint-tanstack {dev,typecheck,lint,format:check,test:unit,test:integration,build}`.
- **No database migration** in this spec — every field already exists.
- E2E deferred (consistent with project posture); per-slice verification is unit + integration + the visual gate.

---

## Slice 1 — Enrich the read aggregate

_Delivers the data for FR 2.3 (Your Record) and FR 2.4 (Times to Beat / Your Pace); fixes the capped-at-3 sessions-count bug._

- [x] RED: integration tests for `getGameDetails` — returns `journalCount` (true count, > 3 when applicable), `playtimeTotalMinutes` (null-safe `_sum`, 0 when no minutes), `recentSessionMinutes` (non-null `playedMinutes`, oldest→newest, bounded ~9); anonymous viewer (`userId` absent) → `0` / `0` / `[]`. **[Agent: testing]** — 6 failed first (RED), then 16 passed.
- [x] GREEN: extend the authed branch of `entities/game/api/get-game-details.server.ts` with `prisma.journalEntry.count` + `prisma.journalEntry.aggregate({ _sum: { playedMinutes } })` + the recent-minutes select (fold into the existing `Promise.all`); add the three fields to the `GameDetails` type. **[Agent: prisma-database]**
- [x] Remove the dead `relatedGames: Game[]` field from `GameDetails` and its `[]` producer — grep consumers first (`rg 'relatedGames'`) and confirm none read it. **[Agent: tanstack-fullstack]** — 4 dead sites removed; `relatedGamesSlot`/`getRelatedGamesForGameFn` (name collisions) correctly untouched.
- [x] Gate: `test:integration` + `typecheck` + `lint` green. **[Agent: testing]** — integration 525 pass, unit 1231 pass, typecheck clean, lint exit 0.

---

## Slice 2 — "Log a session" captures optional minutes

_Delivers FR 2.3 (the "Log a session" action), feeding playtime + Your Pace._

- [x] RED: integration test — `createJournalEntryFn` (or its worker) persists optional `playedMinutes`; omitted → `null`; entry still records with empty content + no minutes. Component test — the compose dialog renders an optional "time played" field and includes it on submit. **[Agent: testing]**
- [x] GREEN: extend `CREATE_JOURNAL_ENTRY_INPUT` in `features/compose-journal-entry/api/create-journal-entry-fn.ts` with `playedMinutes: z.number().int().positive().optional()` (validate-twice); optionally set `playSession = journalCount + 1` server-side. Split into a `.worker.ts` only if integration-testing the new branch (foot-gun #8); otherwise note the deferral. **[Agent: tanstack-fullstack]** — no worker (trivial pass-through; tested at entity query); `playSession` deferred (would force a count query + worker split).
- [x] GREEN: add the optional numeric "time played" field to `compose-journal-entry-dialog`; keep existing `router.invalidate()` + close behavior. **[Agent: react-frontend]**
- [x] Gate: unit + integration + typecheck/lint green; manually log a session with minutes and confirm the (existing) page data refreshes. **[Agent: testing]** — verified merged with 3a: unit 1257, integration 528, typecheck clean, lint exit 0.

---

## Slice 3a — Extract tab content into panel components (behavior-preserving)

_Refactor toward FR 2.6/2.7/2.8/2.9 with no visible change yet — content still inside the existing `<Tabs>`._

- [x] RED: tests for each new panel sub-component (`about-panel`, `themes-tags-panel`, `journal-panel`, `related-panel`) rendering their current content. **[Agent: testing]**
- [x] GREEN: extract the Overview body into `about-panel/` (summary, released, developer, **publisher**) + `themes-tags-panel/` (themes, genres, platforms via `PlatformBadges`); extract Journal + Related into `journal-panel/` + `related-panel/` (related keeps the streamed slot). One-folder-per-component + barrels under `widgets/game-detail/ui/`. **[Agent: react-frontend]** — also surfaced themes (not shown before) + publisher per FR 2.6/2.7.
- [x] GREEN: render the new panels inside the still-existing `<Tabs>` (no layout change) so behavior is identical. **[Agent: react-frontend]**
- [x] Gate: unit tests + typecheck/lint green; page looks unchanged (visual diff = none). **[Agent: react-frontend]** — empty rows now collapse instead of showing em-dash (FR 2.6/2.7 behavior); 2 widget-test assertions updated accordingly.

---

## Slice 3b — Swap Tabs → bento grid

_Delivers FR 2.11 (layout) — the structural pivot from tabs to an inline bento dashboard._

- [x] RED: widget test — panels render inline with no `tablist`/`tab` roles; all ported panels present. **[Agent: testing]**
- [x] GREEN: replace the `<Tabs>` block in `game-detail.tsx` with a responsive bento grid composing the Slice-3a panels (desktop multi-column / mobile single-column); keep the route's `Suspense` + `SectionErrorBoundary` slot wiring for streamed sections. **[Agent: react-frontend]** — `grid-cols-1 md:grid-cols-[1.35fr_1fr]`, panels wrapped in Card chrome.
- [x] Gate: tests + Chrome-MCP visual (desktop grid + mobile single-column), Light + Dark. **[Agent: react-frontend]** — unit 1259, typecheck/lint/format green; visual via Playwright MCP (no Chrome connected) across desktop+mobile × Light+Dark.

---

## Slice 4 — Your Record panel

_Delivers FR 2.3 (consolidated personal record)._

- [x] RED: panel test — shows playtime (omitted when total is 0), sessions count, interactive `RatingInput`, and a "Log a session" button that opens the composer; saving updates count/playtime (mocked fn + invalidate). **[Agent: testing]**
- [x] GREEN: build `widgets/game-detail/ui/your-record-panel/` from Slice-1 data + `shared/ui/rating-input` + the Slice-2 composer; place it in the bento grid. **[Agent: react-frontend]** — rating temporarily duplicated in switcher (removed in 5b); `itemId` typed `number`.
- [x] Gate: tests + visual. **[Agent: react-frontend]** — unit 1268, typecheck/lint/format green. **Authenticated visual pass deferred to Slice 8c (panel is signed-in-only; agent has no session — declined to forge a cookie).**

---

## Slice 5a — Critic score ring + hero eyebrow

_Delivers part of FR 2.1 (critic score; publisher in the eyebrow)._

- [x] RED: tests — `critic-score-ring` renders the rounded `aggregated_rating` and is omitted when absent; hero eyebrow includes publisher and omits any missing part. **[Agent: testing]**
- [x] GREEN: `entities/game/ui/critic-score-ring/` (display-only neutral indicator, 0–100) and add it + publisher to the hero. **[Agent: react-frontend]** — returns null when score absent; neutral (not accent).
- [x] Gate: tests + visual (ring present vs. absent), Light + Dark. **[Agent: react-frontend]** — unit 1276, typecheck/lint/format green; **visual confirmed** (Playwright, anon-visible hero) in both themes; score-less game omits ring.

---

## Slice 5b — Status pill (popover / sheet) + move rating into Your Record

_Delivers FR 2.2 (in-place status change). The flagged-risk slice — isolated for a clean gate._

- [x] RED: tests — pill shows current status with its color/icon; on desktop opens an anchored popover, on mobile a bottom sheet, listing all 5 statuses with the current one checked; selecting mutates status and closes; not-in-library select **adds** the game. **[Agent: testing]**
- [x] GREEN: re-present `LibraryStatusSwitcher` as the pill + adaptive menu, reusing `updateLibraryItemFn` / `addGameToLibraryFn` / `deleteLibraryItemFn` and the existing status model; "Up Next" → "Replay" when `hasBeenPlayed`. **[Agent: react-frontend]** — popover.tsx (desktop) + sheet.tsx (mobile); folder-local `use-media-query.ts` (FSD: can't import command-palette sibling).
- [x] GREEN: remove the rating control from the switcher (it now lives in Your Record, Slice 4) — confirm no duplicate rating UI remains. **[Agent: react-frontend]** — `rg RatingInput` confirms single source in your-record-panel; widget test asserts exactly one slider.
- [x] Gate: tests + visual (popover desktop / sheet mobile), Light + Dark. **[Agent: react-frontend]** — unit 1284, typecheck/lint/format green. **Authenticated visual deferred to Slice 8c (signed-in-only control).**

---

## Slice 6 — Screenshots panel + lightbox

_Delivers FR 2.5._

- [x] RED: tests — `shared/ui/image-lightbox` opens on a thumbnail, navigates with prev/next + ←/→ keys, closes on Esc and on backdrop click; `screenshots-panel` is omitted entirely when there are no screenshots. **[Agent: testing]**
- [x] GREEN: build `shared/ui/image-lightbox/` over `shared/ui/dialog.tsx`; build `widgets/game-detail/ui/screenshots-panel/` (thumbnail grid desktop / horizontal rail mobile) using `buildScreenshotUrl`. **[Agent: react-frontend]** — generic controlled lightbox (wrap-around nav); panel full-width `md:col-span-2`, omitted when no screenshots.
- [x] Gate: tests + visual (gallery + lightbox, desktop + mobile). **[Agent: react-frontend]** — unit 1301, typecheck/lint/format green; **visual confirmed** (Playwright, anon) both themes; no-panel path unit-covered (seed games always have screenshots).

---

## Slice 7 — Times to Beat (you-vs-benchmark) + Your Pace fallback

_Delivers FR 2.4._

- [x] RED: tests — **benchmark mode** plots the viewer's logged hours against main-story / 100% (accent marker, neutral benchmarks, context sentence; single tick when only one benchmark); **`null` benchmark** → `your-pace-panel` (sessions, total, average, recent-session bars from `recentSessionMinutes`). **[Agent: testing]**
- [x] GREEN: extend `features/game-detail/ui/times-to-beat-section` with the beat line (seconds→hours); add `features/game-detail/ui/your-pace-panel/`. **[Agent: react-frontend]** — accent="you", benchmarks neutral; single tick when one benchmark.
- [x] GREEN: in `routes/games.$slug.tsx`, build the times-to-beat slot to pass **both** the streamed benchmark and the loader's personal stats, choosing benchmark vs. pace mode by whether the benchmark is `null`. **[Agent: tanstack-fullstack]** — slot no longer suppresses on null benchmark; no new server fn.
- [x] Gate: tests + visual (both states). **[Agent: react-frontend]** — unit 1313, typecheck/lint/format green; benchmark mode **visual confirmed** (Playwright, anon); authenticated you-marker + pace deferred to 8c.

---

## Slice 8a — Graceful degradation rules

_Delivers FR 2.10 (hide-never-placeholder, collapse-when-all-absent, accent-wash, title-only worst case)._

- [x] RED: tests — each panel collapses when **all** its inputs are absent (About, Themes & Tags, Screenshots, Related); no "—" placeholders anywhere; title-only-in-library worst case renders only hero + Your Record + Your Pace + Journal with the accent-wash backdrop. **[Agent: testing]**
- [x] GREEN: apply per-panel presence guards + collapse rules across the bento; confirm the existing accent-wash backdrop fallback path. **[Agent: react-frontend]** — closed catalog-Card + Related-Card empty-box gaps (Related chrome moved to route, the only layer that sees the streamed null); AboutPanel full-collapse made explicit.
- [x] Gate: tests + visual against the empty-state spec artboard. **[Agent: react-frontend]** — unit 1323, typecheck/lint/format green; anon sparse render confirmed (Playwright); title-only-in-library worst case unit-covered, authenticated visual deferred to 8c.

---

## Slice 8b — Not-in-library / logged-out mode

_Delivers FR 2.2 (Add to library) + the catalog-viewer behavior._

- [x] RED: tests — when not in library (or `viewerUserId` null), the status pill is replaced by an "Add to library" action (or sign-in prompt when logged out), and the personal panels (Your Record / Your Pace / Journal) give way to a single "Add this to start tracking" invitation. **[Agent: testing]**
- [x] GREEN: implement the not-in-library / logged-out branch in the hero + bento (reuse `add-game` feature). **[Agent: react-frontend]** — `add-to-track-invite/` (signed-in→AddFromGameDetailButton; logged-out→Sign in link); times-to-beat slot treated as personal (suppressed when logged out — **flagged for review**).
- [x] Gate: tests + visual (in-library vs. not-in-library vs. logged-out). **[Agent: react-frontend]** — unit 1333, typecheck/lint/format green; logged-out **visual confirmed** (Playwright, both themes); signed-in not-in-library deferred to 8c.

---

## Slice 8c — Responsive reflow + final gate

_Delivers FR 2.11 (responsive + Light/Dark) and the whole-spec verification._

- [x] Polish the mobile single-column reflow (screenshot rail, status sheet, panel order) and the desktop grid relaxation as panels collapse. **[Agent: react-frontend]** — already satisfied by slices 3b/6/8a (`md:items-start`, horizontal rail, single-column stack); no layout code change needed, confirmed by anon visual sweep.
- [x] Final gate: full `test:unit` + `test:integration` + `typecheck` + `lint` + `format:check` + `build` green (coverage gate: statements ≥ 85 on `src/{entities,features}`); Chrome-MCP visual sweep across in-library / sparse / title-only, Light + Dark, desktop + mobile. **[Agent: react-frontend]** — unit 1337, integration 528, typecheck/lint/format/build green, coverage 85.06% stmts (2 tests added to clear it); anon sweep (rich+sparse × Light/Dark × desktop/mobile) clean. **Authenticated visual sweep (5 signed-in surfaces) left for the human — see below.**

---

## Agent / verification notes

- All sub-tasks map to existing specialists (`testing`, `react-frontend`, `tanstack-fullstack`, `prisma-database`) — no `general-purpose` fallbacks.
- All slices verified via unit + integration + typecheck/lint/format/build + coverage (85.06% stmts) and **anonymous** Playwright visual passes. Chrome MCP had no connected browser; Playwright MCP was used instead.

## Pending: authenticated visual verification (human, with a signed-in session)

Agents could not run these — the surfaces are signed-in-only and forging a session cookie was (correctly) refused. Each is covered by unit tests; only the visual confirmation in a real session remains. Verify Light + Dark, desktop (≥1280px) + mobile (390px):

1. **Your Record** — playtime (omitted when 0), sessions count, interactive star rating, "Log a session" → composer opens → save updates count/playtime/journal.
2. **Status pill** — desktop anchored **popover** vs mobile bottom **sheet**; select mutates + closes; "Up Next" → "Replay" when played.
3. **Times to Beat (benchmark mode) with the accent "You" marker** for an in-library viewer with logged hours; **Your Pace fallback** for an in-library game with no benchmark.
4. **Title-only-in-library worst case** — minimal hero (placeholder cover, title, status pill, accent-wash backdrop) + only Your Record / Your Pace / Journal; no catalog surfaces; no em-dash.
5. **Signed-in not-in-library** — hero "Add to library" + the single "Add this to start tracking" invitation replacing the personal panels.

## Open product question (flagged, not blocking)

- The **times-to-beat slot is suppressed entirely for logged-out viewers** (treated as part of the personal "you" layer). Matches §2.4's framing, but anonymous visitors then never see the catalog benchmark line. Confirm this is desired, or have anon users see the bare benchmark (no "You" marker).

## Post-implementation refinements (2026-06-03, user review)

- **Bento order corrected to match the Claude Design prototype.** The build had drifted (screenshots buried mid-grid; About+Themes merged into one catalog card; Times to Beat pushed away from Your Record). Restored: full-width **Screenshots strip above the grid**, then **Your Record │ Times to Beat**, **About │ Themes & Tags**, **Journal │ Related**. About/Themes un-merged into two separate self-omitting cards (each `Card` gated on its own `hasAboutData`/`hasThemesTagsData`, so no empty box). Related card chrome still owned by the route. unit 1339, typecheck/lint/format/build green; anon Playwright confirmed.
- **Game-detail panels use `Card variant="flat"`** (no hover). The panels are read-only surfaces; the default Card's hover affordance was wrong here. Used the **pre-existing `flat` variant** in `shared/ui/card.tsx` (no new variant, no per-instance override) on all 10 cards (7 widget + 3 route Related states). unit 1339, typecheck/lint/format green.
- **Platform badges colored by family (completes FR 2.7).** The `playstation`/`xbox`/`nintendo`/`pc` Badge variants + `--color-*` tokens already existed but `PlatformBadges` rendered everything `subtle`. Added a single `getPlatformFamily(name)` classifier (4 families + neutral tail; mobile-exclusion guard so "Windows Phone" → other) + `getPlatformBadgeVariant`, wired into `PlatformBadges`. Also fixed a latent bug: short token "nes" was substring-matching "geNESis" → Sega got a Nintendo glyph (now whole-word matched). unit 1364 green.
- **Cards adopt the colored badges.** Game card now reuses `<PlatformBadges>` (glyph + abbreviation + family color + +N overflow) instead of hand-rolled grey chips; library card's single-platform badge uses the family variant. `getPlatformFamily`/`getPlatformBadgeVariant` exported through the `@/entities/game` barrel. unit 1368 green.
