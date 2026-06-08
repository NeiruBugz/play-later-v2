<!--
Architectural HOW for spec 023. Contracts and file responsibilities, not implementations.
All paths are under savepoint-tanstack/ unless noted.
-->

# Technical Specification: Enriched Game Detail Page

- **Functional Specification:** [`./functional-spec.md`](./functional-spec.md)
- **Status:** Completed
- **Author(s):** Nail Badiullin (with AI assistance)

---

## 1. High-Level Technical Approach

This is **~90% a recomposition of existing, tested pieces** into a new layout, not a greenfield build. The current game-detail page (`src/widgets/game-detail/ui/game-detail/game-detail.tsx`) renders a hero plus a `<Tabs>` block (Overview / Journal / Related / Times-to-beat). We replace the tabs with a single **inline bento layout** of panels, folding every tab's content into the page, and add the personal "your record / your pace" machinery and a screenshot gallery.

The work touches three layers, in line with the C2 DAL + FSD rules:

- **`entities/`** — extend the existing `getGameDetails` read aggregate to also return the true journal **session count**, **total logged playtime**, and a short **recent-session-minutes** series (fixing a real bug where today's count is capped at 3). No schema migration.
- **`features/`** — extend `createJournalEntryFn` to accept an **optional "minutes played"** value (the `JournalEntry.playedMinutes` field already exists); re-present the existing status switcher as a **pill + adaptive menu** (popover on desktop, bottom sheet on mobile). Reuse `getTimesToBeatForGameFn` and `getRelatedGamesForGameFn` unchanged (still streamed).
- **`widgets/` + `shared/ui/`** — recompose `widgets/game-detail/` into bento panel sub-components; add a reusable **image lightbox** primitive in `shared/ui/`.

Read-path strategy is unchanged: core data stays **eager in the route loader** (via the existing `getGameDetailPageDataFn` wrapper — preserving the loader-direct bundler caveat), while **times-to-beat and related games stay client-streamed** via `useSuspenseQuery` behind the route's `Suspense` + `SectionErrorBoundary`. The journal compose dialog continues to call `router.invalidate()`, which now also refreshes the count and playtime because they live in the loader aggregate.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Data Model / Database Changes

**No migration.** Every field needed already exists. Relevant columns:

| Model | Field | Use in this feature |
|---|---|---|
| `LibraryItem` | `status` (`LibraryItemStatus`) | Status pill — 5 values (WISHLIST/SHELF/UP_NEXT/PLAYING/PLAYED) |
| `LibraryItem` | `rating` (`Int?`, 1–10 half-step) | Interactive star rating |
| `LibraryItem` | `hasBeenPlayed` (`Boolean`) | "Up Next" → "Replay" label |
| `JournalEntry` | `playedMinutes` (`Int?`) | Per-session time; summed → total playtime; series → Your Pace bars |
| `JournalEntry` | `playSession` (`Int?`) | Session ordinal (display; optionally auto-set on create) |
| `JournalEntry` | `content`, `kind`, `gameId` | Existing journal entry shape |

Derived values (computed in the read aggregate, not stored):
- **Total playtime (minutes)** = `SUM(JournalEntry.playedMinutes)` for `(userId, gameId)`.
- **Sessions** = `COUNT(JournalEntry)` for `(userId, gameId)`.
- **Recent-session series** = `playedMinutes` of the most recent ~9 entries (non-null), oldest→newest, for the Your Pace bars.

### 2.2 Read Aggregate Changes

**File:** `src/entities/game/api/get-game-details.server.ts` (entity query, `.server.ts`).

Extend the `GameDetails` return shape (within the existing `if (userId)` branch, using `Promise.all` alongside the current `findFirst` / `findMany`):

| Field | Type | Source |
|---|---|---|
| `journalCount` | `number` | `prisma.journalEntry.count({ where: { userId, gameId } })` |
| `playtimeTotalMinutes` | `number` | `prisma.journalEntry.aggregate({ _sum: { playedMinutes } })` (null → 0) |
| `recentSessionMinutes` | `number[]` | recent entries' `playedMinutes`, non-null, oldest→newest |

Also **remove the dead `relatedGames: Game[]` field** (always `[]`; "kept for backward-compat") while reshaping — confirm no consumer reads it first. Per the **"no specialized subset query"** rule, fold these into this aggregate rather than adding standalone `count` / `sum` entity queries. Anonymous viewers (`userId` absent) get `journalCount: 0`, `playtimeTotalMinutes: 0`, `recentSessionMinutes: []`.

> The route loader keeps calling `getGameDetailPageDataFn` (`src/features/game-detail/api/get-game-detail-page-data.ts`), which already wraps the entity query in a `createServerFn` — do **not** switch the loader to a top-level `.server.ts` import (foot-gun #2 hover-preload hang).

### 2.3 Mutation Changes — "Log a session" captures optional minutes

**File:** `src/features/compose-journal-entry/api/create-journal-entry-fn.ts`.

Extend `CREATE_JOURNAL_ENTRY_INPUT` with an optional `playedMinutes: z.number().int().positive().optional()` (and optionally set `playSession` server-side to `journalCount + 1`). Apply **validate-twice** (inputValidator + handler re-parse) and keep `requireUserId()`. The downstream entity create query persists `playedMinutes`.

**Worker-split (foot-gun #8):** the handler now does conditional logic (optional fields, possible ordinal derivation). If integration coverage of the new branch is wanted, split into `create-journal-entry-fn.worker.ts` (plain async, owns its `UnauthorizedError` gate) + a thin `createServerFn` wrapper; integration tests import the worker. If the handler stays a trivial pass-through to the entity query, the split can be deferred — note the decision in the task list.

**Dialog:** `src/features/compose-journal-entry/ui/compose-journal-entry-dialog/` gains an **optional numeric "time played" field**. Existing success behavior (`router.invalidate()` then close) is unchanged and now also refreshes count + playtime.

### 2.4 Reused As-Is (no change)

- **Status mutations:** `updateLibraryItemFn`, `addGameToLibraryFn`, `deleteLibraryItemFn` (rating bound 1–10 already enforced in `update-library-item-fn.ts`).
- **`RatingInput`** (`src/shared/ui/rating-input.tsx`) — interactive, half-step, keyboard-accessible.
- **`getTimesToBeatForGameFn`** + `getTimesToBeat` entity query — returns `{ mainStory, completionist }` in **seconds**; streamed.
- **`getRelatedGamesForGameFn`** + `RelatedGamesTabs` / `RelatedGamesSkeleton` — streamed `RelatedCollectionSection[]`.
- **`JournalTeaser`** (entity ui), **`GameCover`**, **`PlatformBadges`** (entity ui), **`buildScreenshotUrl`** / **`buildCoverImageUrl`** (`shared/lib/igdb-image.ts`).

### 2.5 Component Breakdown

New / changed UI, each as a one-folder-per-component unit with a barrel + `.type.ts` + colocated `.test.tsx`.

**`widgets/game-detail/ui/` (layout owner — composes features + entities + shared/ui):**

| Component | Responsibility |
|---|---|
| `game-detail/` (existing) | Replace `<Tabs>` with the bento grid (desktop multi-column / mobile single-column); render hero + panels; keep slot props for streamed sections |
| `game-detail-hero/` | Cover, eyebrow (year · publisher · primary genre — each omitted if absent), title, critic score ring, status pill |
| `your-record-panel/` | Total playtime (omit if 0), sessions count, `RatingInput`, "Log a session" button |
| `screenshots-panel/` | Thumbnail grid (desktop) / horizontal rail (mobile); opens the lightbox; omitted entirely if no screenshots |
| `about-panel/` | Summary + released/developer/publisher; whole panel omitted if all absent |
| `themes-tags-panel/` | Themes / genres / platforms rows (platform brand colors via `PlatformBadges`); per-row omit; whole panel omitted if all absent |
| `journal-panel/` | Latest entry teaser + entry count + "New entry"; empty-invite when none |
| `related-panel/` | Wraps the streamed related-games slot; omitted when no sections |

**`features/game-detail/ui/`:**

| Component | Responsibility |
|---|---|
| `times-to-beat-section/` (existing — extend) | Render the **you-vs-benchmark line**: convert benchmark seconds→hours, plot the viewer's logged hours against main-story / 100%, accent marker + neutral benchmarks + context sentence |
| `your-pace-panel/` (new) | Fallback when times-to-beat is `null`: sessions, total, average, recent-session bars from `recentSessionMinutes` |

**`entities/game/ui/`:**

| Component | Responsibility |
|---|---|
| `critic-score-ring/` (new, display-only) | Circular indicator for `aggregated_rating` (0–100, rounded); a neutral catalog fact |

**`features/manage-library-entry/` (or the existing switcher folder):** re-present `LibraryStatusSwitcher` as a **status pill** that opens an anchored **popover (desktop)** / **bottom sheet (mobile)** listing the 5 statuses with the current one checked, reusing the existing mutation calls and the not-in-library "select adds the game" behavior. (See Risk 3.)

**`shared/ui/`:**

| Component | Responsibility |
|---|---|
| `image-lightbox/` (new) | Full-screen viewer over the existing `dialog.tsx`: large image, prev/next, thumbnail strip, ←/→/Esc keys. Reusable, presentational |

### 2.6 Route Wiring

**File:** `src/routes/games.$slug.tsx`. The route already has the loader `data` (now carrying `playtimeTotalMinutes`, `journalCount`, `recentSessionMinutes`) and renders the streamed `timesToBeatSlot`. Build that slot to pass **both** the streamed benchmark and the loader-derived personal stats into `TimesToBeatSection`, so the panel chooses **benchmark mode** (benchmark present) vs **Your Pace mode** (benchmark `null`). Keep `Suspense` + `SectionErrorBoundary` in the route (widgets rule: route owns plumbing).

### 2.7 Logic / Algorithm Notes

- **Hours formatting:** benchmark seconds → hours (`/3600`); playtime minutes → hours (`/60`); round per existing `times-to-beat-section` convention.
- **Beat line:** plot viewer hours against `mainStory` / `completionist`; show "Xh past/from main story" + remaining-to-100% sentence; if only one benchmark present, render only that tick.
- **Degradation (functional-spec §2.10):** each panel's render is guarded by its data presence; a panel collapses only when **all** its inputs are absent; the title-only worst case yields hero + Your Record + (Your Pace) + Journal only, with the accent-wash backdrop fallback (already implemented in the current hero).

---

## 3. Impact and Risk Analysis

### System Dependencies

- **IGDB** (`/games`, `/game_time_to_beats`, `/collections`) — unchanged usage; failures already surface as `UpstreamError` and degrade per-section.
- **Prisma / Postgres** — two extra cheap aggregates (`count`, `_sum`) on `JournalEntry`, already indexed by `gameId`; in the same authed branch as the current reads.
- **Existing mutations** — status/rating/journal flows are reused; behavior must remain intact.

### Potential Risks & Mitigations

1. **Heavily-tested widget rebuild.** `game-detail` and its pieces carry substantial tests. *Mitigation:* TDD per the binding methodology — author panel tests RED first; preserve the route's `errorComponent` / `SectionErrorBoundary` behavior; keep the coverage gate (statements ≥ 85 on `src/{entities,features}`) green.
2. **Count/playtime correctness.** Today's sessions badge is `journalTeaser.length` (capped at 3) — a latent bug. *Mitigation:* integration-test the new aggregate against real PG (0 entries, >3 entries, null vs set `playedMinutes`).
3. **Status-control re-presentation (decided: convert to pill).** The design unifies on a **pill → popover (desktop) / bottom sheet (mobile)**; today it's an inline `SegmentedControl`. This is the single largest behavioral change — it rewrites tested interaction surface. *Mitigation:* reuse the same mutations and status model unchanged; rewrite only the switcher's presentation and its tests together, keeping the not-in-library "select adds the game" behavior intact.
4. **Removing the dead `relatedGames` field.** *Mitigation:* grep consumers before deletion; it's documented as always-empty.
5. **Extending `createJournalEntryFn` input.** Optional field is backward-compatible. *Mitigation:* validate-twice; add the worker split only if integration-testing the new branch (foot-gun #8).
6. **App shell / mobile chrome.** The design mocks a sidebar + bottom tab bar; those belong to the existing app shell and are **out of scope** — this page must lay out correctly *within* the current shell on mobile and desktop.

---

## 4. Testing Strategy

Per the binding TDD methodology (tests precede implementation; RED → GREEN → refactor) and the two-project Vitest setup.

- **Entity aggregate (integration, real PG):** `getGameDetails` returns correct `journalCount`, `playtimeTotalMinutes` (sum, null-safe), and `recentSessionMinutes` ordering; anonymous viewer gets zeroed personal fields.
- **Mutation (integration, real PG):** `createJournalEntryFn` (or its worker) persists optional `playedMinutes`; omitted minutes leave it null; entry still records with empty content + no minutes.
- **Component (unit, jsdom)** — following the elements / actions / given-when-then shape, asserting **user-observable behavior** (not call-envelope shape):
  - Each panel renders its data and **collapses when its data is absent**; title-only worst case shows only hero + personal panels.
  - Times-to-beat panel shows the **benchmark line** when a benchmark is present and the **Your Pace** fallback when it is `null`.
  - "Log a session" opens the composer, accepts optional minutes, and on save the count/playtime/journal update (via mocked server fn + invalidate).
  - Status pill opens popover (desktop) / sheet (mobile), reflects current status, and triggers the mutation on select; not-in-library shows "Add to library".
  - Screenshot lightbox opens, navigates with arrows/keys, and closes on Esc.
  - Interactive rating sets/clears via `RatingInput`.
- **Regression floors:** keep `test/eslint/` (FSD boundary) and `test/canary/` harness sentinels intact; respect `eslint-plugin-boundaries`.
- **E2E:** deferred (consistent with current project posture).
