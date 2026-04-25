# Tasks: UI/UX Audit Improvements (High + Medium Priority)

- **Spec:** [`functional-spec.md`](./functional-spec.md)
- **Tech:** [`technical-considerations.md`](./technical-considerations.md)

Each slice keeps the app runnable and ships one user-visible improvement. Sub-tasks include a verification step before the slice is considered done.

---

## Slice 1: Library card shows status as a text-bearing pill badge (F#4)

- [x] **Slice 1: Library card shows status as a text-bearing pill badge**
  - [x] Add `library-status-badge.tsx` to `features/library/ui/` — props `{ status, hidden? }`, reuses existing per-status color tokens, renders translucent backdrop + status label. Export from `features/library/ui/index.ts`. **[Agent: react-frontend]**
  - [x] Update `library-card.tsx` to overlay `<LibraryStatusBadge>` in the top-left of the cover. Keep the existing 10px dot temporarily out (badge replaces it). Hide the badge when a single-status filter is active (preserve current dedupe behavior). **[Agent: react-frontend]**
  - [x] Remove the redundant status text label below the cover (the slot is reused in Slice 2; for now leave the slot empty). **[Agent: react-frontend]**
  - [x] Component test: render card with each `LibraryItemStatus`; assert badge text + role/aria; assert badge hidden when `singleStatusFilterActive` prop is true. **[Agent: typescript-test-expert]**
  - [x] Verification: `pnpm --filter savepoint test:components` — 40 files / 622 tests pass; lint + typecheck clean. **[Agent: testing]**

## Slice 2: Library card shows status-aware metadata (F#7) — *superseded by Slice 9 (F#2.10)*

- [x] **Slice 2: Library card shows status-aware metadata in place of the removed status text**
  - [x] Add `library-card-metadata.tsx` to `features/library/ui/` — pure presentational; props `{ status, playtimeMinutes, startedAt, createdAt, platform }`. Branches per spec 2.7. Format playtime ("32h" / "1h 23m" / "45m"); format relative dates via existing date util. **[Agent: react-frontend]**
  - [x] Wire `<LibraryCardMetadata>` into `library-card.tsx` in the slot vacated in Slice 1. **[Agent: react-frontend]**
  - [x] Repository platform select — **no-op**: `LibraryItem.platform` is a plain string column already returned by the existing select. (`actualPlaytime` does not exist on the schema; the playtime branch always falls through to `startedAt` for now — out of scope per spec §3.) **[Agent: prisma-database]**
  - [x] Component test: 11 tests covering all branches of the metadata function. **[Agent: typescript-test-expert]**
  - [x] Verification: `pnpm --filter savepoint test:components` — 41 files / 633 tests pass; lint + typecheck clean. **[Agent: testing]**

## Slice 3: Hero search input with ⌘K shortcut (F#6)

- [x] **Slice 3: Search lifts to a 44px hero input above the grid with ⌘K focus shortcut**
  - [x] Add `hero-search.tsx` to `features/library/ui/` — controlled input bound to `search` searchParam (debounced 300ms; param key `search` not `q` to preserve `useLibraryFilters` and existing tests), 44px tall, focus-ring style, right-aligned shortcut hint chip ("⌘K" / "Ctrl K"). Global `keydown` listener focuses the input. **[Agent: react-frontend]**
  - [x] Mount `<HeroSearch>` above `<LibraryFilters>` in `library-page-view.tsx`; remove the Row-2 search input from `library-filters.tsx`. **[Agent: nextjs-expert]**
  - [x] Component test: 6 tests covering aria-label/placeholder, URL init, debounced router.push, ⌘K focus, Ctrl+K focus, shortcut chip render. **[Agent: typescript-test-expert]**
  - [x] Verification: `pnpm --filter savepoint test:components` — 42 files / 639 tests pass; lint + typecheck clean. **[Agent: testing]**

## Slice 4: Status counts available + desktop sidebar with counted filters (F#1 + F#5 desktop)

