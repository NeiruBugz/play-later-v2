# Technical Specification: Star Ratings

- **Functional Specification:** [`functional-spec.md`](./functional-spec.md)
- **Status:** Completed
- **Author(s):** Nail Badiullin

---

## 1. High-Level Technical Approach

Add a nullable integer rating column (1–10 encoding, half-steps ×2) to `LibraryItem`, exposed end-to-end through the existing four-layer pipeline (repository → service → server action). A new shared `RatingInput` UI primitive is the single interaction surface, reused on game detail (as an editor) and on the Library filter bar (as a min-rating selector). The authenticated Library page parses rating sort/filter from URL query params and delegates to the service layer. A new `RatingHistogram` widget on the profile Overview tab reads aggregated bins from an extension of `getProfileWithStats`. Privacy gating is inherited from Spec 009 — no new gate.

No new services are introduced. No new handler or use-case is required: profile data already flows through `features/profile/use-cases/get-profile-page-data.ts`, which will be extended; the rating mutation is a simple single-service server action.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Data Model / Database Changes

Add a single nullable column to `LibraryItem`. Values encode half-steps as integers (1 = 0.5 stars … 10 = 5.0 stars).

| Table         | Column   | Type   | Constraints                                                               | Purpose                              |
| ------------- | -------- | ------ | ------------------------------------------------------------------------- | ------------------------------------ |
| `LibraryItem` | `rating` | `Int?` | nullable; CHECK (`rating IS NULL OR rating BETWEEN 1 AND 10`); no default | Per-entry rating; `NULL` = unrated   |

**Indexes:**

- `@@index([userId, rating])` — supports `ORDER BY rating` and min-rating filter on a user's library. PostgreSQL treats `NULL` as largest by default; sort direction handles "unrated last" via `NULLS LAST` in query construction.

**Migration:** single Prisma migration, additive (nullable column + check + index). Zero backfill. No destructive operations → passes existing migration-validation CI gate.

**Note on naming collision:** The existing `Review.rating Int @default(0)` is an unused legacy stub. It is **not** touched by this spec. The Reviews spec (Phase 2B) will reconcile that model. Add a schema comment marking `Review.rating` as unused/legacy to avoid confusion.

**Per-playthrough forward path:** when Per-Playthrough Logs ship (also 2A), the library-entry rating remains as the aggregate/default; a per-playthrough rating will live on the playthrough table and a later spec will define override semantics.

---

### 2.2 Repository Layer

Extend `data-access-layer/repository/library-item/` (or equivalent directory):

| Method                                                                    | Responsibility                                                                                                 |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `setRating({ libraryItemId, userId, rating })`                            | Update `rating` where `id = libraryItemId AND userId = userId` (ownership-scoped). `rating = null` clears.     |
| `findManyForUser({ userId, sort, minRating, unratedOnly, ... })` (extend) | Add `minRating` / `unratedOnly` filters and `sort: "rating-desc" \| "rating-asc"` with `NULLS LAST`.           |
| `getRatingHistogram({ userId })`                                          | Return `{ rating: 1..10, count: number }[]` via `GROUP BY rating` where `rating IS NOT NULL`.                  |

Existing `findManyForUser` signatures that already accept filters get the two new params added optionally — no breaking change. All methods return `RepositoryResult<T>`.

---

### 2.3 Service Layer

Extend `data-access-layer/services/library/library-service.ts`:

| Method                       | Signature                                                                        | Notes                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `setRating`                  | `({ libraryItemId, userId, rating: number \| null }) → ServiceResult<void>`     | Zod-validates `rating` as `null` or integer in `[1, 10]`. Delegates to repo. |
| `getLibraryForUser` (extend) | Adds `minRating?`, `unratedOnly?`, `sort?: "rating-desc" \| "rating-asc" \| ...` | Passes through to repository.                                                |

Extend `data-access-layer/services/profile/profile-service.ts`:

