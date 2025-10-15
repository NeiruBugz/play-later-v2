# Technical Specification: IGDB Integration Consolidation

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Status:** Draft
- **Author:** Technical Architecture Team

---

## 1. High-Level Technical Approach

This refactoring consolidates two IGDB integration implementations into a single, well-tested service layer implementation. The legacy object-based API (`shared/lib/igdb.ts`) will be fully migrated to the modern class-based service (`data-access-layer/services/igdb/igdb-service.ts`), following our three-layer architecture pattern.

**Migration Strategy:**

- **Incremental method-by-method migration** with test-first approach
- **Break circular dependency** where new service imports from legacy code
- **Update consumers incrementally** as each method group is migrated and tested
- **Delete legacy only after verification** that all tests pass and no imports remain

**Architecture Alignment:**

```
Current (problematic):
Server Actions/Pages → IgdbService (3 methods) → Legacy igdbApi object → IGDB API
                     ↘ Legacy igdbApi object (25 methods, direct) → IGDB API

Target (consolidated):
Server Actions/Pages → IgdbService (28 methods, complete) → IGDB API
```

---

## 2. Proposed Solution & Implementation Plan

### Architecture Changes

**Service Layer Pattern:**

- `IgdbService` remains a **class-based service** (not singleton) that consumers instantiate as needed
- Follows the same pattern as `GameService`, `LibraryService`, etc.
- All methods return `ServiceResponse<TData>` (Result type pattern)
- Private methods handle token management, HTTP requests, and error normalization

**Token Management:**

- Instance-level token state (`this.token`, `this.tokenExpiry`)
- OAuth token refresh with 60-second safety margin before expiry
- Consumers should reuse the same `IgdbService` instance within a request context to benefit from cached tokens
- Note: Future enhancement could move to singleton or DI pattern if shared token state becomes necessary

**Error Handling:**
All methods validate inputs and return structured errors with these codes:

```typescript
type IgdbErrorCode =
  | "INVALID_INPUT" // Missing or invalid parameters (e.g., null gameId)
  | "TOKEN_ERROR" // Failed to fetch/refresh OAuth token
  | "API_ERROR" // IGDB API returned error response (4xx/5xx)
  | "NETWORK_ERROR" // Network/timeout issues
  | "NOT_FOUND" // Resource not found (empty response when ID expected)
  | "RATE_LIMIT" // Rate limit exceeded (429)
  | "PARSE_ERROR"; // Failed to parse API response JSON
```

---

### Method Migration Plan

**Phase 1: Core Infrastructure (Already Complete)**

- ✅ `fetchToken()` / `getToken()` - Private token management methods
- ✅ `request()` → `makeRequest()` - Private HTTP request wrapper
- ✅ `handleError()` - Inherited from `BaseService`
- **Action:** Remove circular dependency (`import igdbApi from "@/shared/lib/igdb"` on line 5 of igdb-service.ts)

**Phase 2: Primary Query Methods (High Priority - 10 methods)**
These are the most-used methods for game search, discovery, and Steam integration:

1. ✅ `search()` → `searchGames()` - Already migrated
2. ✅ `getGameById()` → `getGameDetails()` - Already migrated
3. ✅ `getPlatforms()` - Already migrated
4. `getGameByName(gameName: string)` → `searchGamesByName(gameName: string)`
   - Returns games matching exact or partial name
   - Used by: Manual game entry features
5. `getGameBySteamAppId(steamAppId: number)` → `getGameBySteamAppId(steamAppId: number)`
   - **Critical for Steam library import feature**
   - Looks up IGDB game by Steam store URL
6. `getGamesByRating()` → `getTopRatedGames()`
   - Returns top-rated games for discovery/homepage
   - Sorted by aggregated_rating descending
7. `getPlatformId(platformName: string)` → `searchPlatformByName(platformName: string)`
   - Search for platform ID by name (e.g., "PlayStation 5" → 167)
8. `getGameScreenshots(gameId: number)` → `getGameScreenshots(gameId: number)`
   - Fetch screenshot image IDs for gallery views
9. `getGameRating(gameId: number)` → `getGameAggregatedRating(gameId: number)`
   - Lightweight query for rating-only data
10. `getSimilarGames(gameId: number)` → `getSimilarGames(gameId: number)`
    - Recommendation feature

