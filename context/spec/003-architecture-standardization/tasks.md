# Architecture Standardization - Updated Task List

**Date**: 2025-10-08
**Status**: Ready for Implementation (Post-Audit)
**Estimated Time**: 90-120 hours (7-9 weeks)
**Strategy**: Standardization first, then vertical service migration

**Key Changes from Original:**

- Added Phase 0 for structural standardization
- Reorganized feature migration based on complexity
- Acknowledged two-pattern architecture (Server Actions + React Query)
- Added service layer integration to all patterns

---

## Phase 0: Feature Structure Standardization (Week 1, 15-20 hours)

**Goal**: Establish consistent feature structure before service migration

### Slice 0.1: Create Standardization Guidelines

- [ ] **Document standard feature structure**
  - [ ] Create `context/spec/003-architecture-standardization/feature-structure-standard.md`
  - [ ] Define directory conventions (`/lib`, `/components`, `/server-actions`, etc.)
  - [ ] Document validation location (`/lib/validation.ts`, NOT `/validation/`)
  - [ ] Specify types organization (`types.ts` file, NOT `/types/` directory unless >5 definitions)
  - [ ] Include checklist for feature compliance

- [ ] **Document two-pattern architecture**
  - [ ] Update `context/product/architecture.md` with Pattern 1 (Server Actions) and Pattern 2 (API Routes + React Query)
  - [ ] Create decision tree for pattern selection
  - [ ] Add examples for both patterns
  - [ ] Document when each pattern is appropriate
  - [ ] Update migration guide with both patterns

- [ ] **Create feature audit checklist**
  - [ ] Create automated script to check feature structure compliance
  - [ ] Include checks for: validation location, types organization, proper exports
  - [ ] Generate compliance report for all features

### Slice 0.2: Refactor `manage-library-item` Structure

**Current Issue**: Nested sub-features create deep import paths and inconsistency

- [ ] **Plan the refactor**
  - [ ] Document current structure and all dependencies
  - [ ] Design flat structure with shared validation
  - [ ] Identify shared types and utilities
  - [ ] Plan import path updates

- [ ] **Execute the refactor**
  - [ ] Create new flat structure:
    ```
    manage-library-item/
    ├── components/
    │   ├── create-library-item-form.tsx
    │   ├── edit-library-item-form.tsx
    │   └── delete-library-item-dialog.tsx
    ├── server-actions/
    │   ├── create-library-item.ts
    │   ├── edit-library-item.ts
    │   ├── delete-library-item.ts
    │   └── index.ts
    ├── lib/
    │   └── validation.ts (consolidate all schemas)
    ├── types.ts
    ├── index.ts
    ├── CLAUDE.md
    └── PRD.md
    ```
  - [ ] Move components from sub-features to `/components`
  - [ ] Move server actions from sub-features to `/server-actions`
  - [ ] Consolidate validation schemas to `/lib/validation.ts`
  - [ ] Create shared `types.ts`
  - [ ] Update all imports throughout codebase
  - [ ] Update exports in `index.ts`

- [ ] **Test the refactor**
  - [ ] Run tests: `pnpm run test features/manage-library-item`
  - [ ] Manual test: Create library item via UI
  - [ ] Manual test: Edit library item status
  - [ ] Manual test: Delete library item
  - [ ] Verify no regressions

- [ ] **Update documentation**
  - [ ] Update `CLAUDE.md` with new structure
  - [ ] Document the refactor reasoning
  - [ ] Update any references in other docs

### Slice 0.3: Standardize `view-imported-games` Structure

**Current Issue**: Uses `/validation/` instead of `/lib/validation.ts`

- [ ] **Move validation to standard location**
  - [ ] Create `/features/view-imported-games/lib/validation.ts`
  - [ ] Move `search-params-schema.ts` contents to new file
  - [ ] Update import in `/app/api/imported-games/route.ts`
  - [ ] Update import in hooks
  - [ ] Delete old `/validation` directory
  - [ ] Run tests: `pnpm run test features/view-imported-games`

- [ ] **Verify React Query pattern compliance**
  - [ ] Document as Pattern 2 example
  - [ ] Ensure `/hooks` directory follows conventions
  - [ ] Verify API route structure is standard
  - [ ] Add to architecture docs as reference implementation

### Slice 0.4: Flatten `/types/` Directories