| Method                                      | Change                                                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `getProfileWithStats` (extend return shape) | Add `ratingHistogram: { rating: number; count: number }[]` (10 entries, missing bins implied 0) and `ratedCount: number`.      |

No new use-case. Rating mutation is single-service. Profile histogram is read via the existing `get-profile-page-data` use-case, which composes `ProfileService` + `SocialService`.

---

### 2.4 Server Action

New file: `features/manage-library-entry/server-actions/set-library-rating.ts`

- Uses existing `authorizedActionClient` pattern.
- Zod schema: `{ libraryItemId: number.int().positive(), rating: number.int().min(1).max(10).nullable() }`.
- On success: calls `LibraryService.setRating`, `revalidatePath('/library')` and `revalidatePath(\`/u/${username}\`)` for the owner's profile.
- Barrel-exported from `features/manage-library-entry/index.server.ts`.

No API route / handler — mutation is consumed only from Server Components and Server Actions within owner-authenticated flows.

---

### 2.5 UI Components

#### 2.5.1 `RatingInput` — new shared primitive

Path: `shared/components/ui/rating-input.tsx` (client component).

Props:

| Prop         | Type                              | Purpose                                                                  |
| ------------ | --------------------------------- | ------------------------------------------------------------------------ |
| `value`      | `number \| null`                  | Current value (1–10 encoding) or `null` for unrated                      |
| `onChange`   | `(value: number \| null) => void` | Fires on commit (click) and on clear (re-click selected value)           |
| `size`       | `"sm" \| "md" \| "lg"`            | Sizing presets for card/detail/filter reuse                              |
| `readOnly`   | `boolean`                         | Render as display-only (used on library cards, histogram tooltips, etc.) |
| `aria-label` | `string`                          | Required for a11y                                                         |

Behavior: 5 star SVGs split into half-regions; hover reflects the half under the cursor; click commits; clicking the currently-committed value emits `null` (clear). Keyboard: `←`/`→` adjusts by 1 half-step, `Enter` commits, `Escape` clears. No internal network calls — purely controlled.

#### 2.5.2 Game Detail — rating editor

In `features/game-detail/ui/` (owner view only), wire `RatingInput` next to the status control. Optimistic-update wrapper: local state flips immediately, server action fires, failure reverts + toast.

#### 2.5.3 Library Card — rating display

In `widgets/game-card/` (or existing card-meta slot), conditionally render `<RatingInput value={rating} readOnly size="sm" />` when `rating !== null`. Hidden entirely when unrated.

#### 2.5.4 Library Page — sort/filter controls

In `features/library/ui/`, extend the existing filter bar:

- **Sort** `<Select>`: add options `rating-desc` ("Highest rated") and `rating-asc` ("Lowest rated").
- **Min-rating** control: `<RatingInput>` (interactive) paired with a "Clear" affordance.
- **Unrated only** `<Switch>`.

All three push to `router.replace` with updated query params; the page is a Server Component that reads `searchParams` and passes to the service.

#### 2.5.5 Profile Overview — `RatingHistogram` widget

New component under `features/profile/ui/rating-histogram.tsx`. Renders 10 bars using Tailwind; hover/tap surfaces count + rating. Hidden when `ratedCount < 5`. Consumes `ratingHistogram` data from `ProfilePageData`.

---

### 2.6 Data Flow Additions in Spec 009 Payload

`features/profile/use-cases/get-profile-page-data.ts` gets two additive fields on `ProfilePageData.stats`:

- `ratingHistogram: { rating: number; count: number }[]`
- `ratedCount: number`

Both are included in the same branches where existing `stats` is included (owner path and public-visitor non-private path) and omitted on private-visitor path — privacy gating is inherited, not duplicated.

Library items returned in the public Library tab payload gain a `rating: number | null` field so the public library cards can render stars.

---

### 2.7 URL State Contract (Library Page)

