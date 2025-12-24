# Tasks: Architecture Consistency Refactoring

## Slice 0: IGDB Schema Validation Fixes (BLOCKING)

**Goal:** Fix overly strict Zod schemas that reject valid IGDB API responses.

**Priority:** 🔥 **CRITICAL** - App is currently broken due to validation failures.

**Context:** IGDB API does not always return all fields, but our schemas mark many optional fields as required, causing validation failures that break the app.

**Error observed:**
```
IGDB response validation failed
- release_dates[*].platform.human: Required (undefined received)
- game_modes: Required (undefined received)
- game_engines: Required (undefined received)
- player_perspectives: Required (undefined received)
- external_games: Required (undefined received)
- websites: Required (undefined received)
- similar_games: Required (undefined received)
```

- [x] **0.1: Fix IgdbGameDetails schema** `[nextjs-backend-expert]`
  - [x] Make `release_dates[].platform.human` optional (not all platforms have human-readable names)
  - [x] Make `game_modes` optional (not all games have this field)
  - [x] Make `game_engines` optional (not all games have this field)
  - [x] Make `player_perspectives` optional (not all games have this field)
  - [x] Make `external_games` optional (not all games have this field)
  - [x] Make `websites` optional (not all games have this field)
  - [x] Make `similar_games` optional (not all games have this field)
  - [x] Location: `data-access-layer/services/igdb/schemas/output.ts`

- [x] **0.2: Add defensive defaults in service layer** `[nextjs-backend-expert]`
  - [x] Ensure IgdbService handles undefined arrays gracefully (default to `[]`)
  - [x] Add nullish coalescing for optional nested properties

- [x] **0.3: Update related tests** `[testing-expert]`
  - [x] Update test fixtures to reflect actual IGDB API responses
  - [x] Add test cases for games with minimal data (no game_modes, no websites, etc.)

- [x] **0.4: Verify Slice 0 complete** `[nextjs-backend-expert]`
  - [x] Run `pnpm ci:check`
  - [x] Run `pnpm test`
  - [ ] Manual smoke test: search games, view game details for games with sparse data

---

## Slice 1: Repository Result Type Unification

**Goal:** Change Repository layer from `.ok` to `.success` pattern to align with Service/Handler layers.

- [ ] **1.1: Update Repository type definitions** `[nextjs-backend-expert]`
  - [ ] Change `RepositoryResult<T>` in `data-access-layer/repository/types.ts` from `.ok` to `.success`
  - [ ] Update `isRepositorySuccess()` helper function
  - [ ] Add `EXTERNAL_SERVICE_ERROR` to `RepositoryErrorCode` enum

- [ ] **1.2: Update all repository files** `[nextjs-backend-expert]`
  - [ ] Update `game-repository.ts` - change all `{ ok: true/false }` to `{ success: true/false }`
  - [ ] Update `library-repository.ts`
  - [ ] Update `user-repository.ts`
  - [ ] Update `platform-repository.ts`
  - [ ] Update `journal-repository.ts`
  - [ ] Update `review-repository.ts`
  - [ ] Update `imported-game-repository.ts`

- [ ] **1.3: Update all service consumers of repositories** `[nextjs-backend-expert]`
  - [ ] Update LibraryService `.ok` checks to `.success`
  - [ ] Update ProfileService `.ok` checks to `.success`
  - [ ] Update GameService `.ok` checks to `.success`
  - [ ] Update any other services calling repositories

- [ ] **1.4: Update repository tests** `[testing-expert]`
  - [ ] Update all test assertions from `.ok` to `.success`
  - [ ] Run `pnpm test` - all tests should pass

- [ ] **1.5: Verify Slice 1 complete** `[nextjs-backend-expert]`
  - [ ] Run `pnpm ci:check` (format, lint, typecheck)
  - [ ] Run `pnpm test` - all tests pass
  - [ ] Manual smoke test: app starts, game search works

---

## Slice 2: IgdbService Error Handling Standardization

**Goal:** Refactor IgdbService to return `ServiceResult<T>` instead of throwing errors.

- [ ] **2.1: Refactor IgdbService public methods** `[nextjs-backend-expert]`
  - [ ] Update `searchGamesByName()` to wrap in try/catch and return `ServiceResult`
  - [ ] Update `getGameDetailsBySlug()` to return `ServiceResult`
  - [ ] Update `getGameDetailsById()` to return `ServiceResult`
  - [ ] Update `getSimilarGames()` to return `ServiceResult`
  - [ ] Update `getFranchiseGames()` to return `ServiceResult`
  - [ ] Update `getPlatforms()` to return `ServiceResult`

