# Technical Specification: Architecture Consistency Refactoring

- **Functional Specification:** [001-architecture-consistency-refactoring/functional-spec.md](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Claude

---

## 1. High-Level Technical Approach

This refactoring standardizes architectural patterns across the SavePoint codebase to eliminate inconsistencies identified during the architecture review. The work is organized into three phases:

1. **Phase 1: Result Type Unification** - Standardize all layers to use `.success` property
2. **Phase 2: Service Pattern Compliance** - Fix services that throw errors, refactor GameDetailService
3. **Phase 3: Boundary & Cleanup** - Move files, consolidate schemas, fix cross-feature imports

**Key Decision:** Unify Repository layer from `.ok` to `.success` for consistency with Service/Handler layers.

**Systems Affected:**
- `data-access-layer/repository/` - Type definitions and all repository functions
- `data-access-layer/services/` - IgdbService, GameDetailService, PlatformService
- `data-access-layer/handlers/` - Export fixes, rate limiting additions
- `features/` - Server actions, use-cases, cross-feature imports
- `shared/` - New hooks and components locations

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Result Type Unification

**Current State:**
- Repository: `RepositoryResult<T>` with `.ok` property
- Service: `ServiceResult<T>` with `.success` property
- Handler: `HandlerResult<T>` with `.success` property

**Target State:** All layers use `.success` property.

**Files to Modify:**

```
data-access-layer/repository/types.ts
├── Change: RepositoryResult<T> from .ok to .success
├── Change: RepositoryError structure to match ServiceError
└── Add: isRepositorySuccess() helper function update

data-access-layer/repository/**/*-repository.ts (all 7 files)
├── game-repository.ts
├── library-repository.ts
├── user-repository.ts
├── review-repository.ts
├── journal-repository.ts
├── imported-game-repository.ts
└── platform-repository.ts
    └── Update all return statements from { ok: true/false } to { success: true/false }
```

**Type Definition Changes:**

```typescript
// BEFORE (repository/types.ts)
export type RepositoryResult<TData> =
  | { ok: true; data: TData }
  | { ok: false; error: RepositoryError };

// AFTER
export type RepositoryResult<TData> =
  | { success: true; data: TData }
  | { success: false; error: RepositoryError };
```

**Consumer Updates Required:**
- All services that call repositories (~15 locations)
- All tests that check repository results (~20 locations)
- Helper function `isRepositorySuccess()` in `repository/types.ts`

---

### 2.2 IgdbService Error Handling Refactoring

**Current State:** IgdbService extends BaseService but throws errors in public methods.

**Problem Locations:**
- `igdb-service.ts:132` - `throw new Error()` in `requestTwitchToken()`
- `igdb-service.ts:192` - `throw new Error()` in `makeRequest()`
- `igdb-service.ts:337` - `throw new Error()` when game not found

**Target State:** All public methods return `ServiceResult<T>`, internal methods can throw (caught by public methods).

**Refactoring Pattern:**

```typescript
// BEFORE (throws errors)
async searchGamesByName(params: GameSearchParams): Promise<GameSearchResult[]> {
  const query = this.buildSearchQuery(params);
  const data = await this.makeRequest("/games", query); // throws on error
  return data;
}

// AFTER (returns ServiceResult)
async searchGamesByName(params: GameSearchParams): Promise<ServiceResult<GameSearchResult[]>> {
  try {
    const query = this.buildSearchQuery(params);
    const data = await this.makeRequest("/games", query);
    return this.success(data);
  } catch (error) {
    this.logger.error({ error }, "Failed to search games");
    return this.error("Failed to search games", "EXTERNAL_SERVICE_ERROR");
  }
}
```

**Public Methods to Refactor:**
1. `searchGamesByName()`
2. `getGameDetailsBySlug()`
3. `getGameDetailsById()`
4. `getSimilarGames()`
5. `getFranchiseGames()`
6. `getPlatforms()`

**Internal Methods (keep throwing):**
- `makeRequest()` - called by public methods, errors caught there
- `requestTwitchToken()` - called by `makeRequest()`, errors propagate up

**Consumer Updates Required:**
- All handlers calling IgdbService methods
- All use-cases calling IgdbService methods
- All tests for IgdbService

---

### 2.3 GameDetailService Refactoring

**Current State:** Standalone functions, not a class. Uses `{ ok: boolean }` return type.

**File:** `data-access-layer/services/game-detail/game-detail-service.ts`

**Target State:** Class extending `BaseService` with proper logger and `ServiceResult` returns.

**Refactoring:**

```typescript
// BEFORE (standalone function)
export async function populateGameInDatabase(
  igdbGame: FullGameInfoResponse
): Promise<{ ok: boolean; error?: string }> {
  // ... implementation with throws
}

// AFTER (class-based)
export class GameDetailService extends BaseService {
  private logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "GameDetailService" });

  async populateGameInDatabase(
    igdbGame: FullGameInfoResponse
  ): Promise<ServiceResult<Game>> {
    try {
      // ... implementation
      return this.success(game);
    } catch (error) {
      this.logger.error({ error }, "Failed to populate game in database");
      return this.error("Failed to populate game", "INTERNAL_ERROR");
    }
  }
}
```

**Consumer Updates Required:**
- `features/game-detail/use-cases/get-game-details.ts`
- `features/manage-library-entry/use-cases/add-game-to-library.ts`
- Any tests for game detail functionality

---

### 2.4 Error Code Alignment

**Current State:** Repository and Service error codes don't align.

**Changes to `repository/types.ts`:**

```typescript
// Add missing error code
export enum RepositoryErrorCode {
  NOT_FOUND = "NOT_FOUND",
  DUPLICATE = "DUPLICATE",
  INVALID_INPUT = "INVALID_INPUT",
  DATABASE_ERROR = "DATABASE_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR", // NEW
}
```

**Error Code Mapping Documentation:**

| Repository Error | Maps To Service Error |
|-----------------|----------------------|
| `NOT_FOUND` | `NOT_FOUND` |
| `DUPLICATE` | `CONFLICT` |
| `ALREADY_EXISTS` | `CONFLICT` |
| `INVALID_INPUT` | `VALIDATION_ERROR` |
| `DATABASE_ERROR` | `INTERNAL_ERROR` |
| `INTERNAL_ERROR` | `INTERNAL_ERROR` |
| `EXTERNAL_SERVICE_ERROR` | `EXTERNAL_SERVICE_ERROR` |

---

### 2.5 Feature Boundary Fixes

#### Move `useGetPlatforms` Hook

**From:** `features/game-detail/hooks/use-get-platforms.ts`
**To:** `shared/hooks/game/use-get-platforms.ts`

**Steps:**
1. Create `shared/hooks/game/` directory
2. Move hook file
3. Update `shared/hooks/index.ts` barrel export
4. Update imports in:
   - `features/manage-library-entry/ui/add-entry-form.tsx`
   - `features/manage-library-entry/ui/entry-form.tsx`
   - `features/game-detail/` (if used internally)

#### Move Profile Components

**From:** `features/setup-profile/ui/` (AvatarUpload, UsernameInput)
**To:** `shared/components/profile/`

**Steps:**
1. Create `shared/components/profile/` directory
2. Move `avatar-upload.tsx` and `username-input.tsx`
3. Update `shared/components/index.ts` barrel export
4. Update imports in:
   - `features/profile/ui/profile-settings-form.tsx`
   - `features/setup-profile/ui/` (original feature)

---

### 2.6 Server Action Validation Standardization

**Target:** All server actions use `.safeParse()` or `createServerAction` helper.

**Files to Update:**

| File | Current | Target |
|------|---------|--------|
| `features/auth/server-actions/sign-up.ts` | `.parse()` | `.safeParse()` |
| `features/auth/server-actions/sign-in.ts` | `.parse()` | `.safeParse()` |
| `features/browse-related-games/server-actions/load-more-franchise-games.ts` | `.parse()` | `.safeParse()` |

**Standard Pattern:**

```typescript
// BEFORE (throws on validation error)
const validated = schema.parse(input);

// AFTER (safe, returns result)
const validated = schema.safeParse(input);
if (!validated.success) {
  return { success: false, error: validated.error.errors[0]?.message ?? "Validation error" };
}
const data = validated.data;
```

---

### 2.7 Logger Consistency Fixes

**Files to Update:**

| File | Current Context | Correct Context |
|------|----------------|-----------------|
| `features/game-detail/use-cases/get-game-details.ts` | `LOGGER_CONTEXT.SERVICE` | `LOGGER_CONTEXT.USE_CASE` |
| `data-access-layer/services/platform/platform-service.ts` | None | Add `LOGGER_CONTEXT.SERVICE` |

---

### 2.8 Centralized Type Definitions

**ActionResult Type:**

**Canonical Location:** `shared/lib/server-action/create-server-action.ts`

**Files with Local Redefinitions (to remove):**
- `features/manage-library-entry/server-actions/update-library-status-action.ts`
- `features/manage-library-entry/server-actions/delete-library-item.ts`

**Fix:** Import from shared location:
```typescript
import type { ActionResult } from "@/shared/lib/server-action";
```

**Profile Schemas:**

**Current Location:** `shared/lib/profile/`
**Target Location:** `features/profile/schemas.ts` and `features/setup-profile/schemas.ts`

---

### 2.9 Handler & Schema Cleanup

#### Export Missing Handler

**File:** `data-access-layer/handlers/index.ts`

**Add:**
```typescript
export * from "./platform/get-unique-platforms";
```

#### Rate Limiting Addition

**File:** `data-access-layer/handlers/library/get-library-handler.ts`

**Add:** Rate limiting check matching `game-search-handler.ts` pattern:
```typescript
import { checkRateLimit } from "@/shared/lib/rate-limit";

// At start of handler
const rateLimitResult = await checkRateLimit(request);
if (!rateLimitResult.success) {
  return { success: false, error: "Rate limit exceeded", status: 429 };
}
```

#### Schema Consolidation

**Duplicate Found:**
- `features/game-search/schemas.ts` - `SearchGamesSchema` with `query` field
- `services/igdb/schemas/input.ts` - `GameSearchSchema` with `name` field

**Resolution:** Service layer schemas are source of truth. Feature schemas can extend/re-export.

#### Inline Schema Fix

**File:** `features/browse-related-games/server-actions/load-more-franchise-games.ts`

**Move** inline `LoadMoreSchema` to `features/browse-related-games/schemas.ts`

#### Empty Index File

**File:** `features/game-detail/server-actions/index.ts`

**Action:** Either populate with exports or remove if no server actions exist in this feature.

---

## 3. Impact and Risk Analysis

### System Dependencies

| Change | Dependencies |
|--------|-------------|
| Repository Result types | All services, all repository tests |
| IgdbService refactoring | Handlers, use-cases, game-detail feature |
| GameDetailService refactoring | game-detail use-case, manage-library-entry use-case |
| File moves (hooks/components) | All importing features |

### Potential Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking runtime behavior during Result type change | Medium | High | Comprehensive test coverage before changes; run full test suite after each file |
| Missing import updates after file moves | Low | Medium | Use TypeScript compiler errors as guide; grep for old import paths |
| IgdbService consumers not handling new return type | Medium | High | Update consumers in same PR; test each endpoint manually |
| Rate limiting breaking existing library API calls | Low | Medium | Test with real requests before merge |

### Breaking Changes

**Internal Only** - No user-facing API changes. All changes are internal refactoring.

**Consumers Requiring Updates:**
1. All code checking `.ok` on repository results → change to `.success`
2. All code calling IgdbService methods → handle `ServiceResult` instead of raw data
3. All imports from moved files → update import paths

---

## 4. Testing Strategy

### Unit Tests

**Existing tests to update:**
- Repository tests: Update assertions from `.ok` to `.success`
- Service tests: Update IgdbService test mocks and assertions
- GameDetailService: New tests for class-based implementation

**New tests to add:**
- `IgdbService` error handling edge cases
- `GameDetailService` class methods
- Moved hooks (`useGetPlatforms`)

### Integration Tests

**Verify:**
- Repository → Service flow with new Result types
- IgdbService → Handler → API route flow
- Rate limiting on library handler

### Manual Testing Checklist

- [ ] Game search works end-to-end
- [ ] Game detail page loads with IGDB data
- [ ] Add game to library flow works
- [ ] Library page loads and filters work
- [ ] Profile settings page works
- [ ] Rate limiting returns 429 when exceeded

### Regression Testing

Run full test suite after each phase:
```bash
pnpm test                    # All tests
pnpm lint                    # ESLint boundaries check
pnpm typecheck              # TypeScript compilation
```

---

## Implementation Order

**Phase 1: Result Type Unification** (High risk, do first)
1. Update `repository/types.ts` type definitions
2. Update all repository files (7 files)
3. Update all service consumers of repositories
4. Update all repository tests
5. Run full test suite

**Phase 2: Service Pattern Compliance** (Medium risk)
1. Refactor IgdbService public methods
2. Update IgdbService consumers (handlers, use-cases)
3. Refactor GameDetailService to class
4. Update GameDetailService consumers
5. Add logger to PlatformService
6. Run full test suite

**Phase 3: Boundary & Cleanup** (Low risk)
1. Move `useGetPlatforms` to shared/hooks/
2. Move profile components to shared/components/
3. Update server actions to use `.safeParse()`
4. Fix logger contexts
5. Import ActionResult from shared
6. Move schemas to feature files
7. Export missing handler
8. Add rate limiting to library handler
9. Clean up empty index files
10. Update features/CLAUDE.md
11. Run full test suite + ESLint boundaries
