<!--
This document describes HOW to build the feature at an architectural level.
It is NOT a copy-paste implementation guide.
-->

# Technical Specification: Mindful Core Simplification

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Nail Badiullin (with prisma-database, tanstack-fullstack, react-frontend specialist input)

Paths are relative to `savepoint-tanstack/` unless noted.

---

## 1. High-Level Technical Approach

The change is a **model swap with a data migration**, followed by a rewrite of every surface that reads status.

1. **Schema.**
   - `LibraryItemStatus` becomes `WANT | PLAYING | DONE`, via an enum swap.
   - `LibraryItem` gains a queue position, an ownership flag, a private "done outcome", and prompt-dismissal timestamps.
   - `JournalEntry` gains a nullable prompt marker.
   - `user` gains a one-time notice flag.
   - One transactional migration converts all existing data in place (spec §2.12).
2. **Plays reuse the `Playthrough` table.**
   - A play is *open* when `finishedAt` is null, *ended* otherwise.
   - Invariant: a Playing game has exactly one open play; every other game has none.
   - Plays are opened and closed only as a side effect of status changes. Run-derived status, the manual override, and the playthrough CRUD UI are deleted.
3. **One status write path.**
   - Every status change (card, game page, bottom bar, log confirmation, Steam import) goes through a single entity query.
   - In one transaction, that query writes `status` and `statusChangedAt`, opens or closes the play, and maintains the Up Next queue.
   - It returns an undo snapshot that the client holds for 5 seconds.
4. **Up Next is a column, not a status.**
   - `upNextPosition` is 1..5. A per-user lock serializes every queue mutation.
5. **UI.**
   - A presentational status control and picker live in `entities/library-item/ui/`.
   - Mutations are wired in features (`manage-library-entry`, `up-next`, `add-game`, `done-follow-up`, `library-prompts`), and widgets compose them.
   - Optimistic updates come with rollback and undo toasts (sonner).
6. **Expand → contract.**
   - Legacy columns (`statusIsManual`, `hasBeenPlayed`, `startedAt`, `completedAt`, journal kind/mood/…, unused Playthrough columns) stay in the schema, unused, until a contract migration in the final slice.
   - **The enum swap itself is not backward compatible.** Rollback means restoring a Neon branch taken immediately before the deploy, not a Vercel revert alone. **Decided (2026-10-29):** Neon branch + migration dry run on it before `migrate:deploy`; the contract migration B is the final slice of this spec.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1. Data Model Changes

| Model | Field | Type / default | Purpose |
|---|---|---|---|
| LibraryItem | `status` | enum `LibraryItemStatus { WANT, PLAYING, DONE }`, default `WANT` | Replaces the 5 statuses (spec §2.1). |
| LibraryItem | `upNextPosition` | `Int?` (null = not queued) | Queue order 1..5 (§2.4). |
| LibraryItem | `isOwned` | `Boolean @default(true)` | Replaces Wishlist vs Shelf (§2.5). |
| LibraryItem | `doneOutcome` | enum `DoneOutcome { FINISHED, LET_GO }?` | Private "how it ended" (§2.7). Kept when the game leaves Done; pre-filled on the next Done. |
| LibraryItem | `whyPromptDismissedAt` | `DateTime?` | The "why" prompt dismissal is permanent (§2.8). |
| LibraryItem | `stayedPromptDismissedAt` | `DateTime?` | The "What stayed" dismissal counts only when it is ≥ `statusChangedAt`, so the prompt returns after a new Done without a reset write. |
| LibraryItem | `statusChangedAt` | existing, **now written on every status change** | Drives the activity-feed sort, the "since last Done" prompt logic, and undo restore. Not backfilled, so old edits don't look like status changes. |
| JournalEntry | `prompt` | enum `JournalPrompt { WHY, STAYED }?` | Marks a note as a prompt answer; the UI renders the question as its heading (§2.7, §2.8). |
| user | `statusModelNoticePending` | `Boolean @default(false)` | Set `true` for all existing users by the migration; "Got it" sets it to `false` (§2.12). New sign-ups default to `false`. |
| Playthrough | (no new columns) | — | Backing store for plays. Read `startedAt`, `finishedAt`, `playtimeMinutes` (Times to Beat still reads it). `kind`, `status`, `rating`, `completion`, `notes` become dead and are dropped in the contract migration. |
| LibraryItem | `@@unique([userId, gameId])` | new constraint | Removes the find-first race in `addGameToLibrary` (`entities/library-item/api/add-game-to-library.server.ts:18-23`). The migration must abort if duplicates exist; check on a Neon branch first. |

**Constraints and indexes**

