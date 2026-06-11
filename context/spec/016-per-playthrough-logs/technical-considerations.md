<!--
Architectural HOW for Per-Playthrough Logs. Structures & contracts, not implementations.
Grounded in the deployed savepoint-tanstack app (TanStack Start v1, C2 DAL, FSD).
Companion design handoff lives in ./design-handoff/ (DATA_MODEL.md, COMPONENTS.md, prototype/).
-->

# Technical Specification: Per-Playthrough Logs

- **Functional Specification:** [`functional-spec.md`](./functional-spec.md)
- **Design handoff:** [`design-handoff/`](./design-handoff/) — `README.md`, `DATA_MODEL.md`, `COMPONENTS.md`, `prototype/`
- **Status:** Completed
- **Author(s):** Nail Badiullin

> **Supersedes the May 2026 pre-migration tech spec** (which targeted the retired Next.js
> `savepoint-app`). This version targets the deployed **`savepoint-tanstack`** app: TanStack
> Start v1, the C2 two-layer DAL (entity queries throw `AppError`; feature `createServerFn`
> wrappers), FSD boundaries, Prisma/Neon, Better Auth. It also reflects four confirmed
> architectural decisions (see [§1](#1-high-level-technical-approach)).

---

## 1. High-Level Technical Approach

A new **`Playthrough`** entity hangs off `LibraryItem` (cascade-deleted). Each run carries
its own platform, run-state, dates, playtime, completion note, rating, and notes; journal
entries gain an optional `playthroughId`. The game-detail page's `YourRecordPanel` is
replaced by a new **`PlaythroughsPanel`** (aggregate band + spine timeline), a full-width
run-aware **`JournalFeed`** is added below the bento grid, and the hero
**`LibraryStatusSwitcher`** becomes run-derived with a manual-override escape hatch.

Four confirmed decisions drive the design:

1. **Status = persist-on-write + a manual flag.** `LibraryItem.status` stays the effective
   stored value. A new `statusIsManual` boolean records intent. Every playthrough
   create/update/delete recomputes `status` + `hasBeenPlayed` in the **same transaction**
   — unless `statusIsManual` is true. "Set manually" pins a status and sets the flag;
   "Follow my playthroughs" clears it and recomputes. (Strategy B from the handoff
   DATA_MODEL, extended with the override flag your functional spec §2.9 requires.)
2. **`RunMarker` = inline SVG** (the two rotated rects), tinted via `currentColor` /
   `--status-*` tokens. No `logo-mark.svg` asset exists in the repo; the marker is built as
   an `entities/playthrough/ui` atom, not extracted from `logo.svg`.
3. **Total playtime moves onto runs.** Aggregate playtime = `Σ Playthrough.playtimeMinutes`.
   "Log session" increments the chosen run's `playtimeMinutes` **and** writes a journal
   entry (same transaction). A one-time backfill seeds each played item's run playtime from
   its current `SUM(JournalEntry.playedMinutes)`. `TimesToBeatPanel`'s you-vs-benchmark math
   switches to the run sum.
4. **Profile timeline visibility = the existing binary `isPublicProfile`.** No new
   visibility column, no followers tier (functional spec §2.14 amended to match).

Affected systems: Prisma schema (+1 model, +2 enums, 2 modified models, 1 migration with
backfill), the `getGameDetails` aggregate, the game-detail route loader, the
`compose-journal-entry` feature, a new `manage-playthrough` feature, the game-detail widget
(panel swap + new timeline + feed + status rewire), the library-grid card (quick-add), and
the public-profile widget (timeline section).

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Data Model / Database Changes

**New enums**

| Enum | Values |
|---|---|
| `PlaythroughKind` | `FIRST`, `REPLAY` |
| `PlaythroughStatus` | `PLAYING`, `FINISHED`, `ABANDONED` |

**New model `Playthrough`** (key columns)

| Column | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `libraryItemId` | `Int` | FK → `LibraryItem.id`, `onDelete: Cascade`. **`LibraryItem.id` is `Int`** (autoincrement) — the handoff sample used `String`; use `Int` here. |
| `ordinal` | `Int` | 1-based per library item; `@@unique([libraryItemId, ordinal])` |
| `kind` | `PlaythroughKind @default(REPLAY)` | first run coerced to `FIRST` server-side |
| `status` | `PlaythroughStatus @default(PLAYING)` | |
| `platform` | `String?` | free string (`PS5/PS4/PC/Xbox/Switch`); promote to relation later if analytics need it |
| `startedAt` / `finishedAt` | `DateTime?` | `finishedAt` null while `PLAYING` |
| `playtimeMinutes` | `Int @default(0)` | minutes, matching `JournalEntry.playedMinutes` convention |
| `rating` | `Int?` | 1–10 scale (shown 0–5 half-stars) — same scale as `LibraryItem.rating` |
| `completion` | `String?` | "Platinum", "100%", "Story", … |
| `notes` | `String? @db.Text` | |
| `createdAt` / `updatedAt` | timestamps | |

Indexes: `@@index([libraryItemId])`, `@@unique([libraryItemId, ordinal])`.

**Modified `JournalEntry`** — add `playthroughId String?` + relation to `Playthrough`
(`onDelete: SetNull` so deleting a run detaches, never deletes, entries — functional spec
§2.7). Add `@@index([playthroughId])`.

**Modified `LibraryItem`** — add `playthroughs Playthrough[]` back-relation and
`statusIsManual Boolean @default(false)`. (`status`, `hasBeenPlayed`, `rating` already
exist.)

**Migration + backfill** (single migration; the app owns migrations now):
- Create enums, table, columns, indexes.
- Backfill **one `Playthrough` per played `LibraryItem`** (status `PLAYING` or `PLAYED`):
  - `ordinal = 1`, `kind = FIRST`
  - run `status`: `PLAYED → FINISHED`, `PLAYING → PLAYING`
  - `playtimeMinutes = SUM(JournalEntry.playedMinutes)` for that item
  - `rating = LibraryItem.rating`, `startedAt = LibraryItem.startedAt`,
    `finishedAt = LibraryItem.completedAt`, `platform = LibraryItem.platform`
  - re-point that item's `JournalEntry.playthroughId` to the new run
- Leave `WISHLIST / SHELF / UP_NEXT` items with **zero** runs and `statusIsManual = false`
  (status stays manual until a run is started).
- Backfill is **destructive-data-adjacent** → must pass the CI migration validation
  (schema-drift + destructive-op detection). Write it as data SQL in the migration, idempotent.

> Migration risk + verification covered in [§3](#3-impact-and-risk-analysis) and
> [§4](#4-testing-strategy).

### 2.2 Status derivation (pure functions)

Location: `entities/library-item/model/derive-status.ts` (co-located with existing
`status.ts` / `getUpNextLabel`). Pure, unit-tested, no Prisma.

```
deriveLibraryStatus(runs, manualPrePlay):
  runs empty            → manualPrePlay              // WISHLIST | SHELF | UP_NEXT
  any run PLAYING       → PLAYING
  any run FINISHED      → PLAYED
  else (ABANDONED-only) → PLAYED                     // confirmed: "experienced it"

deriveHasBeenPlayed(runs): any run FINISHED or ABANDONED
```

`getUpNextLabel(hasBeenPlayed)` is unchanged; `hasBeenPlayed` now flows from runs.

**Persistence rule (Strategy B + flag):** a shared helper
`syncLibraryStatusFromRuns(tx, libraryItemId)` runs inside each playthrough mutation's
transaction: reads the item's runs + `statusIsManual`; if `!statusIsManual`, writes
`status = deriveLibraryStatus(runs, status)` and `hasBeenPlayed = deriveHasBeenPlayed(runs)`.
If `statusIsManual`, it only updates `hasBeenPlayed` (a fact about runs) and leaves `status`.

### 2.3 Aggregate selector

Location: `entities/playthrough/model/aggregate.ts` (pure; the seed for future Aggregate
Game Stats / Reviews — keep the math here, not in the panel).

`aggregatePlaythroughs(runs) → { totalPlaytimeMinutes: Σ, count, bestRating: max(rating),
completion: first "Platinum" else first non-null completion }`.

### 2.4 Entity queries — `entities/playthrough/api/*.server.ts`

Plain async, direct Prisma, throw `AppError`. Ownership/privacy invariants live here
(throw `NotFoundError` for missing-or-not-yours — anti-enumeration). All writes that touch
runs call `syncLibraryStatusFromRuns` in the same `prisma.$transaction`.

| File | Responsibility |
|---|---|
| `get-playthroughs.server.ts` | by `libraryItemId`, `include` journal entries, order `ordinal desc`; ownership-gated |
| `create-playthrough.server.ts` | assign next `ordinal` (max+1); coerce 2nd `FIRST`→`REPLAY`; sync status |
| `update-playthrough.server.ts` | partial patch by id; ownership check (two-step); sync status; map Prisma constraint errors in this one place |
| `delete-playthrough.server.ts` | ownership check; delete (journal entries detach via `SetNull`); sync status; ordinals may keep gaps (documented) |
| `set-library-status-manual.server.ts` | pin `status` + `statusIsManual = true` (the override) |
| `clear-library-status-manual.server.ts` | `statusIsManual = false` + recompute (follow runs) |
| `get-profile-playthroughs.server.ts` | recent runs for a userId, gated on target user's `isPublicProfile`; joined to game (§2.9) |

> The status-manual toggles could instead extend `update-library-item` — but a dedicated
> pair keeps the override intent explicit and independently testable. Decide at task time.

### 2.5 Feature server functions (`features/<intent>/api/<fn>.ts`, NO `.server` suffix)

`createServerFn` wrappers: `.inputValidator(zod)` + handler re-parse (validate-twice),
`requireUserId()`, delegate to entity queries, `router.invalidate()` client-side after.

| Feature | Server fns | Notes |
|---|---|---|
| `manage-playthrough` ★NEW | `createPlaythroughFn`, `updatePlaythroughFn`, `deletePlaythroughFn`, `setLibraryStatusManualFn`, `clearLibraryStatusManualFn` | IDs: `z.string().min(1)` for run id; `libraryItemId` is `z.number().int()` |
| `compose-journal-entry` ★MODIFY | extend `createJournalEntryFn` input with `playthroughId?: string` | in the same transaction add `playedMinutes` to that run's `playtimeMinutes`; validate the run belongs to the same item/user |

**Worker-split (foot-gun #8):** `createPlaythroughFn` (ordinal assignment + status sync in a
transaction) and the modified journal create (entry + run increment in a transaction) do
non-trivial multi-step DB work → give them `.worker.ts` companions and integration-test the
worker directly. `update`/`delete`/the status toggles are thin enough to test at the entity
layer; revisit per-fn at task time.

### 2.6 Route loader — extend the aggregate, don't add subset queries

The "no specialized subset query" rule applies: **fold playthroughs into `getGameDetails`**
rather than adding a parallel `getPlaythroughsForPage` read. Extend the `GameDetails` return
shape (`entities/game/api/get-game-details.server.ts`):

| New/changed field | Type | Use |
|---|---|---|
| `playthroughs` | `PlaythroughWithEntries[]` (ordinal desc, journal entries included) | `PlaythroughsPanel`, `JournalFeed` |
| `playtimeTotalMinutes` | `number` (CHANGED source) | now `Σ playthroughs.playtimeMinutes` (was `SUM(playedMinutes)`) → feeds `TimesToBeatPanel` |
| `derivedStatus` | `LibraryItemStatus` | `deriveLibraryStatus(runs, libraryEntry.status)` |
| `statusIsManual` | `boolean` | from `libraryEntry` |
| `hasBeenPlayed` | `boolean` | `deriveHasBeenPlayed(runs)` (or read persisted) |

`recentSessionMinutes` / `playtimeSessionCount` (the spec-023 rhythm chart) stay
journal-derived — unchanged. The loader still routes through the tolerated loader-only
wrapper `getGameDetailPageDataFn` (foot-gun #2). Anonymous viewers (`userId` undefined) get
`playthroughs: []`.

### 2.7 Component breakdown (FSD)

```
entities/playthrough/                          ★NEW
  model/  run-status.ts (RUN_STATUS map), aggregate.ts, types.ts, zod schemas
  ui/     run-marker/ (inline SVG diamond), run-status-badge/, platform-pill/ (wraps
          existing PlatformBadgeItem from entities/game), index.ts
entities/library-item/model/derive-status.ts   ★NEW (pure)
entities/journal-entry/model/types.ts           ★MODIFY (+playthroughId, run label)

features/manage-playthrough/                    ★NEW
  api/   create|update|delete + status-toggle server fns (+ workers where noted)
  model/ form zod schema
  ui/    add-edit-playthrough-drawer/ (Sheet side="right"; SegmentedControl for
         Type/Platform/Status; date inputs; RatingInput; textarea)
features/compose-journal-entry/                 ★MODIFY (add run picker + playthroughId)

widgets/game-detail/ui/
  playthroughs-panel/        ★NEW  (replaces your-record-panel slot) — AggregateBand + timeline
  playthrough-timeline/      ★NEW  (spine; PlaythroughNode + AddPlaythroughNode)
  game-detail/               ★MODIFY (swap panel, mount full-width JournalFeed, rewire status)
  library-status-switcher/   ★MODIFY (run-derived read-only pill + "Set manually" override)
  your-record-panel/         ★REMOVE (after PlaythroughsPanel lands + tests migrated)

widgets/journal-feed/ (or extend journal-timeline)  ★NEW/MODIFY — full-width, run-aware
widgets/library-grid card                            ★MODIFY — "Add playthrough" quick-add → manage-playthrough drawer
widgets/<profile-overview>                           ★MODIFY — Playthroughs timeline section (public profiles only)
```

Each component follows the one-folder-per-component convention (`index.ts` /
`<name>.tsx` / `<name>.type.ts` / `<name>.test.tsx`), mirroring `about-panel/`.

**Reuse:** `RatingInput` (`shared/ui/rating-input`, `readOnly` for "Best rating"),
`PlatformBadgeItem` (`entities/game/ui/platform-badges`), `Sheet` / `Popover` / `Card
variant="flat"` / `Badge` / `Button` / `SegmentedControl` from `shared/ui`. (No `ToggleGroup`
exists — `SegmentedControl` is the segmented primitive.) Drawer entrance animation gated on
`prefers-reduced-motion`.

### 2.8 Status switcher rewire (hero)

`LibraryStatusSwitcher` (mounted in the hero, not the bento) gains run-awareness via the new
loader fields:
- **No runs** → existing interactive dropdown (Wishlist / On the Shelf / Up Next / Add to
  library); `getUpNextLabel` reads `hasBeenPlayed`.
- **Runs + `!statusIsManual`** → read-only `derivedStatus` pill + "Follows your
  playthroughs" caption (`GitBranch` icon) + a **"Set manually"** action → `setLibraryStatusManualFn`.
- **Runs + `statusIsManual`** → the manually-pinned status pill + "Set manually" caption +
  a **"Follow my playthroughs"** action → `clearLibraryStatusManualFn`.

### 2.9 Out-of-band surfaces

- **Library-card quick-add (§2.13):** add an "Add playthrough" action to the library-grid
  card that opens the `manage-playthrough` drawer over the library; `router.invalidate()`
  on save. Drawer state lifts to the library widget (mirrors how game-detail lifts `composeOpen`).
- **Profile timeline (§2.14):** `get-profile-playthroughs.server.ts` — recent runs for a
  userId, **gated on the target user's `isPublicProfile`** (throws/empties for denied),
  joined to game (cover/title/slug). New profile-widget section, hidden when empty. No new
  visibility column (binary `isPublicProfile`, per the confirmed decision).

---

## 3. Impact and Risk Analysis

**System dependencies**
- `getGameDetails` is the single aggregate feeding the page; changing its shape touches the
  route loader, `TimesToBeatPanel` (playtime source), and the (removed) `YourRecordPanel`.
- `compose-journal-entry` is shared by game-detail and elsewhere; adding `playthroughId`
  must stay **optional** so non-game / legacy callers are unaffected.
- The hero status switcher and the library card both call the same library mutations today;
  the run-derived rewire must not break the no-runs manual path.

**Risks & mitigations**

| Risk | Mitigation |
|---|---|
| **Playtime double-count** (run sum + journal sum both surfaced) | Single source after migration: aggregate sums **runs only**; journal `playedMinutes` is per-entry display, never re-summed into the total. Document in CONTEXT.md. |
| **Migration backfill data loss / drift** | Idempotent data SQL; backfill from `SUM(playedMinutes)` so no playtime is lost; verify against CI migration validation (drift + destructive-op gate); integration test asserts post-backfill invariants (one FIRST run per played item, entries re-pointed, playtime preserved). |
| **Status drift between derived and persisted** | Recompute inside every run mutation's transaction; `statusIsManual` is the only thing that suppresses recompute; unit-test the truth table + the manual-flag branches. |
| **`LibraryItem.id` is `Int`** (handoff samples used String) | FK typed `Int`; server-fn validators use `z.number().int()` for `libraryItemId`, `z.string().min(1)` for run `id`. |
| **`.server.ts` bundler boundary** | Entity queries are `.server.ts`; `manage-playthrough` server fns are **not** `.server.ts` (RPC bridge); loader keeps using the wrapper (foot-gun #2). |
| **Coverage gate (≥85% stmts on entities+features)** | New entity/feature code is the gated surface — TDD per slice (RED→GREEN), pure helpers (`derive-status`, `aggregate`) carry cheap high-value coverage. |
| **Scope creep via profile/library surfaces** | They reuse the same entity/feature; ship game-detail core first, then the two satellite surfaces as later slices. |

---

## 4. Testing Strategy

TDD per slice (tests precede implementation). Vitest two projects; integration uses real PG.

**Unit (`*.unit.test.ts`, mocked Prisma / pure):**
- `deriveLibraryStatus` truth table — empty→manual, any PLAYING→PLAYING, FINISHED→PLAYED,
  ABANDONED-only→PLAYED, mixed.
- `deriveHasBeenPlayed` → drives "Replay" label.
- `aggregatePlaythroughs` — total minutes, count, best rating, completion ("Platinum"
  preference, all-null → no badge).
- entity query unit tests with mocked Prisma: ordinal assignment, 2nd-FIRST→REPLAY coercion,
  ownership `NotFoundError`/`UnauthorizedError`, Prisma constraint mapping.

**Component (`*.test.tsx`, jsdom, element/action vocabulary, given/when/then):** verify
user-observable behavior, not call shape — `PlaythroughsPanel` empty vs populated, aggregate
band figures, timeline newest-first + marker state colors, drawer open/close + field
disabling (Finished disabled while PLAYING), status pill three states (no-runs interactive /
following read-only / manual + revert), run-aware `JournalFeed` run labels (+ legacy null
label omitted).

**Integration (`*.integration.test.ts`, real PG, sequential):** import the **worker**, not
the wrapper (foot-gun #8). Cover: create → ordinal + status sync (transaction); log-session
→ increments the right run's `playtimeMinutes` + sets `playthroughId` (one transaction);
delete run → entries detach (`playthroughId` null) and survive; manual override sticks across
a subsequent run write; **migration backfill** invariants. Aggregate selector exercised via
the extended `getGameDetails` integration test.

**E2E:** deferred (project-wide, post-cutover).
