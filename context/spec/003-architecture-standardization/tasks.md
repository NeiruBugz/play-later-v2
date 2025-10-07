# Architecture Standardization - Task List

**Status**: Ready for Implementation
**Estimated Time**: 80-110 hours (6-7 weeks)
**Strategy**: Vertical slicing - each phase keeps the application in a working state

---

## Phase 1: Foundation & Documentation (Week 1, 15-20 hours)

### Slice 1: Architecture Documentation & Standards

- [x] **Update architecture documentation**
  - [x] Update `context/product/architecture.md`: Add section "11. Service Layer Architecture"
  - [x] Add service layer diagram showing three-tier architecture
  - [x] Document service responsibilities and boundaries
  - [x] Add service naming conventions and file organization
  - [x] Document when to use service layer vs direct repository calls
  - [x] Include service composition patterns and best practices

- [x] **Create service layer guide**
  - [x] Create `context/product/service-layer-guide.md`
  - [x] Document standard service class structure
  - [x] Include complete code examples for each service type
  - [x] Add error handling patterns
  - [x] Document testing approach for services
  - [x] Include service composition examples
  - [x] Add troubleshooting section

- [x] **Create migration guide**
  - [x] Create `context/product/migration-guide.md`
  - [x] Document step-by-step migration process
  - [x] Include before/after code examples
  - [x] Add checklist for feature refactoring
  - [x] Document testing requirements
  - [x] Include rollback procedures

### Slice 2: Service Layer Infrastructure

- [x] **Set up testing infrastructure**
  - [x] Create `test/helpers/service-test-helpers.ts` with common mock utilities
  - [x] Create repository mock factory patterns
  - [x] Add service test utilities (mock builders, assertion helpers)
  - [x] Update `test/setup/vitest.config.ts` if needed

- [x] **Create shared types**
  - [x] Create `shared/services/types.ts`
  - [x] Add `ServiceResult<T>` generic type
  - [x] Add `PaginatedResult<T>` type
  - [x] Add common error types
  - [x] Add service input/output base types
  - [x] Export from `shared/services/index.ts`

---

## Phase 2: Core Services Implementation (Week 2-3, 25-35 hours)

### Slice 3: LibraryService Implementation

- [x] **Create LibraryService foundation**
  - [x] Create directory: `shared/services/library/`
  - [x] Create `library/types.ts` with all service input/output types
  - [x] Create `library/library-service.ts` class skeleton
  - [x] Add constructor with repository dependency
  - [x] Export from `library/index.ts`

- [x] **Implement LibraryService methods**
  - [x] Implement `getLibraryItems(input)` method
  - [x] Implement `createLibraryItem(input)` method
  - [x] Implement `updateLibraryItem(input)` method
  - [x] Implement `deleteLibraryItem(id, userId)` method
  - [x] Implement `getLibraryItemCount(userId, filters)` method
  - [x] Add private helper methods for validation and transformation

- [x] **Test LibraryService**
  - [x] Create `library/library-service.test.ts`
  - [x] Mock all repository dependencies
  - [x] Test all public methods with valid input
  - [x] Test validation error scenarios
  - [x] Test repository error handling
  - [x] Test business logic edge cases
  - [x] Achieve >90% coverage: `pnpmrun test shared/services/library`

- [x] **Document LibraryService**
  - [x] Add JSDoc comments to all public methods
  - [x] Document input/output types
  - [x] Add usage examples in comments
  - [x] Update service index exports

### Slice 4: GameService Implementation

- [x] **Create GameService foundation**
  - [x] Create directory: `shared/services/game/`
  - [x] Create `game/types.ts` with service types
  - [x] Create `game/game-service.ts` class skeleton
  - [x] Add repository dependencies
  - [x] Export from `game/index.ts`

- [x] **Implement GameService methods**
  - [x] Implement `getGame(id)` method
  - [x] Implement `searchGames(query, filters)` method
  - [x] Implement `createGame(input)` method
  - [x] Implement `updateGame(id, input)` method
  - [x] Implement `getGameWithLibraryItems(gameId, userId)` method
  - [x] Add IGDB integration wrapper methods