**Current Issue**: Some features use `/types/` directory for small type sets

**Features to refactor**: `add-game`, `dashboard`, `gaming-goals`, `steam-integration`, `view-wishlist`

- [ ] **`add-game` types**
  - [ ] Count type definitions in `/types/` directory
  - [ ] If <5 definitions, create flat `types.ts` file
  - [ ] Move all type definitions to `types.ts`
  - [ ] Update imports throughout feature
  - [ ] Delete `/types/` directory
  - [ ] Run tests

- [ ] **`dashboard` types**
  - [ ] Count type definitions in `/types/` directory
  - [ ] If <5 definitions, create flat `types.ts` file
  - [ ] Move all type definitions to `types.ts`
  - [ ] Update imports throughout feature
  - [ ] Delete `/types/` directory
  - [ ] Run tests

- [ ] **`steam-integration` types**
  - [ ] Count type definitions in `/types/` directory
  - [ ] If <5 definitions, create flat `types.ts` file
  - [ ] Move all type definitions to `types.ts`
  - [ ] Update imports throughout feature
  - [ ] Delete `/types/` directory
  - [ ] Run tests

- [ ] **`view-wishlist` types**
  - [ ] Count type definitions in `/types/` directory
  - [ ] If <5 definitions, create flat `types.ts` file
  - [ ] Move all type definitions to `types.ts`
  - [ ] Update imports throughout feature
  - [ ] Delete `/types/` directory
  - [ ] Run tests

- [ ] **`gaming-goals` types** (may skip if feature incomplete)
  - [ ] Evaluate feature status
  - [ ] If active, follow same process as above
  - [ ] If incomplete, document for future work

### Slice 0.5: Add Missing Validation Files

**Current Issue**: `view-backlogs` missing validation

- [ ] **Add validation to `view-backlogs`**
  - [ ] Review server actions to identify validation needs
  - [ ] Create `/features/view-backlogs/lib/validation.ts`
  - [ ] Add Zod schemas for server action inputs
  - [ ] Update server actions to use validation
  - [ ] Add tests for validation
  - [ ] Run tests: `pnpm run test features/view-backlogs`

### Slice 0.6: Verification & Documentation

- [ ] **Run full compliance check**
  - [ ] Run automated feature structure checker (from Slice 0.1)
  - [ ] Generate compliance report
  - [ ] Verify all features pass standardization checks
  - [ ] Fix any remaining issues

- [ ] **Update all documentation**
  - [ ] Update main `CLAUDE.md` with standardization notes
  - [ ] Update architecture docs with standard structure
  - [ ] Document migration learnings
  - [ ] Create "before/after" examples

- [ ] **Code quality checks**
  - [ ] Run: `pnpm typecheck`
  - [ ] Run: `pnpm lint`
  - [ ] Run: `pnpm test`
  - [ ] Fix any errors

---

## Phase 1: Foundation & Documentation (Week 2, 10-15 hours)

**Note**: Slices 1-2 from original plan already completed ✅

### Slice 1.1: Update Architecture Documentation for Two Patterns

- [ ] **Document Pattern 1: Server Actions (Default)**
  - [ ] Update `context/product/architecture.md`
  - [ ] Add flow diagram: Page → Server Action → Service → Repository → DB
  - [ ] Document use cases (forms, mutations, server-rendered pages)
  - [ ] Add code examples with service layer integration
  - [ ] Document pros/cons

- [ ] **Document Pattern 2: API Routes + React Query (Advanced)**
  - [ ] Add to `context/product/architecture.md`
  - [ ] Add flow diagram: Page → React Query → API Route → Service → Repository → DB
  - [ ] Document use cases (complex filtering, caching, optimistic updates)
  - [ ] Reference `view-imported-games/REFACTOR.md`
  - [ ] Add code examples with service layer integration
  - [ ] Document pros/cons

- [ ] **Create pattern decision tree**
  - [ ] Document criteria for choosing Pattern 1 vs Pattern 2
  - [ ] Include flowchart or decision matrix
  - [ ] Add real examples from codebase
  - [ ] Include performance considerations

### Slice 1.2: Update Migration Guide