- [x] **Slice 4: Desktop ≥1280px renders a left filter sidebar with status, platform, sort, and per-status counts**
  - [x] Add `countLibraryItemsByStatus({ userId, platformId?, search? })` in `library-repository.ts` using `prisma.libraryItem.groupBy`. Always returns all five `LibraryItemStatus` keys (zero-fill missing). **[Agent: prisma-database]**
  - [x] Add `LibraryService.getStatusCounts(input)` returning `ServiceResult<Record<LibraryItemStatus, number>>`. **[Agent: nextjs-expert]**
  - [x] Adapted to existing TanStack Query architecture: added `getStatusCountsHandler` + `app/api/library/status-counts/route.ts` + `useStatusCounts` hook (deviation from RSC `Promise.all` plan, documented). **[Agent: nextjs-expert]**
  - [x] Add `library-filter-sidebar.tsx` (≥1280px) with: status rows (label + inline count badge; dim zero-count rows but keep clickable), platform combobox, sort control. Reads/writes `searchParams` via `useRouter`. **[Agent: react-frontend]**
  - [x] Add `library-filter-sidebar-rail.tsx` (icon-only collapsed variant for 768–1279px); collapse state in `sessionStorage` (default expanded). Uses `useSyncExternalStore` to avoid hydration mismatch. **[Agent: react-frontend]**
  - [x] Restructure `library-page-view.tsx` into a sidebar + grid-area layout on ≥768px; existing inline filters retained as `md:hidden` fallback for ≤640px until Slice 5. **[Agent: react-frontend]**
  - [x] Repository integration test: empty user, single status, mixed statuses, with platform filter, with search filter — assert correct count map. **[Agent: typescript-test-expert]**
  - [x] Component test: sidebar renders counts, dim-but-clickable zero rows, chip click pushes searchParams. **[Agent: typescript-test-expert]**
  - [x] Verification: `pnpm --filter savepoint test:components` — 42 files / 639 tests pass; typecheck + lint clean. **[Agent: testing]**

## Slice 5: Mobile segmented status tabs + Filters bottom sheet (F#2 + F#5 mobile)

- [x] **Slice 5: ≤640px replaces the chip strip with a segmented control + Filters bottom sheet**
  - [x] Add `mobile-filter-bar.tsx` — segmented control (All + 5 status segments, labels only), "Filters" trigger opening shadcn `<Sheet>` (bottom) with status list + counts, platform, sort, rating, unrated-only, clear-all. **[Agent: react-frontend]**
  - [x] Snap-x scroll + CSS mask faded right edge for visible overflow affordance. **[Agent: react-frontend]**
  - [x] Deleted `library-filters.tsx` (sole consumer was `library-page-view.tsx`); added `shared/components/ui/sheet.tsx` shadcn primitive. **[Agent: react-frontend]**
  - [x] Component test: 13+ tests covering all segments, sheet open/close (Escape), counts inside sheet, sort/platform pushes, Steam import conditional. **[Agent: typescript-test-expert]**
  - [x] Verification: `pnpm --filter savepoint test:components` — 43 files / 654 tests pass; typecheck + lint clean. **[Agent: testing]**

## Slice 6: Optimistic chip-pressed UI + loading feedback (F#9)

- [x] **Slice 6: Filter chips, sort, and search render an instant pressed state and disable during reconcile**
  - [x] Created `use-optimistic-filters` hook wrapping `useLibraryFilters` with React 19 `useOptimistic` + `useTransition`; per-field `pendingField` derived from optimistic vs URL diff. **[Agent: react-architect]**
  - [x] Status chips, sort, platform, clear-all routed through hook; spinner + disabled state on the pending control across sidebar, rail, mobile bar, and hero search. **[Agent: react-frontend]**
  - [x] Added `placeholderData: keepPreviousData` to `useLibraryData` so grid stays mounted during filter transitions; skeleton only on initial load. **[Agent: nextjs-expert]**
  - [x] Component test: 8 tests covering immediate `aria-pressed` flip, router push correctness, rapid-click last-write-wins, clearAll. **[Agent: typescript-test-expert]**
  - [x] Verification: 44 files / 662 tests pass; typecheck + lint clean. **[Agent: testing]**

## Slice 7: Dashboard Quick Log hero simplification (F#3)

