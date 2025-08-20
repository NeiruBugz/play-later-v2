# Service Layer Design for Boundary Migration

**Date**: 2024-12-19  
**Purpose**: Design service layer to eliminate cross-feature dependencies

## Executive Summary

Based on our comprehensive boundary violation analysis, we'll implement a service layer that abstracts cross-feature dependencies through clean interfaces. This approach maintains existing functionality while enforcing architectural boundaries.

## Service Architecture Overview

### Core Principles

1. **Dependency Inversion**: Features depend on service interfaces, not implementations
2. **Single Responsibility**: Each service handles one domain concern
3. **Composition Over Inheritance**: Services compose functionality from repositories
4. **Interface Segregation**: Minimal, focused service interfaces

### Service Layer Structure

```
shared/services/
├── game-management/          # Game CRUD and collection operations
│   ├── game-management-service.ts
│   ├── types.ts
│   └── index.ts
├── integration/              # Platform integration abstractions
│   ├── integration-service.ts
│   ├── steam-integration-adapter.ts
│   ├── types.ts
│   └── index.ts
├── user-interface/           # UI component services
│   ├── modal-service.ts
│   ├── navigation-service.ts
│   ├── types.ts
│   └── index.ts
└── index.ts                  # Service registry
```

## Service Designs

### 1. Game Management Service

**Purpose**: Consolidate game creation, import, and backlog management operations

```typescript
// shared/services/game-management/types.ts
export interface GameCreationInput {
  igdbId: number;
  backlogStatus?: BacklogItemStatus;
  platform?: string;
  acquisitionType?: AcquisitionType;
  playtime?: number; // For imported games
}

export interface GameManagementService {
  // Core game operations
  createGameAndAddToBacklog(
    input: GameCreationInput,
    userId: string
  ): Promise<GameCreationResult>;

  // Import workflow (consolidates add-game + view-imported-games logic)
  importSteamGameToCollection(
    steamAppId: number,
    userId: string
  ): Promise<GameCreationResult>;

  // Backlog management
  updateBacklogItemStatus(
    itemId: number,
    status: BacklogItemStatus,
    userId: string
  ): Promise<void>;
}
```

**Implementation Strategy**:

```typescript
// shared/services/game-management/game-management-service.ts
export class GameManagementServiceImpl implements GameManagementService {
  constructor(
    private gameRepository: GameRepository,
    private backlogRepository: BacklogRepository,
    private igdbService: IgdbService
  ) {}

  async createGameAndAddToBacklog(input: GameCreationInput, userId: string) {
    // Consolidates logic from:
    // - features/add-game/server-actions/add-game.ts
    // - features/view-imported-games/server-actions/import-to-application.ts
    // 1. Fetch/create game from IGDB
    // 2. Create backlog entry
    // 3. Handle playtime for imported games
    // 4. Return standardized result
  }
}
```

**Eliminates Dependencies**:

- ✅ `view-imported-games` → `add-game`
- ✅ Centralizes game creation logic

### 2. Steam Integration Service

**Purpose**: Abstract Steam-specific operations behind generic interface

```typescript
// shared/services/integration/types.ts
export interface PlatformIntegrationService {
  // Generic platform operations
  getUserOwnedGames(userId: string): Promise<PlatformGame[]>;
  getUserAchievements(userId: string, gameId: string): Promise<Achievement[]>;
  syncUserLibrary(userId: string): Promise<SyncResult>;
}

export interface SteamIntegrationAdapter extends PlatformIntegrationService {
  // Steam-specific operations if needed
  getSteamUserData(userId: string): Promise<SteamUserData>;
}
```

**Implementation Strategy**:

```typescript
// shared/services/integration/steam-integration-adapter.ts
export class SteamIntegrationAdapterImpl implements SteamIntegrationAdapter {
  constructor(private steamRepository: UserRepository) {}

  async getUserOwnedGames(userId: string): Promise<PlatformGame[]> {
    // Delegates to existing steam-integration feature
    return await getUserOwnedGames(userId);
  }

  async getUserAchievements(
    userId: string,
    gameId: string
  ): Promise<Achievement[]> {
    // Delegates to existing steam-integration feature
    return await getUserAchievements(userId, gameId);
  }
}
```

**Eliminates Dependencies**:

- ✅ `manage-integrations` → `steam-integration`
- ✅ `view-game-details` → `steam-integration`

### 3. UI Component Service

**Purpose**: Provide shared UI components through service layer

```typescript
// shared/services/user-interface/types.ts
export interface ModalService {
  // Game management modals
  AddToCollectionModal: ComponentType<AddToCollectionModalProps>;
  EditGameEntryModal: ComponentType<EditGameEntryModalProps>;
  AddReviewDialog: ComponentType<AddReviewDialogProps>;
}

export interface NavigationService {
  ShareWishlist: ComponentType<ShareWishlistProps>;
  User: ComponentType<UserProps>;
  ThemeToggle: ComponentType<ThemeToggleProps>;
}
```

**Implementation Strategy**:

```typescript
// shared/services/user-interface/modal-service.ts
export const modalService: ModalService = {
  // Re-export components from their original features
  // This creates a facade without circular dependencies
  AddToCollectionModal: lazy(() =>
    import("@/features/add-game").then((m) => ({
      default: m.AddToCollectionModal,
    }))
  ),
  EditGameEntryModal: lazy(() =>
    import("@/features/manage-backlog-item").then((m) => ({
      default: m.EditGameEntryModal,
    }))
  ),
  AddReviewDialog: lazy(() =>
    import("@/features/add-review").then((m) => ({
      default: m.AddReviewDialog,
    }))
  ),
};
```