**Phase 3: Extended Metadata Methods (8 methods)**
These provide rich game details for detail pages and discovery:

11. `getGameGenres(gameId: number)` → `getGameGenres(gameId: number)`
12. `getGameTimeToBeats(gameId: number)` → `getGameCompletionTimes(gameId: number)`
    - HowLongToBeat data integration
13. `getGameDLCsAndExpansions(gameId: number)` → `getGameExpansions(gameId: number)`
14. `getGameFranchiseGames(franchiseId: number)` → `getFranchiseGames(franchiseId: number)`
15. `getArtworks(gameId: number)` → `getGameArtworks(gameId: number)`
16. `getNextMonthReleases(ids: number[])` → `getUpcomingReleasesByIds(ids: number[])`
17. `getEvents()` → `getUpcomingGamingEvents()`
18. `getEventLogo(id: number)` → `getEventLogo(id: Event["event_logo"])`

**Migration Process (per method):**

1. Write comprehensive unit tests for the method (success, error, edge cases)
2. Implement method in `IgdbService` class
3. Run tests to verify behavior matches legacy implementation
4. Update consumers (imports) to use new service method
5. Re-run all tests to ensure no regressions
6. Mark legacy method as deprecated with JSDoc comment
7. After all methods migrated and all consumers updated: Delete `shared/lib/igdb.ts`

**Method Naming Conventions:**

- More descriptive names for clarity (e.g., `getEvents()` → `getUpcomingGamingEvents()`)
- Consistent verb prefixes: `get*` for single item/specific query, `search*` for fuzzy search
- Keep domain context in name (e.g., `getGameArtworks()` not just `getArtworks()`)

---

### Component Breakdown

**Files to Create/Modify:**

**1. `data-access-layer/services/igdb/igdb-service.ts` (Primary work)**

- Add 18 new public methods (Phases 2-3)
- Remove `import igdbApi from "@/shared/lib/igdb"` circular dependency
- Add input validation using Zod schemas where appropriate
- Add JSDoc comments for each public method

**2. `data-access-layer/services/igdb/types.ts` (Extend interfaces)**

- Add method parameter types (e.g., `SearchGamesByNameParams`, `GetGameBySteamAppIdParams`)
- Add result types (e.g., `TopRatedGamesResult`, `GameExpansionsResult`)
- Update `IgdbService` interface to include all 21 public methods

**3. `data-access-layer/services/igdb/igdb-service.test.ts` (Comprehensive tests)**

- Extend existing test file with new test suites for each migrated method
- Follow **Given-When-Then** pattern for test structure:

  ```typescript
  describe("IgdbService", () => {
    describe("getGameBySteamAppId", () => {
      it("should return game when valid Steam app ID is provided", async () => {
        // Given: A valid Steam app ID and mocked IGDB response
        const steamAppId = 123456;
        const mockResponse = [{ id: 789, name: "Test Game" }];
        mockFetch(mockResponse);

        // When: We call getGameBySteamAppId
        const result = await service.getGameBySteamAppId({ steamAppId });

        // Then: We get a successful response with the game
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data.game.id).toBe(789);
        }
      });

      it("should return error when Steam app ID is invalid", async () => {
        // Given: An invalid Steam app ID (0)
        const steamAppId = 0;

        // When: We call getGameBySteamAppId
        const result = await service.getGameBySteamAppId({ steamAppId });

        // Then: We get an INVALID_INPUT error
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe("INVALID_INPUT");
        }
      });

      it("should return NOT_FOUND when game does not exist in IGDB", async () => {
        // Given: A valid Steam app ID but no IGDB match
        const steamAppId = 999999;
        mockFetch([]); // Empty response

        // When: We call getGameBySteamAppId
        const result = await service.getGameBySteamAppId({ steamAppId });

        // Then: We get a NOT_FOUND error
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe("NOT_FOUND");
        }
      });
    });
  });
  ```

- Use test fixtures from `test/fixtures/igdb/` for mocked responses
- Coverage target: ≥80% for all service methods

**4. `test/fixtures/igdb/` (New directory)**