- [x] **Slice 7: Quick Log hero shows one primary CTA per game, recency-sorted, with Reflect as a secondary text link**
  - [x] Added `findLatestJournalDateByGameId` (groupBy on `createdAt`) + integration tests. **[Agent: prisma-database]**
  - [x] Added `JournalService.getLatestEntryDatePerGame` wrapper. **[Agent: nextjs-expert]**
  - [x] Added `getQuickLogPlayingGames` use-case composing library + journal services with `max(startedAt, latestJournal, updatedAt)` sort. **[Agent: nextjs-expert]**
  - [x] Updated `quick-log-hero-client.tsx`: "Log Session" primary button, `Reflect` as styled Link (not Button) below. **[Agent: react-frontend]**
  - [x] Use-case unit tests (8) + component tests (8) covering ordering, ties, link-not-button. **[Agent: typescript-test-expert]**
  - [x] Verification: 45 files / 670 component tests + 43 files / 731 backend tests pass; typecheck + lint clean. **[Agent: testing]**

## Slice 8: Empty-library onboarding hero (F#8)

- [x] **Slice 8: Users with zero `LibraryItem` rows see a single onboarding hero with two CTAs (Steam import + Search games)**
  - [x] Added `empty-library-hero.tsx` with `library` / `dashboard` variants, lucide icon-stack illustration, two CTAs. **[Agent: react-frontend]**
  - [x] Library page branches on `getStatusCounts` total === 0; legacy `library-empty-state.tsx` retained for filtered-empty cases. **[Agent: nextjs-expert]**
  - [x] Dashboard page renders dashboard variant when total === 0. **[Agent: nextjs-expert]**
  - [x] "Browse Popular" CTA absent — asserted in tests. **[Agent: react-frontend]**
  - [x] 10 component tests covering both variants, CTAs, absence of Browse Popular. **[Agent: typescript-test-expert]**
  - [x] Verification: 46 files / 680 tests pass; typecheck + lint + format clean. **[Agent: testing]**

---

## Slice 9: Card metadata row — platform • contextual date (F#2.10.3, supersedes Slice 2)

- [x] **Slice 9: Every card shows `<platform badge> • <contextual date>` instead of the single status-aware field**
  - [x] Rewrote `library-card-metadata.tsx` — shadcn Badge (secondary) + bullet + contextual date; null-platform fallback. **[Agent: react-frontend]**
  - [x] Added colocated `getContextualDate` helper reusing `formatRelativeDate` from `@/shared/lib/date`. **[Agent: react-frontend]**
  - [x] 11 component tests covering all 5 status branches + null-platform + null-startedAt fallbacks. **[Agent: typescript-test-expert]**
  - [x] Verification: 46 files / 681 tests pass; typecheck + lint clean. **[Agent: testing]**

## Slice 10: Per-card always-visible primary CTA (F#2.10.4)

- [x] **Slice 10: Each card exposes a status-aware primary button (Log Session / Start Playing / Queue It / Replay / Add to Shelf)**
  - [x] Added pure `getPrimaryCtaPayload` mapping module (zero React imports). **[Agent: nextjs-expert]**
  - [x] 12 exhaustive matrix unit tests (5 statuses × 2 hasBeenPlayed). **[Agent: typescript-test-expert]**
  - [x] `library-card-cta.tsx` reuses `JournalQuickEntrySheet` for Log Session; dispatches `updateLibraryStatusAction` for status transitions. **[Agent: react-frontend]**
  - [x] Wired into `library-card.tsx` under the rating row with `data-library-interactive` propagation guard. **[Agent: react-frontend]**
  - [x] 14 component tests covering label matrix, dispatch, propagation stop. **[Agent: typescript-test-expert]**
  - [x] Verification: 47 files / 694 component + 44 files / 743 backend tests pass; typecheck + lint clean. **[Agent: testing]**

## Slice 11: Per-card context menu (⋮) — replaces hover action bar (F#2.10.4)

- [x] **Slice 11: Each card surfaces secondary actions through an always-visible ⋮ menu in the cover top-right**
  - [x] Added `library-card-menu.tsx` with shadcn `DropdownMenu` (4 items including Change Status submenu); installed `@radix-ui/react-dropdown-menu`. **[Agent: react-frontend]**
  - [x] Deleted `library-card-action-bar.tsx` + types (no other consumers). **[Agent: react-frontend]**
  - [x] Wired into `library-card.tsx` top-right of cover. **[Agent: react-frontend]**
  - [x] 12 component tests covering visibility, items, submenu, dispatch payloads (no implicit hasBeenPlayed/startedAt), propagation. **[Agent: typescript-test-expert]**
  - [x] Verification: 48 files / 706 tests pass; typecheck + lint clean. **[Agent: testing]**