- [ ] **Update `context/product/migration-guide.md`**
  - [ ] Add section for Pattern 1 migration (Server Actions → Service Layer)
  - [ ] Add section for Pattern 2 migration (API Routes → Service Layer)
  - [ ] Include step-by-step process for both patterns
  - [ ] Add testing requirements for both patterns
  - [ ] Include rollback procedures
  - [ ] Add troubleshooting guide

---

## Phase 2: Core Services Implementation ✅ (Already Complete)

**Note**: Slices 3-5 from original plan already completed:

- ✅ LibraryService implemented and tested
- ✅ GameService implemented and tested
- ✅ ReviewService, UserService, JournalService implemented and tested

No additional work needed in this phase.

---

## Phase 3: Feature Migration to Service Layer (Week 3-7, 40-60 hours)

**Strategy**: Start with easiest features to establish patterns, then tackle complex ones

### Slice 3.1: Simple Migrations (Pattern 1) - Week 3

**Goal**: Establish service layer integration pattern with simple features

#### Feature 1: `add-review` (1-2 days)

- [ ] **Review current implementation**
  - [ ] Document current server action flow
  - [ ] Identify direct repository calls
  - [ ] Verify ReviewService has needed methods

- [ ] **Migrate to ReviewService**
  - [ ] Update `server-actions/create-review.ts`
  - [ ] Import ReviewService: `import { ReviewService } from '@/shared/services'`
  - [ ] Replace repository calls with service calls
  - [ ] Keep validation in `/lib/validation.ts` (feature-specific)
  - [ ] Simplify server action to thin wrapper

- [ ] **Update tests**
  - [ ] Update `create-review.server-action.test.ts`
  - [ ] Mock ReviewService instead of repository
  - [ ] Test service integration
  - [ ] Run tests: `pnpm run test features/add-review`
  - [ ] Verify >80% coverage

- [ ] **Update documentation**
  - [ ] Update `CLAUDE.md` with service layer usage
  - [ ] Add service integration examples
  - [ ] Document any learnings

#### Feature 2: `manage-user-info` (1-2 days)

- [ ] **Review current implementation**
  - [ ] Document current server action flow
  - [ ] Identify direct repository calls
  - [ ] Verify UserService has needed methods

- [ ] **Migrate to UserService**
  - [ ] Update `server-actions/edit-user-action.ts`
  - [ ] Update `server-actions/get-user-info.ts`
  - [ ] Import UserService
  - [ ] Replace repository calls with service calls
  - [ ] Simplify to thin wrappers

- [ ] **Update tests**
  - [ ] Update `edit-user-action.server-action.test.ts`
  - [ ] Mock UserService instead of repository
  - [ ] Test service integration
  - [ ] Run tests: `pnpm run test features/manage-user-info`
  - [ ] Verify >80% coverage

- [ ] **Update documentation**
  - [ ] Update `CLAUDE.md` with service layer usage

#### Feature 3: `view-wishlist` (1-2 days)

- [ ] **Review current implementation**
  - [ ] Document current server action flow
  - [ ] Identify direct repository calls
  - [ ] Verify LibraryService has needed methods

- [ ] **Migrate to LibraryService**
  - [ ] Update `server-actions/get-wishlisted-items.ts`
  - [ ] Import LibraryService
  - [ ] Replace repository calls with service calls
  - [ ] Simplify to thin wrapper

- [ ] **Update tests**
  - [ ] Add/update tests for server actions
  - [ ] Mock LibraryService
  - [ ] Run tests: `pnpm run test features/view-wishlist`
  - [ ] Verify >80% coverage

- [ ] **Update documentation**
  - [ ] Update `CLAUDE.md` with service layer usage

**Week 3 Deliverable**: 3 features using service layer, pattern established ✅

### Slice 3.2: Medium Migrations (Pattern 1) - Week 4-5

**Goal**: Apply service layer pattern to more complex features

#### Feature 4: `manage-library-item` (3-4 days)

**Note**: Structure already refactored in Phase 0

- [ ] **Review refactored structure**
  - [ ] Verify flat structure is in place
  - [ ] Confirm all tests passing post-refactor
  - [ ] Document current server action flows

- [ ] **Migrate create operation**
  - [ ] Update `server-actions/create-library-item.ts`
  - [ ] Import LibraryService
  - [ ] Replace repository calls with `libraryService.createLibraryItem()`
  - [ ] Keep feature-specific validation in `/lib/validation.ts`
  - [ ] Update tests
  - [ ] Run tests: `pnpm run test features/manage-library-item`

