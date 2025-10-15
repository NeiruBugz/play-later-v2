# Implementation Tasks: IGDB Integration Consolidation

**Specification:** [functional-spec.md](./functional-spec.md) | [technical-considerations.md](./technical-considerations.md)

**Status:** Ready for Implementation

**Last Updated:** 2025-10-09

---

## Overview

This task list breaks down the IGDB integration consolidation into **17 vertical slices**. Each slice delivers end-to-end functionality, ensuring the application remains runnable and testable after completion.

**Key Principles:**

- ✅ **Test-first approach**: Write tests before implementation
- ✅ **Incremental updates**: Update consumers as methods are migrated
- ✅ **Maintain coverage**: Verify ≥80% test coverage after each slice
- ✅ **Always runnable**: App is functional after every completed slice

**Testing Philosophy:**

- **Unit tests only**: We use comprehensive unit tests with realistic mock data from IGDB API responses
- **No integration tests**: External API integration tests are unreliable (data dependencies, rate limits, downtime) and don't provide sufficient value
- **Manual QA for validation**: Real integration with IGDB is verified through manual testing and E2E tests in staging environments
- **Contract testing**: If needed, we validate API response shapes match our types using captured real responses as fixtures

---

## Task List

### **Slice 0: Preparation & Infrastructure Setup**

Before migrating methods, set up testing infrastructure and remove circular dependency.

- [x] **Slice 0: Prepare testing infrastructure and remove circular dependency**
  - [x] Create `test/fixtures/igdb/` directory
  - [x] Create test fixture files:
    - [x] `top-rated-games.json`
    - [x] `game-details-1234.json`
    - [x] `game-search-zelda.json`
    - [x] `steam-lookup-success.json`
    - [x] `empty-response.json`
    - [x] `token-response.json`
    - [x] `screenshots-response.json`
    - [x] `similar-games-response.json`
  - [x] Create `test/utils/igdb-mocks.ts` with mock utilities (`mockFetchSuccess`, `mockFetchError`, `mockTokenFetchFailure`)
  - [x] Remove circular dependency: Delete `import igdbApi from "@/shared/lib/igdb"` from [data-access-layer/services/igdb/igdb-service.ts](../../../data-access-layer/services/igdb/igdb-service.ts) (line 5)
  - [x] Verify the app still builds: Run `pnpm build`

---

### **Slice 1: Migrate Game Name Search (First User-Facing Feature)**

Enable searching games by name through the service layer.

- [x] **Slice 1: Enable searching games by name through the service layer**
  - [x] Write unit tests for `searchGamesByName()` method:
    - [x] Test: Success case with valid game name
    - [x] Test: `INVALID_INPUT` error for empty name
    - [x] Test: `NOT_FOUND` error for no matches
    - [x] Test: `API_ERROR` error for API failure
  - [x] Implement `searchGamesByName(params: SearchGamesByNameParams)` in `IgdbService`
  - [x] Add `SearchGamesByNameParams` and `SearchGamesByNameResult` types to [data-access-layer/services/igdb/types.ts](../../../data-access-layer/services/igdb/types.ts)
  - [x] Update all consumers that use `igdbApi.getGameByName()` to use the new service method
  - [x] Run full test suite to verify no regressions
  - [x] Verify app is runnable: `pnpm dev` and manually test game search functionality

---

### **Slice 2: Migrate Steam App ID Lookup (Critical for Steam Import)**

Enable Steam library import by migrating Steam app ID lookup.

- [x] **Slice 2: Enable Steam library import by migrating Steam app ID lookup**
  - [x] Write unit tests for `getGameBySteamAppId()` method:
    - [x] Test: Success case with valid Steam app ID
    - [x] Test: `INVALID_INPUT` error for invalid Steam app ID (0 or negative)
    - [x] Test: `NOT_FOUND` error when no IGDB game matches the Steam app ID
    - [x] Test: `API_ERROR` error for API failure
  - [x] Implement `getGameBySteamAppId(params: GetGameBySteamAppIdParams)` in `IgdbService`
  - [x] Add `GetGameBySteamAppIdParams` and `GameBySteamAppIdResult` types to [data-access-layer/services/igdb/types.ts](../../../data-access-layer/services/igdb/types.ts)
  - [x] Update all consumers that use `igdbApi.getGameBySteamAppId()` to use the new service method (especially Steam import features)
  - [x] Run full test suite
  - [x] Manual QA: Test Steam library import end-to-end to verify no regressions