- [ ] **2.2: Update IgdbService consumers (handlers)** `[nextjs-backend-expert]`
  - [ ] Update `game-search-handler.ts` to handle `ServiceResult`
  - [ ] Update `get-platforms-handler.ts` to handle `ServiceResult`

- [ ] **2.3: Update IgdbService consumers (use-cases)** `[nextjs-backend-expert]`
  - [ ] Update `get-game-details.ts` use-case
  - [ ] Update `get-franchise-games.ts` use-case
  - [ ] Update `add-game-to-library.ts` use-case

- [ ] **2.4: Update IgdbService tests** `[testing-expert]`
  - [ ] Update test mocks and assertions for new return types
  - [ ] Add tests for error handling paths

- [ ] **2.5: Verify Slice 2 complete** `[nextjs-backend-expert]`
  - [ ] Run `pnpm ci:check`
  - [ ] Run `pnpm test`
  - [ ] Manual smoke test: game search, game detail page, similar games

---

## Slice 3: GameDetailService Refactoring

**Goal:** Convert GameDetailService from standalone functions to class extending BaseService.

- [ ] **3.1: Create GameDetailService class** `[nextjs-backend-expert]`
  - [ ] Create new class structure extending `BaseService`
  - [ ] Add logger with `LOGGER_CONTEXT.SERVICE`
  - [ ] Move `populateGameInDatabase()` logic into class method
  - [ ] Return `ServiceResult<Game>` instead of `{ ok: boolean }`

- [ ] **3.2: Update GameDetailService consumers** `[nextjs-backend-expert]`
  - [ ] Update `get-game-details.ts` use-case to use new class
  - [ ] Update `add-game-to-library.ts` use-case to use new class
  - [ ] Remove old function export

- [ ] **3.3: Update GameDetailService tests** `[testing-expert]`
  - [ ] Update tests for class-based implementation
  - [ ] Add tests for error handling

- [ ] **3.4: Verify Slice 3 complete** `[nextjs-backend-expert]`
  - [ ] Run `pnpm ci:check`
  - [ ] Run `pnpm test`
  - [ ] Manual smoke test: add game to library flow

---

## Slice 4: Logger Consistency & PlatformService

**Goal:** Add missing loggers and fix logger contexts.

- [ ] **4.1: Add logger to PlatformService** `[nextjs-backend-expert]`
  - [ ] Add `private logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "PlatformService" })`
  - [ ] Add logging statements to key methods

- [ ] **4.2: Fix logger context in get-game-details.ts use-case** `[nextjs-backend-expert]`
  - [ ] Change from `LOGGER_CONTEXT.SERVICE` to `LOGGER_CONTEXT.USE_CASE`

- [ ] **4.3: Verify Slice 4 complete** `[nextjs-backend-expert]`
  - [ ] Run `pnpm ci:check`
  - [ ] Run `pnpm test`

---

## Slice 5: Feature Boundary Fixes - useGetPlatforms Hook

**Goal:** Move shared hook to proper location to fix cross-feature import.

- [ ] **5.1: Move useGetPlatforms hook** `[react-expert]`
  - [ ] Create `shared/hooks/game/` directory
  - [ ] Move `features/game-detail/hooks/use-get-platforms.ts` to `shared/hooks/game/`
  - [ ] Create barrel export in `shared/hooks/game/index.ts`
  - [ ] Update `shared/hooks/index.ts` to export from game/

- [ ] **5.2: Update imports** `[react-expert]`
  - [ ] Update `features/manage-library-entry/ui/add-entry-form.tsx`
  - [ ] Update `features/manage-library-entry/ui/entry-form.tsx`
  - [ ] Update any other importers in game-detail feature
  - [ ] Remove old file from game-detail/hooks/

- [ ] **5.3: Verify Slice 5 complete** `[react-expert]`
  - [ ] Run `pnpm ci:check` - ESLint boundaries should pass
  - [ ] Run `pnpm test`
  - [ ] Manual smoke test: library modal with platform selection

---

## Slice 6: Feature Boundary Fixes - Profile Components

**Goal:** Move shared profile components to proper location.

- [ ] **6.1: Move profile components to shared** `[react-expert]`
  - [ ] Create `shared/components/profile/` directory
  - [ ] Move `features/setup-profile/ui/avatar-upload.tsx` to `shared/components/profile/`
  - [ ] Move `features/setup-profile/ui/username-input.tsx` to `shared/components/profile/`
  - [ ] Create barrel export in `shared/components/profile/index.ts`
  - [ ] Update `shared/components/index.ts`