- [ ] **Migrate edit operation**
  - [ ] Update `server-actions/edit-library-item.ts`
  - [ ] Replace repository calls with `libraryService.updateLibraryItem()`
  - [ ] Handle multiple item operations (if any)
  - [ ] Update tests
  - [ ] Run tests

- [ ] **Migrate delete operation**
  - [ ] Update `server-actions/delete-library-item.ts`
  - [ ] Replace repository calls with `libraryService.deleteLibraryItem()`
  - [ ] Update tests
  - [ ] Run tests

- [ ] **Integration testing**
  - [ ] Manual test: Create library item via UI
  - [ ] Manual test: Edit library item status
  - [ ] Manual test: Delete library item
  - [ ] Verify all operations work correctly
  - [ ] Check browser console for errors

- [ ] **Update documentation**
  - [ ] Update `CLAUDE.md` with service layer integration
  - [ ] Document consolidated structure benefits
  - [ ] Add service usage examples

#### Feature 5: `view-game-details` (2-3 days)

- [ ] **Review current implementation**
  - [ ] Document current server action flows
  - [ ] Identify all repository calls
  - [ ] Map to GameService and ReviewService methods

- [ ] **Migrate game retrieval**
  - [ ] Update `server-actions/get-game.ts`
  - [ ] Import GameService
  - [ ] Replace repository calls with `gameService.getGame()`
  - [ ] Update tests: `get-game.server-action.test.ts`

- [ ] **Migrate reviews retrieval**
  - [ ] Update `server-actions/get-reviews.ts`
  - [ ] Import ReviewService
  - [ ] Replace repository calls with `reviewService.getReviews()`
  - [ ] Update tests: `get-reviews.server-action.test.ts`

- [ ] **Migrate library items retrieval**
  - [ ] Update `server-actions/get-library-items-by-igdb-id.ts`
  - [ ] Import LibraryService
  - [ ] Replace repository calls with service method
  - [ ] Update tests: `get-library-items-by-igdb-id.server-action.test.ts`

- [ ] **Integration testing**
  - [ ] Manual test: View game details page
  - [ ] Verify all data loads correctly
  - [ ] Check for console errors
  - [ ] Test with various game IDs

- [ ] **Update documentation**
  - [ ] Update `CLAUDE.md` with service layer usage
  - [ ] Document service composition pattern

#### Feature 6: `dashboard` (3-4 days)

**Note**: Most complex due to multiple services and many server actions

- [ ] **Audit all server actions**
  - [ ] List all server actions in dashboard
  - [ ] Map each to appropriate service(s)
  - [ ] Identify service composition needs

- [ ] **Migrate library-related actions**
  - [ ] Update `get-backlog-items-count.ts` → LibraryService
  - [ ] Update `get-recent-completed-backlog-items.ts` → LibraryService
  - [ ] Update `get-platform-breakdown.ts` → LibraryService
  - [ ] Update `get-acquisition-type-breakdown.ts` → LibraryService
  - [ ] Update `get-user-games-with-grouped-backlog.ts` → LibraryService

- [ ] **Migrate review-related actions**
  - [ ] Update `get-aggregated-review-ratings.ts` → ReviewService
  - [ ] Update `get-recent-reviews.ts` → ReviewService

- [ ] **Migrate wishlist actions**
  - [ ] Update `get-upcoming-wishlist-items.ts` → LibraryService + GameService

- [ ] **Migrate integration actions**
  - [ ] Update `get-steam-integration-connection-state.ts` → UserService

- [ ] **Test all migrations**
  - [ ] Run tests: `pnpm run test features/dashboard`
  - [ ] Verify all tests passing
  - [ ] Check coverage >80%

- [ ] **Integration testing**
  - [ ] Manual test: View dashboard
  - [ ] Verify all widgets load correctly
  - [ ] Check stats accuracy
  - [ ] Verify no console errors
  - [ ] Test loading states

- [ ] **Update documentation**
  - [ ] Update `CLAUDE.md` with service layer usage
  - [ ] Document service composition examples
  - [ ] Add notes on multiple service coordination

**Week 4-5 Deliverable**: 6 features using service layer, complex patterns established ✅

### Slice 3.3: Complex Migrations (Pattern 1) - Week 6

**Goal**: Handle most complex feature migrations