**Eliminates Dependencies**:

- ✅ `view-game-details` → `add-game`, `manage-backlog-item`, `add-review`
- ✅ `shared/components` → various features

## Migration Strategy

### Phase 1: Service Infrastructure (Low Risk)

1. **Create service interfaces** in `shared/services/`
2. **Implement service adapters** that delegate to existing code
3. **Add service registration** and dependency injection setup
4. **Create service tests** using existing component test patterns

### Phase 2: Type Migration (Low Risk)

1. **Move shared types** from `features/view-wishlist/types` to `shared/types`
2. **Update imports** in `grid-view.tsx` and `list-view.tsx`
3. **Verify no functionality changes** with existing tests

### Phase 3: Component Services (Medium Risk)

1. **Implement modal service** with lazy loading
2. **Update `view-game-details` components** to use service
3. **Create navigation service** for header/nav dependencies
4. **Update shared components** to use services

### Phase 4: Business Logic Services (High Risk)

1. **Implement game management service**
2. **Migrate `view-imported-games`** to use service
3. **Update server actions** to delegate to services
4. **Implement integration service**
5. **Migrate integration features** to use service

## Detailed Implementation Plan

### 1. Service Registration Pattern

```typescript
// shared/services/index.ts
export interface ServiceRegistry {
  gameManagement: GameManagementService;
  steamIntegration: SteamIntegrationAdapter;
  modals: ModalService;
  navigation: NavigationService;
}

export const createServices = (): ServiceRegistry => ({
  gameManagement: new GameManagementServiceImpl(),
  // Inject repositories
  steamIntegration: new SteamIntegrationAdapterImpl(),
  // Inject dependencies
  modals: modalService,
  navigation: navigationService,
});
```

### 2. Dependency Injection in Server Actions

```typescript
// Example: Updated view-imported-games server action
export const importToApplication = authorizedActionClient
  .inputSchema(ImportToApplicationSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const services = createServices();

    // Use service instead of direct feature import
    const result = await services.gameManagement.importSteamGameToCollection(
      parsedInput.steamAppId,
      userId
    );

    RevalidationService.revalidateCollection();
    return result;
  });
```

### 3. Component Service Usage

```typescript
// Example: Updated view-game-details component
import { createServices } from '@/shared/services';

export function GameQuickActions({ game, backlogItems }) {
  const services = createServices();

  return (
    <div>
      <services.modals.AddToCollectionModal
        gameTitle={game.name}
        igdbId={game.igdbId}
      />
      <services.modals.EditGameEntryModal
        backlogItems={backlogItems}
      />
    </div>
  );
}
```

## Testing Strategy

### Service Layer Testing

```typescript
// shared/services/game-management/game-management-service.test.ts
describe("GameManagementService", () => {
  it("should create game and add to backlog", async () => {
    // Test service logic with mocked repositories
  });

  it("should handle Steam import workflow", async () => {
    // Test consolidated import logic
  });
});
```

### Integration Testing

```typescript
// Verify existing component tests still pass
// Add service integration tests
// Ensure no behavioral changes
```

## Risk Mitigation

### Low-Risk Migrations

1. **Type movements** - Pure type imports, no runtime impact
2. **Service facades** - Delegate to existing implementations
3. **Lazy loading** - Maintains bundle splitting

### Medium-Risk Migrations

1. **Component service injection** - Test thoroughly with existing test suites
2. **Modal lazy loading** - Verify no loading performance regressions
3. **Server action changes** - Maintain exact same API contracts

### High-Risk Migrations

1. **Business logic consolidation** - Comprehensive testing required
2. **Repository layer changes** - Database operation integrity critical
3. **Authentication flow changes** - Security implications

### Safety Measures

1. **Feature flags** for gradual rollout
2. **Atomic commits** for easy rollback
3. **Comprehensive test coverage** before any changes
4. **Performance monitoring** throughout migration

## Success Metrics

### Technical Metrics

- ✅ **Zero boundary violations** in ESLint
- ✅ **Build success** with all linting rules enforced
- ✅ **Test suite maintains** < 8 second execution time
- ✅ **No functionality regressions** in existing behavior

### Architectural Metrics

- ✅ **Clean service interfaces** with single responsibilities
- ✅ **Reduced coupling** between features
- ✅ **Improved testability** through dependency injection
- ✅ **Maintainable abstractions** for future platform additions

## Implementation Timeline

### Week 1: Foundation

- [ ] Create service interfaces and types
- [ ] Implement basic service infrastructure
- [ ] Set up dependency injection pattern
- [ ] Create service layer tests

### Week 2: Low-Risk Migrations

- [ ] Move shared types to `shared/types`
- [ ] Update grid/list view imports
- [ ] Implement component service facades
- [ ] Test lazy loading performance

### Week 3: Component Services

- [ ] Migrate modal dependencies in view-game-details
- [ ] Update shared component dependencies
- [ ] Implement navigation service
- [ ] Comprehensive integration testing

### Week 4: Business Logic Services

- [ ] Implement game management service
- [ ] Migrate view-imported-games workflow
- [ ] Implement Steam integration service
- [ ] Final validation and performance testing

---

_Service layer designed to eliminate all 7 boundary violations while maintaining existing functionality and performance characteristics._