- `@@unique([userId, upNextPosition])`, a plain unique index. Postgres treats NULLs as distinct, so unqueued rows don't collide. It can be expressed in Prisma, so there is no drift.
- `CHECK ("upNextPosition" BETWEEN 1 AND 5)`, added in raw SQL; Prisma does not diff checks.
- The `(userId, status)` index is rebuilt by the `ALTER COLUMN TYPE`. Verify it exists after migrating; an earlier migration lost it (`prisma/migrations/20251225102105_status_simplification`).
- The open-play invariant is enforced by a `SELECT … FOR UPDATE` lock on the LibraryItem row inside every status transaction. **Assumption:** no partial unique index on `(libraryItemId) WHERE finishedAt IS NULL`, because Prisma 7.6 drift behavior on partial indexes is unverified.

### 2.2. Migration Plan

There are two migration files.

**Migration A — `<ts>_mindful_core_model`** (one implicit transaction; no `ADD VALUE`, so the same-transaction enum limit doesn't apply). Steps run in this order, all reading **old** status values:

1. Create the enums `DoneOutcome` and `JournalPrompt`. Add the new columns.
2. **Queue.** For `status = UP_NEXT`, set `upNextPosition = row_number() OVER (PARTITION BY userId ORDER BY updatedAt DESC, id DESC)`. Then null any position > 5. This must run before any other write touches `updatedAt`.
3. Set `isOwned = false` where the status is `WISHLIST`.
4. Set `doneOutcome = LET_GO` where the status is `PLAYED`, the item has at least one run, and every run is `ABANDONED` (Played row only, per spec).
5. Set `rating = COALESCE(rating, MAX(run.rating))`.
6. **Plays.** The stored status is the truth, including for manual-override items.
   - Non-PLAYING items: close any open run with `finishedAt = COALESCE(finishedAt, updatedAt)`.
   - PLAYING items with several open runs: keep the latest open, close the rest.
   - PLAYING items with no open run: insert one open play with `startedAt = COALESCE(item.startedAt, updatedAt)` and `ordinal = max+1`.
   - Non-PLAYING items with no runs but with `startedAt`/`completedAt`: insert one ended play, so those dates survive in History. **Decided (2026-10-29)**, supporting "nothing is lost".
   - **Time played moves to logs (spec §2.16, 2026-11-04).** For every run whose `playtimeMinutes` exceeds the sum of `JournalEntry.playedMinutes` attached to it, insert one time-only note for the difference. The note is dated `COALESCE(finishedAt, updatedAt)` and carries the run's `gameId` and `playthroughId`. After this step, the sum of a game's notes' `playedMinutes` is the single source of "Time played", and `Playthrough.playtimeMinutes` is dead.
7. **Remap within the old enum.** `UP_NEXT` that was played before (`hasBeenPlayed` or any ended run) becomes `PLAYED`; any other `UP_NEXT` becomes `SHELF`. This works because `USING` cannot hold subqueries, and the queue column is already set.
8. **Enum swap**, following the precedent `20260325000001_library_status_data_migration`:
   - rename the type to `_old`;
   - create the new type;
   - drop the default;
   - `ALTER COLUMN TYPE … USING CASE` (WISHLIST/SHELF → WANT, PLAYING → PLAYING, PLAYED → DONE);
   - set default `WANT`;
   - drop `_old`.
9. Set `user.statusModelNoticePending = true` for all existing rows.
10. Add the unique indexes and the CHECK constraint, then verify the `(userId, status)` index.

**Idempotency.** The file is all-or-nothing. A re-run fails loudly on the missing old enum labels rather than corrupting data.

**Migration B — `<ts>_mindful_core_contract`** (final slice, after production verification) drops:

- `statusIsManual`, `hasBeenPlayed`, `startedAt`, `completedAt`;
- JournalEntry `kind`, `mood`, `tags`, `playSession`, `visibility`, `publishedAt`, and their enums;
- Playthrough `kind`, `status`, `rating`, `completion`, `notes`, `playtimeMinutes`, and their enums;
- LibraryItem `acquisitionType` and the `AcquisitionType` enum (spec §2.5, audit N8: nothing writes it);
- `statusModelNoticePending` — **Assumption:** only once the notice is no longer needed, possibly in a later release.

Until migration B lands, those fields stay in `schema.prisma`, unused, so `migrate dev` doesn't propose drops.

**CI note.** `migration-validation` (`.github/workflows/pr-checks-tanstack.yml:129-223`) only *warns* on destructive SQL and doesn't match `DROP TYPE` at all. Protection is therefore the backfill integration test (§4) plus a dry run on a Neon branch of production.

### 2.3. Entity Queries (`entities/*/api/*.server.ts`)

All entity queries share these rules:

- They take `userId` first.
- Ownership is checked with `findFirst({ id, userId })`. A missing row throws `NotFoundError` (anti-enumeration).
- Every queue mutation runs in an interactive `$transaction`.
- That transaction first takes `pg_advisory_xact_lock(hashtext(userId))`, which works on Neon's pooled URL.
- Positions are compacted with ≤5 sequential single-row updates in ascending order. For a swap, the moved rows are set to null first.

| Entity | Query | Contract |
|---|---|---|
| library-item | `setLibraryItemStatus(userId, id, to)` | Locks the item row, writes `status` and `statusChangedAt`. `→PLAYING`: leaves the queue (compacts) and opens a play. Leaving PLAYING closes the open play. Same status → no-op. Returns `{ item, undo: { snapshot: {status, upNextPosition, statusChangedAt, doneOutcome}, createdPlayId, closedPlayId } }`. |
| library-item | `restoreLibraryItem(userId, id, undo)` | Deletes `createdPlayId`, reopens `closedPlayId`, restores the snapshot. Re-inserts at `snapshot.upNextPosition` only if the queue has room (shifting later items down), otherwise leaves the item outside the queue. Returns `{ item, queueRestored }`. The snapshot is Zod-validated and the position clamped to 1..5. |
| library-item | `addToUpNext(userId, id)` | Appends at `count+1`. `ConflictError` code `UP_NEXT_FULL` at 5. `ValidationError` if the item is PLAYING. Idempotent if already queued. |
| library-item | `removeFromUpNext(userId, id)` | Clears the position and compacts the queue. |
| library-item | `moveInUpNext(userId, id, { direction } \| { toPosition })` | Swap or insert-shift; a no-op at the edges. Returns the full ordered `[{ id, position }]`. |
| library-item | `setOwnership(userId, id, isOwned)`, `setDoneOutcome(userId, id, outcome \| null)`, `setRating(userId, id, rating \| null)` | Single-field writes. |
| library-item | `dismissPrompt(userId, id, WHY \| STAYED)` | Writes the dismissal timestamp. |
| library-item | `addGameToLibrary(userId, gameId)` | Creates with `WANT`, `isOwned = true`. On P2002 (the new unique constraint) it returns the existing item. Returns `{ item, created }`. |
| library-item | `undoAddGame(userId, id)` | Guarded delete: the item must be created < 60 s ago and have no plays and no notes other than a `WHY` note. Deletes that note in the same transaction. Otherwise throws `ConflictError`. Fixes the palette bug where Undo deleted an existing item (`features/command-palette/api/remove-library-item-fn.ts:19-27`). |
| library-item | `getLibrary`, `getLibraryStatusCounts`, `getLibraryItemsByIgdbIds`, `getLibraryStats` | New filters: `status ∈ {WANT, PLAYING, DONE}`, `upNext` (ordered by position), `notOwnedOnly`, `minRating`. Counts are `{ WANT, PLAYING, DONE, upNext }`. The search lookup returns `{ status, upNextPosition }`. Stats are `{ want, playing, done }`. `doneOutcome` is never aggregated. `startedOnly`/`TOUCHED_STATUSES` are deleted. |
| library-item | `updateLibraryItem` | Status, `startedAt` and `completedAt` are removed from its input; it keeps platform and acquisition. |
| playthrough (folder name kept to reduce churn) | `getEndedPlays(userId, libraryItemId)` | Ended plays, newest first. Open and close are internal helpers used only by `setLibraryItemStatus`/`restoreLibraryItem`. **Deleted:** create/update/delete-playthrough (public), `sync-library-status`, `set/clear-library-status-manual`, `get-profile-playthroughs`, `shared/lib/derive-playthrough-status.ts`. |
| journal-entry | `createJournalEntry(userId, { gameId, content?, playedMinutes?, prompt? })` | Requires content or minutes; no run required. If a play is open, its `playtimeMinutes` is incremented. The game must be in the user's library (`NotFoundError`). Writes no kind or title. |
| journal-entry | `updateJournalEntry` / reads | Update takes content only. Reads return `prompt` and drop kind, title and mood. |
| profile | `acknowledgeStatusModelNotice(userId)` | Idempotent; sets the flag to `false`. |
| activity-feed | raw SQL (`entities/activity-feed/api/get-activity-feed.server.ts`) | The SQL has no status literals. It returns the status, and the widget maps it to "wants to play / is playing / is done with". The sort by `GREATEST(createdAt, statusChangedAt)` now works. |
| imported-game | `calculate-smart-status.ts` | `PLAYING` if Steam's last-played time is within 7 days of the import, otherwise `WANT`. The import goes through `setLibraryItemStatus`, so a PLAYING import opens a play. |

### 2.4. Server Function Contracts (`features/*/api/`)

Every server function is a `createServerFn` with `.inputValidator(zod)`, a re-parse in the handler, and `requireUserId()`. IDs are `z.string().min(1)`. Each splits into `*-fn.ts` + `*.worker.ts` (foot-gun #8).

| Fn | Slice | Input | Output | Errors |
|---|---|---|---|---|
| `setStatusFn` | `manage-library-entry` | `{ id, to }` | `{ status, upNextPosition, undo }` | NotFound |
| `undoStatusFn` | `manage-library-entry` | `{ id, undo }` | `{ status, queueRestored }` | NotFound, Validation |
| `setOwnershipFn` | `manage-library-entry` | `{ id, isOwned }` | `{ isOwned }` | NotFound |
| `addToUpNextFn`, `removeFromUpNextFn` | `up-next` (new) | `{ id }` | `{ position \| null }` | Conflict `UP_NEXT_FULL`, Validation, NotFound |
| `moveInUpNextFn` | `up-next` | `{ id, direction \| toPosition }` | `[{ id, position }]` | NotFound |
| `saveDoneFollowUpFn` | `done-follow-up` (new) | `{ id, outcome?, rating?, stayed? }` | `{ noteId? }` | NotFound, Validation |
| `answerPromptFn`, `dismissPromptFn` | `library-prompts` (new) | `{ id, kind, text? }` | `{ noteId? }` | NotFound, Validation |
| `addGameFn` | `add-game` | `{ igdbId }` | `{ libraryItemId, created, status, upNextPosition }` | Upstream, Validation |
| `undoAddGameFn` | `add-game` | `{ libraryItemId }` | `{}` | NotFound, Conflict |
| `logTimeFn` (replaces the create-journal-entry fn) | `compose-journal-entry` | `{ gameId, content?, playedMinutes? }` (at least one) | `{ noteId, offerMarkPlaying }` | Validation, NotFound |
| `acknowledgeNoticeFn` | `whats-new` | none | `{}` | Unauthorized |

**How some flows map onto these functions**

- The follow-up's **Undo** calls `undoStatusFn` with the undo payload returned by the Done transition. That payload includes the previous rating and outcome, and the follow-up Save hasn't run yet.
- "Mark as Playing" calls `setStatusFn`.
- "Put in Up Next" in the add confirmation calls `addToUpNextFn`.

**Deleted or merged**

- `manage-playthrough/*` is deleted.
- `setLibraryStatusManualFn` and `clearLibraryStatusManualFn` are deleted.
- The palette's `quick-add-to-library-fn.ts` and the search quick-add both merge into `addGameFn`.
- `remove-library-item-fn.ts`, which was used as an undo, is replaced by `undoAddGameFn`.
- The user-facing "Remove from library" stays in `manage-library-entry`.
- The status path of `updateLibraryItemFn` is removed.

### 2.5. Read Paths (loaders)

Read paths go through loader-safe `createServerFn`s, never a direct `.server.ts` import (foot-gun #2).

- **Library page.**
  - Input: `status: ALL | UP_NEXT | WANT | PLAYING | DONE`, `notOwnedOnly`, `minRating`.
  - The Up Next view is ordered by position.
  - The route search enum changes (`routes/_authed/library.tsx:8-10`).
- **Dashboard.**
  - The top 3 queued games, ordered by `upNextPosition`, replace the `updatedAt` rail (`features/dashboard/api/get-dashboard-page-data.worker.ts:65-126`).
  - The strip and stats bar show 3 counts.
- **Game detail.**
  - Data: `status`, `upNextPosition`, `isOwned`, `doneOutcome` (owner only), `rating`, and `history` (ended plays, omitted when empty).
  - `prompts: { why, stayed }`:
    - `why` = WANT, with no `WHY` note and no dismissal.
    - `stayed` = DONE, with no `STAYED` note created since `statusChangedAt` and no dismissal at or after it.
    - Neither is shown while PLAYING.
  - The derived status and "Best rating" are removed.
- **Search and palette.** The status plus `upNextPosition` drive the "Up Next #n" / "Replay" markers (`features/search-games/api/search-library-aware-games.worker.ts:24`).
- **Root loader.** Adds `statusModelNoticePending` for the signed-in user.

### 2.6. Component Breakdown (UI)

**Shared status config.** `entities/library-item/model/status.ts` stays the single source of truth. It is client-safe: no `.server` imports, and only a type import from Prisma. It exports:

- the status values and the Zod schema;
- label, icon and badge variant per status;
- `NEXT_STEP[status] → { label, target }`;
- `getQueueMarker({ status, upNextPosition })` → "Up Next #n" | "Replay";
- `getDoneLabel(outcome)`;
- `UP_NEXT_MAX = 5`.

Other entities (activity-feed) receive the status as data and the widget formats it, so there is no cross-entity import.

| Component | Path (new / changed / deleted) | Responsibility |
|---|---|---|
| `StatusPicker` | new `entities/library-item/ui/status-picker` | 3-option radio list. Popover on desktop (≥768 px), Sheet on phone. Presentational, `onSelect` callback. |
| `StatusControl` | new `entities/library-item/ui/status-control` | Status pill or label that opens the picker directly. Used by grid tile, list row, game page and phone bottom bar (replaces the scroll-to-hero in `widgets/game-detail/ui/game-detail-action-bar`). |
| `NextStepButton`, `QueueMarker`, `NotOwnedTag` | new `entities/library-item/ui/` | Next-step button, "Up Next #n"/"Replay" marker, "Not owned" tag. `NextStepButton` replaces `library-item-card-cta.tsx` / `library-item-card.utility.ts` and shows in both grid and list. |
| `useSetStatus` | `features/manage-library-entry/model` | Optimistic status change, undo toast, "queue full" undo message; opens `DoneFollowUp` on Done. |
| Card "⋯" menu | changed `features/manage-library-entry/ui/library-card-menu` | Removes the status submenu and "Add playthrough". Adds Put in / Remove from Up Next (hidden when Playing) and the ownership toggle. |
| `UpNextQueueList`, `useUpNext` | new `features/up-next/` | Numbered list. Move up/down hidden at the ends. Desktop drag (see §2.7). The full-queue message is keyed by `error.code`. |
| `NotOwnedOnlyToggle` | changed `features/filter-library` | Visible only with the Want filter. Filter types go 5 → All/Up Next/Want/Playing/Done. |
| `useAddGame`, `AddConfirmation` | changed `features/add-game/` | One add hook for the search page, add dialog, palette and the game-page "Add to library". Custom sonner toast (`toast.custom`, manual 8 s timer that pauses while the "why" input is focused or being typed in) with "why" + Save, Put in Up Next, and Undo (only when `created`). Live debounced search. The dialog stays open. "Add game" buttons on the dashboard and library open `?action=add-game` (`shared/lib/global-action.ts:14`). |
| `DoneFollowUp` | new `features/done-follow-up/ui` | Dialog (desktop) / Sheet (phone). Finished/Let go radio group (none selected), pre-filled rating, "What stayed". Save, Skip and Undo; closing = Skip; stays open on error. |
| `GamePrompts` | new `features/library-prompts/ui` | One-line prompt; Enter or Save to answer, × to dismiss; driven by the `prompts` flags. |
| Note composer | changed `features/compose-journal-entry/` | Text plus hours in 0.5 h steps. Save is enabled when either is set. The run picker and kind are removed (`log-session-content.tsx:130-172`). The log confirmation toast offers "Mark as Playing" when `offerMarkPlaying` is true. |
| `PlayHistory` | new `widgets/game-detail/ui/play-history` | Collapsed, read-only list of ended plays; not rendered when there are none. |
| Game-detail header | changed `widgets/game-detail/` | `StatusControl`, "Done · Finished/Let go" (editable), rating, `GamePrompts`, queue marker, ownership. **Deleted:** `library-status-switcher` three-state logic, `playthroughs-panel`, `playthrough-timeline`, `add-edit-playthrough-drawer`, the jump-spine playthroughs entry. |
| Status-model notice | changed `features/whats-new/` | Server-driven one-time dialog ("Got it" → `acknowledgeNoticeFn`), independent of the localStorage announcements. |
| Labels elsewhere | changed | Steam import picker and readable card badge (`features/steam-import/ui/*`), activity copy (`widgets/profile-activity-tab`), profile counts (`widgets/profile-overview`), dashboard strip/stats. The "Tried" chip, kind labels and `profile-playthroughs-section` are deleted. Status CSS vars go 5 → 3 (`styles.css:205-214,300-309`). |

**Composition.** Features never import sibling features (enforced by `eslint-plugin-boundaries`). Widgets compose them; for example the library card widget wires `manage-library-entry` together with `up-next`.

### 2.7. Logic Notes

- **Optimistic UI.** Each action follows this sequence:
  1. Snapshot the affected caches and patch the item, including queue shifts.
  2. Call the server function.
  3. On error, roll back and toast "Couldn't save. Try again."
  4. On settle, call `router.invalidate()` once.

  Mutations are scoped per game (mutation key) so rapid taps serialize. Reorder buttons are disabled while a move is in flight, and the client replaces its list with the server's ordered response.
- **Undo.** The client holds the snapshot and the server restores it under validation. There is no server-side token: the 5-second window is UI-only, and add-undo is server-guarded (60 s, no plays or notes).
- **Drag and drop.** **Decided (2026-10-29):** add `@dnd-kit/core` + `@dnd-kit/sortable`, pinned to exact versions.
  - They provide built-in keyboard sensors and screen-reader announcements, at ~15–20 KB gzip.
  - The sortable wrapper is lazy-loaded and rendered only on desktop in the Up Next view.
  - Move up/down stays at every size.
  - Native HTML5 drag was rejected: no keyboard support, poor accessibility.
- **Accessibility.**
  - The picker is a radio group with arrow keys, Enter, and Escape; focus returns to the trigger.
  - The control's aria-label states the current value ("Status: Want. Change").
  - Move buttons are labelled "Move {Game} up/down", and the new position is announced.
  - The add toast's input has an explicit label and does not steal focus.

### 2.8. UI Audit Additions (spec §2.3, §2.5, §2.6, §2.9, §2.11, §2.14–§2.19; `ui-audit/ui-audit.md`)

| Audit # | Change | Where |
|---|---|---|
| U1 | `_authed/profile.tsx` `beforeLoad` must not run for its child `profile.setup.tsx`. Either guard on the matched child route, or move setup out of the `profile` subtree (preferred: a sibling route `_authed/profile-setup`, keeping the URL via the route path). | `routes/_authed/profile.tsx:17-25` |
| U2, U3 | Add `<Outlet/>` (or flatten to non-nested file names) so the child routes render: `journal.$id`, `journal.new`, `journal.$id.edit` under `journal.tsx`, and followers/following under `u.$username.tsx`. | `routes/_authed/journal.tsx`, `routes/u.$username.tsx` |
| U4 | Stop returning run `notes` and `rating` in public profile reads now (slice 0); slice 8 later deletes the section. | `entities/playthrough/api/get-profile-playthroughs.server.ts:51-52`, `widgets/profile-overview/ui/profile-playthroughs-section` |
| U5 | Profile tiles link by `Game.slug`, not `Game.id`. | `widgets/profile-overview/ui/profile-overview/profile-overview.tsx:180` |
| U6 | One `RemoveFromLibraryDialog` (confirm, no typed title) in `features/manage-library-entry/ui`, used by the card menu, the game page and the details form. Replaces `delete-confirm.tsx`'s typed-title gate. | `library-card-menu.tsx:53-58`, `library-status-switcher.tsx:224-239`, `delete-confirm.tsx:30` |
| N1 | The phone game-page action bar is offset above the bottom nav (nav height + safe-area inset) with a z-index above page content. An E2E/DOM check: `elementFromPoint` at the bar centre returns the bar. | `widgets/game-detail/ui/game-detail-action-bar`, `widgets/app-bottom-nav` |
| N2, N19 | The desktop library gets the grid/list toggle, the rich list card with `NextStepButton`, and the min-rating / unrated filters that today live only in the mobile sheet. Desktop and mobile filter configs come from one shared definition. | `features/filter-library/ui/library-filters.tsx:100-172`, `mobile-filter-bar.tsx:90,118-138,199-205`, `widgets/library-page` |
| N3 | A "See all results" link in the add dialog and the palette navigates to `/games/search?q=<text>`. The route reads `q` from validated search params. | `features/add-game/ui/add-game-content`, `features/command-palette`, `routes/games.search.tsx` |
| N4 | One `GameNotesList` in `widgets/game-detail` (notes newest first, each linking to `/journal/$id`). Delete `journal-teaser.tsx` and the nested per-run note lists. | `journal-teaser.tsx:46`, `nested-journal.tsx:42-55`, `journal-feed.tsx:68-83` |
| N5, N6, N7 | **One Log form** = the global-action-host `log-session` content, opened as `?action=log-session[&game=<slug>]` from the nav, the sidebar, the game page "Log time" and the Journal "New note". `/journal/new` renders the same content full-page. Delete the minutes-based compose dialog and the text-only form. The picker: `getLoggableGames` returns the user's library items (Playing first, then by title) plus a client-side text filter. The list sits in a scroll container capped to the viewport; the header shows the chosen game's title and cover; on success it shows the 2.2 confirmation toast. The game page hides "Log time" unless the viewer owns the library item; `logTimeFn` already throws `NotFoundError` for games outside the library. | `widgets/global-action-host/ui/global-action-host.tsx:35`, `features/compose-journal-entry/*`, `game-detail-detail-rail.tsx:30-32`, `game-detail-action-bar.tsx:67-69` |
| N8 | Remove the Acquisition filter and its UI. The column is dropped in migration B. | `features/filter-library/lib/acquisition.ts:28-33` |
| N9, N14, N15, N16 | Home data drops `recentlyPlayed` and the stats card. It returns `{ playing[], upNextTop3[], counts }`, and the widget renders each game once. The empty state picks "Pick from Up Next" (→ `/library?status=UP_NEXT`) or "Add a game" (→ `?action=add-game`). The library desktop sidebar status list is removed; the chips stay. | `features/dashboard/api/get-dashboard-page-data.worker.ts:77`, `widgets/dashboard-page/*`, `library-filters.tsx:105-117` |
| N10 | **Time played = sum of the game's notes' `playedMinutes`** (after the migration A step 6 backfill). The session count = number of notes with `playedMinutes > 0`. One formatter `formatHours(minutes)` → "1.5 h" / "12 h" (≤1 decimal, trailing ".0" dropped) in `shared/lib/date.ts`, replacing the variants. Times to Beat / Your Pace read the same total. | `get-game-details.server.ts:98-132`, `shared/lib/date.ts:95-101`, `your-pace-panel.tsx:6-8`, `journal-feed.tsx:28-31` |
| N11 | The palette and add-dialog results use the same `getLibraryItemsByIgdbIds` lookup as the search page, returning `{ status, upNextPosition }`. | `features/command-palette`, `features/add-game` |
| N12, N13 | Journal reads sort and date by `createdAt`. The card shows `formatHours` and reads "{time} played" when there is no text. `updateJournalEntryFn` accepts `playedMinutes`, with validation "content or time". | `entities/journal-entry/api/get-journal.server.ts:21`, `journal-entry-card.tsx:20,41-53`, `edit-journal-entry-form.tsx:54-82` |
| N17 | Delete the lifecycle (backlog-age) strip from cards. The rating renders only when non-null. | `lifecycle-strip.utility.ts:91-109`, `library-item-card.tsx:122-125` |
| N18 | Log keeps its icon; Add uses a distinct icon. The desktop sidebar gains an "Add game" item (`?action=add-game`). The phone library FAB is repositioned or removed so it never overlaps card menus (Add stays reachable from the library header). | `app-bottom-nav.tsx:52`, `app-sidebar`, `library-page.tsx:374` |
| N20 | Remove the period counts from the Journal stats rail. | `journal-stats-rail.tsx:7-16` |
| N21 | Palette quick actions: "New note" → `?action=log-session`; delete the "Add game to library" action. | `command-palette.tsx:119-124`, `palette-quick-actions-group.tsx:18-36` |
| N22, N23 | Status badges use `whitespace-nowrap` with room reserved before the menu, and title case from `status.ts` (no `uppercase` class). A copy sweep applies the spec's "Words used in the app" table. "IGDB" is removed from user-facing strings. | `library-status-badge.tsx:6-10`, `search-games-results.tsx:157`, add dialog headings |
| T1 | `AddConfirmation` gets "Start playing", which calls `setStatusFn({ id, to: PLAYING })` (that opens a play). The palette result row offers the same confirmation, replacing its fixed "Add to Up Next". | `features/add-game/ui`, `features/command-palette/ui/game-result-item` |
| T2 | **Raised to slice 1.** `createJournalEntry`'s validation becomes "content or `playedMinutes`" with no run required. When a play is open it increments that play; otherwise it only stores `playedMinutes`. The Log sheet and compose dialog enable Save with time only, and the raw Zod error toast is replaced by the code → message map. | `features/compose-journal-entry/api/create-journal-entry-fn.worker.ts:15-18`, `entities/journal-entry/api/create-journal-entry.server.ts`, `compose-journal-entry-dialog.tsx:43,118` |
| T3 | Covered by removing the read-only "Follows your playthroughs" pill (slice 2). The details form (`LibraryModal`) loses its status select. | `widgets/game-detail/ui/library-status-switcher`, `features/manage-library-entry/ui/library-modal` |
| T4 | `JournalEntry.gameId` stays nullable. Journal reads take a `gameId \| "none" \| undefined` filter. The Journal gets a filter control listing "All", the games that have notes (one query), and "No game". The Log form allows no game only when `playedMinutes` is empty; server validation: `playedMinutes` requires `gameId`. | `entities/journal-entry/api/get-journal.server.ts`, `widgets/journal-timeline-page`, `features/journal-timeline` |
| §2.14 | User-facing error copy comes only from a code → message map (`getErrorMessage` from the shared primitives). Never render `error.message` from Zod or Prisma. | `shared/lib` error helpers |

---

## 3. Impact and Risk Analysis

**System dependencies.** Almost every surface reads status:

- library filter and counts;
- dashboard;
- library card and grid tile;
- game detail;
- search and palette;
- Steam import;
- profile;
- activity feed;
- Times to Beat / Your Pace (switches from run `playtimeMinutes` to the notes total, §2.8 N10).

About 17 source sites hard-code the 5 statuses (research notes), and 66 test files mention them. The Prisma enum change turns every stale source site into a compile error, which the typecheck gate catches.

| Risk | Mitigation |
|---|---|
| Migration mis-maps or loses data | Backfill integration test runs the real 026 SQL against seeded legacy rows (§4). Dry run on a Neon branch of production. Legacy columns are kept until the contract migration. |
| Rollback impossible after the enum swap | Take a Neon branch immediately before `migrate:deploy` (decided); the rollback runbook gets a note (`docs/cutover-rollback.md`). |
| Duplicate `(userId, gameId)` rows block the new unique constraint | Pre-check query on the Neon branch. If any are found, dedupe in the migration (keep the oldest, re-point notes) — **Assumption:** none exist, since app code already prevents them. |
| Queue exceeds 5 or positions collide under concurrent taps | Per-user advisory lock, in-transaction cap check, unique index as a backstop, sequential compaction. |
| Undo deletes a pre-existing item (existing bug) | `created` flag plus the guarded `undoAddGame`. |
| Undo after the queue filled up | `restoreLibraryItem` returns `queueRestored = false`, and the client shows the spec message. |
| Add toast with an input is awkward on phones (soft keyboard covers the toast) | Prototype on a real device early in the add slice. Fallback: an anchored panel or sheet with the same contract. |
| Status constants pulled into the client from server code | Constants live in `entities/library-item/model/` (non-`.server`). Never import Prisma enums as values into client code. The CI production build catches leaks. |
| Activity feed briefly sorted oddly | `statusChangedAt` is not backfilled, so old rows sort by `createdAt` as today. |
| Routing defects invisible to unit tests (audit: two parents without `<Outlet/>`, a self-redirect loop) | Add a router-level integration test that renders the real route tree with memory history and asserts the child routes render (journal note / new / edit, followers, profile setup), plus the Playwright smoke in each Verify task. |
| Time-played totals change for games whose run hours were entered without notes | The migration A step 6 backfill creates time-only notes for the difference; the migration test asserts each game's total before = after. |
| `(userId, status)` index dropped by the type change | An explicit verification step in migration A and an assertion in the migration test. |

---

## 4. Testing Strategy

Per-slice TDD, following the architecture doc §7.

- **First task: a `libraryItemFactory`** (plus a play factory) under `test/`. Tests seed inline today, and 66 files need rewriting, so the factory comes first so later slices don't fight over the same changes.
- **Migration integration test**, `test/integration/mindful-core-migration.integration.test.ts`.
  - Setup: apply all prior migrations, seed legacy-shaped rows with raw SQL, then **read and execute the real migration A file from disk** (no copied SQL, unlike `per-playthrough-backfill.integration.test.ts`).
  - Seed cases:
    - every row of spec §2.12;
    - 7 Up Next items;
    - Up Next played and unplayed;
    - Played with no runs, with only abandoned runs, and with mixed runs;
    - PLAYING with no runs and with two open runs;
    - a manual-override item;
    - a rating only on a run;
    - a run-less item with `startedAt`/`completedAt`;
    - a run with `playtimeMinutes` larger than its notes' minutes.
  - Asserted invariants:
    - row counts are unchanged;
    - ≤5 queued per user, with unique positions;
    - open plays = PLAYING items;
    - the `(userId, status)` index exists;
    - the notice flag is set for existing users;
    - each game's time played (old run minutes vs the new notes total) is unchanged.
- **Entity integration tests** (real PG), covering:
  - `setLibraryItemStatus` / `restoreLibraryItem`: play open/close, queue leave/restore, the full-queue undo;
  - the queue operations, including concurrent `addToUpNext` calls (two parallel transactions → exactly one `UP_NEXT_FULL`);
  - `addGameToLibrary` `created` semantics and the `undoAddGame` guard;
  - time-only `createJournalEntry` without a play;
  - the prompt-state rules.
- **Router integration test** (new, audit U1–U3): render the real `routeTree.gen` with memory history at `/journal/<id>`, `/journal/new`, `/journal/<id>/edit`, `/u/<name>/followers` and `/profile/setup` (a user without a username), and assert the child content renders and no redirect loops.
- **Server-fn worker tests.** Validate-twice, ownership `NotFoundError`, and error codes.
- **Component tests** (jsdom), covering user-observable behaviour as the acceptance criteria describe:
  - the picker has 3 options;
  - the next-step buttons;
  - the undo toast restores the status;
  - the queue numbering and move buttons hidden at the ends;
  - the "Not owned only" toggle visible only with Want;
  - the add confirmation timer pausing while typing;
  - the Done follow-up Skip/close/Undo;
  - the prompts dismiss;
  - Save enabled with time only;
  - History hidden when empty.
- **Gates.** Typecheck (catches stale enum sites), lint (FSD boundaries), the CI production build (bundler boundary), and coverage of statements ≥ 85 on `src/{entities,features}`.
- **Manual pass.** On a real phone: the bottom-bar picker, the add toast with the soft keyboard, the Done sheet. On desktop: drag reorder. Also the one-time notice across two devices.

**Delivery slices:** see [tasks.md](./tasks.md) — 13 slices, starting with the audit's broken paths (U1–U6) so first-run and note routes work before the model swap.