#### Feature 7: `add-game` (4-5 days)

**Note**: Complex due to IGDB integration, game creation + backlog addition

- [ ] **Review current implementation**
  - [ ] Document `server-actions/create-game-action.ts` flow
  - [ ] Document `server-actions/add-game.ts` flow
  - [ ] Identify IGDB integration points
  - [ ] Map to GameService and LibraryService methods

- [ ] **Migrate game creation**
  - [ ] Update `server-actions/create-game-action.ts`
  - [ ] Import GameService and LibraryService
  - [ ] Replace IGDB calls with `gameService.searchGames()` or similar
  - [ ] Replace game creation with `gameService.createGame()`
  - [ ] Update tests: `create-game-action.server-action.test.ts`

- [ ] **Migrate add-to-backlog operation**
  - [ ] Update `server-actions/add-game.ts`
  - [ ] Use service composition: GameService + LibraryService
  - [ ] Ensure transaction-like behavior via services
  - [ ] Handle IGDB enrichment through GameService

- [ ] **Test migration**
  - [ ] Run tests: `pnpm run test features/add-game`
  - [ ] Verify >80% coverage
  - [ ] Test IGDB integration mocks

- [ ] **Integration testing**
  - [ ] Manual test: Search for game via IGDB
  - [ ] Manual test: Add game to collection
  - [ ] Manual test: Quick add via modal
  - [ ] Verify default status is CURIOUS_ABOUT
  - [ ] Check for console errors

- [ ] **Update documentation**
  - [ ] Update `CLAUDE.md` with service layer usage
  - [ ] Document IGDB integration through services
  - [ ] Add service composition examples

#### Feature 8: `steam-integration` (4-5 days)

**Note**: Complex due to external API, bulk operations, multiple services

- [ ] **Review current implementation**
  - [ ] Document all server actions
  - [ ] Identify Steam API integration points
  - [ ] Identify bulk import operations
  - [ ] Map to GameService, LibraryService, and UserService

- [ ] **Migrate Steam connection operations**
  - [ ] Update `server-actions/get-steam-id-for-user.ts` → UserService
  - [ ] Keep external API routes (`/api/steam/*`) as-is (integration layer)

- [ ] **Migrate game fetching**
  - [ ] Update `server-actions/get-user-owned-games.ts`
  - [ ] Keep Steam API calls (external integration)
  - [ ] Use GameService for IGDB enrichment

- [ ] **Migrate bulk game import**
  - [ ] Update `server-actions/save-steam-games.ts`
  - [ ] Use GameService for game creation
  - [ ] Use LibraryService for backlog additions
  - [ ] Optimize for bulk operations
  - [ ] Consider transaction handling

- [ ] **Migrate achievements**
  - [ ] Update `server-actions/get-achievements.ts`
  - [ ] Keep Steam API calls (external data)
  - [ ] Use GameService for game data correlation

- [ ] **Test migration**
  - [ ] Run tests: `pnpm run test features/steam-integration`
  - [ ] Verify bulk operation handling
  - [ ] Test external API mocks

- [ ] **Integration testing**
  - [ ] Manual test: Connect Steam account
  - [ ] Manual test: Import Steam library
  - [ ] Manual test: View achievements
  - [ ] Verify bulk import performance
  - [ ] Check for console errors

- [ ] **Update documentation**
  - [ ] Update `CLAUDE.md` with service layer usage
  - [ ] Document bulk operation patterns
  - [ ] Add external API integration notes

**Week 6 Deliverable**: 8 features using service layer, all complex patterns handled ✅

### Slice 3.4: Evaluate Pattern 2 Migration (Week 7)

**Goal**: Decide on `view-collection` architecture and finalize remaining features

#### Feature 9: `view-collection` - Architecture Decision

**Context**: This feature has complex filtering/sorting, similar to `view-imported-games`

- [ ] **Evaluate for Pattern 2 (API Routes + React Query)**
  - [ ] Review current implementation
  - [ ] Assess filtering/searching complexity
  - [ ] Evaluate caching benefits
  - [ ] Compare with `view-imported-games` use case
  - [ ] **Decision**: Keep Server Actions (Pattern 1) OR migrate to React Query (Pattern 2)

**If Pattern 1 (Server Actions):**