---

### **Slice 3: Migrate Top-Rated Games (For Discovery/Homepage)**

Display top-rated games on homepage via the service layer.

- [ ] **Slice 3: Display top-rated games on homepage via the service layer**
  - [ ] Write unit tests for `getTopRatedGames()` method:
    - [ ] Test: Success case returning games sorted by rating
    - [ ] Test: Handle empty response gracefully
    - [ ] Test: `API_ERROR` error for API failure
    - [ ] Test: `TOKEN_ERROR` error when token fetch fails
  - [ ] Implement `getTopRatedGames()` in `IgdbService` (no parameters needed)
  - [ ] Add `TopRatedGamesResult` type to [data-access-layer/services/igdb/types.ts](../../../data-access-layer/services/igdb/types.ts)
  - [ ] Update all consumers that use `igdbApi.getGamesByRating()` to use the new service method
  - [ ] Run full test suite

---

### **Slice 4: Migrate Platform Search**

Enable platform search and filtering through the service layer.

- [ ] **Slice 4: Enable platform search and filtering through the service layer**
  - [ ] Write unit tests for `searchPlatformByName()` method:
    - [ ] Test: Success case with valid platform name
    - [ ] Test: `INVALID_INPUT` error for empty name
    - [ ] Test: `NOT_FOUND` error for no matches
    - [ ] Test: `API_ERROR` error for API failure
  - [ ] Implement `searchPlatformByName(params: SearchPlatformByNameParams)` in `IgdbService`
  - [ ] Add `SearchPlatformByNameParams` and `PlatformSearchResult` types to [data-access-layer/services/igdb/types.ts](../../../data-access-layer/services/igdb/types.ts)
  - [ ] Update all consumers that use `igdbApi.getPlatformId()` to use the new service method
  - [ ] Run full test suite

---

### **Slice 5: Migrate Game Screenshots**

Display game screenshots on detail pages via the service layer.

- [ ] **Slice 5: Display game screenshots on detail pages via the service layer**
  - [ ] Write unit tests for `getGameScreenshots()` method:
    - [ ] Test: Success case with valid game ID
    - [ ] Test: `INVALID_INPUT` error for null/invalid game ID
    - [ ] Test: Handle empty response (game has no screenshots)
    - [ ] Test: `API_ERROR` error for API failure
  - [ ] Implement `getGameScreenshots(params: GetGameScreenshotsParams)` in `IgdbService`
  - [ ] Add `GetGameScreenshotsParams` and `GameScreenshotsResult` types to [data-access-layer/services/igdb/types.ts](../../../data-access-layer/services/igdb/types.ts)
  - [ ] Update all consumers that use `igdbApi.getGameScreenshots()` to use the new service method
  - [ ] Run full test suite

---

### **Slice 6: Migrate Game Rating**

Display game aggregated ratings via the service layer.

- [ ] **Slice 6: Display game aggregated ratings via the service layer**
  - [ ] Write unit tests for `getGameAggregatedRating()` method:
    - [ ] Test: Success case with valid game ID
    - [ ] Test: `INVALID_INPUT` error for null/invalid game ID
    - [ ] Test: Handle missing rating data
    - [ ] Test: `API_ERROR` error for API failure
  - [ ] Implement `getGameAggregatedRating(params: GetGameAggregatedRatingParams)` in `IgdbService`
  - [ ] Add `GetGameAggregatedRatingParams` and `GameAggregatedRatingResult` types to [data-access-layer/services/igdb/types.ts](../../../data-access-layer/services/igdb/types.ts)
  - [ ] Update all consumers that use `igdbApi.getGameRating()` to use the new service method
  - [ ] Run full test suite

---