## Slice 12: Interactive star rating on cards (F#2.10.6)

- [x] **Slice 12: Cards rate games inline by clicking stars; clicking the current value clears the rating**
  - [x] Added `library-card-rating.tsx` wrapping `RatingInput` in interactive mode with `useOptimistic` + `useTransition`. **[Agent: react-frontend]**
  - [x] Failure restore via optimistic dispatch + existing error toast; root span with `data-library-interactive` for propagation. **[Agent: react-frontend]**
  - [x] Keyboard support inherited from `RatingInput` (Arrows shift, Enter commits, Escape clears). **[Agent: react-frontend]**
  - [x] Replaced read-only `<RatingInput>` in `library-card.tsx`. **[Agent: react-frontend]**
  - [x] 8 component tests: click mapping, click-current-clear, failure restore (reject + throw), keyboard, propagation guard. **[Agent: typescript-test-expert]**
  - [x] Reused existing `setLibraryRatingAction` from `@/features/manage-library-entry/server-actions`; no new action. RatingInput already on 1–10 DB scale.
  - [x] Verification: 49 files / 714 tests pass; typecheck + lint clean. **[Agent: testing]**

## Slice 13: Library grid track sizing (F#2.10.1)

- [x] **Slice 13: Grid uses content-aware track sizing on tablet/desktop instead of fixed column counts**
  - [x] Replaced fixed-column classes in `library-grid.tsx` with viewport-aware `auto-fill` tracks per spec breakpoints. **[Agent: react-frontend]**
  - [x] Mirrored tracks in `library-grid-skeleton.tsx`; added `role="status"`/`aria-busy` for testability + a11y. **[Agent: react-frontend]**
  - [x] Class-presence tests added (visual snapshot deferred to Playwright follow-up per task note). **[Agent: typescript-test-expert]**
  - [x] Verification: 50 files / 716 tests pass; typecheck + lint clean. **[Agent: testing]**

## Slice 14: Mobile list view at ≤640px + remove swipe components (F#2.10.5)

- [x] **Slice 14: Mobile (≤640px) renders each library item as a horizontal list row; swipe UI is removed**
  - [x] Added `library-card-list-row.tsx` reusing all Slice 9–12 child components. **[Agent: react-frontend]**
  - [x] `library-grid.tsx` Tailwind-only responsive split (`flex-col` <sm, `hidden sm:grid` ≥sm). **[Agent: react-frontend]**
  - [x] `library-grid-skeleton.tsx` mirrors the split with list-row skeletons at <sm. **[Agent: react-frontend]**
  - [x] Deleted `library-card-swipe.tsx`, `library-card-mobile-actions.tsx`, `SWIPE_IMPLEMENTATION.md` (no other consumers); added `variant="row"` to `LibraryCardMenu`. **[Agent: react-frontend]**
  - [x] 7 new list-row tests + skeleton test extended. **[Agent: typescript-test-expert]**
  - [x] Verification: 51 files / 724 tests pass; typecheck + lint clean. **[Agent: testing]**

---

## Slice 15: Editable platform on library items (F#2.12)

- [x] **Slice 15: Users can change a library item's platform from the Edit Library Details form**
  - [x] Extend `UpdateLibraryEntrySchema` in `features/manage-library-entry/schemas.ts` with `platform: z.string().nullable().optional()`. **[Agent: nextjs-expert]**
  - [x] Update `update-library-entry-action.ts` to forward `platform` into `LibraryService.updateLibraryItem({ libraryItem: { ..., platform } })`. Treat empty string as `null`. **[Agent: nextjs-expert]**
  - [x] Verify `LibraryService.updateLibraryItem` already accepts `platform?: string` (it does at `library-service.ts:280`); add a service unit test that asserts the contract so future refactors do not regress it. **[Agent: typescript-test-expert]**
  - [x] Update `features/manage-library-entry/ui/edit-entry-form.tsx` (and `entry-form.tsx` if shared) to render the platform combobox in the **edit** path; bind to `platform` in the form schema; submit passes the value through. Legacy unrecognized values render as a sticky `(legacy)` option until changed. **[Agent: react-frontend]**
  - [x] Action integration test: `update-library-entry-action.test.ts` — `{ platform: "PS5" }` updates the row; `{ platform: null }` clears; `{ platform: "" }` is treated as `null`; unauthorized user rejected. **[Agent: typescript-test-expert]**
  - [x] Component test: `edit-entry-form.test.tsx` — combobox pre-selects existing value; legacy value is selectable as `(legacy)` until changed; submit posts the new value. **[Agent: typescript-test-expert]**
  - [x] Verification: 52 files / 728 component tests + 44 files / 751 backend tests pass; typecheck + lint clean. **[Agent: testing]**

