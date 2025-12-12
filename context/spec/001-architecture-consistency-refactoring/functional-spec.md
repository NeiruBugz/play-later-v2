# Functional Specification: Architecture Consistency Refactoring

- **Roadmap Item:** Technical Foundation & Refactoring
- **Status:** Draft
- **Author:** Claude

---

## 1. Overview and Rationale (The "Why")

**Context:** During a comprehensive architecture review, 15 inconsistencies were identified across the data access layer, features layer, and shared utilities. The codebase has drifted from its documented patterns over time.

**Problem Being Solved:**

1. **Type confusion:** Three different Result type patterns (`.ok` vs `.success`) create cognitive load and potential runtime errors
2. **Error handling inconsistency:** Some services throw exceptions, others return Result types - consumers can't reliably handle errors
3. **Boundary violations:** Undocumented cross-feature imports create tight coupling
4. **Pattern drift:** Different features use different approaches for the same operations (validation, logging, etc.)

**Desired Outcome:**

- All layers use consistent Result type patterns
- Error handling is predictable across all services
- Architectural boundaries are enforced
- New features can be built faster with less confusion

**Success Metrics:**

- Zero ESLint boundary violations
- All services return `ServiceResult<T>` (no thrown exceptions in business logic)
- All server actions use `.safeParse()` for validation
- Type checking passes with no workarounds

---

## 2. Functional Requirements (The "What")

### 2.1 Result Type Standardization

- **As a** developer, **I want** all data access layers to use consistent Result type patterns, **so that** I know how to check success/failure without looking up each layer's convention.

**Acceptance Criteria:**

- [ ] Repository layer uses `RepositoryResult<T>` with `.success` property (aligned with services)
- [ ] Service layer uses `ServiceResult<T>` with `.success` property (no changes needed)
- [ ] Handler layer uses `HandlerResult<T>` with `.success` property (no changes needed)
- [ ] `GameDetailService` returns `ServiceResult<T>` instead of ad-hoc `{ ok: boolean }`

### 2.2 Error Handling Standardization

- **As a** developer, **I want** services to return structured error results instead of throwing exceptions, **so that** I can handle errors consistently without try/catch blocks.

**Acceptance Criteria:**

- [ ] `IgdbService.requestTwitchToken()` returns `ServiceResult` instead of throwing
- [ ] `IgdbService.makeRequest()` returns `ServiceResult` instead of throwing
- [ ] `populateGameInDatabase()` returns `ServiceResult` instead of throwing
- [ ] All repository-to-service error mapping is explicit and documented

### 2.3 GameDetailService Refactoring

- **As a** developer, **I want** `GameDetailService` to follow the same class-based pattern as other services, **so that** I can use it consistently with dependency injection and logging.

**Acceptance Criteria:**

- [ ] `GameDetailService` is a class extending `BaseService`
- [ ] Has a logger instance with `LOGGER_CONTEXT.SERVICE`
- [ ] Returns `ServiceResult<Game>` from all methods
- [ ] Uses private methods for internal operations

### 2.4 Error Code Alignment

- **As a** developer, **I want** error codes to map cleanly between layers, **so that** I can translate errors appropriately.

**Acceptance Criteria:**

- [ ] `RepositoryErrorCode` includes `EXTERNAL_SERVICE_ERROR` for consistency
- [ ] Documented mapping between Repository and Service error codes exists
- [ ] Services consistently map repository errors to appropriate service error codes

### 2.5 Feature Boundary Compliance

- **As a** developer, **I want** cross-feature imports to be eliminated or documented, **so that** ESLint boundary rules pass and features remain decoupled.

**Acceptance Criteria:**

- [ ] `useGetPlatforms` hook moved from `game-detail` to `shared/hooks/`
- [ ] Profile components importing from `setup-profile` are resolved
- [ ] ESLint `boundaries` plugin reports zero violations
- [ ] `features/CLAUDE.md` updated if new exceptions are needed

### 2.6 Server Action Validation Standardization

- **As a** developer, **I want** all server actions to use `.safeParse()` for validation, **so that** error handling is consistent and exceptions aren't thrown.

**Acceptance Criteria:**

- [ ] `features/auth/server-actions/sign-up.ts` uses `.safeParse()` instead of `.parse()`
- [ ] `features/auth/server-actions/sign-in.ts` uses `.safeParse()` instead of `.parse()`
- [ ] `features/browse-related-games/server-actions/load-more-franchise-games.ts` uses `.safeParse()`
- [ ] All validation errors are handled uniformly across actions

### 2.7 Logger Consistency

- **As a** developer, **I want** all services and use-cases to have properly configured loggers, **so that** debugging and monitoring are consistent.

**Acceptance Criteria:**

- [ ] `PlatformService` has a logger instance
- [ ] `get-game-details.ts` use-case uses `LOGGER_CONTEXT.USE_CASE` (not `SERVICE`)
- [ ] All services have loggers with appropriate context keys

### 2.8 Centralized Type Definitions

- **As a** developer, **I want** shared types (like `ActionResult`) to be imported from a single location, **so that** I don't redefine them locally.

**Acceptance Criteria:**

- [ ] `ActionResult<T>` imported from `shared/lib/server-action/` where used
- [ ] Local redefinitions of `ActionResult` removed from feature files
- [ ] Profile schemas moved from `shared/lib/profile/` to feature directories

### 2.9 Handler & Schema Cleanup

- **As a** developer, **I want** handler exports and schema locations to be consistent, **so that** I can find and import them predictably.

**Acceptance Criteria:**

- [ ] `getUniquePlatformsHandler` exported from `handlers/index.ts`
- [ ] Rate limiting added to `get-library-handler.ts` (matching game search pattern)
- [ ] Duplicate validation schemas consolidated (e.g., `GetLibrarySchema`)
- [ ] Inline schemas moved to feature `schemas.ts` files
- [ ] Empty index files either populated or removed

---

## 3. Scope and Boundaries

### In-Scope

- All 15 identified architecture issues
- Type definition changes
- File moves/restructuring
- Import path updates
- Test updates to match new patterns
- CLAUDE.md documentation updates

### Out-of-Scope (Other Roadmap Items)

- Vitest Configuration Restructure (separate roadmap item)
- Gaming Journal feature
- Steam Library Import
- Any user-facing functionality changes
- Database schema changes
- API endpoint behavior changes