### **Slice 7: Migrate Similar Games Recommendations**

Display similar game recommendations via the service layer.

- [ ] **Slice 7: Display similar game recommendations via the service layer**
  - [ ] Write unit tests for `getSimilarGames()` method:
    - [ ] Test: Success case with valid game ID
    - [ ] Test: `INVALID_INPUT` error for null/invalid game ID
    - [ ] Test: Handle empty response (no similar games found)
    - [ ] Test: `API_ERROR` error for API failure
  - [ ] Implement `getSimilarGames(params: GetSimilarGamesParams)` in `IgdbService`
  - [ ] Add `GetSimilarGamesParams` and `SimilarGamesResult` types to [data-access-layer/services/igdb/types.ts](../../../data-access-layer/services/igdb/types.ts)
  - [ ] Update all consumers that use `igdbApi.getSimilarGames()` to use the new service method
  - [ ] Run full test suite

**Progress Checkpoint:** After Slice 7, all Phase 2 high-priority methods are migrated. Core features are fully functional with improved error handling and test coverage.

---

### **Slice 8: Migrate Game Genres**

Display game genres via the service layer.

- [ ] **Slice 8: Display game genres via the service layer**
  - [ ] Write unit tests for `getGameGenres()` method:
    - [ ] Test: Success case with valid game ID
    - [ ] Test: `INVALID_INPUT` error for null/invalid game ID
    - [ ] Test: Handle empty response
    - [ ] Test: `API_ERROR` error for API failure
  - [ ] Implement `getGameGenres(params: GetGameGenresParams)` in `IgdbService`
  - [ ] Add `GetGameGenresParams` and `GameGenresResult` types to [data-access-layer/services/igdb/types.ts](../../../data-access-layer/services/igdb/types.ts)
  - [ ] Update all consumers that use `igdbApi.getGameGenres()` to use the new service method
  - [ ] Run full test suite

---

### **Slice 9: Migrate Game Completion Times (HowLongToBeat)**

Display game completion times via the service layer.

- [ ] **Slice 9: Display game completion times via the service layer**
  - [ ] Write unit tests for `getGameCompletionTimes()` method:
    - [ ] Test: Success case with valid game ID
    - [ ] Test: `INVALID_INPUT` error for null/invalid game ID
    - [ ] Test: Handle missing completion time data
    - [ ] Test: `API_ERROR` error for API failure
  - [ ] Implement `getGameCompletionTimes(params: GetGameCompletionTimesParams)` in `IgdbService`
  - [ ] Add `GetGameCompletionTimesParams` and `GameCompletionTimesResult` types to [data-access-layer/services/igdb/types.ts](../../../data-access-layer/services/igdb/types.ts)
  - [ ] Update all consumers that use `igdbApi.getGameTimeToBeats()` to use the new service method
  - [ ] Run full test suite

---

### **Slice 10: Migrate Game Expansions (DLCs)**

Display game expansions and DLCs via the service layer.

- [ ] **Slice 10: Display game expansions and DLCs via the service layer**
  - [ ] Write unit tests for `getGameExpansions()` method:
    - [ ] Test: Success case with valid game ID
    - [ ] Test: `INVALID_INPUT` error for null/invalid game ID
    - [ ] Test: Handle no expansions (empty response)
    - [ ] Test: `API_ERROR` error for API failure
  - [ ] Implement `getGameExpansions(params: GetGameExpansionsParams)` in `IgdbService`
  - [ ] Add `GetGameExpansionsParams` and `GameExpansionsResult` types to [data-access-layer/services/igdb/types.ts](../../../data-access-layer/services/igdb/types.ts)
  - [ ] Update all consumers that use `igdbApi.getGameDLCsAndExpansions()` to use the new service method
  - [ ] Run full test suite

---

### **Slice 11: Migrate Franchise Games**

Display franchise games via the service layer.