- [x] **Test GameService**
  - [x] Create `game/game-service.test.ts`
  - [x] Mock repository and IGDB dependencies
  - [x] Test all CRUD methods
  - [x] Test search functionality
  - [x] Test error scenarios
  - [x] Achieve >90% coverage

- [x] **Document GameService**
  - [x] Add JSDoc comments
  - [x] Document IGDB integration
  - [x] Add usage examples

### Slice 5: ReviewService, UserService, JournalService

- [x] **Create ReviewService**
  - [x] Create `shared/services/review/` directory
  - [x] Implement `review-service.ts` with CRUD methods
  - [x] Create `types.ts` and tests
  - [x] Test with >90% coverage
  - [x] Document API

- [x] **Create UserService**
  - [x] Create `shared/services/user/` directory
  - [x] Implement `user-service.ts` with user operations
  - [x] Add Steam integration methods
  - [x] Create types and tests
  - [x] Test with >90% coverage
  - [x] Document API

- [x] **Create JournalService**
  - [x] Create `shared/services/journal/` directory
  - [x] Implement `journal-service.ts` with CRUD methods
  - [x] Add mood and session tracking logic
  - [x] Create types and tests
  - [x] Test with >90% coverage
  - [x] Document API

- [x] **Update shared services index**
  - [x] Update `shared/services/index.ts` to export all services
  - [x] Verify clean imports: `import { LibraryService } from '@/shared/services'`
  - [x] Run typecheck: `pnpmtypecheck`

---

## Phase 3: Feature Migration (Week 4-6, 35-50 hours)

### Slice 6: Refactor manage-library-item Feature

- [ ] **Extract business logic to service**
  - [ ] Identify business logic in `create-library-item/server-actions/action.ts`
  - [ ] Verify LibraryService has equivalent methods
  - [ ] Identify business logic in `edit-library-item/server-actions/action.ts`
  - [ ] Identify business logic in `delete-library-item/server-actions/action.ts`

- [ ] **Update create-library-item**
  - [ ] Update `create-library-item/server-actions/action.ts`
  - [ ] Import LibraryService
  - [ ] Replace repository calls with service calls
  - [ ] Simplify to thin wrapper pattern
  - [ ] Keep validation schemas in feature's `lib/validation.ts`
  - [ ] Update tests: `create-library-item/server-actions/action.test.ts`
  - [ ] Run tests: `pnpmrun test features/manage-library-item/create-library-item`

- [ ] **Update edit-library-item**
  - [ ] Update `edit-library-item/server-actions/action.ts`
  - [ ] Replace repository calls with LibraryService.updateLibraryItem
  - [ ] Update all related server actions in edit-library-item
  - [ ] Update tests
  - [ ] Run tests: `pnpmrun test features/manage-library-item/edit-library-item`

- [ ] **Update delete-library-item**
  - [ ] Update `delete-library-item/server-actions/action.ts`
  - [ ] Replace repository calls with LibraryService.deleteLibraryItem
  - [ ] Update tests
  - [ ] Run tests: `pnpmrun test features/manage-library-item/delete-library-item`

- [ ] **Standardize feature structure**
  - [ ] Ensure consistent `/lib/validation.ts` location
  - [ ] Move any misplaced files to standard locations
  - [ ] Update feature exports in `index.ts`
  - [ ] Update `CLAUDE.md` to reflect service layer usage
  - [ ] Run full feature tests: `pnpmrun test features/manage-library-item`

- [ ] **Integration testing**
  - [ ] Manual test: Create library item via UI
  - [ ] Manual test: Edit library item status
  - [ ] Manual test: Delete library item
  - [ ] Verify all operations work correctly
  - [ ] Check browser console for errors

### Slice 7: Refactor add-game Feature

- [ ] **Extract business logic**
  - [ ] Identify logic in `server-actions/create-game-action.ts`
  - [ ] Identify logic in `server-actions/add-game.ts`
  - [ ] Verify GameService and LibraryService have needed methods