- [ ] **Migrate to service layer**
  - [ ] Update `server-actions/get-game-with-backlog-items.ts` → LibraryService
  - [ ] Update `server-actions/get-uniques-platforms.ts` → LibraryService
  - [ ] Update tests: `get-game-with-backlog-items.server-action.test.ts`
  - [ ] Verify filtering performance

**If Pattern 2 (React Query):**

- [ ] **Create API route**
  - [ ] Create `/app/api/collection/route.ts` (or update existing)
  - [ ] Move server action logic to API route
  - [ ] Integrate with service layer
  - [ ] Add request validation

- [ ] **Create React Query hook**
  - [ ] Create `/features/view-collection/hooks/use-collection.ts`
  - [ ] Implement query with filtering/sorting
  - [ ] Configure caching strategy
  - [ ] Export types

- [ ] **Update components**
  - [ ] Refactor to use React Query hook
  - [ ] Simplify state management
  - [ ] Add loading/error states
  - [ ] Implement optimistic updates if needed

- [ ] **Test migration**
  - [ ] Create hook tests
  - [ ] Create API route tests
  - [ ] Update component tests

**Common tasks regardless of decision:**

- [ ] **Integration testing**
  - [ ] Manual test: View collection page
  - [ ] Test filtering by platform
  - [ ] Test search functionality
  - [ ] Test sorting options
  - [ ] Verify pagination works
  - [ ] Check performance

- [ ] **Update documentation**
  - [ ] Update `CLAUDE.md` with chosen pattern
  - [ ] Document reasoning for pattern choice
  - [ ] Add service layer integration details

#### Feature 10: `view-imported-games` - Add Service Layer

**Note**: Feature already uses Pattern 2 (React Query), just needs service layer integration

- [ ] **Update API route to use service layer**
  - [ ] Update `/app/api/imported-games/route.ts`
  - [ ] Import GameService (or create ImportedGameService if needed)
  - [ ] Replace direct repository calls with service calls
  - [ ] Keep validation and request handling logic

- [ ] **Consider creating ImportedGameService**
  - [ ] Evaluate if imported games need separate service
  - [ ] OR use existing GameService/LibraryService
  - [ ] **Decision**: Create new service OR use existing

- [ ] **Test migration**
  - [ ] Update/create API route tests
  - [ ] Mock service layer
  - [ ] Run tests: `pnpm run test features/view-imported-games`
  - [ ] Verify React Query functionality still works

- [ ] **Update documentation**
  - [ ] Update `REFACTOR.md` with service layer integration
  - [ ] Update `CLAUDE.md` with service usage
  - [ ] Document as Pattern 2 reference implementation

#### Feature 11: `view-backlogs` (1-2 days)

- [ ] **Migrate to service layer**
  - [ ] Update `server-actions/get-users-backlog.ts` → LibraryService
  - [ ] Update `server-actions/get-backlogs.ts` → LibraryService
  - [ ] Update tests

- [ ] **Integration testing**
  - [ ] Manual test: View personal backlog
  - [ ] Manual test: View shared backlog
  - [ ] Verify public sharing works

- [ ] **Update documentation**
  - [ ] Update `CLAUDE.md` with service layer usage

#### Feature 12: `manage-integrations` (1-2 days)

- [ ] **Migrate to service layer**
  - [ ] Update `server-actions/get-steam-user-data.ts` → UserService
  - [ ] Update `server-actions/remove-steam-data-from-user.ts` → UserService
  - [ ] Update tests

- [ ] **Integration testing**
  - [ ] Manual test: View integrations page
  - [ ] Manual test: Disconnect Steam
  - [ ] Verify connection status updates

- [ ] **Update documentation**
  - [ ] Update `CLAUDE.md` with service layer usage

**Week 7 Deliverable**: All features using service layer ✅

---

## Phase 4: Testing & Quality Assurance (Week 8, 15-20 hours)

**Goal**: Comprehensive testing and quality verification

### Slice 4.1: Service Layer Testing

- [ ] **Verify service test coverage**
  - [ ] Run: `pnpm run test:coverage shared/services`
  - [ ] Verify all services have >90% coverage
  - [ ] Add tests for any uncovered code paths
  - [ ] Test all error scenarios
  - [ ] Test all edge cases

### Slice 4.2: Feature Testing

