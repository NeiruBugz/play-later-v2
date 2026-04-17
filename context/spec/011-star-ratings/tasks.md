# Tasks: Star Ratings (Spec 011)

Sliced for incremental, runnable delivery. Each slice leaves the app in a working, testable state.

---

- [x] **Slice 1: Persist + display a rating on game detail (read-only, manually seeded)**

  _Smallest visible value: schema accepts a rating; the game detail page renders it for a library entry. No input yet — values seeded via Prisma Studio for verification._

  - [x] Add nullable `rating Int?` column to `LibraryItem` with `CHECK (rating IS NULL OR rating BETWEEN 1 AND 10)` and `@@index([userId, rating])` in `prisma/schema.prisma`. Add comment to `Review.rating` marking it legacy/unused. Generate migration via `prisma migrate dev`. **[Agent: prisma-database]**
  - [x] Create `shared/components/ui/rating-input.tsx` as a controlled client component supporting `readOnly` mode only (display 5 stars with half-step precision from a 1–10 integer; render empty state when `value === null`). Include `size` prop and `aria-label`. **[Agent: react-frontend]**
  - [x] Wire `<RatingInput value={libraryItem.rating} readOnly size="md" />` into the owner section of `features/game-detail/ui/...` (next to the status control). Plumb `rating` through whatever read path already feeds the owner-side library entry. **[Agent: nextjs-fullstack]**
  - [x] Verify: run `pnpm --filter savepoint dev`, manually seed a `LibraryItem.rating` via Prisma Studio (e.g., 7 → 3.5 stars), open the game detail page, confirm stars render correctly; clear the rating to NULL and confirm empty state. Confirm `pnpm --filter savepoint typecheck && pnpm --filter savepoint test --project=unit` passes. **[Agent: testing]**

- [x] **Slice 2: Owner can set, change, and clear a rating from game detail**

  _Adds the full mutation path. End-to-end: click stars → optimistic update → server persists → reload reflects new value._

  - [x] Extend `data-access-layer/repository/library-item/...` with `setRating({ libraryItemId, userId, rating })` (returns `RepositoryResult<void>`, ownership-scoped). Add integration test covering set, update, clear, and ownership rejection. **[Agent: prisma-database]**
  - [x] Extend `data-access-layer/services/library/library-service.ts` with `setRating` method using a Zod schema (`rating: number.int().min(1).max(10).nullable()`). Add unit tests for validation rejections (0, 11, 5.5, NaN) and pass-through. **[Agent: typescript-test-expert]**
  - [x] Create `features/manage-library-entry/server-actions/set-library-rating.ts` using `authorizedActionClient`. On success call `revalidatePath('/library')` and `revalidatePath(\`/u/${username}\`)`. Barrel-export from `index.server.ts`. Add server-action test (happy path, validation rejection, unauthenticated rejection). **[Agent: nextjs-fullstack]**
  - [x] Extend `RatingInput` to support interactive mode: hover preview (left/right half of star), click-to-commit, click-on-current-value clears, keyboard nav (`←`/`→`/`Enter`/`Escape`). Ignore double-click within 150ms of last commit. Add component tests for hover/click/clear/keyboard/a11y. **[Agent: react-frontend]**
  - [x] Wire interactive `RatingInput` into game detail (owner only) with optimistic-update wrapper: local state flips immediately, server action fires, on failure revert + sonner toast. **[Agent: nextjs-fullstack]**
  - [x] Verify: in dev, rate a game from detail page, refresh, confirm persistence; clear rating; trigger a server-side error (temporarily throw in service) and confirm UI reverts and toast appears. Run `pnpm --filter savepoint test`. **[Agent: testing]**