- [ ] **Update server actions**
  - [ ] Update `server-actions/create-game-action.ts`
  - [ ] Import GameService and LibraryService
  - [ ] Replace repository calls with service calls
  - [ ] Simplify business logic to service layer
  - [ ] Update `server-actions/add-game.ts`

- [ ] **Update and test**
  - [ ] Update tests: `server-actions/create-game-action.test.ts`
  - [ ] Run tests: `pnpmrun test features/add-game`
  - [ ] Ensure validation remains in `lib/validation.ts`
  - [ ] Update `CLAUDE.md` documentation

- [ ] **Integration testing**
  - [ ] Manual test: Search for game
  - [ ] Manual test: Add game to library
  - [ ] Manual test: Quick add via modal
  - [ ] Verify IGDB integration works
  - [ ] Check default status is CURIOUS_ABOUT

### Slice 8: Refactor dashboard Feature

- [ ] **Identify service dependencies**
  - [ ] Review `server-actions/get-backlog-items-count.ts`
  - [ ] Review `server-actions/get-aggregated-review-ratings.ts`
  - [ ] Review `server-actions/get-recent-completed-backlog-items.ts`
  - [ ] Review all dashboard server actions

- [ ] **Update server actions**
  - [ ] Update `get-backlog-items-count.ts` to use LibraryService
  - [ ] Update `get-aggregated-review-ratings.ts` to use ReviewService
  - [ ] Update `get-recent-completed-backlog-items.ts` to use LibraryService
  - [ ] Update `get-platform-breakdown.ts` to use LibraryService
  - [ ] Update `get-acquisition-type-breakdown.ts` to use LibraryService
  - [ ] Update all remaining dashboard server actions

- [ ] **Simplify business logic**
  - [ ] Move aggregation logic to services
  - [ ] Extract filtering logic to services
  - [ ] Simplify server actions to thin wrappers
  - [ ] Update tests for all server actions

- [ ] **Test and document**
  - [ ] Run tests: `pnpmrun test features/dashboard`
  - [ ] Update `CLAUDE.md` with service usage
  - [ ] Manual test: View dashboard, verify all stats correct

### Slice 9: Refactor view-game-details Feature

- [ ] **Review existing implementation**
  - [ ] Check `server-actions/get-game.ts`
  - [ ] Check `server-actions/get-reviews.ts`
  - [ ] Check `server-actions/get-library-items-by-igdb-id.ts`

- [ ] **Update to use services**
  - [ ] Update `get-game.ts` to use GameService
  - [ ] Update `get-reviews.ts` to use ReviewService
  - [ ] Update `get-library-items-by-igdb-id.ts` to use LibraryService
  - [ ] Simplify all server actions

- [ ] **Test and document**
  - [ ] Update tests: `server-actions/*.test.ts`
  - [ ] Run tests: `pnpmrun test features/view-game-details`
  - [ ] Update `CLAUDE.md`
  - [ ] Manual test: View game details page, verify all data loads

### Slice 10: Refactor view-collection Feature

- [ ] **Verify existing service layer**
  - [ ] Review `shared/services/collection/collection-service.ts`
  - [ ] Check if it follows new standards
  - [ ] Update if necessary to match LibraryService patterns

- [ ] **Update server actions (if needed)**
  - [ ] Verify `server-actions/get-game-with-backlog-items.ts` uses service correctly
  - [ ] Verify `server-actions/get-uniques-platforms.ts` uses service
  - [ ] Update to use LibraryService if not already

- [ ] **Standardize structure**
  - [ ] Ensure validation is in `lib/validation.ts`
  - [ ] Check directory structure matches standard
  - [ ] Update `CLAUDE.md` if needed
  - [ ] Run tests: `pnpmrun test features/view-collection`

### Slice 11: Refactor Remaining Features

- [ ] **Refactor steam-integration**
  - [ ] Update to use GameService and LibraryService
  - [ ] Update server actions
  - [ ] Update tests
  - [ ] Update `CLAUDE.md`