- [ ] **Run all feature tests**
  - [ ] Run: `pnpm run test`
  - [ ] Verify all tests pass
  - [ ] Check overall coverage: `pnpm run test:coverage`
  - [ ] Ensure >80% overall coverage
  - [ ] Fix any failing tests

- [ ] **Integration testing per feature**
  - [ ] `add-game`: Add game → Update status → Delete
  - [ ] `dashboard`: Verify all stats load correctly
  - [ ] `view-collection`: Verify filtering and pagination
  - [ ] `view-game-details`: Verify all data displays
  - [ ] `steam-integration`: Verify import works
  - [ ] Check browser console for errors in all features

### Slice 4.3: End-to-End Testing

- [ ] **Critical user flows**
  - [ ] New user onboarding flow
  - [ ] Search and add game flow
  - [ ] Update library item status flow
  - [ ] Create and view review flow
  - [ ] Steam integration flow
  - [ ] Public sharing flow (wishlist/backlog)

- [ ] **Performance testing**
  - [ ] Test dashboard load time
  - [ ] Test collection page with many items
  - [ ] Test search/filter performance
  - [ ] Test bulk operations (Steam import)
  - [ ] Identify and fix bottlenecks

### Slice 4.4: Code Quality

- [ ] **Type checking**
  - [ ] Run: `pnpm typecheck`
  - [ ] Fix any TypeScript errors
  - [ ] Verify zero errors

- [ ] **Linting**
  - [ ] Run: `pnpm lint`
  - [ ] Fix any linting errors
  - [ ] Run: `pnpm lint:fix` for auto-fixable issues
  - [ ] Verify clean lint report

- [ ] **Formatting**
  - [ ] Run: `pnpm format:check`
  - [ ] Run: `pnpm format:write` to fix formatting
  - [ ] Verify consistent code style

- [ ] **Build verification**
  - [ ] Clear Next.js cache: `rm -rf .next`
  - [ ] Run: `pnpm build`
  - [ ] Verify build succeeds
  - [ ] Check for any build warnings
  - [ ] Fix any warnings

---

## Phase 5: Documentation & Deployment (Week 9, 10-15 hours)

**Goal**: Complete documentation and prepare for deployment

### Slice 5.1: Feature Documentation

- [ ] **Verify all feature CLAUDE.md files**
  - [ ] Check all features have updated `CLAUDE.md`
  - [ ] Verify service usage is documented
  - [ ] Ensure data flow diagrams are correct
  - [ ] Check code examples are up to date
  - [ ] Add service layer integration notes

### Slice 5.2: Architecture Documentation

- [ ] **Update main architecture docs**
  - [ ] Verify `context/product/architecture.md` is complete
  - [ ] Verify `context/product/service-layer-guide.md` is accurate
  - [ ] Verify `context/product/migration-guide.md` reflects reality
  - [ ] Add final diagrams and examples
  - [ ] Document two-pattern architecture thoroughly

- [ ] **Update main CLAUDE.md**
  - [ ] Update architecture section with service layer
  - [ ] Add service layer to data flow diagram
  - [ ] Reference service layer guide
  - [ ] Update development practices section
  - [ ] Document when to use each pattern

- [ ] **Create pattern comparison guide**
  - [ ] Side-by-side comparison of Pattern 1 vs Pattern 2
  - [ ] Include code examples for both
  - [ ] Document performance characteristics
  - [ ] Add decision flowchart

### Slice 5.3: Code Audit

- [ ] **Verify no direct repository calls from features**
  - [ ] Run: `grep -r "from ['"@]/shared/lib/repository" features/`
  - [ ] Ensure all imports are from services, not repositories
  - [ ] Fix any remaining direct repository calls
  - [ ] Document any intentional exceptions (if any)

- [ ] **Verify consistent feature structure**
  - [ ] Run automated structure checker
  - [ ] Verify all features follow standard conventions
  - [ ] Fix any inconsistencies
  - [ ] Generate final compliance report

- [ ] **Code cleanup**
  - [ ] Remove any unused imports
  - [ ] Remove commented-out code
  - [ ] Remove TODO comments that were addressed
  - [ ] Clean up any temporary code

### Slice 5.4: Pre-Deployment Verification

- [ ] **Final quality checks**
  - [ ] Run: `pnpm run code-check` (if exists)
  - [ ] Run: `pnpm typecheck`
  - [ ] Run: `pnpm lint`
  - [ ] Run: `pnpm test`
  - [ ] Run: `pnpm build`
  - [ ] Verify all pass