- [x] **Slice 3: Rating displays on library cards (private + public)**

  _Cards everywhere — owner Library page and public `/u/{username}/library` — show the rating._

  - [x] Ensure `rating` is included in the payload returned by the owner's library data path and in the public Library tab payload (Spec 009 `getProfilePageData` and library-tab data fetcher). Verify additive shape. **[Agent: nextjs-fullstack]**
  - [x] In `widgets/game-card/...` (or existing meta slot), conditionally render `<RatingInput value={rating} readOnly size="sm" />` when `rating !== null`; render nothing when null. **[Agent: react-frontend]**
  - [x] Verify: with multiple library items at varied ratings (incl. one unrated), confirm cards render correct stars on `/library` and on `/u/{me}/library`. Visit a public profile other than your own (or use a seeded test user) and confirm public visibility. Confirm a private profile shows nothing. **[Agent: testing]**

- [x] **Slice 4: Sort and filter the owner's Library by rating (URL-addressable)**

  _Library page exposes Sort, Min-rating, and Unrated-only controls; state persists in URL._

  - [x] Extend `findManyForUser` in the library-item repository: optional `minRating`, `unratedOnly`, and `sort: "rating-desc" | "rating-asc"` with `NULLS LAST`. Service-layer precedence: `unratedOnly=1` wins over `minRating`. Add integration tests covering each combination + NULLS LAST ordering + precedence. **[Agent: prisma-database]**
  - [x] Extend `LibraryService.getLibraryForUser` to forward new params. Unit-test pass-through and precedence rule. **[Agent: typescript-test-expert]**
  - [x] In `features/library/ui/...` add controls to the existing filter bar: Sort `<Select>` adds `rating-desc` / `rating-asc`, Min-rating uses `<RatingInput>` (interactive) with a Clear button, `Unrated only` `<Switch>`. All three call `router.replace` with merged query params. **[Agent: react-frontend]**
  - [x] Update the Library page Server Component to read `searchParams.sort`, `searchParams.minRating`, `searchParams.unratedOnly` and pass to the service. Add component test for URL round-trip on each control. **[Agent: nextjs-fullstack]**
  - [x] Verify: in dev, set `?sort=rating-desc&minRating=8`, confirm only ≥4-star entries appear in descending order with unrated last; toggle `Unrated only`, confirm only nulls show; share the URL and confirm state restores on cold load. **[Agent: testing]**

- [x] **Slice 5: Rating Distribution histogram on profile Overview**

  _Profile Overview gains a 10-bar histogram, hidden below 5 rated entries, privacy-gated via Spec 009._

  - [x] Add `getRatingHistogram({ userId })` to the library-item repository: `GROUP BY rating` where `rating IS NOT NULL`, returns 10 bins. Add integration test (sparse + dense distributions, all-null user). **[Agent: prisma-database]**
  - [x] Extend `ProfileService.getProfileWithStats` return shape with `ratingHistogram` and `ratedCount`. Update existing unit tests to assert new fields without breaking other consumers. **[Agent: typescript-test-expert]**
  - [x] Extend `features/profile/use-cases/get-profile-page-data.ts` to surface `ratingHistogram` and `ratedCount` on `ProfilePageData.stats` for owner + public-visitor non-private branches; omit on private-visitor branch. Update use-case unit tests for all three branches. **[Agent: nextjs-fullstack]**
  - [x] Create `features/profile/ui/rating-histogram.tsx` rendering 10 Tailwind bars, hover/tap reveals count + rating, hidden when `ratedCount < 5`. Add component tests (threshold gate, proportional bar heights, a11y). **[Agent: react-frontend]**
  - [x] Mount `RatingHistogram` on the profile Overview tab in `app/u/[username]/(tabs)/page.tsx` (or appropriate route file), reading from `ProfilePageData`. **[Agent: nextjs-fullstack]**
  - [x] Verify: as owner with <5 ratings, confirm widget hidden; rate a 5th game, refresh, confirm widget appears with correct bars; visit public profile, confirm visible; flip `isPublicProfile=false` and visit as anon, confirm absent. Run full test suite. **[Agent: testing]**