- [ ] **Refactor view-imported-games**
  - [ ] Update to use GameService
  - [ ] Move validation to `lib/validation.ts` (currently in separate `/validation`)
  - [ ] Update server actions
  - [ ] Update tests
  - [ ] Update `CLAUDE.md`

- [ ] **Refactor view-wishlist**
  - [ ] Update to use LibraryService
  - [ ] Update server actions
  - [ ] Update tests
  - [ ] Update `CLAUDE.md`

- [ ] **Refactor share-wishlist**
  - [ ] Update to use LibraryService
  - [ ] Update server actions
  - [ ] Update tests
  - [ ] Update `CLAUDE.md`

- [ ] **Refactor manage-integrations**
  - [ ] Update to use UserService
  - [ ] Update Steam integration actions
  - [ ] Update tests
  - [ ] Update `CLAUDE.md`

- [ ] **Refactor manage-user-info**
  - [ ] Update to use UserService
  - [ ] Update server actions
  - [ ] Update tests
  - [ ] Update `CLAUDE.md`

- [ ] **Refactor add-review**
  - [ ] Update to use ReviewService
  - [ ] Update server actions
  - [ ] Update tests
  - [ ] Update `CLAUDE.md`

- [ ] **Verify no direct repository calls**
  - [ ] Run codebase search: `grep -r "from '@/shared/lib/repository'" features/`
  - [ ] Ensure all imports are from services, not repositories
  - [ ] Fix any remaining direct repository calls

---

## Phase 4: Testing & Quality Assurance (Week 7, 15-20 hours)

### Slice 12: Comprehensive Testing

- [ ] **Service layer testing**
  - [ ] Verify all services have >90% coverage
  - [ ] Run: `pnpmrun test:coverage shared/services`
  - [ ] Add missing tests for uncovered code paths
  - [ ] Ensure all error scenarios are tested

- [ ] **Integration testing**
  - [ ] Run full test suite: `pnpmrun test`
  - [ ] Verify all tests pass
  - [ ] Check overall coverage: `pnpmrun test:coverage`
  - [ ] Ensure >80% overall coverage

- [ ] **End-to-end testing**
  - [ ] Test critical user flow: Add game → Update status → Delete
  - [ ] Test dashboard: Verify all stats load correctly
  - [ ] Test collection: Verify filtering and pagination
  - [ ] Test game details: Verify all data displays
  - [ ] Test Steam integration: Verify import works
  - [ ] Check browser console for errors

### Slice 13: Code Quality & Standards

- [ ] **Type checking**
  - [ ] Run: `pnpmtypecheck`
  - [ ] Fix any TypeScript errors
  - [ ] Verify zero errors

- [ ] **Linting**
  - [ ] Run: `pnpmlint`
  - [ ] Fix any linting errors
  - [ ] Run: `pnpmlint:fix` for auto-fixable issues

- [ ] **Formatting**
  - [ ] Run: `pnpmformat:check`
  - [ ] Run: `pnpmformat:write` to fix formatting
  - [ ] Verify consistent code style

- [ ] **Build verification**
  - [ ] Clear Next.js cache: `rm -rf .next`
  - [ ] Run: `pnpmbuild`
  - [ ] Verify build succeeds
  - [ ] Check for any build warnings

### Slice 14: Documentation Updates

- [ ] **Update main CLAUDE.md**
  - [ ] Update architecture section to mention service layer
  - [ ] Add service layer to data flow diagram
  - [ ] Reference service layer guide
  - [ ] Update development practices section

- [ ] **Verify feature documentation**
  - [ ] Check all feature `CLAUDE.md` files updated
  - [ ] Verify service usage is documented
  - [ ] Ensure data flow diagrams are correct
  - [ ] Check code examples are up to date

- [ ] **Update architecture documentation**
  - [ ] Verify `context/product/architecture.md` has service layer section
  - [ ] Verify `context/product/service-layer-guide.md` is complete
  - [ ] Verify `context/product/migration-guide.md` is accurate
  - [ ] Add any missing diagrams or examples