- [ ] **Manual testing in dev**
  - [ ] Test all critical features one final time
  - [ ] Check for console errors
  - [ ] Verify no regressions
  - [ ] Test in different browsers (Chrome, Firefox, Safari)
  - [ ] Test responsive layouts

### Slice 5.5: Deployment Preparation

- [ ] **Create rollback plan**
  - [ ] Document rollback procedure
  - [ ] Tag current state before deployment
  - [ ] Create rollback script if needed
  - [ ] Test rollback process

- [ ] **Deployment checklist**
  - [ ] Verify environment variables are set
  - [ ] Check database migration status
  - [ ] Verify Vercel configuration
  - [ ] Review deployment settings
  - [ ] Plan deployment timing (low-traffic period)

- [ ] **Post-deployment monitoring plan**
  - [ ] Set up error tracking (if not already)
  - [ ] Prepare monitoring dashboard
  - [ ] Document what to monitor:
    - Error rates
    - Response times
    - Database query performance
    - User-reported issues
  - [ ] Create alert thresholds

---

## Progress Tracking

**Week 1**: Feature Standardization ⬜
**Week 2**: Architecture Documentation Updates ⬜
**Week 3**: Simple Service Migrations (3 features) ⬜
**Week 4-5**: Medium Service Migrations (3 features) ⬜
**Week 6**: Complex Service Migrations (2 features) ⬜
**Week 7**: Pattern 2 Decisions & Final Migrations (4 features) ⬜
**Week 8**: Testing & Quality Assurance ⬜
**Week 9**: Documentation & Deployment Prep ⬜

**Overall Progress:** 0% (0/28 slices completed)

**Phase Progress:**

- Phase 0 (Standardization): 0/6 slices ⬜
- Phase 1 (Updated Docs): 0/2 slices ⬜
- Phase 2 (Services): ✅ Complete (from original plan)
- Phase 3 (Migration): 0/12 features ⬜
- Phase 4 (Testing): 0/4 slices ⬜
- Phase 5 (Docs & Deploy): 0/5 slices ⬜

---

## Key Changes from Original Plan

1. **Added Phase 0**: Feature structure standardization before service migration
2. **Flatten `manage-library-item`**: Consolidate nested sub-features
3. **Two-Pattern Architecture**: Acknowledged and documented Server Actions + React Query
4. **Realistic Estimates**: 90-120 hours instead of 80-110 hours
5. **Feature Prioritization**: Start with simple features, build to complex
6. **Pattern 2 Integration**: `view-imported-games` and potentially `view-collection`
7. **Better Testing**: More emphasis on integration and E2E testing

---

## Success Criteria

### Structural Standardization ✅

- [ ] All features use `/lib/validation.ts` for validation (NOT `/validation/`)
- [ ] No nested sub-features (flatten `manage-library-item`)
- [ ] Types in `types.ts` files (flatten `/types/` directories unless >5 definitions)
- [ ] Consistent directory structure across all features
- [ ] Automated compliance checker in place

### Service Layer Integration ✅

- [ ] Zero direct repository imports in server actions
- [ ] Zero direct repository imports in API routes
- [ ] All server actions call service layer
- [ ] All API routes call service layer
- [ ] Services have >90% test coverage

### Architecture Clarity ✅

- [ ] Clear documentation of Pattern 1 (Server Actions)
- [ ] Clear documentation of Pattern 2 (API Routes + React Query)
- [ ] Decision tree for pattern selection exists
- [ ] Both patterns demonstrated in codebase
- [ ] Updated migration guide for both patterns

### Code Quality ✅

- [ ] All features have passing tests
- [ ] `pnpm typecheck` passes (zero errors)
- [ ] `pnpm lint` passes (zero errors)
- [ ] `pnpm test` passes with >80% coverage
- [ ] `pnpm build` succeeds (zero errors)

### Feature Quality ✅

- [ ] All 12 features migrated to service layer
- [ ] All features tested and working
- [ ] No regressions in functionality
- [ ] Performance maintained or improved
- [ ] All documentation updated

---

**Next Action**: Begin Phase 0, Slice 0.1 - Create standardization guidelines

**Document Owner**: Architecture Team
**Last Updated**: 2025-10-08
**Status**: Ready for Implementation