- [ ] **6.2: Update imports** `[react-expert]`
  - [ ] Update `features/profile/ui/profile-settings-form.tsx`
  - [ ] Update `features/setup-profile/ui/` to import from shared
  - [ ] Remove old files from setup-profile/ui/

- [ ] **6.3: Verify Slice 6 complete** `[react-expert]`
  - [ ] Run `pnpm ci:check` - ESLint boundaries should pass
  - [ ] Run `pnpm test`
  - [ ] Manual smoke test: profile settings page, profile setup flow

---

## Slice 7: Server Action Validation Standardization

**Goal:** Standardize all server actions to use `.safeParse()`.

- [ ] **7.1: Update auth server actions** `[nextjs-backend-expert]`
  - [ ] Update `features/auth/server-actions/sign-up.ts` to use `.safeParse()`
  - [ ] Update `features/auth/server-actions/sign-in.ts` to use `.safeParse()`
  - [ ] Add proper error handling for validation failures

- [ ] **7.2: Update browse-related-games server action** `[nextjs-backend-expert]`
  - [ ] Update `load-more-franchise-games.ts` to use `.safeParse()`
  - [ ] Move inline `LoadMoreSchema` to `features/browse-related-games/schemas.ts`

- [ ] **7.3: Verify Slice 7 complete** `[nextjs-backend-expert]`
  - [ ] Run `pnpm ci:check`
  - [ ] Run `pnpm test`
  - [ ] Manual smoke test: sign-in, sign-up, franchise games pagination

---

## Slice 8: Type Definition Cleanup

**Goal:** Centralize ActionResult type and move profile schemas.

- [ ] **8.1: Centralize ActionResult imports** `[nextjs-backend-expert]`
  - [ ] Remove local `ActionResult` definition from `update-library-status-action.ts`
  - [ ] Remove local `ActionResult` definition from `delete-library-item.ts`
  - [ ] Import `ActionResult` from `@/shared/lib/server-action` instead
  - [ ] Ensure `ActionResult` is exported from shared lib

- [ ] **8.2: Move profile schemas to features** `[nextjs-backend-expert]`
  - [ ] Move schemas from `shared/lib/profile/` to `features/profile/schemas.ts`
  - [ ] Update imports in `features/profile/server-actions/`
  - [ ] Update imports in `features/setup-profile/server-actions/`
  - [ ] Remove `shared/lib/profile/` directory

- [ ] **8.3: Verify Slice 8 complete** `[nextjs-backend-expert]`
  - [ ] Run `pnpm ci:check`
  - [ ] Run `pnpm test`

---

## Slice 9: Handler & Schema Cleanup

**Goal:** Fix exports, add rate limiting, clean up index files.

- [ ] **9.1: Export missing handler** `[nextjs-backend-expert]`
  - [ ] Add `export * from "./platform/get-unique-platforms"` to `handlers/index.ts`
  - [ ] Update API route to import from barrel file

- [ ] **9.2: Add rate limiting to library handler** `[nextjs-backend-expert]`
  - [ ] Add `checkRateLimit()` call to `get-library-handler.ts`
  - [ ] Match pattern from `game-search-handler.ts`

- [ ] **9.3: Clean up empty index files** `[nextjs-backend-expert]`
  - [ ] Check `features/game-detail/server-actions/index.ts`
  - [ ] Either populate with exports or remove if no server actions

- [ ] **9.4: Verify Slice 9 complete** `[nextjs-backend-expert]`
  - [ ] Run `pnpm ci:check`
  - [ ] Run `pnpm test`
  - [ ] Manual smoke test: library API endpoint

---

## Slice 10: Documentation & Final Verification

**Goal:** Update documentation and verify all acceptance criteria met.

- [ ] **10.1: Update CLAUDE.md files** `[nextjs-backend-expert]`
  - [ ] Update `savepoint-app/CLAUDE.md` if any patterns changed
  - [ ] Update `savepoint-app/features/CLAUDE.md` with boundary exceptions (if any remain)

- [ ] **10.2: Update architecture.md** `[nextjs-backend-expert]`
  - [ ] Update Result type patterns section (Repository now uses `.success`)
  - [ ] Document error code mapping between layers

- [ ] **10.3: Final verification** `[nextjs-backend-expert]`
  - [ ] Run `pnpm ci:check` - all checks pass
  - [ ] Run `pnpm test` - all tests pass
  - [ ] Run `pnpm build` - production build succeeds
  - [ ] Manual E2E test of critical flows
  - [ ] Verify ESLint boundaries: zero violations

- [ ] **10.4: Mark functional spec acceptance criteria complete** `[nextjs-backend-expert]`
  - [ ] Review each acceptance criterion in functional-spec.md
  - [ ] Mark all as complete