- Create JSON fixture files for common IGDB responses:
  - `game-search-zelda.json` - Search results for "Zelda"
  - `game-details-1234.json` - Full game info response
  - `top-rated-games.json` - Top rated games list
  - `steam-lookup-success.json` - Successful Steam app ID lookup
  - `empty-response.json` - Empty array for NOT_FOUND cases
  - `token-response.json` - OAuth token response

**5. Consumer Files (8 files identified by grep - update incrementally):**

- `data-access-layer/services/game/game-service.ts`
- `data-access-layer/services/game/game-service.unit.test.ts`
- `data-access-layer/repository/game/game-repository.ts`
- `data-access-layer/services/igdb/game-search-service.ts`
- `data-access-layer/services/igdb/game-search-service.unit.test.ts`
- Other files as discovered during migration

**Update Pattern (per consumer file):**

```typescript
// Before (legacy import)

// After (service import)
import { IgdbService } from "@/data-access-layer/services";

import igdbApi from "@/shared/lib/igdb";

const game = await igdbApi.getGameById(123);
if (game === undefined) {
  throw new Error("Game not found");
}

const igdbService = new IgdbService();
const result = await igdbService.getGameDetails({ gameId: 123 });

if (!result.ok) {
  throw new Error(result.error.message);
}
const game = result.data.game;
```

**6. `shared/lib/igdb.ts` (Mark deprecated, then delete)**

- Phase 2-3: Add JSDoc `@deprecated` comments as methods are migrated
- Final step: Delete entire file after all consumers updated and tests pass

**7. `data-access-layer/services/index.ts` (Export update)**

- Verify `IgdbService` is exported (already should be)
- Ensure single entry point for all service imports

---

### Type Consolidation

**Current State Analysis:**

- `igdb-api-types` v0.2.0 is already installed and used in `shared/types/igdb.ts`
- Base IGDB entity types (Cover, Genre, Platform, etc.) are imported from `igdb-api-types`
- Custom response types (FullGameInfoResponse, SearchResponse, etc.) are defined in-house

**Decision:** **Keep custom response types** in `shared/types/igdb.ts`

**Rationale:**

- Custom types represent our **application-specific response shapes**, not raw IGDB API responses
- They combine multiple IGDB entities into cohesive structures (e.g., `FullGameInfoResponse` includes cover, genres, screenshots, similar_games)
- These are our **data contracts** used throughout the app—changing them would break consumer code
- They provide **type safety** for our specific use cases

**Action Items:**

- ✅ Keep `shared/types/igdb.ts` with custom response types
- ✅ Continue importing base entity types from `igdb-api-types` (already done)
- ✅ No additional type packages needed (requirement already satisfied)
- Document in `shared/types/igdb.ts` that these are app-specific shapes built from `igdb-api-types` primitives

---

### Logic / Algorithm

**Token Management (Already Implemented):**

```typescript
private async getToken(): Promise<string | null> {
  // If token exists and not expired (with 60s safety margin)
  if (this.token && getTimeStamp() < this.tokenExpiry) {
    return this.token.access_token;
  }

  // Otherwise, fetch new token
  const token = await this.requestTwitchToken();
  if (token) {
    this.token = token;
    this.tokenExpiry = getTimeStamp() + token.expires_in - 60; // 60s safety margin
    return token.access_token;
  }

  return null;
}
```

**Query Building Pattern (Using QueryBuilder):**
All methods use the existing `QueryBuilder` class to construct IGDB query strings:

```typescript
const query = new QueryBuilder()
  .fields(["name", "cover.image_id", "platforms.name"])
  .where("category = 0 & cover.image_id != null")
  .search("zelda")
  .limit(20)
  .build();
```

**Error Handling Pattern (Standard for all methods):**

