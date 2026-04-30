# Technical Specification: Per-Playthrough Logs

- **Functional Specification:** [`functional-spec.md`](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Nail Badiullin

---

## 1. High-Level Technical Approach

Introduce `Playthrough` as a first-class child of `LibraryItem`: one row per distinct run of a game, owned by `User`, denormalised to `gameId` for cheap profile-feed and game-detail queries. Wire it through the standard four-layer stack (repository → service → use-case → server action / RSC) and surface it via a new FSD slice `features/playthroughs/` consumed by `manage-library-entry`, `game-detail`, `library`, `journal`, and `app/u/[username]/`.

The library-level rating from spec 011 stays canonical and untouched. Status transitions in `manage-library-entry` are the auto-create / wrap-up trigger points; per-playthrough writes never mutate `LibraryItem.status` or `LibraryItem.rating` automatically. Per-section profile visibility is introduced via a new dedicated enum column on `UserProfile`; this is forward-compatible enough for one section and deferred-decision for future ones.

The same migration aligns `LibraryItem.platform` with the new `Platform` FK so the data model is internally consistent. UI follows the existing dialog + form patterns from `manage-library-entry` (`EditEntryForm`, `PlatformCombobox`, `DateField`); cache invalidation follows the existing `setLibraryRatingAction` `revalidatePath` pattern — no new `cacheTag`.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Data Model Changes

#### New: `Playthrough`

| Column | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Cuid to match existing `Game.id` style |
| `libraryItemId` | `Int` | FK → `LibraryItem.id`, `onDelete: Cascade` |
| `userId` | `String` | Denormalised; FK → `User.id`, `onDelete: Cascade` |
| `gameId` | `String` | Denormalised; FK → `Game.id`, `onDelete: Cascade` |
| `platformId` | `String?` | FK → `Platform.id`, `onDelete: SetNull`. Nullable at DB level; service enforces presence on save (AC 2.1) |
| `startedAt` | `DateTime` | Date-only semantics; midnight UTC |
| `endedAt` | `DateTime?` | Null = in progress |
| `rating` | `Int?` | 1–10 with half-steps stored as ×2 (1–20), reusing spec 011's encoding |
| `note` | `String? @db.VarChar(280)` | Hard limit at DB level |
| `createdAt`, `updatedAt` | `DateTime` | Standard |

Indexes:
- `@@index([libraryItemId, endedAt])` — game detail timeline
- `@@index([userId, endedAt])` — public profile feed (newest-first)
- `@@index([userId, gameId, endedAt])` — open-playthrough lookup for wrap-up dialog

#### Modified: `JournalEntry`

| Change | Notes |
|---|---|
| `playthroughId String?` | New nullable FK → `Playthrough.id`, `onDelete: SetNull` (AC 2.7 — entries detach on playthrough delete) |
| `@@index([playthroughId])` | New |

#### Modified: `LibraryItem` (alignment migration)

| Change | Notes |
|---|---|
| Add `platformId String?` | FK → `Platform.id`, `onDelete: SetNull` |
| Backfill | `UPDATE LibraryItem SET platformId = Platform.id FROM Platform WHERE LibraryItem.platform = Platform.name` (case-insensitive). Unmatched rows keep `platformId NULL`; legacy free-text remains in `platform` column for one cycle |
| Drop legacy column | **Deferred to a follow-up cleanup migration** in a later spec to allow rollback. The legacy `platform String?` column is left in place but ignored by the application |

This keeps the alignment migration in scope without forcing an irreversible drop in the same release.

#### Modified: `User`

| Change | Notes |
|---|---|
| `playthroughsVisibility ProfileSectionVisibility @default(PUBLIC)` | New; lives on `User` next to `isPublicProfile` (the codebase has no separate `UserProfile` model — all profile fields are flat on `User`) |
| New enum `ProfileSectionVisibility { PUBLIC, FOLLOWERS, PRIVATE }` | Reusable shape for future per-section toggles |

The existing `User.isPublicProfile` boolean is preserved unchanged — `playthroughsVisibility` only matters when the profile itself is publicly viewable.

### 2.2 Repository Layer

New: `data-access-layer/repository/playthrough/playthrough-repository.ts`. Methods:

| Method | Purpose |
|---|---|
| `createPlaythrough(input)` | Insert |
| `findPlaythroughById(id)` | For ownership-checked reads/writes |
| `findPlaythroughsByLibraryItemId(libraryItemId)` | Game detail timeline |
| `findOpenPlaythroughsByUserAndGame(userId, gameId)` | Wrap-up dialog |
| `findRecentPlaythroughsByUserId(userId, { limit })` | Profile feed (joins `Game` for cover/title) |
| `updatePlaythrough(id, patch)` | |
| `deletePlaythrough(id)` | |

Returns mix per existing convention: `RepositoryResult<T>` for happy paths, `NotFoundError` thrown for ownership/missing rows. No business logic in this layer.

Extend `journal-repository.ts` to read/write the new `playthroughId` column; no new methods needed beyond column inclusion.

### 2.3 Service Layer

New: `data-access-layer/services/playthrough/playthrough-service.ts`, class `PlaythroughService`, returning `ServiceResult<T>`:

| Method | Notes |
|---|---|
| `createPlaythrough(userId, input)` | Validates platform belongs to game's `GamePlatform` set; rejects without platform |
| `wrapUpPlaythroughs(userId, [{ playthroughId, endedAt, platformId, rating?, note? }])` | Closes one or many in a single tx; rejects already-closed |
| `listForGame(userId, libraryItemId)` | |
| `listOpenForGame(userId, gameId)` | For wrap-up dialog |
| `listForUserPublic(userId, viewerId, { limit })` | Applies `playthroughsVisibility` + follow check |
| `update(userId, id, patch)` | Ownership-checked |
| `delete(userId, id)` | Ownership-checked; FK `SET NULL` cascades to journal |
| `getPlatformsForGame(gameId)` | Direct read, not a delegation to `LibraryService` (services-don't-call-services) |

Per ADR-008, `wrapUpPlaythroughs` is **not** orchestration on its own — it only touches `Playthrough`. The cross-service coordination happens in use-cases (§2.4).

### 2.4 Use-Cases

In `features/manage-library-entry/use-cases/`:

| Use-Case | Coordinates | Triggered by |
|---|---|---|
| `transition-status-to-playing` | `LibraryService.updateLibraryItem` + `PlaythroughService.createPlaythrough` (silent, dates=today, platform copied from most recent) | `updateLibraryStatusAction` when `next === "PLAYING"` |
| `transition-status-to-played` | `LibraryService.updateLibraryItem` + `PlaythroughService.wrapUpPlaythroughs` | `wrapUpPlaythroughAction` confirm path |

In `features/playthroughs/use-cases/`:

| Use-Case | Coordinates |
|---|---|
| `add-historical-playthrough` | `PlaythroughService.createPlaythrough` + (optional) `LibraryService.updateLibraryItem` to set status to `PLAYED` based on user's prompt answer (AC 2.6) |

Single-service calls (edit, delete, list, basic create from game detail "+") stay direct in their server action per ADR-008.

### 2.5 Server Actions

New, under `features/playthroughs/server-actions/`:

| Action | Input | Backed by |
|---|---|---|
| `createPlaythroughAction` | `{ libraryItemId, startedAt, endedAt?, platformId, rating?, note?, markGameAsPlayed?: boolean }` | `add-historical-playthrough` use-case if both dates set & flag true; otherwise direct `PlaythroughService.createPlaythrough` |
| `wrapUpPlaythroughAction` | `{ libraryItemId, closures: Array<{ playthroughId, endedAt, platformId, rating?, note? }> }` | `transition-status-to-played` use-case |
| `updatePlaythroughAction` | `{ id, ...patch }` | `PlaythroughService.update` |
| `deletePlaythroughAction` | `{ id }` | `PlaythroughService.delete` |
| `listOpenForGameAction` | `{ gameId }` | `PlaythroughService.listOpenForGame` (used by wrap-up dialog when opened) |

Modified: `features/journal/server-actions/create-journal-entry.ts` and `update-journal-entry.ts` accept optional `playthroughId`.

Modified: `features/manage-library-entry/server-actions/update-library-status-action.ts` — when target is `PLAYING` and no open playthrough exists, internally invokes `transition-status-to-playing` use-case. When target is `PLAYED`, the **client** intercepts and opens the wrap-up dialog before the action fires (existing pattern at `library-card-menu.tsx:66`).

All actions use `authorizedActionClient` and Zod input validation.

### 2.6 Cache Invalidation

After every playthrough mutation, server actions call:
- `revalidatePath(`/games/${slug}`)` — game detail
- `revalidatePath("/library")` — library cards (playthrough count)
- `revalidatePath(`/u/${username}`)` — public profile

No new `cacheTag` is introduced. User-specific data is not wrapped in `"use cache"` per the existing pattern in `getGameDetails`.

### 2.7 Component Breakdown (`features/playthroughs/`)

```
features/playthroughs/
├── ui/
│   ├── playthrough-form-dialog.tsx       # Add/edit (reuses PlatformCombobox, DateField, RatingInput)
│   ├── playthrough-row.tsx                # Single timeline row (status indicator, dates, platform, rating, note, actions menu)
│   ├── playthrough-timeline.tsx           # Game detail section: "Playthroughs" + rows + empty state
│   ├── wrap-up-playthrough-dialog.tsx     # Triggered on PLAYING→PLAYED
│   ├── delete-playthrough-confirmation.tsx
│   └── public-playthrough-feed.tsx        # Profile section
├── server-actions/                       # see 2.5
├── use-cases/
│   └── add-historical-playthrough.ts
├── hooks/
│   ├── use-playthroughs-for-game.ts       # client-side TanStack Query for forms (esp. journal picker)
│   └── use-playthrough-dialog.ts          # dialog state hook
├── schemas.ts                             # Zod (start/end ordering, note ≤280, rating ∈ {2..20})
├── types.ts
├── index.ts                               # client-safe barrel
└── index.server.ts                        # server actions / use-cases barrel
```

Consumer changes:
- `features/manage-library-entry/ui/library-card-menu.tsx` — new "Add playthrough" dropdown item; opens `playthrough-form-dialog`. Detect `next === "PLAYED"` and open `wrap-up-playthrough-dialog`.
- `features/game-detail/ui/` — add `<PlaythroughTimeline>` after journal section.
- `features/game-detail/use-cases/get-game-details.ts` — add `PlaythroughService.listForGame` to the parallel fanout; add `playthroughs` to `GameDetailsResult`.
- `features/journal/ui/journal-entry-form.tsx` — add "Playthrough (optional)" `Select` mirroring the existing library-item picker; add `playthroughId` to `schemas.ts`.
- `features/journal/ui/journal-entry-row.tsx` (or equivalent) — render "from playthrough #N — Platform, Mon YYYY" badge when `playthroughId` is set (AC 2.8).
- `features/profile/ui/` — new visibility toggle row in profile settings bound to `playthroughsVisibility`.
- `app/u/[username]/(tabs)/...` — render `<PublicPlaythroughFeed>` based on visibility flag computed in `getProfilePageData`.

### 2.8 FSD Allowlist Update

Add to `features/CLAUDE.md`:

| Feature | Authorized Consumers |
|---|---|
| `playthroughs` | `manage-library-entry/ui/`, `game-detail/`, `library/ui/`, `journal/ui/`, `profile/ui/`, `app/u/[username]/` |

---

## 3. Impact and Risk Analysis

### System Dependencies

- **`manage-library-entry`** — status transitions become orchestrated paths; existing direct `LibraryService.updateLibraryItem` calls in `update-library-entry-action` and `add-to-library-action` must be audited and routed through the new use-cases when status is `PLAYING` or `PLAYED` so auto-create / wrap-up logic doesn't drift.
- **`journal`** — schema and both create/update actions extended; existing entries unaffected (column nullable).
- **`game-detail`** — `getGameDetails` parallel fanout grows by one service call (not cached, per-request).
- **Public profile** — adds a new section conditional on the new visibility enum.
- **Spec 011 Star Ratings** — untouched. Library-level rating remains canonical; per-playthrough rating renders only inside the timeline row.

### Potential Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Auto-create logic drifts across multiple status-change call sites | Centralise in `transition-status-to-playing` use-case; all status writes route through it |
| Wrap-up dialog with multiple open playthroughs has tricky state | `wrapUpPlaythroughAction` accepts an array of closures; UI tested explicitly with the multi-open case |
| `LibraryItem.platform` migration backfill misses rows due to case/spelling differences | Backfill is best-effort case-insensitive match; unmatched rows keep `platformId = NULL` and remain functional. Drop of legacy `platform` column deferred |
| Per-playthrough rating accidentally becomes new canonical rating in some surface | Spec 011 surfaces (library card, profile rating histogram) read `LibraryItem.rating` only; per-playthrough rating constrained to `<PlaythroughRow>` — boundary enforced via component contract, not state |
| Public profile leak — user expects "Followers only" but follow check is wrong | `listForUserPublic` consults `social` follow relation server-side; integration test covers the three visibility states × three viewer roles |
| Profile visibility regression for users who upgrade with no setting | Default `PUBLIC` — same effective visibility as having no setting, so no change for existing public profiles |
| Migration is multi-step (new tables + alter + backfill) | Run as one Prisma migration; validation step in CI catches schema drift; no destructive op in this migration (legacy column kept) |
| Mismatch of repo result style (`RepositoryResult.ok` vs throws) | Follow `library-repository.ts` convention; document choice per method in code review |

### Out-of-Scope for Migration / Code Changes

- Dropping `LibraryItem.platform String?` (deferred to follow-up cleanup spec).
- Generalising `playthroughsVisibility` to a multi-section JSON column.
- Steam/PSN/Xbox playthrough import.
- Bulk playthrough operations.
- `playedMinutes` / hours tracking.

---

## 4. Testing Strategy

E2E coverage is excluded from this spec — the project's E2E pipeline needs to be re-stood-up before adding new flows is meaningful. The tests below cover the spec at unit / integration / component levels.

**Unit (`.unit.test.ts`):**
- `PlaythroughService` — happy paths, ownership rejection, validation (platform must belong to game, end ≥ start, note length, rating range), wrap-up against already-closed playthrough.
- `transition-status-to-playing` use-case — auto-create with platform inheritance; idempotent if an open playthrough already exists.
- `transition-status-to-played` use-case — single-close and multi-close paths; transactional rollback on partial failure.
- `add-historical-playthrough` use-case — Yes/No status follow-up branches.
- Zod schemas (forms + actions).

**Integration (`.integration.test.ts`):**
- `playthrough-repository` — full CRUD against real Postgres; cascade behaviour on `LibraryItem` delete; `JournalEntry.playthroughId` `SET NULL` on playthrough delete.
- Migration: backfill correctness for `LibraryItem.platformId` against representative fixture rows (matched + unmatched + case-mismatch).
- `listForUserPublic` matrix: visibility × viewer role (owner / follower / stranger / unauthenticated) — including verifying `PRIVATE` returns empty for non-owners.

**Component (`.test.tsx`):**
- `playthrough-form-dialog` — required platform, character counter at 280, date validation, submit disabled states.
- `wrap-up-playthrough-dialog` — single open vs multiple open; per-playthrough close fields.
- `playthrough-timeline` — order (open pinned, then end-date desc), empty state, edit/delete/end actions.
- `journal-entry-form` — playthrough picker shows None by default, lists newest-first, submit includes `playthroughId`.

**Coverage:** Maintain ≥80% threshold; new playthrough service/use-cases targeted at ~90% for critical paths (auto-create, wrap-up, deletion cascade).