- [ ] **Slice 11: Display franchise games via the service layer**
  - [ ] Write unit tests for `getFranchiseGames()` method:
    - [ ] Test: Success case with valid franchise ID
    - [ ] Test: `INVALID_INPUT` error for null/invalid franchise ID
    - [ ] Test: Handle no franchise games (empty response)
    - [ ] Test: `API_ERROR` error for API failure
  - [ ] Implement `getFranchiseGames(params: GetFranchiseGamesParams)` in `IgdbService`
  - [ ] Add `GetFranchiseGamesParams` and `FranchiseGamesResult` types to [data-access-layer/services/igdb/types.ts](../../../data-access-layer/services/igdb/types.ts)
  - [ ] Update all consumers that use `igdbApi.getGameFranchiseGames()` to use the new service method
  - [ ] Run full test suite

---

### **Slice 12: Migrate Game Artworks**

Display game artworks via the service layer.

- [ ] **Slice 12: Display game artworks via the service layer**
  - [ ] Write unit tests for `getGameArtworks()` method:
    - [ ] Test: Success case with valid game ID
    - [ ] Test: `INVALID_INPUT` error for null/invalid game ID
    - [ ] Test: Handle no artworks (empty response)
    - [ ] Test: `API_ERROR` error for API failure
  - [ ] Implement `getGameArtworks(params: GetGameArtworksParams)` in `IgdbService`
  - [ ] Add `GetGameArtworksParams` and `GameArtworksResult` types to [data-access-layer/services/igdb/types.ts](../../../data-access-layer/services/igdb/types.ts)
  - [ ] Update all consumers that use `igdbApi.getArtworks()` to use the new service method
  - [ ] Run full test suite

---

### **Slice 13: Migrate Upcoming Releases**

Display upcoming game releases via the service layer.

- [ ] **Slice 13: Display upcoming game releases via the service layer**
  - [ ] Write unit tests for `getUpcomingReleasesByIds()` method:
    - [ ] Test: Success case with array of valid game IDs
    - [ ] Test: `INVALID_INPUT` error for empty array
    - [ ] Test: Handle no upcoming releases
    - [ ] Test: `API_ERROR` error for API failure
  - [ ] Implement `getUpcomingReleasesByIds(params: GetUpcomingReleasesByIdsParams)` in `IgdbService`
  - [ ] Add `GetUpcomingReleasesByIdsParams` and `UpcomingReleasesResult` types to [data-access-layer/services/igdb/types.ts](../../../data-access-layer/services/igdb/types.ts)
  - [ ] Update all consumers that use `igdbApi.getNextMonthReleases()` to use the new service method
  - [ ] Run full test suite

---

### **Slice 14: Migrate Gaming Events**

Display upcoming gaming events via the service layer.

- [ ] **Slice 14: Display upcoming gaming events via the service layer**
  - [ ] Write unit tests for `getUpcomingGamingEvents()` method:
    - [ ] Test: Success case returning events
    - [ ] Test: Handle empty response (no upcoming events)
    - [ ] Test: `API_ERROR` error for API failure
  - [ ] Implement `getUpcomingGamingEvents()` in `IgdbService` (no parameters needed)
  - [ ] Add `UpcomingGamingEventsResult` type to [data-access-layer/services/igdb/types.ts](../../../data-access-layer/services/igdb/types.ts)
  - [ ] Update all consumers that use `igdbApi.getEvents()` to use the new service method
  - [ ] Run full test suite

---

### **Slice 15: Migrate Event Logos**

Display event logos via the service layer.

- [ ] **Slice 15: Display event logos via the service layer**
  - [ ] Write unit tests for `getEventLogo()` method:
    - [ ] Test: Success case with valid event logo ID
    - [ ] Test: `INVALID_INPUT` error for null/invalid logo ID
    - [ ] Test: `NOT_FOUND` error when logo doesn't exist
    - [ ] Test: `API_ERROR` error for API failure
  - [ ] Implement `getEventLogo(params: GetEventLogoParams)` in `IgdbService`
  - [ ] Add `GetEventLogoParams` and `EventLogoResult` types to [data-access-layer/services/igdb/types.ts](../../../data-access-layer/services/igdb/types.ts)
  - [ ] Update all consumers that use `igdbApi.getEventLogo()` to use the new service method
  - [ ] Run full test suite

