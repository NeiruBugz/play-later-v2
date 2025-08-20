# Cross-Feature Dependency Analysis

This document analyzes the current boundary violations in the PlayLater v2 codebase, identifying the specific cross-feature dependencies that need to be addressed during the architectural boundary migration.

## Current Boundary Violations

Based on ESLint boundaries analysis, there are **7 boundary violations** across **6 files** where features are importing from other features, violating the current architectural boundaries.

### 1. Manage Integrations → Steam Integration

**File**: `features/manage-integrations/components/service-integration.tsx`  
**Line**: 10  
**Violation**: Imports from steam-integration feature

```typescript
import {
  getUserOwnedGames,
  saveSteamGames,
} from "@/features/steam-integration/server-actions";
```

**Analysis**:

- **Business Logic**: Managing platform integrations depends on steam-specific operations
- **Coupling Type**: Server action dependency - tight coupling for Steam library syncing
- **Impact**: High - core functionality for Steam integration management

### 2. View Game Details → Steam Integration

**File**: `features/view-game-details/components/achievements.tsx`  
**Line**: 8  
**Violation**: Imports from steam-integration feature

```typescript
import { getUserAchievements } from "@/features/steam-integration/server-actions";
```

**Analysis**:

- **Business Logic**: Game detail page displays Steam achievements for authenticated users
- **Coupling Type**: Server action dependency for achievement data
- **Impact**: Medium - enhanced feature for Steam-connected users

### 3. View Game Details → Add Game

**File**: `features/view-game-details/components/external-game-actions.tsx`  
**Line**: 4  
**Violation**: Imports from add-game feature

```typescript
import { AddToCollectionModal } from "@/features/add-game";
```

**Analysis**:

- **Business Logic**: Game detail pages allow adding games to collection
- **Coupling Type**: UI component dependency - modal for quick game addition
- **Impact**: High - core user workflow for collection management

### 4. View Game Details → Multiple Features

**File**: `features/view-game-details/components/game-quick-actions.tsx`  
**Lines**: 3, 7  
**Violations**: Imports from add-game and manage-backlog-item features

```typescript
import { AddToCollectionModal } from "@/features/add-game";
// ...
import { EditGameEntryModal } from "@/features/manage-backlog-item/edit-backlog-item";
```

**Analysis**:

- **Business Logic**: Game detail pages provide comprehensive game management actions
- **Coupling Type**: UI component dependencies - modals for game management
- **Impact**: High - central hub for game management workflows

### 5. View Game Details → Add Review

**File**: `features/view-game-details/components/reviews.tsx`  
**Line**: 1  
**Violation**: Imports from add-review feature

```typescript
import { AddReviewDialog } from "@/features/add-review";
```

**Analysis**:

- **Business Logic**: Game detail pages allow users to add reviews
- **Coupling Type**: UI component dependency - dialog for review submission
- **Impact**: Medium - social/engagement feature

### 6. View Imported Games → Add Game

**File**: `features/view-imported-games/server-actions/import-to-application.ts`  
**Line**: 3  
**Violation**: Imports from add-game feature

```typescript
import { saveGameAndAddToBacklog } from "@/features/add-game/server-actions/add-game";
```

**Analysis**:

- **Business Logic**: Importing Steam games uses the same logic as manually adding games
- **Coupling Type**: Server action dependency - shared business logic
- **Impact**: High - code reuse for game creation workflow

## Dependency Patterns Analysis

### Pattern 1: View Game Details as Integration Hub

The `view-game-details` feature acts as a central hub that integrates multiple other features:

- **Add Game**: For adding games to collection from external pages
- **Manage Backlog Item**: For editing existing game entries
- **Add Review**: For submitting game reviews
- **Steam Integration**: For displaying achievements

This creates a hub-and-spoke pattern where one feature depends on many others.

### Pattern 2: Integration Features Cross-Dependency

Integration-related features have natural dependencies:

- **Manage Integrations** → **Steam Integration**: Platform management needs platform-specific operations
- **View Imported Games** → **Add Game**: Import workflow reuses game creation logic