## Slice 16: Quick Add server contract — smart defaults + platform auto-detect (F#2.11.6, server-only)

- [x] **Slice 16: `quickAddToLibraryAction({ igdbId })` adds with smart defaults; existing flows unaffected**
  - [x] Update `QuickAddToLibrarySchema` in `features/manage-library-entry/schemas.ts`: `status` becomes optional (default `UP_NEXT` server-side). Public input contract is `{ igdbId, status?: LibraryItemStatus }`. **[Agent: nextjs-expert]**
  - [x] Update `addGameToLibrary` use-case to accept new optional fields: `acquisitionType?: AcquisitionType` and `autoDetectPlatform?: boolean`. **[Agent: nextjs-expert]**
  - [x] Add pure helper `resolvePrimaryPlatform({ igdbPlatforms, knownPlatforms })` in `features/manage-library-entry/lib/`. **[Agent: nextjs-expert]**
  - [x] Pure unit test for `resolvePrimaryPlatform`. **[Agent: typescript-test-expert]**
  - [x] Update `quickAddToLibraryAction` defaults + logging + return type. **[Agent: nextjs-expert]**
  - [x] Integration test extension `quick-add-to-library-action.integration.test.ts`. **[Agent: typescript-test-expert]**
  - [x] Verification: 45 files / 757 backend tests pass; 52 files / 728 component tests pass; typecheck + lint clean. **[Agent: testing]**

## Slice 17: Inline + Quick Add button on search-result cards + Undo toast (F#2.11.1, F#2.11.5)

- [x] **Slice 17: IGDB search-result cards expose a `+` button that adds with smart defaults and emits an undoable toast**
  - [x] Added `shared/components/ui/undo-toast.tsx` — `UndoToastBody` component + `showUndoToast` helper wrapping sonner with 5s Undo action. **[Agent: react-frontend]**
  - [x] Added `features/manage-library-entry/ui/quick-add-button.tsx` — 32×32 Plus → Check transition, useTransition pending, propagation stopped, alreadyInLibrary disabled-success state, undo toast with `deleteLibraryItemAction`. **[Agent: react-frontend]**
  - [x] Mounted in `features/game-search/ui/game-card.tsx` and `game-grid-card.tsx`; `features/game-search/ui/quick-add-button.tsx` becomes a thin wrapper delegating to manage-library-entry. **[Agent: react-frontend]**
  - [x] 8 quick-add-button tests + 4 undo-toast tests. **[Agent: typescript-test-expert]**
  - [x] Verification: 54 files / 740 component tests pass; typecheck clean. **[Agent: testing]**

## Slice 18: Realign keyboard shortcuts — ⌘K to command palette, `/` to library hero (F#2.6 revision)

- [x] **Slice 18: `⌘K` opens the global command palette from anywhere; library hero search uses `/`**
  - [x] `use-command-palette.ts` binding flipped from `(meta|ctrl)+/` to `(meta|ctrl)+k`; CommandPaletteProvider already mounted globally. **[Agent: react-frontend]**
  - [x] `hero-search.tsx` drops ⌘K listener; adds `/` listener with editable-element guard + preventDefault; chip renders `/`. **[Agent: react-frontend]**
  - [x] `hero-search.test.tsx` updated: `/` focus test, `/` no-op when input focused, chip renders `/`. **[Agent: typescript-test-expert]**
  - [x] Verification: 54 files / 740 component tests pass; typecheck + lint clean. **[Agent: testing]**

## Slice 19: Command palette Quick Add path (F#2.11.2)

