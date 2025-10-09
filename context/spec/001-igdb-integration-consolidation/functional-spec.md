# Functional Specification: IGDB Integration Consolidation

- **Roadmap Item:** Technical Foundation & Refactoring - IGDB Integration Consolidation
- **Status:** Approved
- **Author:** Product Team

---

## 1. Overview and Rationale (The "Why")

### Problem Statement

Currently, the IGDB (Internet Games Database) integration code is scattered across multiple locations in the codebase, creating maintenance challenges and developer confusion:

1. **Duplication**: Two implementations exist—a legacy utility file (`shared/lib/igdb.ts`) and a newer service layer implementation (`data-access-layer/services/igdb/igdb-service.ts`)
2. **Inconsistent patterns**: Different parts of the codebase may use different implementations, leading to inconsistent behavior
3. **Type fragmentation**: Custom IGDB types are defined in-house instead of using the standardized `igdb-api-types` package
4. **Risk of outdated usage**: Developers may unknowingly import and use the legacy implementation when building new features

### Desired Outcome

After this consolidation, the codebase will have:

1. **Single source of truth**: All IGDB API interactions flow through the service layer at `data-access-layer/services/igdb/`
2. **Standardized types**: All IGDB types come from the official `igdb-api-types` npm package
3. **Complete test coverage**: The consolidated service has comprehensive tests covering success cases, error cases, and edge cases
4. **Clear developer guidance**: Only one way to interact with IGDB, following the established service layer pattern

### Success Metrics

This refactoring is considered successful when:

1. **Zero legacy imports**: No files import from `shared/lib/igdb.ts` (file is deleted)
2. **Type consolidation**: All custom IGDB types in `shared/types` are replaced with `igdb-api-types`
3. **Test coverage maintained and improved**: All existing IGDB functionality is tested, with coverage equal to or better than before
4. **No regressions**: All existing IGDB-dependent features continue to work as expected
5. **Single entry point**: Developers can access the IGDB service from `data-access-layer/services/index.ts`

---

## 2. Functional Requirements (The "What")

### Requirement 1: Install and Integrate `igdb-api-types` Package

- **As a** developer, **I need** the `igdb-api-types` package installed as a regular dependency, **so that** I can use standardized IGDB type definitions throughout the codebase.
  - **Acceptance Criteria:**
    - [ ] `igdb-api-types` is added to `package.json` as a regular dependency (not dev dependency)
    - [ ] The package is successfully installed and importable in TypeScript files
    - [ ] All imports of IGDB types use the `igdb-api-types` package instead of custom types from `shared/types`

### Requirement 2: Migrate All IGDB Methods to Service Layer

- **As a** developer, **I need** all IGDB functionality consolidated into the service layer, **so that** there is a single, consistent way to interact with the IGDB API.
  - **Acceptance Criteria:**
    - [ ] All methods from `shared/lib/igdb.ts` are migrated to `data-access-layer/services/igdb/igdb-service.ts`, including:
      - Token management (`fetchToken`, `getToken`)
      - Game queries (`getGamesByRating`, `getGameById`, `getGameByName`, `getGameBySteamAppId`)
      - Game metadata (`getGameScreenshots`, `getGameRating`, `getSimilarGames`, `getGameGenres`, `getGameTimeToBeats`, `getGameDLCsAndExpansions`, `getGameFranchiseGames`)
      - Search (`search`)
      - Platform queries (`getPlatforms`, `getPlatformId`)
      - Event queries (`getEvents`, `getEventLogo`)
      - Release queries (`getNextMonthReleases`)
      - Artwork queries (`getArtworks`)
    - [ ] Each migrated method follows the service layer pattern (returns `ServiceResponse<T>` with success/error structure)
    - [ ] Method names are clear, readable, and self-explanatory (e.g., `getSimilarGames`, `getGamesByRating`)
    - [ ] Private helper methods (token management, request handling, error handling) are consolidated and not duplicated