| Param         | Values                                        | Behavior                                                                                                            |
| ------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `sort`        | existing values ∪ `rating-desc`, `rating-asc` | Orders results; rating sorts use `NULLS LAST`                                                                       |
| `minRating`   | `1`–`10`                                      | Keeps entries with `rating >= minRating`                                                                            |
| `unratedOnly` | `1`                                           | Keeps entries with `rating IS NULL` only; mutually exclusive with `minRating` (server ignores `minRating` when set) |

No breaking change to existing `searchParams` consumers.

---

## 3. Impact and Risk Analysis

### System Dependencies

- **Spec 009 (Unified Profile):** extends `ProfilePageData` shape and public library payload — additive fields only, no consumer breakage.
- **`manage-library-entry` feature:** new server action added under existing conventions.
- **`library` feature:** extends existing sort/filter URL contract; requires one pass over library page Server Component.
- **`profile` feature:** extends `getProfilePageData` + adds one UI widget under Overview.
- **Prisma schema & CI migration gate:** additive change, passes destructive-op detection.

### Potential Risks & Mitigations

| Risk                                                                                        | Mitigation                                                                                                                                         |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing `Review.rating` naming collision creates confusion for future maintainers.         | Add schema comment marking `Review.rating` as legacy/unused; note in Reviews (2B) spec that it will be reconciled there.                           |
| Future Per-Playthrough Logs will need a migration path for ratings.                         | Document in functional spec's Out-of-Scope (already done). Library-entry rating remains the canonical default; later spec defines override.        |
| Float/half-step edge cases in UI (hover jitter, accidental double-click clearing a rating). | Treat "click on selected value" as the sole clear gesture; ignore any click within 150ms of last commit.                                           |
| Histogram query performance on large libraries.                                             | Indexed by `(userId, rating)`. Upper bound per user is ~few thousand entries — well within a single grouped query. No N+1 risk (single query).     |
| Optimistic-update divergence if server action fails silently.                               | Server action returns `ServiceResult`; client wrapper reverts local state and surfaces `sonner` toast on failure.                                  |
| Privacy leak: rating in public library payload for a private profile.                       | Rating inclusion follows the exact same branch as existing library preview / public library — no separate code path, so privacy gate is inherited. |
| URL param conflict: user sets both `minRating` and `unratedOnly=1`.                         | Service-layer precedence rule: `unratedOnly=1` wins; `minRating` is ignored. Documented in tech spec (§2.7) and asserted in repository unit test.  |

---

## 4. Testing Strategy

| Layer              | Test Type        | Coverage Focus                                                                                                                                                |
| ------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository         | Integration      | `setRating` (set / update / clear), `findManyForUser` with `minRating` + `unratedOnly` + `sort=rating-*`, `getRatingHistogram` grouping, NULLS LAST ordering  |
| Service            | Unit             | `LibraryService.setRating` Zod validation (null, 1, 10, 0, 11, 5.5 strings), ownership scoping, pass-through to repo                                          |
| Service            | Unit             | `ProfileService.getProfileWithStats` histogram shape and `ratedCount` math                                                                                    |
| Server Action      | Unit + component | Happy path, validation rejection, unauthenticated rejection, revalidation called with expected paths                                                          |
| Use-Case           | Unit             | `get-profile-page-data` includes `ratingHistogram` on owner + public-visitor paths, omits on private-visitor path                                             |
| Component          | Component        | `RatingInput` hover preview, click commit, re-click clears, keyboard nav, `readOnly` mode, a11y labels                                                        |
| Component          | Component        | `RatingHistogram` hidden below threshold, bar heights proportional to counts                                                                                  |
| Library page       | Component        | URL param round-trip for `sort=rating-desc`, `minRating=8`, `unratedOnly=1`                                                                                   |
| E2E (opt, Phase 2) | Playwright       | Owner rates a game on detail → sees it reflected on library card → sorts library by rating → histogram updates on profile                                     |

Coverage threshold remains 80% per ADR-009. Repository integration tests run against real PostgreSQL via Docker Compose.