### Pattern 3: Shared UI Component Dependencies

Multiple features depend on UI components from other features rather than shared components:

- Modal components for game management
- Dialog components for reviews
- Action buttons and forms

## Shared Components with Feature Dependencies

Based on our comprehensive testing, these shared components currently import from features:

### 1. GridView & ListView

**Files**: `shared/components/grid-view.tsx`, `shared/components/list-view.tsx`  
**Dependency**: `@/features/view-wishlist/types`

**Type Dependency**:

```typescript
import { type GameWithBacklogItems } from "@/features/view-wishlist/types";
```

**Analysis**:

- **Coupling Type**: Type definition dependency
- **Impact**: Low - pure type import, no runtime dependency
- **Solution Path**: Move type to shared types

### 2. CollectionNav

**File**: `shared/components/collection-nav.tsx`  
**Dependency**: `@/features/share-wishlist`

**Component Dependency**:

```typescript
import { ShareWishlist } from "@/features/share-wishlist";
```

**Analysis**:

- **Coupling Type**: UI component dependency
- **Impact**: Medium - functional component used in navigation
- **Solution Path**: Extract to shared component or pass as prop

### 3. Header

**File**: `shared/components/header.tsx`  
**Dependencies**: `@/features/manage-user-info`, `@/features/theme-toggle`

**Component Dependencies**:

```typescript
import { User } from "@/features/manage-user-info/components/user";
import { ThemeToggle } from "@/features/theme-toggle/components/theme-toggle";
```

**Analysis**:

- **Coupling Type**: UI component dependencies for header functionality
- **Impact**: Medium - essential header features
- **Solution Path**: Move to shared components or composition pattern

## Impact Assessment

### High Impact Violations (5)

These violations represent core user workflows and would significantly impact functionality if broken:

1. **Manage Integrations** → **Steam Integration**
2. **View Game Details** → **Add Game**
3. **View Game Details** → **Manage Backlog Item**
4. **View Imported Games** → **Add Game**

### Medium Impact Violations (2)

These enhance user experience but aren't core to basic functionality:

1. **View Game Details** → **Steam Integration** (achievements)
2. **View Game Details** → **Add Review**

### Shared Component Impact (3)

These affect layout and navigation but have cleaner migration paths:

1. **GridView/ListView** → **View Wishlist** (types only)
2. **CollectionNav** → **Share Wishlist**
3. **Header** → **User Management/Theme Toggle**

## Migration Strategy Insights

Based on this analysis, the migration should follow these principles:

### 1. Service Layer Approach

For high-impact server action dependencies, introduce a service layer:

- **Game Management Service**: Consolidate add-game and import workflows
- **Integration Service**: Abstract Steam-specific operations
- **Achievement Service**: Centralize Steam achievement logic

### 2. Shared Component Migration

Move commonly used UI components to shared:

- Modal components for game management
- Dialog components for reviews and actions
- Navigation and user interface components

### 3. Type Consolidation

Consolidate shared types in `shared/types`:

- Game and backlog item types
- User interface types
- Integration-related types

### 4. Composition Over Dependency

For complex dependencies like game-quick-actions, use composition:

- Pass actions as props instead of importing components
- Use dependency injection for server actions
- Implement plugin-style architecture for feature integration

## Test Coverage Status

✅ **Comprehensive test coverage established** (94 tests across 7 files):

- All boundary violation components have complete test suites
- Elements and actions pattern established for maintainability
- Edge cases, error handling, and accessibility covered
- Strong foundation for safe refactoring

## Next Steps

1. **Establish Performance Baselines**: Measure current performance metrics before changes
2. **Design Service Layer**: Plan the service abstraction based on dependency analysis
3. **Create Migration Plan**: Define atomic commits for incremental migration
4. **Execute Migration**: Implement changes with test-driven approach
5. **Validate Architecture**: Ensure boundaries are properly enforced

---

_Analysis completed: 2024-12-19_  
_Test Coverage: 94 tests across 7 boundary violation components_  
_Boundary Violations: 7 feature-to-feature, 3 shared-to-feature_