- [x] **Slice 19: Selecting a game in the command palette adds it with smart defaults and closes the palette**
  - [x] desktop-command-palette + mobile-command-palette: Enter/click on search result → `quickAdd({ igdbId, gameName })` + palette close; recent games still navigate. **[Agent: react-frontend]**
  - [x] `game-result-item.tsx` renders right-aligned `Add to Up Next` hint chip on search rows (recent rows excluded by design). **[Agent: react-frontend]**
  - [x] Cmd+Enter detail-page secondary action skipped (cmdk limitation); navigation preserved via recent rows + library card path. Documented. **[Agent: react-frontend]**
  - [x] New `desktop-command-palette.test.tsx` (4 tests) covering Enter dispatch + close, Esc close without dispatch, chip presence, undo toast. **[Agent: typescript-test-expert]**
  - [x] Verification: 55 files / 744 component tests pass; typecheck + lint clean. **[Agent: testing]**

## Slice 20: Navbar Add Game button (F#2.11.3)

- [x] **Slice 20: Header exposes a global Add Game entry point that opens the command palette**
  - [x] `widgets/header/ui/header.tsx` replaces ⌘K Search trigger with a single Tailwind-responsive Add Game button (44×44 mobile icon-only, `Add Game` label desktop); delegates to `useCommandPaletteContext().open()`. **[Agent: react-frontend]**
  - [x] New `header.test.tsx` (5 cases) covering single-trigger, label markup, mobile tap target, click → open(), unauthenticated case. Added widgets/ glob to `vitest.config.ts` components project. **[Agent: typescript-test-expert]**
  - [x] Verification: 56 files / 749 component tests pass; typecheck + lint clean. **[Agent: testing]**

---

## Final validation

- [x] **Run full CI suite locally** — ci:check (lint + format + typecheck) clean; `test:components` 56 files / 749 tests; `test:backend` 45 files / 757 tests; `test:utilities` 8 files / 77 tests. All green. **[Agent: testing]**
- [ ] **Manual sweep** — requires `pnpm --filter savepoint dev` + interactive browser walkthrough. Not performable in this autonomous session — left for human verification. **[Agent: testing]**
- [x] **Update spec status** — `functional-spec.md` already reads `Status: In Review`. **[Agent: general-purpose]**

---

## Subagent / dependency notes

| Task / Slice | Issue | Recommendation |
|---|---|---|
| Final validation → "Update spec status" | Assigned to `general-purpose` (no specialist exists for spec-status bookkeeping) | Acceptable; trivial markdown edit. |
| Slice 5 verification | Mobile-viewport visual check uses Chrome devtools (no dedicated mobile MCP) | Acceptable; project already verifies responsive UI manually. Consider adding a Playwright viewport test in a follow-up. |
| Slice 10 — Log Session surface | Reuses an existing journal-entry surface (referenced in `quick-log-hero-client.tsx`); if no reusable component is found, the slice may need a thin `<LogSessionDialog>` wrapper before completing. | Inspect at start of slice; surface decision in PR description. Do not add a dialog unless required. |
| Slice 13 visual snapshot | No existing Playwright snapshot infra for grid sizing | Use Vitest + JSDOM matchMedia mocks for the responsive class assertion; defer pixel-level visual snapshot to a follow-up if not already configured. |
| Slice 14 swipe deletion | `library-card-swipe.tsx` / `library-card-mobile-actions.tsx` may have non-obvious consumers | Run `rg` audit before deletion; if any consumer remains, refactor in place rather than deleting. |
| Slice 17 toast primitive | Project's toast library (likely `sonner`) needs to support Undo-style action buttons | Verify at slice start; if the existing primitive does not expose action buttons, build `<UndoToast>` on top of `Sonner.toast.custom` (or equivalent) — do not introduce a new toast library. |
| Slice 17 search-result card location | The IGDB search-result card may live in `features/game-search/ui/` or under `features/library/ui/game-search-results.tsx` — file location unconfirmed | First sub-task is to locate via `rg` and confirm; document the chosen mount path in PR description. |
| Slice 18 — shortcut conflict on Linux/Chrome | `Ctrl+K` is bound by browser tab search in some setups | Use `event.preventDefault()` only when the palette open is intended; verify on Linux/Chrome. Document outcome in PR. |
| Slice 20 — duplicate header trigger | Header may already render a `⌘K` palette trigger today | Replace, do not duplicate. Audit at slice start. |
| Slice 16 platform list source | `resolvePrimaryPlatform` needs a list of known platforms; `PlatformService.list()` may not exist | If absent, add a thin `LibraryService.listPlatforms()` (or local helper) that selects distinct platform identifiers from the existing `Platform` table. Tiny addition; defer fancy caching. |