**Progress Checkpoint:** After Slice 15, all 18 methods from the legacy implementation are migrated. The application is fully functional with the new service layer, and all features have comprehensive test coverage.

---

### **Slice 16: Final Cleanup and Legacy Removal**

Remove legacy IGDB implementation and finalize consolidation.

- [ ] **Slice 16: Remove legacy IGDB implementation and finalize consolidation**
  - [ ] Run grep to verify no files import from `shared/lib/igdb.ts`: `grep -r "from.*shared/lib/igdb" --include="*.ts" --include="*.tsx"`
  - [ ] Run `pnpm typecheck` to ensure no TypeScript errors
  - [ ] Run `pnpm test:coverage` to verify ≥80% coverage for IGDB service
  - [ ] Run `pnpm build` to ensure production build succeeds
  - [ ] Delete [shared/lib/igdb.ts](../../../shared/lib/igdb.ts)
  - [ ] Delete `shared/lib/igdb.server-action.test.ts` (if it exists)
  - [ ] Verify `IgdbService` is exported from [data-access-layer/services/index.ts](../../../data-access-layer/services/index.ts)
  - [ ] Run full test suite one final time: `pnpm test`
  - [ ] Manual QA of all critical flows:
    - [ ] Game search functionality
    - [ ] Game detail page (screenshots, similar games, ratings, genres, artworks)
    - [ ] Steam library import end-to-end
    - [ ] Top-rated games on homepage/discovery page
    - [ ] Upcoming releases display
    - [ ] Gaming events display
  - [ ] Verify app is runnable and fully functional: `pnpm dev`

---

### **Slice 17: Documentation (Final Polish)**

Add comprehensive documentation for the IGDB service.

- [ ] **Slice 17: Add comprehensive documentation for the IGDB service**
  - [ ] Add JSDoc comments to all public methods in `IgdbService` class
  - [ ] Update [data-access-layer/services/README.md](../../../data-access-layer/services/README.md) with IGDB service usage examples
  - [ ] Add inline comment in [shared/types/igdb.ts](../../../shared/types/igdb.ts) explaining that custom response types are application-specific shapes built from `igdb-api-types` primitives
  - [ ] Verify all documentation is clear and helpful
  - [ ] Commit all documentation changes

---

## Success Criteria

This implementation is considered complete when:

1. ✅ **Zero legacy imports:** No files import from `shared/lib/igdb.ts` (verified by grep + TypeScript compiler)
2. ✅ **File deleted:** `shared/lib/igdb.ts` is removed from the codebase
3. ✅ **All methods migrated:** All 18 methods from legacy implementation are in `IgdbService`
4. ✅ **Test coverage maintained:** ≥80% coverage for `data-access-layer/services/igdb/` (enforced by Vitest)
5. ✅ **No regressions:** All existing IGDB-dependent features work as expected (verified by test suite + manual QA)
6. ✅ **Single entry point:** `IgdbService` exported from `data-access-layer/services/index.ts`
7. ✅ **Type consolidation:** All base IGDB types imported from `igdb-api-types`
8. ✅ **Improved error handling:** All methods return structured `ServiceResponse` with clear error codes
9. ✅ **No circular dependencies:** Service layer does not import from legacy implementation
10. ✅ **Build succeeds:** `pnpm build` completes without errors

---

## Useful Commands

```bash
# Development
pnpm dev                                    # Start dev server
pnpm build                                  # Production build

# Testing
pnpm test                                   # Run all tests
pnpm test:watch                             # Watch mode
pnpm test:coverage                          # Coverage report (≥80% required)
pnpm test data-access-layer/services/igdb   # Test IGDB service only

# Code Quality
pnpm typecheck                              # TypeScript validation
pnpm lint                                   # ESLint checks
pnpm code-check                             # All checks (format + lint + typecheck)

# Search for legacy imports
grep -r "from.*shared/lib/igdb" --include="*.ts" --include="*.tsx"
```

---

**Document Metadata:**

- **Version:** 1.0
- **Created:** 2025-10-09
- **Status:** Ready for Implementation
