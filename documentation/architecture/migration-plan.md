# Incremental Migration Plan - Atomic Commits

**Date**: 2024-12-19  
**Purpose**: Define atomic, safe migration steps to eliminate boundary violations

## Migration Overview

**Goal**: Eliminate 7 boundary violations through incremental, test-driven migrations  
**Strategy**: Atomic commits with rollback points and comprehensive test validation  
**Safety**: Each commit maintains green build and test suite

## Atomic Commit Sequence

### Phase 1: Foundation (4 commits) - SAFE ✅

#### Commit 1: Create Service Layer Infrastructure

```bash
git checkout -b feat/service-layer-foundation
```

**Files Created**:

- `shared/services/types.ts` - Core service interfaces
- `shared/services/index.ts` - Service registry
- `shared/services/README.md` - Service usage documentation

**Test Added**:

- `shared/services/service-registry.test.ts` - Basic service instantiation

**Validation**:

- ✅ Build succeeds (no new dependencies)
- ✅ All 313 tests pass
- ✅ No boundary violations introduced

**Rollback**: Delete service files, no impact on existing code

---

#### Commit 2: Move Shared Types (Type-only Migration)

```bash
git checkout -b fix/move-shared-types
```

**Changes**:

- Move `features/view-wishlist/types/index.ts` → `shared/types/wishlist.ts`
- Update imports in:
  - `shared/components/grid-view.tsx`
  - `shared/components/list-view.tsx`
  - Update exports in `shared/types/index.ts`

**Boundary Violations Fixed**: 2 (grid-view, list-view type imports)

**Tests**:

- ✅ All existing grid-view and list-view tests pass
- ✅ No functionality changes

**Validation Command**:

```bash
bun run test shared/components/grid-view.test.tsx shared/components/list-view.test.tsx
bun run build # Should reduce boundary violations by 2
```

**Rollback**: Simple git revert, pure type movement

---

#### Commit 3: Create Component Service Facades

```bash
git checkout -b feat/component-service-facades
```

**Files Created**:

- `shared/services/user-interface/modal-service.ts`
- `shared/services/user-interface/navigation-service.ts`
- `shared/services/user-interface/index.ts`
- `shared/services/user-interface/types.ts`

**Implementation**:

```typescript
// Facade pattern - no new dependencies yet
export const modalService = {
  // Lazy loaded facades to existing components
  AddToCollectionModal: lazy(() => import("@/features/add-game")),
  EditGameEntryModal: lazy(() => import("@/features/manage-backlog-item")),
  AddReviewDialog: lazy(() => import("@/features/add-review")),
};
```

**Tests**:

- `shared/services/user-interface/modal-service.test.ts`
- Verify lazy loading works correctly

**Validation**:

- ✅ Services instantiate correctly
- ✅ Lazy loading doesn't break
- ✅ No new boundary violations

**Rollback**: Delete service files, no existing code changes

---

#### Commit 4: Update Service Registry with All Services

```bash
git checkout -b feat/complete-service-registry
```

**Files Created**:

- `shared/services/game-management/types.ts`
- `shared/services/integration/types.ts`
- Update `shared/services/index.ts` with full registry

**Implementation**: Interface definitions only, no implementations

**Tests**: Service interface validation tests

**Validation**:

- ✅ All service interfaces are properly typed
- ✅ Service registry builds correctly
- ✅ No runtime dependencies added yet

**Rollback**: Revert service additions

---

### Phase 2: Low-Risk Component Updates (2 commits) - SAFE ✅

#### Commit 5: Update Header Component Dependencies

```bash
git checkout -b fix/header-component-services
```

**Changes**:

- Update `shared/components/header.tsx` to use navigation service
- Create proper service injection pattern
- Maintain exact same component behavior

**Boundary Violations Fixed**: 1 (header → user-info + theme-toggle)

**Tests**:

- ✅ All 24 header tests pass unchanged
- ✅ Component behavior identical

**Validation**:

```bash
bun run test shared/components/header.test.tsx
bun run build # Boundary violations reduced by 1
```

**Rollback**: Single file revert

---

#### Commit 6: Update CollectionNav Component Dependencies

```bash
git checkout -b fix/collection-nav-services
```

**Changes**:

- Update `shared/components/collection-nav.tsx` to use navigation service
- Service injection for ShareWishlist component

**Boundary Violations Fixed**: 1 (collection-nav → share-wishlist)

**Tests**:

- ✅ All 27 collection-nav tests pass unchanged

**Validation**:

```bash
bun run test shared/components/collection-nav.test.tsx
bun run build # Boundary violations reduced by 1 more (total 3 fixed)
```

**Rollback**: Single file revert

---

### Phase 3: Medium-Risk Service Implementation (3 commits) - MODERATE RISK ⚠️

#### Commit 7: Implement Game Management Service

```bash
git checkout -b feat/game-management-service
```

**Files Created**:

- `shared/services/game-management/game-management-service.ts`
- `shared/services/game-management/game-management-service.test.ts`

**Implementation**: Consolidate logic from add-game feature

**Tests**:

- Comprehensive service unit tests
- Integration tests with repository layer
- Performance tests (maintain < 8s total test time)

**Validation**:

- ✅ All existing game creation workflows work
- ✅ No performance regression
- ✅ Service tests pass

**Rollback Strategy**: More complex - requires careful validation

---

#### Commit 8: Migrate View-Imported-Games to Game Management Service

```bash
git checkout -b feat/migrate-imported-games-service
```

**Changes**:

- Update `features/view-imported-games/server-actions/import-to-application.ts`
- Use game management service instead of direct add-game import
- Maintain exact API contract

**Boundary Violations Fixed**: 1 (view-imported-games → add-game)

**Tests**:

- ✅ All import workflow tests pass
- ✅ End-to-end import functionality unchanged

**Validation**:

```bash
bun run test features/view-imported-games/
bun run build # Should show 4 violations fixed (3 + 1)
```

**Rollback**: Service delegation revert

---

#### Commit 9: Implement Steam Integration Service

```bash
git checkout -b feat/steam-integration-service
```

**Files Created**:

- `shared/services/integration/steam-integration-adapter.ts`
- `shared/services/integration/steam-integration-adapter.test.ts`

**Implementation**: Adapter pattern delegating to existing steam-integration

**Tests**:

- Service adapter unit tests
- Integration tests with Steam API
- Mock Steam responses for reliable testing

**Validation**:

- ✅ Steam integration workflows unchanged
- ✅ Achievement display works correctly
- ✅ Library sync functionality intact

**Rollback**: Delete service files, no existing code changes yet

---

### Phase 4: High-Risk Integration Migration (3 commits) - HIGH RISK 🔴

#### Commit 10: Migrate View-Game-Details Achievement Component

```bash
git checkout -b feat/migrate-achievements-service
```

**Changes**:

- Update `features/view-game-details/components/achievements.tsx`
- Use Steam integration service instead of direct import
- Maintain exact component behavior

**Boundary Violations Fixed**: 1 (view-game-details → steam-integration)

**Tests**:

- ✅ Achievement component tests pass
- ✅ Steam achievement display unchanged

**Validation**:

```bash
bun run test features/view-game-details/components/
bun run build # Should show 5 violations fixed
```

**Rollback**: Single component file revert

---

#### Commit 11: Migrate Manage-Integrations to Steam Service

```bash
git checkout -b feat/migrate-manage-integrations-service
```

**Changes**:

- Update `features/manage-integrations/components/service-integration.tsx`
- Use Steam integration service for library operations
- Maintain exact UI behavior

**Boundary Violations Fixed**: 1 (manage-integrations → steam-integration)

**Tests**:

- ✅ Integration management tests pass
- ✅ Steam sync workflows unchanged

**Validation**:

```bash
bun run test features/manage-integrations/
bun run build # Should show 6 violations fixed
```

**Rollback**: Single component file revert

---

#### Commit 12: Migrate View-Game-Details Modal Dependencies (FINAL)

```bash
git checkout -b feat/migrate-game-details-modals
```

**Changes**:

- Update all view-game-details components:
  - `external-game-actions.tsx`
  - `game-quick-actions.tsx`
  - `reviews.tsx`
- Use modal service for all modal dependencies
- Maintain exact UI behavior and functionality

**Boundary Violations Fixed**: 3 (final violations - add-game, manage-backlog-item, add-review)

**Tests**:

- ✅ All view-game-details component tests pass
- ✅ Modal workflows identical
- ✅ Game management actions unchanged

**Validation**:

```bash
bun run test features/view-game-details/
bun run build # SUCCESS - Zero boundary violations! ✅
bun run test # All 313+ tests pass
```

**Final Success**: 🎉 All 7 boundary violations eliminated!

---

## Rollback Strategy

### Immediate Rollback (Single Commit)

```bash
git revert HEAD
bun run test # Verify rollback success
```

### Multi-Commit Rollback

```bash
git revert HEAD~n # n = number of commits to revert
bun run test # Verify each rollback step
```

### Emergency Rollback (Nuclear Option)

```bash
git checkout main
git branch -D [feature-branch]
# Start over from known good state
```

## Validation Checkpoints

### After Each Commit

```bash
# Required validation sequence
bun run test                    # All tests pass
bun run lint                    # Check boundary violations
bun run typecheck               # No TypeScript errors
bun run build                   # Successful build (once violations fixed)

# Performance validation
time bun run test              # Maintain < 8s execution time
```

### Milestone Checkpoints

**After Phase 1 (Foundation)**:

- ✅ 2 boundary violations fixed (types)
- ✅ Service infrastructure ready
- ✅ No functionality changes

**After Phase 2 (Component Services)**:

- ✅ 4 boundary violations fixed (2 more)
- ✅ Shared components use services
- ✅ UI behavior unchanged

**After Phase 3 (Service Implementation)**:

- ✅ 5 boundary violations fixed (1 more)
- ✅ Business logic services working
- ✅ Import workflows use services

**After Phase 4 (Integration Migration)**:

- ✅ 7 boundary violations fixed (ALL!)
- ✅ Green build with boundaries enforced
- ✅ Complete architectural compliance

## Risk Assessment Per Commit

### Low Risk (Commits 1-6) ✅

- Type movements and infrastructure
- Facade pattern implementations
- Single component updates
- Easy rollback

### Medium Risk (Commits 7-9) ⚠️

- Service implementations
- Business logic consolidation
- Multi-component coordination
- Moderate rollback complexity

### High Risk (Commits 10-12) 🔴

- Critical workflow migrations
- Complex component updates
- Multiple boundary violations per commit
- Comprehensive testing required

## Success Criteria

### Technical Success

- [ ] **Zero boundary violations** in ESLint
- [ ] **All tests pass** (maintain 313+ test count)
- [ ] **Build succeeds** with full linting enabled
- [ ] **Performance maintained** (< 8s test execution)

### Architectural Success

- [ ] **Clean service abstractions** implemented
- [ ] **Dependency inversion** achieved
- [ ] **Feature isolation** maintained
- [ ] **Future extensibility** enabled

### Process Success

- [ ] **No functionality regressions** in any workflow
- [ ] **All existing tests pass** without modification
- [ ] **Atomic commit history** for easy rollback
- [ ] **Documentation updated** for service usage

---

_Migration plan designed for maximum safety with comprehensive rollback strategies and validation checkpoints._