```typescript
async getGameBySteamAppId(params: GetGameBySteamAppIdParams): Promise<ServiceResponse<GameBySteamAppIdResult>> {
  try {
    // 1. Input validation
    if (!params.steamAppId || params.steamAppId <= 0) {
      return this.createErrorResponse({
        code: "INVALID_INPUT",
        message: "Valid Steam app ID is required"
      });
    }

    // 2. Build query
    const steamUrl = `https://store.steampowered.com/app/${params.steamAppId}`;
    const query = new QueryBuilder()
      .fields(["name"])
      .where(`external_games.category = 1 & external_games.url = "${steamUrl}"`)
      .limit(1)
      .build();

    // 3. Make API request
    const response = await this.makeRequest<Array<{ id: number; name: string }>>({
      body: query,
      resource: "/games"
    });

    // 4. Handle empty response (NOT_FOUND)
    if (!response || response.length === 0) {
      return this.createErrorResponse({
        code: "NOT_FOUND",
        message: `No IGDB game found for Steam app ID ${params.steamAppId}`
      });
    }

    // 5. Return success
    return this.createSuccessResponse({
      game: response[0]
    });
  } catch (error) {
    // 6. Catch-all error handling
    return this.handleError(error, "Failed to fetch game by Steam app ID");
  }
}
```

---

## 3. Impact and Risk Analysis

### System Dependencies

**Directly Affected Components:**

1. **Service Layer:**
   - `data-access-layer/services/game/game-service.ts` - Uses IGDB for game search and metadata enrichment
   - `data-access-layer/services/igdb/game-search-service.ts` - Dedicated game search service (may be redundant after consolidation)

2. **Repository Layer:**
   - `data-access-layer/repository/game/game-repository.ts` - May use IGDB for lookups before database queries

3. **Features/Server Actions:**
   - Game search features
   - Steam library import feature (critical dependency on `getGameBySteamAppId`)
   - Game detail pages (screenshots, ratings, similar games)
   - Discovery/homepage (top-rated games, upcoming releases)

4. **Test Files:**
   - All test files that import from `shared/lib/igdb.ts` must be updated

**Dependency Update Strategy:**

- **Incremental updates** (method-by-method) aligned with migration phases
- Update consumers as each method group (Phase 2, then Phase 3) is migrated and tested
- Run full test suite after each consumer update to catch regressions early
- Use TypeScript compiler to identify remaining usages (`tsc --noEmit` will show errors after partial deletion)

---

### Potential Risks & Mitigations

**Risk 1: Behavioral Changes During Migration**

- **Likelihood:** Medium
- **Impact:** High (could break existing features like Steam import, game search)
- **Mitigation:**
  - Migrate implementation **as-is** without changing query logic, parameters, or field selections
  - Write comparison tests that verify new implementation produces identical output to legacy for same inputs
  - Use fixtures captured from real IGDB responses to ensure accuracy
  - Manual QA testing of critical flows (search, Steam import, game details) before marking complete

**Risk 2: Token State Management Issues**

- **Likelihood:** Low
- **Impact:** Medium (token refresh failures could cause intermittent API errors)
- **Context:** Legacy uses module-level state, service uses instance-level state
- **Mitigation:**
  - Document clearly that consumers should reuse `IgdbService` instances within a request context
  - Add integration test that verifies token refresh works across multiple method calls
  - Monitor token refresh frequency in logs to detect issues early
  - Future enhancement: Move to singleton or static token management if issues arise

**Risk 3: Incomplete Test Coverage**

- **Likelihood:** Medium
- **Impact:** High (regressions could go undetected)
- **Mitigation:**
  - Enforce ≥80% coverage threshold in CI (already configured in `vitest.config.ts`)
  - Run `pnpm test:coverage` before removing each legacy method
  - Block PR merge if coverage drops below threshold
  - Review coverage report to ensure all edge cases (null IDs, empty responses, API errors) are tested

**Risk 4: Breaking Changes in Consumer Code**

- **Likelihood:** Medium
- **Impact:** High (compilation errors, runtime failures)
- **Mitigation:**
  - Update consumers incrementally (not all at once)
  - Use TypeScript compiler to identify all usages before deletion
  - Run full test suite (unit + integration) after each consumer update
  - Add temporary wrapper functions if needed to maintain backward compatibility during transition

**Risk 5: Missing Methods During Migration**

- **Likelihood:** Low
- **Impact:** Medium (incomplete migration blocks legacy deletion)
- **Mitigation:**
  - Maintain checklist of all 25 methods from legacy implementation
  - Cross-reference with grep results for imports to ensure no method is missed
  - Final verification step: Attempt to delete `shared/lib/igdb.ts` and let TypeScript compiler reveal any missed usages

**Risk 6: IGDB API Changes**

- **Likelihood:** Low (external factor)
- **Impact:** High (could break all IGDB functionality)
- **Mitigation:**
  - Not directly related to this refactoring, but good to note
  - Integration tests with real API will catch breaking changes
  - Error handling improvements in this refactor will make failures more visible
  - Consider adding API version monitoring in future work

---

## 4. Testing Strategy

### Test Architecture

**Test Strategy: Unit Tests Only**

We use **comprehensive unit tests with realistic mock data** instead of integration tests with the real IGDB API. This approach provides:

- ✅ **Deterministic tests**: No flakiness from external service changes, rate limits, or downtime
- ✅ **Fast execution**: Tests run in milliseconds instead of seconds
- ✅ **Reliable data**: Mock fixtures captured from real IGDB responses guarantee test data availability
- ✅ **Full control**: Can test edge cases and error scenarios that are hard to reproduce with real API

**Why No Integration Tests:**

- ❌ IGDB's `external_games` data is incomplete (Steam app IDs often missing)
- ❌ External API changes can break tests unpredictably
- ❌ Rate limits and network issues cause intermittent failures
- ❌ Slow test execution hurts developer experience
- ✅ **Alternative**: Manual QA and E2E tests in staging environments validate real integration

**Test Implementation:**

1. **Unit Tests** (`igdb-service.test.ts`)
   - **File:** `data-access-layer/services/igdb/igdb-service.test.ts`
   - **Environment:** Node with mocked `fetch`
   - **Coverage:** All 21 public methods (3 existing + 18 new)
   - **Patterns:** Given-When-Then structure for clarity
   - **Fixtures:** Realistic mock data from `test/fixtures/igdb/` (captured from real IGDB responses)

**Test Coverage Requirements (per Functional Spec):**

- ✅ Each public method has at least one test (success case)
- ✅ Error cases covered: `TOKEN_ERROR`, `API_ERROR`, `INVALID_INPUT`, `NOT_FOUND`, `NETWORK_ERROR`
- ✅ Edge cases covered: null IDs, empty responses, missing data in responses, array inputs with empty arrays
- ✅ Full test suite passes before each legacy method removal
- ✅ Coverage metrics ≥80% (enforced by Vitest config)

---

### Test Implementation Details

**1. Unit Test Structure (Given-When-Then Pattern):**

```typescript
import topRatedGamesFixture from "@/test/fixtures/igdb/top-rated-games.json";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { IgdbService } from "./igdb-service";