---

## Phase 5: Final Verification & Cleanup (Week 7-8, 10-15 hours)

### Slice 15: Performance Verification

- [ ] **Benchmark critical paths**
  - [ ] Measure dashboard load time (before/after)
  - [ ] Measure collection page load time (before/after)
  - [ ] Measure library item operations (create/update/delete)
  - [ ] Ensure no regression (within ±5%)

- [ ] **Check service overhead**
  - [ ] Add performance logging to services (dev only)
  - [ ] Measure average service execution time
  - [ ] Verify overhead is <10ms per service call
  - [ ] Remove performance logging before production

### Slice 16: Feature Flag Cleanup

- [ ] **If feature flags were used:**
  - [ ] Verify all features work with service layer
  - [ ] Remove feature flag configuration
  - [ ] Delete old code paths
  - [ ] Clean up conditional logic

### Slice 17: Final Code Review

- [ ] **Self-review checklist**
  - [ ] All features follow standardized structure
  - [ ] All business logic is in services
  - [ ] All server actions are thin wrappers
  - [ ] No direct repository calls from server actions
  - [ ] All services have comprehensive tests
  - [ ] Documentation is complete and accurate

- [ ] **Prepare for PR**
  - [ ] Create comprehensive PR description
  - [ ] List all changed features
  - [ ] Include migration notes
  - [ ] Add before/after code examples
  - [ ] Reference architectural decisions

### Slice 18: Deployment Preparation

- [ ] **Pre-deployment verification**
  - [ ] Run all quality checks: `pnpmrun code-check`
  - [ ] Run full test suite one final time
  - [ ] Verify build succeeds
  - [ ] Check no console errors in dev
  - [ ] Review Vercel deployment configuration

- [ ] **Create rollback plan**
  - [ ] Document rollback procedure
  - [ ] Create rollback script if needed
  - [ ] Tag current production version
  - [ ] Prepare rollback communication plan

- [ ] **Monitor post-deployment**
  - [ ] Set up alerts for error rates
  - [ ] Monitor Vercel function logs
  - [ ] Check response time metrics
  - [ ] Monitor user feedback channels

---

## Notes

### Vertical Slicing Strategy

Each slice represents a complete, testable increment:

- **Phase 1 (Slices 1-2):** Foundation - documentation and infrastructure
- **Phase 2 (Slices 3-5):** Core services - reusable business logic layer
- **Phase 3 (Slices 6-11):** Feature migration - incremental adoption
- **Phase 4 (Slices 12-14):** Quality assurance - comprehensive verification
- **Phase 5 (Slices 15-18):** Final verification - production readiness

### Rollback Strategy

- Each feature migration is independent
- Can rollback individual features without affecting others
- Service layer is additive, not destructive
- Old repository calls can be restored by reverting PR

### Implementation Philosophy

**After each numbered slice:**

- Application remains in runnable state
- Tests pass (may be WIP for current slice)
- No breaking changes to existing features
- Documentation reflects current state

### Success Criteria

**Per Feature:**

- ✅ Uses service layer for all business logic
- ✅ Server actions are thin wrappers
- ✅ Tests updated and passing
- ✅ Documentation updated

**Overall:**

- ✅ All services have >90% test coverage
- ✅ Overall codebase has >80% test coverage
- ✅ Zero TypeScript errors
- ✅ Zero linting errors
- ✅ Build succeeds
- ✅ All features working in production

---

## Progress Tracking

**Week 1:** Foundation ⬜
**Week 2:** Core Services (Library, Game) ⬜
**Week 3:** Core Services (Review, User, Journal) ⬜
**Week 4:** Feature Migration (High Priority) ⬜
**Week 5:** Feature Migration (Medium Priority) ⬜
**Week 6:** Feature Migration (Remaining) ⬜
**Week 7-8:** Testing & Deployment ⬜

**Overall Progress:** 0% (0/18 slices completed)

---

**Next Action:** Start with Slice 1 - Update architecture documentation