### Requirement 3: Comprehensive Test Coverage for Consolidated Service

- **As a** developer, **I need** comprehensive tests for the IGDB service, **so that** I can confidently refactor and extend IGDB functionality without introducing regressions.
  - **Acceptance Criteria:**
    - [ ] Each public method in the consolidated `IgdbService` has at least one test
    - [ ] Tests cover **success cases** (valid inputs return expected results)
    - [ ] Tests cover **error cases** (API failures, invalid tokens, network errors)
    - [ ] Tests cover **edge cases** (null/undefined IDs, empty responses, missing data)
    - [ ] The **entire test suite passes** before each legacy method is removed
    - [ ] If integration-level IGDB usage is found (e.g., in features or pages), integration tests are added to verify end-to-end behavior
    - [ ] Test coverage metrics are equal to or better than before consolidation

### Requirement 4: Improved Error Handling and Messages

- **As a** developer, **I need** clear and understandable error messages from the IGDB service, **so that** I can quickly diagnose and fix issues when IGDB interactions fail.
  - **Acceptance Criteria:**
    - [ ] All error responses from the service include a clear `message` describing what went wrong
    - [ ] All error responses include a `code` for programmatic error handling (e.g., `INVALID_INPUT`, `SEARCH_FAILED`, `API_ERROR`)
    - [ ] Token-related errors are distinguishable from API errors and input validation errors
    - [ ] Error messages are human-readable and actionable (e.g., "Valid game ID is required" instead of "Invalid input")

### Requirement 5: Remove Legacy Implementation

- **As a** developer, **I need** the legacy IGDB implementation removed, **so that** there is no confusion about which implementation to use.
  - **Acceptance Criteria:**
    - [ ] The file `shared/lib/igdb.ts` is completely deleted from the codebase
    - [ ] All imports from `shared/lib/igdb.ts` are updated to use the consolidated service
    - [ ] Custom IGDB types in `shared/types` that duplicate `igdb-api-types` are deleted
    - [ ] If custom types are still needed (for application-specific response shapes), they are kept but clearly documented and minimal
    - [ ] The codebase builds successfully with no TypeScript errors after deletion

### Requirement 6: Single Entry Point for IGDB Service

- **As a** developer, **I need** a clear, single entry point to access the IGDB service, **so that** I know exactly how to use it in my features.
  - **Acceptance Criteria:**
    - [ ] The `IgdbService` class is exported from `data-access-layer/services/index.ts`
    - [ ] Developers instantiate the service as needed (no singleton pattern enforced at this stage)
    - [ ] The service follows the same instantiation pattern as other services in the service layer
    - [ ] Documentation or inline comments explain how to instantiate and use the service

---

## 3. Scope and Boundaries

### In-Scope

- Installing the `igdb-api-types` package as a regular dependency
- Migrating all IGDB methods from `shared/lib/igdb.ts` to the service layer
- Replacing all custom IGDB types with types from `igdb-api-types` (or minimal custom types if necessary)
- Writing comprehensive tests for all public methods in the consolidated service (success, error, and edge cases)
- Improving error messages and error handling to make them clear and actionable
- Removing the legacy `shared/lib/igdb.ts` file after migration
- Removing duplicate custom IGDB types from `shared/types`
- Ensuring the consolidated service is exported from `data-access-layer/services/index.ts`
- Updating all imports throughout the codebase to use the new service
- Verifying that all existing IGDB-dependent features continue to work (no regressions)

### Out-of-Scope

- Changing the IGDB API query logic or parameters (migrate as-is, do not alter behavior)
- Refactoring or optimizing the `QueryBuilder` class
- Adding new IGDB features or API endpoints not present in the legacy code
- Performance optimizations or caching improvements beyond what already exists
- Creating comprehensive developer documentation beyond inline code comments (this can be a future task)
- Implementing a singleton pattern or dependency injection framework for the service (let consumers instantiate as needed for now)