describe("IgdbService", () => {
  let service: IgdbService;

  beforeEach(() => {
    service = new IgdbService();
    vi.clearAllMocks();
  });

  describe("getTopRatedGames", () => {
    describe("Success Cases", () => {
      it("should return top rated games when API call succeeds", async () => {
        // Given: IGDB API returns top rated games
        mockFetchSuccess(topRatedGamesFixture);

        // When: We request top rated games
        const result = await service.getTopRatedGames();

        // Then: We get a successful response with games sorted by rating
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data.games).toHaveLength(10);
          expect(result.data.games[0].aggregated_rating).toBeGreaterThan(90);
        }
      });
    });

    describe("Error Cases", () => {
      it("should return API_ERROR when IGDB API returns 500", async () => {
        // Given: IGDB API is experiencing errors
        mockFetchError(500, "Internal Server Error");

        // When: We request top rated games
        const result = await service.getTopRatedGames();

        // Then: We get an API_ERROR
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe("API_ERROR");
          expect(result.error.message).toContain("IGDB API error");
        }
      });

      it("should return TOKEN_ERROR when token fetch fails", async () => {
        // Given: OAuth token endpoint is unavailable
        mockTokenFetchFailure();

        // When: We request top rated games
        const result = await service.getTopRatedGames();

        // Then: We get a TOKEN_ERROR
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe("TOKEN_ERROR");
        }
      });
    });

    describe("Edge Cases", () => {
      it("should handle empty response gracefully", async () => {
        // Given: IGDB API returns empty array
        mockFetchSuccess([]);

        // When: We request top rated games
        const result = await service.getTopRatedGames();

        // Then: We get a successful response with empty games array
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data.games).toEqual([]);
        }
      });
    });
  });

  describe("getGameBySteamAppId", () => {
    describe("Success Cases", () => {
      it("should return game when valid Steam app ID is provided", async () => {
        // Given: A valid Steam app ID and IGDB match
        const params = { steamAppId: 570 }; // Dota 2
        mockFetchSuccess([{ id: 1234, name: "Dota 2" }]);

        // When: We look up the game by Steam app ID
        const result = await service.getGameBySteamAppId(params);

        // Then: We get the matching IGDB game
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data.game.id).toBe(1234);
          expect(result.data.game.name).toBe("Dota 2");
        }
      });
    });

    describe("Error Cases", () => {
      it("should return INVALID_INPUT when Steam app ID is 0", async () => {
        // Given: An invalid Steam app ID
        const params = { steamAppId: 0 };

        // When: We attempt lookup
        const result = await service.getGameBySteamAppId(params);

        // Then: We get INVALID_INPUT error
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe("INVALID_INPUT");
          expect(result.error.message).toContain(
            "Valid Steam app ID is required"
          );
        }
      });

      it("should return NOT_FOUND when no IGDB game matches Steam app ID", async () => {
        // Given: A valid Steam app ID but no IGDB match
        const params = { steamAppId: 999999 };
        mockFetchSuccess([]); // Empty response

        // When: We attempt lookup
        const result = await service.getGameBySteamAppId(params);

        // Then: We get NOT_FOUND error
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe("NOT_FOUND");
          expect(result.error.message).toContain("No IGDB game found");
        }
      });
    });
  });

  // ... Similar structure for all 21 methods
});
```

**2. Test Fixtures:**

Create `test/fixtures/igdb/` directory with JSON files:

- `top-rated-games.json` - Array of 10 games with high ratings
- `game-details-1234.json` - Full `FullGameInfoResponse` object
- `game-search-zelda.json` - Array of Zelda game search results
- `steam-lookup-success.json` - Single game matching Steam app ID
- `empty-response.json` - `[]`
- `token-response.json` - OAuth token response
- `screenshots-response.json` - Array of screenshot objects
- `similar-games-response.json` - Array of similar games

**3. Mock Utilities:**

```typescript
// test/utils/igdb-mocks.ts
export function mockFetchSuccess<T>(data: T) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
    statusText: "OK",
  });
}

export function mockFetchError(status: number, statusText: string) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
  });
}

export function mockTokenFetchFailure() {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
}
```

---

### CI Integration

**Existing PR Checks Workflow (`.github/workflows/pr-checks.yml`):**

- ✅ Already runs `pnpm test` which includes unit tests
- ✅ Already runs `pnpm test:coverage` with ≥80% threshold
- ✅ No changes needed to CI configuration

**Verification Steps (before merging):**

1. Run `pnpm code-check` (format + lint + typecheck)
2. Run `pnpm test:coverage` (verify ≥80% coverage maintained)
3. Run `pnpm build` (ensure no TypeScript errors)
4. Manual QA of Steam import and game search features

---

### Test Execution Commands

```bash
# Run all IGDB service tests
pnpm test data-access-layer/services/igdb

# Run with coverage report
pnpm test:coverage data-access-layer/services/igdb

# Watch mode during development
pnpm test:watch data-access-layer/services/igdb/igdb-service.test.ts

# Type check
pnpm typecheck

# Build verification
pnpm build
```

---

## 5. Implementation Checklist

**Phase 0: Setup**

- [ ] Create `test/fixtures/igdb/` directory
- [ ] Create test fixture JSON files (8 files as listed above)
- [ ] Create `test/utils/igdb-mocks.ts` with mock utilities
- [ ] Remove circular dependency: Delete `import igdbApi from "@/shared/lib/igdb"` from igdb-service.ts (line 5)

**Phase 1: Infrastructure (Already Complete)**

- [x] Token management methods (`getToken`, `requestTwitchToken`)
- [x] HTTP request wrapper (`makeRequest`)
- [x] Error handling (`handleError` from BaseService)

**Phase 2: Primary Query Methods (10 methods)**

- [ ] Migrate `getGameByName()` → `searchGamesByName()`
  - [ ] Write unit tests (success, INVALID_INPUT, NOT_FOUND, API_ERROR)
  - [ ] Implement method
  - [ ] Update consumers
  - [ ] Verify all tests pass
- [ ] Migrate `getGameBySteamAppId()` (CRITICAL for Steam import)
  - [ ] Write unit tests + integration test
  - [ ] Implement method
  - [ ] Update consumers (Steam import feature)
  - [ ] Manual QA of Steam import flow
- [ ] Migrate `getGamesByRating()` → `getTopRatedGames()`
  - [ ] Write unit tests
  - [ ] Implement method
  - [ ] Update consumers (homepage/discovery)
- [ ] Migrate `getPlatformId()` → `searchPlatformByName()`
  - [ ] Write unit tests
  - [ ] Implement method
  - [ ] Update consumers
- [ ] Migrate `getGameScreenshots()`
  - [ ] Write unit tests (handle null gameId, empty response)
  - [ ] Implement method
  - [ ] Update consumers
- [ ] Migrate `getGameRating()` → `getGameAggregatedRating()`
  - [ ] Write unit tests
  - [ ] Implement method
  - [ ] Update consumers
- [ ] Migrate `getSimilarGames()`
  - [ ] Write unit tests
  - [ ] Implement method
  - [ ] Update consumers (game detail pages)
- [ ] Run full test suite and verify ≥80% coverage

**Phase 3: Extended Metadata Methods (8 methods)**

- [ ] Migrate `getGameGenres()`
- [ ] Migrate `getGameTimeToBeats()` → `getGameCompletionTimes()`
- [ ] Migrate `getGameDLCsAndExpansions()` → `getGameExpansions()`
- [ ] Migrate `getGameFranchiseGames()` → `getFranchiseGames()`
- [ ] Migrate `getArtworks()` → `getGameArtworks()`
- [ ] Migrate `getNextMonthReleases()` → `getUpcomingReleasesByIds()`
- [ ] Migrate `getEvents()` → `getUpcomingGamingEvents()`
- [ ] Migrate `getEventLogo()`
- [ ] For each method: Write tests → Implement → Update consumers → Verify
- [ ] Run full test suite and verify ≥80% coverage

**Phase 4: Cleanup**

- [ ] Verify no files import from `shared/lib/igdb.ts` (run grep)
- [ ] Run `pnpm typecheck` to ensure no TypeScript errors
- [ ] Run `pnpm test:coverage` to verify ≥80% coverage
- [ ] Run `pnpm build` to ensure production build succeeds
- [ ] Delete `shared/lib/igdb.ts`
- [ ] Delete `shared/lib/igdb.server-action.test.ts` (if exists)
- [ ] Update `data-access-layer/services/index.ts` exports (verify IgdbService exported)
- [ ] Run full test suite one final time
- [ ] Manual QA of critical flows:
  - [ ] Game search
  - [ ] Game detail page (screenshots, similar games, ratings)
  - [ ] Steam library import
  - [ ] Top-rated games on homepage

**Phase 5: Documentation**

- [ ] Add JSDoc comments to all public methods in `IgdbService`
- [ ] Update `data-access-layer/services/README.md` with IGDB service usage examples
- [ ] Add inline comment in `shared/types/igdb.ts` explaining custom response types

---

## 6. Success Criteria

This implementation is considered complete when:

1. ✅ **Zero legacy imports:** No files import from `shared/lib/igdb.ts` (verified by grep + TypeScript compiler)
2. ✅ **File deleted:** `shared/lib/igdb.ts` is removed from the codebase
3. ✅ **All methods migrated:** All 25 methods from legacy implementation are in `IgdbService` (21 public + 4 private)
4. ✅ **Test coverage maintained:** ≥80% coverage for `data-access-layer/services/igdb/` (enforced by Vitest)
5. ✅ **No regressions:** All existing IGDB-dependent features work as expected (verified by test suite + manual QA)
6. ✅ **Single entry point:** `IgdbService` exported from `data-access-layer/services/index.ts`
7. ✅ **Type consolidation:** All base IGDB types imported from `igdb-api-types` (already done ✅)
8. ✅ **Improved error handling:** All methods return structured `ServiceResponse` with clear error codes
9. ✅ **No circular dependencies:** Service layer does not import from legacy implementation
10. ✅ **Build succeeds:** `pnpm build` completes without errors

---

**Document Metadata:**

- **Version:** 1.0
- **Last Updated:** 2025-10-09
- **Status:** Draft (awaiting approval)
- **Next Steps:** Review with team → Approve → Begin Phase 0 setup
