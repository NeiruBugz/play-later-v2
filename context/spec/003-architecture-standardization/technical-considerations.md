# Technical Specification: Architecture Standardization & Service Layer Implementation

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Status:** Draft
- **Author:** Architecture Team
- **Created:** 2025-10-03

---

## 1. High-Level Technical Approach

### Overview

Implement a standardized **three-layer architecture** (Consumer → Service → Repository) across all features in the PlayLater application. This involves:

1. **Creating a service layer** between server actions and repositories
2. **Standardizing feature directory structures** for consistency
3. **Migrating business logic** from server actions to services
4. **Implementing comprehensive testing** at the service layer
5. **Updating documentation** to reflect new patterns

### System Impact

**Affected Systems:**

- All feature modules in `/features/*`
- Shared services directory (new): `/shared/services/*`
- Repository layer (minor updates): `/shared/lib/repository/*`
- Documentation: Architecture diagrams and CLAUDE.md files

**Data Flow After Implementation:**

```
UI Components → Server Actions → Service Layer → Repository Layer → Prisma → PostgreSQL
                (thin wrappers)   (business logic)  (data access)
```

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Architecture Changes

#### Current Architecture

```typescript
// Server Action directly calls repository
export const getUserGamesWithGroupedBacklogPaginated = authorizedActionClient
  .inputSchema(FilterParamsSchema)
  .action(async ({ ctx: { userId }, parsedInput }) => {
    const [games, count] = await findGamesWithBacklogItemsPaginated({
      userId,
      platform: parsedInput.platform,
      status: parsedInput.status,
      search: parsedInput.search,
      page: parsedInput.page,
    });
    return { games, count };
  });
```

#### Target Architecture

```typescript
// Server Action calls service, service calls repository
export const getUserGamesWithGroupedBacklogPaginated = authorizedActionClient
  .inputSchema(FilterParamsSchema)
  .action(async ({ ctx: { userId }, parsedInput }) => {
    const result = await collectionService.getCollection({
      userId,
      ...parsedInput
    });

    if (!result.success) {
      throw new Error(result.error ?? "Failed to fetch collection");
    }

    return result.data;
  });
```

#### New Service Layer Structure

**Location:** `/shared/services/`

**Service Organization:**

```
shared/services/
├── library/                    # Library item operations
│   ├── library-service.ts     # Main service class
│   ├── library-service.test.ts # Unit tests
│   ├── types.ts               # Service-specific types
│   └── index.ts               # Public exports
├── game/                       # Game operations
├── review/                     # Review management
├── user/                       # User operations
├── journal/                    # Journal entries
└── index.ts                    # Barrel exports
```

### 2.2 Service Layer Implementation

#### Standard Service Template

```typescript
// shared/services/library/library-service.ts
import "server-only";

import type { Prisma } from "@prisma/client";
import { LibraryItemStatus } from "@prisma/client";

import {
  createLibraryItem,
  updateLibraryItem,
  deleteLibraryItem,
  getManyLibraryItems,
  getLibraryCount,
} from "@/shared/lib/repository/library";

import type {
  LibraryServiceInput,
  LibraryServiceResult,
  CreateLibraryItemInput,
  UpdateLibraryItemInput,
} from "./types";

export class LibraryService {
  /**
   * Get library items for a user with filtering and pagination
   */
  async getLibraryItems(
    input: LibraryServiceInput
  ): Promise<LibraryServiceResult> {
    try {
      // 1. Validate and normalize input
      const validatedInput = this.validateInput(input);

      // 2. Build filters
      const filters = this.buildFilters(validatedInput);

      // 3. Execute repository query
      const items = await getManyLibraryItems(filters);

      // 4. Transform and return
      return {
        success: true,
        data: {
          items: items.map(this.transformLibraryItem),
          count: items.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create a new library item
   */
  async createLibraryItem(
    input: CreateLibraryItemInput
  ): Promise<LibraryServiceResult> {
    try {
      // Business validation
      this.validateCreateInput(input);

      // Create via repository
      const item = await createLibraryItem({
        libraryItem: {
          status: input.status ?? LibraryItemStatus.CURIOUS_ABOUT,
          platform: input.platform,
          acquisitionType: input.acquisitionType,
          startedAt: input.startedAt,
          completedAt: input.completedAt,
        },
        userId: input.userId,
        gameId: input.gameId,
      });

      return {
        success: true,
        data: { item: this.transformLibraryItem(item) },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create",
      };
    }
  }

  /**
   * Update an existing library item
   */
  async updateLibraryItem(
    input: UpdateLibraryItemInput
  ): Promise<LibraryServiceResult> {
    try {
      // Business validation
      this.validateUpdateInput(input);

      // Update via repository
      const item = await updateLibraryItem({
        userId: input.userId,
        libraryItem: {
          id: input.id,
          status: input.status,
          platform: input.platform,
          startedAt: input.startedAt,
          completedAt: input.completedAt,
        },
      });

      return {
        success: true,
        data: { item: this.transformLibraryItem(item) },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update",
      };
    }
  }

  /**
   * Delete a library item
   */
  async deleteLibraryItem(
    libraryItemId: string,
    userId: string
  ): Promise<LibraryServiceResult> {
    try {
      await deleteLibraryItem({ libraryItemId, userId });

      return {
        success: true,
        data: { message: "Library item deleted successfully" },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete",
      };
    }
  }

  /**
   * Get library item count with filters
   */
  async getLibraryItemCount(
    userId: string,
    status?: LibraryItemStatus,
    gteClause?: { createdAt: Date }
  ): Promise<number> {
    return getLibraryCount({ userId, status, gteClause });
  }

  // Private helper methods
  private validateInput(input: LibraryServiceInput): LibraryServiceInput {
    if (!input.userId) {
      throw new Error("User ID is required");
    }
    return input;
  }

  private validateCreateInput(input: CreateLibraryItemInput): void {
    if (!input.userId || !input.gameId) {
      throw new Error("User ID and Game ID are required");
    }
  }

  private validateUpdateInput(input: UpdateLibraryItemInput): void {
    if (!input.userId || !input.id) {
      throw new Error("User ID and Library Item ID are required");
    }
  }

  private buildFilters(input: LibraryServiceInput): any {
    return {
      userId: input.userId,
      gameId: input.gameId,
      status: input.status,
      platform: input.platform,
    };
  }

  private transformLibraryItem(item: any) {
    // Transform repository data to service response format
    return item;
  }
}
```

#### Service Type Definitions

```typescript
// shared/services/library/types.ts
import type { LibraryItem, LibraryItemStatus, AcquisitionType } from "@prisma/client";

export type LibraryServiceInput = {
  userId: string;
  gameId?: string;
  status?: LibraryItemStatus;
  platform?: string;
};

export type CreateLibraryItemInput = {
  userId: string;
  gameId: string;
  status?: LibraryItemStatus;
  platform?: string;
  acquisitionType?: AcquisitionType;
  startedAt?: Date | null;
  completedAt?: Date | null;
};

export type UpdateLibraryItemInput = {
  userId: string;
  id: string;
  status?: LibraryItemStatus;
  platform?: string;
  startedAt?: Date | null;
  completedAt?: Date | null;
};

export type LibraryServiceResult = {
  success: boolean;
  data?: {
    item?: any;
    items?: any[];
    count?: number;
    message?: string;
  };
  error?: string;
};
```

#### Service Tests

```typescript
// shared/services/library/library-service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LibraryItemStatus } from "@prisma/client";
import { LibraryService } from "./library-service";
import * as libraryRepo from "@/shared/lib/repository/library";

// Mock repository
vi.mock("@/shared/lib/repository/library", () => ({
  createLibraryItem: vi.fn(),
  updateLibraryItem: vi.fn(),
  deleteLibraryItem: vi.fn(),
  getManyLibraryItems: vi.fn(),
  getLibraryCount: vi.fn(),
}));

describe("LibraryService", () => {
  let service: LibraryService;

  beforeEach(() => {
    service = new LibraryService();
    vi.clearAllMocks();
  });

  describe("createLibraryItem", () => {
    it("should create library item with valid input", async () => {
      const mockItem = {
        id: "item-1",
        userId: "user-1",
        gameId: "game-1",
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
      };

      vi.mocked(libraryRepo.createLibraryItem).mockResolvedValue(mockItem);

      const result = await service.createLibraryItem({
        userId: "user-1",
        gameId: "game-1",
        platform: "PC",
      });

      expect(result.success).toBe(true);
      expect(result.data?.item).toEqual(mockItem);
      expect(libraryRepo.createLibraryItem).toHaveBeenCalledWith({
        libraryItem: expect.objectContaining({
          platform: "PC",
          status: LibraryItemStatus.CURIOUS_ABOUT,
        }),
        userId: "user-1",
        gameId: "game-1",
      });
    });

    it("should return error when userId is missing", async () => {
      const result = await service.createLibraryItem({
        userId: "",
        gameId: "game-1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("updateLibraryItem", () => {
    it("should update library item status", async () => {
      const mockItem = {
        id: "item-1",
        userId: "user-1",
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      };

      vi.mocked(libraryRepo.updateLibraryItem).mockResolvedValue(mockItem);

      const result = await service.updateLibraryItem({
        userId: "user-1",
        id: "item-1",
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });

      expect(result.success).toBe(true);
      expect(libraryRepo.updateLibraryItem).toHaveBeenCalledWith({
        userId: "user-1",
        libraryItem: expect.objectContaining({
          id: "item-1",
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
        }),
      });
    });
  });

  describe("deleteLibraryItem", () => {
    it("should delete library item", async () => {
      vi.mocked(libraryRepo.deleteLibraryItem).mockResolvedValue(undefined);

      const result = await service.deleteLibraryItem("item-1", "user-1");

      expect(result.success).toBe(true);
      expect(libraryRepo.deleteLibraryItem).toHaveBeenCalledWith({
        libraryItemId: "item-1",
        userId: "user-1",
      });
    });
  });

  describe("getLibraryItemCount", () => {
    it("should return count from repository", async () => {
      vi.mocked(libraryRepo.getLibraryCount).mockResolvedValue(5);

      const count = await service.getLibraryItemCount("user-1");

      expect(count).toBe(5);
      expect(libraryRepo.getLibraryCount).toHaveBeenCalledWith({
        userId: "user-1",
      });
    });
  });
});
```

### 2.3 Feature Structure Standardization

#### Standard Feature Directory

```
features/[feature-name]/
├── components/              # UI components
│   ├── [feature]-form.tsx
│   ├── [feature]-list.tsx
│   └── index.ts            # Component exports
├── server-actions/          # Server actions (thin wrappers)
│   ├── [action].ts
│   ├── [action].test.ts
│   └── index.ts
├── hooks/                   # React hooks (optional)
│   └── use-[feature].ts
├── lib/                     # Feature utilities
│   ├── validation.ts       # Zod schemas
│   ├── utils.ts            # Helper functions
│   └── constants.ts        # Constants
├── types/                   # Type definitions
│   └── index.ts
├── CLAUDE.md               # Documentation
└── index.ts                # Public API
```

#### Migration Pattern: manage-library-item

**Before (current structure):**

```
features/manage-library-item/
├── create-library-item/
│   ├── components/
│   ├── server-actions/action.ts  # Has business logic
│   └── lib/
├── edit-library-item/
│   ├── components/
│   ├── server-actions/action.ts  # Has business logic
│   └── lib/
└── delete-library-item/
    ├── components/
    └── server-actions/action.ts  # Has business logic
```

**After (with service layer):**

```
features/manage-library-item/
├── create-library-item/
│   ├── components/
│   └── server-actions/
│       └── action.ts            # Calls LibraryService
├── edit-library-item/
│   ├── components/
│   └── server-actions/
│       └── action.ts            # Calls LibraryService
├── delete-library-item/
│   ├── components/
│   └── server-actions/
│       └── action.ts            # Calls LibraryService
└── lib/
    └── validation.ts

# Business logic moved to:
shared/services/library/library-service.ts
```

#### Server Action Migration Example

**Before:**

```typescript
// features/manage-library-item/create-library-item/server-actions/action.ts
export const createLibraryItem = authorizedActionClient
  .inputSchema(createLibraryItemFormDataSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // Business logic here
    const libraryItem = {
      status: parsedInput.status,
      platform: parsedInput.platform,
      // ... more logic
    };

    // Direct repository call
    const result = await createLibraryItemCommand({
      libraryItem,
      userId,
      gameId: parsedInput.gameId,
    });

    RevalidationService.revalidateCollection();
    return { success: true };
  });
```

**After:**

```typescript
// features/manage-library-item/create-library-item/server-actions/action.ts
import { LibraryService } from "@/shared/services";

const libraryService = new LibraryService();

export const createLibraryItem = authorizedActionClient
  .inputSchema(createLibraryItemFormDataSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // Call service
    const result = await libraryService.createLibraryItem({
      userId,
      gameId: parsedInput.gameId,
      status: parsedInput.status,
      platform: parsedInput.platform,
    });

    if (!result.success) {
      throw new Error(result.error ?? "Failed to create library item");
    }

    RevalidationService.revalidateCollection();
    return result.data;
  });
```

### 2.4 Data Model Changes

**No database schema changes required.** This refactoring only reorganizes code, not data structures.

**Type System Updates:**

```typescript
// shared/services/types.ts (new file)
export type ServiceResult<TData = unknown> = {
  success: boolean;
  data?: TData;
  error?: string;
  code?: string;
};

export type PaginatedResult<TItem> = {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};
```

### 2.5 API Contracts

**No external API changes.** Server actions maintain the same interfaces.

**Internal Service APIs:**

```typescript
// Library Service API
interface LibraryServiceAPI {
  getLibraryItems(input: LibraryServiceInput): Promise<ServiceResult>;
  createLibraryItem(input: CreateLibraryItemInput): Promise<ServiceResult>;
  updateLibraryItem(input: UpdateLibraryItemInput): Promise<ServiceResult>;
  deleteLibraryItem(id: string, userId: string): Promise<ServiceResult>;
  getLibraryItemCount(userId: string, filters?: Filters): Promise<number>;
}

// Game Service API
interface GameServiceAPI {
  getGame(id: string): Promise<ServiceResult>;
  searchGames(query: string): Promise<ServiceResult>;
  createGame(input: CreateGameInput): Promise<ServiceResult>;
  updateGame(id: string, input: UpdateGameInput): Promise<ServiceResult>;
}

// Review Service API
interface ReviewServiceAPI {
  getReviews(gameId: string): Promise<ServiceResult>;
  createReview(input: CreateReviewInput): Promise<ServiceResult>;
  updateReview(id: string, input: UpdateReviewInput): Promise<ServiceResult>;
  deleteReview(id: string, userId: string): Promise<ServiceResult>;
}
```

### 2.6 Component Breakdown

#### Core Services to Implement

1. **LibraryService** (`shared/services/library/`)
   - Library item CRUD operations
   - Status management
   - Platform filtering
   - Date tracking (started/completed)

2. **GameService** (`shared/services/game/`)
   - Game CRUD operations
   - IGDB integration wrapper
   - Game search functionality
   - Cover image handling

3. **ReviewService** (`shared/services/review/`)
   - Review CRUD operations
   - Rating aggregation
   - User review management

4. **UserService** (`shared/services/user/`)
   - User profile operations
   - Preference management
   - Steam integration status

5. **JournalService** (`shared/services/journal/`)
   - Journal entry CRUD
   - Mood tracking
   - Session logging

#### Service Dependency Graph

```
┌─────────────────┐
│  LibraryService │
└────────┬────────┘
         │ depends on
         ↓
┌─────────────────┐
│   GameService   │
└─────────────────┘

┌─────────────────┐
│  ReviewService  │
└────────┬────────┘
         │ depends on
         ↓
┌─────────────────┐
│   GameService   │
└─────────────────┘

┌─────────────────┐
│ JournalService  │
└────────┬────────┘
         │ depends on
         ├────────────────┐
         ↓                ↓
┌─────────────────┐  ┌─────────────────┐
│ LibraryService  │  │   GameService   │
└─────────────────┘  └─────────────────┘
```

---

## 3. Impact and Risk Analysis

### 3.1 System Dependencies

**Affected Features (Priority Order):**

1. **manage-library-item** (High Impact)
   - Most complex feature
   - Multiple CRUD operations
   - Good candidate for service extraction

2. **add-game** (High Impact)
   - Core functionality
   - IGDB integration
   - Business logic in server actions

3. **view-collection** (Low Impact)
   - Already has service layer
   - Serves as reference implementation

4. **dashboard** (Medium Impact)
   - Multiple data sources
   - Aggregation logic
   - Good service composition example

5. **view-game-details** (Medium Impact)
   - Read-heavy operations
   - Review aggregation

**Dependency Chain:**

- Server Actions → Services (new dependency)
- Services → Repositories (new dependency)
- Repositories → Prisma (existing)

### 3.2 Potential Risks & Mitigations

#### Risk 1: Breaking Changes During Refactor

**Probability:** Medium
**Impact:** High

**Mitigation:**

- Feature-by-feature incremental rollout
- Comprehensive testing at each step
- Feature flags for gradual migration
- Parallel implementation (keep old code until new is tested)

**Rollback Plan:**

- Git branches per feature refactor
- Can revert individual features without affecting others
- Service layer is additive, not destructive

#### Risk 2: Increased Complexity

**Probability:** Low
**Impact:** Medium

**Mitigation:**

- Clear documentation and examples
- Service templates for consistency
- Code review guidelines
- Team training sessions

**Validation:**

- Developer feedback after first 2 features
- Complexity metrics (cyclomatic complexity should decrease)

#### Risk 3: Performance Regression

**Probability:** Low
**Impact:** Low

**Mitigation:**

- Services add minimal overhead (one function call)
- No additional database queries
- Performance testing after major features
- Monitor response times in production

**Monitoring:**

- Vercel Analytics for response time tracking
- Log service execution times during development

#### Risk 4: Test Coverage Gaps

**Probability:** Medium
**Impact:** Medium

**Mitigation:**

- Service tests mandatory before deployment
- > 80% coverage requirement enforced
- Test templates provided
- Review process includes test verification

**Quality Gates:**

- CI/CD blocks on <80% coverage
- Pre-commit hooks run tests
- Pull request template includes test checklist

### 3.3 Migration Strategy Risks

#### Risk: Inconsistent Pattern Application

**Mitigation:**

- Code review checklist
- Automated linting rules
- Reference implementations
- Architecture decision records (ADRs)

#### Risk: Developer Confusion

**Mitigation:**

- Comprehensive documentation
- Pair programming sessions
- "Office hours" for questions
- Slack channel for architecture discussions

---

## 4. Testing Strategy

### 4.1 Service Layer Testing

**Unit Testing Approach:**

```typescript
// Pattern: Mock repositories, test service logic
describe("LibraryService", () => {
  let service: LibraryService;

  beforeEach(() => {
    service = new LibraryService();
    vi.clearAllMocks();
  });

  describe("Business Logic Tests", () => {
    it("should validate required fields", async () => {
      const result = await service.createLibraryItem({
        userId: "", // Invalid
        gameId: "game-1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("User ID is required");
    });

    it("should set default status to CURIOUS_ABOUT", async () => {
      vi.mocked(createLibraryItem).mockResolvedValue(mockItem);

      await service.createLibraryItem({
        userId: "user-1",
        gameId: "game-1",
        // no status provided
      });

      expect(createLibraryItem).toHaveBeenCalledWith(
        expect.objectContaining({
          libraryItem: expect.objectContaining({
            status: LibraryItemStatus.CURIOUS_ABOUT,
          }),
        })
      );
    });
  });

  describe("Repository Integration", () => {
    it("should call repository with correct parameters", async () => {
      vi.mocked(createLibraryItem).mockResolvedValue(mockItem);

      await service.createLibraryItem({
        userId: "user-1",
        gameId: "game-1",
        platform: "PC",
      });

      expect(createLibraryItem).toHaveBeenCalledTimes(1);
      expect(createLibraryItem).toHaveBeenCalledWith({
        libraryItem: expect.objectContaining({
          platform: "PC",
        }),
        userId: "user-1",
        gameId: "game-1",
      });
    });

    it("should handle repository errors", async () => {
      vi.mocked(createLibraryItem).mockRejectedValue(
        new Error("Database error")
      );

      const result = await service.createLibraryItem({
        userId: "user-1",
        gameId: "game-1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });
  });
});
```

### 4.2 Integration Testing

**Server Action Integration Tests:**

```typescript
// Test server actions with real services, mocked repositories
describe("createLibraryItem (integration)", () => {
  it("should create library item through service layer", async () => {
    const mockUserId = "user-123";
    mockGetServerUserId.mockResolvedValue(mockUserId);

    const formData = new FormData();
    formData.append("gameId", "game-1");
    formData.append("platform", "PC");
    formData.append("status", "CURIOUS_ABOUT");

    vi.mocked(createLibraryItemRepo).mockResolvedValue(mockLibraryItem);

    const result = await createLibraryItemAction(formData);

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty("item");
  });
});
```

### 4.3 End-to-End Testing

**Critical User Flows:**

1. **Add game to library** → Verify creates with default status
2. **Update library item status** → Verify service updates correctly
3. **Delete library item** → Verify service deletes correctly
4. **Filter collection** → Verify service filtering works
5. **Dashboard stats** → Verify service aggregation correct

**E2E Test Example:**

```typescript
// Playwright E2E test
test("complete library item lifecycle", async ({ page }) => {
  await page.goto("/add-game");

  // Search and add game
  await page.fill('[data-testid="game-search"]', "Portal 2");
  await page.click('[data-testid="game-result-0"]');
  await page.click('[data-testid="add-to-library"]');

  // Verify created with default status
  await expect(page.locator('[data-testid="library-item-status"]'))
    .toHaveText("Curious About");

  // Update status
  await page.click('[data-testid="edit-library-item"]');
  await page.selectOption('[data-testid="status-select"]', "CURRENTLY_EXPLORING");
  await page.click('[data-testid="save-button"]');

  // Verify updated
  await expect(page.locator('[data-testid="library-item-status"]'))
    .toHaveText("Currently Exploring");
});
```

### 4.4 Coverage Requirements

**Service Layer:**

- Unit test coverage: >90%
- Integration test coverage: >80%
- All business logic paths tested
- All error scenarios covered

**Server Actions:**

- Integration tests for service calls
- Error handling verification
- Input validation tests

**Quality Gates:**

- `pnpmrun test` must pass
- `pnpmrun test:coverage` must meet thresholds
- No TypeScript errors
- No linting errors

---

## 5. Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal:** Establish standards and create infrastructure

**Tasks:**

1. Update `context/product/architecture.md` with service layer documentation
2. Create service template in `/shared/services/_template/`
3. Create testing utilities for services
4. Document migration guide
5. Set up service layer CI/CD checks

**Deliverables:**

- [ ] Updated architecture documentation
- [ ] Service template with example
- [ ] Testing template with mocks
- [ ] Migration guide document
- [ ] CI/CD configuration updates

### Phase 2: Core Services (Week 2-3)

**Goal:** Implement shared service layer

**Tasks:**

**Week 2:**

1. Create LibraryService
   - [ ] Implement service class
   - [ ] Add unit tests (>90% coverage)
   - [ ] Document service API

2. Create GameService
   - [ ] Implement service class
   - [ ] Add unit tests (>90% coverage)
   - [ ] Document service API

**Week 3:** 3. Create ReviewService

- [ ] Implement service class
- [ ] Add unit tests (>90% coverage)
- [ ] Document service API

4. Create UserService & JournalService
   - [ ] Implement service classes
   - [ ] Add unit tests (>90% coverage)
   - [ ] Document service APIs

**Deliverables:**

- [ ] 5 core services implemented
- [ ] All services with >90% test coverage
- [ ] Service API documentation complete
- [ ] Integration test examples

### Phase 3: Feature Migration (Week 4-6)

**Goal:** Migrate features to use service layer

**Week 4: High-Priority Features**

1. Refactor manage-library-item
   - [ ] Update create-library-item to use LibraryService
   - [ ] Update edit-library-item to use LibraryService
   - [ ] Update delete-library-item to use LibraryService
   - [ ] Add integration tests
   - [ ] Update CLAUDE.md

2. Refactor add-game
   - [ ] Update server actions to use GameService
   - [ ] Update server actions to use LibraryService
   - [ ] Add integration tests
   - [ ] Update CLAUDE.md

**Week 5: Medium-Priority Features** 3. Refactor dashboard

- [ ] Update stats actions to use services
- [ ] Simplify aggregation logic
- [ ] Add integration tests
- [ ] Update CLAUDE.md

4. Refactor view-game-details
   - [ ] Update to use GameService
   - [ ] Update to use ReviewService
   - [ ] Add integration tests
   - [ ] Update CLAUDE.md

**Week 6: Remaining Features** 5. Refactor steam-integration, view-imported-games

- [ ] Update to use GameService
- [ ] Add integration tests
- [ ] Update CLAUDE.md

6. Refactor view-wishlist, share-wishlist
   - [ ] Update to use LibraryService
   - [ ] Add integration tests
   - [ ] Update CLAUDE.md

**Deliverables:**

- [ ] All features using service layer
- [ ] Integration tests for all features
- [ ] Updated feature documentation
- [ ] No direct repository calls from server actions

### Phase 4: Quality Assurance (Ongoing)

**Goal:** Ensure quality and consistency

**Continuous Tasks:**

- [ ] Code review for each PR
- [ ] Test coverage verification
- [ ] Performance monitoring
- [ ] Documentation updates
- [ ] Team feedback collection

**Final Verification:**

- [ ] `pnpmtypecheck` - zero errors
- [ ] `pnpmlint` - zero errors
- [ ] `pnpmrun test` - all passing
- [ ] `pnpmrun test:coverage` - >80% overall
- [ ] Manual QA of critical flows
- [ ] Performance benchmarks stable

---

## 6. Rollout Strategy

### 6.1 Feature Flags

**Implementation:**

```typescript
// lib/feature-flags.ts
export const FEATURE_FLAGS = {
  USE_SERVICE_LAYER_LIBRARY: process.env.NEXT_PUBLIC_USE_SERVICE_LAYER_LIBRARY === 'true',
  USE_SERVICE_LAYER_GAME: process.env.NEXT_PUBLIC_USE_SERVICE_LAYER_GAME === 'true',
  // ... other flags
};

// Usage in server action
export const createLibraryItem = authorizedActionClient
  .action(async ({ parsedInput, ctx: { userId } }) => {
    if (FEATURE_FLAGS.USE_SERVICE_LAYER_LIBRARY) {
      // New: Use service
      return await libraryService.createLibraryItem({...});
    } else {
      // Old: Direct repository call
      return await createLibraryItemRepo({...});
    }
  });
```

### 6.2 Gradual Migration

**Week 4:** Enable LibraryService for manage-library-item only
**Week 5:** Enable GameService for add-game and view-game-details
**Week 6:** Enable all services for all features
**Week 7:** Remove feature flags and old code

### 6.3 Monitoring

**Metrics to Track:**

- Response time for service calls
- Error rates per service
- Test coverage per service
- Developer feedback scores

**Rollback Triggers:**

- > 10% increase in error rates
- > 20% increase in response times
- Critical bugs affecting users
- Negative team feedback

---

## 7. Success Criteria

### 7.1 Technical Metrics

- ✅ All features use service layer
- ✅ Zero TypeScript errors
- ✅ >80% overall test coverage
- ✅ >90% service layer test coverage
- ✅ All linting rules pass
- ✅ No direct repository calls from server actions

### 7.2 Quality Metrics

- ✅ Consistent directory structure across features
- ✅ All business logic in service layer
- ✅ Comprehensive service documentation
- ✅ Migration guide complete
- ✅ Team training completed

### 7.3 Performance Metrics

- ✅ No performance regression (±5%)
- ✅ Service overhead <10ms per call
- ✅ Same or better response times
- ✅ No increase in error rates

---

## 8. Documentation Updates

### 8.1 Architecture Documentation

**Files to Update:**

- [ ] `context/product/architecture.md` - Add service layer section
- [ ] Create `context/product/service-layer-guide.md`
- [ ] Create `context/product/migration-guide.md`
- [ ] Update `CLAUDE.md` - Reference new patterns

### 8.2 Feature Documentation

**For Each Migrated Feature:**

- [ ] Update data flow diagrams
- [ ] Document service integration
- [ ] Update testing approach
- [ ] Add migration notes

### 8.3 Developer Guide

**New Documents:**

- [ ] Service layer implementation guide
- [ ] Testing patterns guide
- [ ] Common patterns and anti-patterns
- [ ] Troubleshooting guide

---

## 9. Appendix

### 9.1 Service Layer Design Patterns

#### Pattern 1: Result Type Pattern

```typescript
type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

#### Pattern 2: Service Composition

```typescript
class JournalService {
  constructor(
    private libraryService = new LibraryService(),
    private gameService = new GameService()
  ) {}

  async createJournalEntry(input: CreateJournalInput) {
    // Compose multiple services
    const game = await this.gameService.getGame(input.gameId);
    const libraryItem = await this.libraryService.getLibraryItems({
      userId: input.userId,
      gameId: input.gameId
    });

    // Business logic using composed data
    // ...
  }
}
```

#### Pattern 3: Transaction Management

```typescript
async updateGameWithReview(input: UpdateGameReviewInput) {
  return prisma.$transaction(async (tx) => {
    const game = await this.gameRepo.update(input.gameId, input.gameData, tx);
    const review = await this.reviewRepo.create(input.reviewData, tx);
    return { game, review };
  });
}
```

### 9.2 Reference Files

**Complete Examples:**

- `shared/services/collection/collection-service.ts` - Existing implementation
- `shared/services/collection/collection-service.test.ts` - Testing example
- `features/view-collection/server-actions/get-game-with-backlog-items.ts` - Server action integration

### 9.3 Common Pitfalls

**Anti-Pattern 1: Business Logic in Server Actions**

```typescript
// ❌ DON'T
export const createLibraryItem = authorizedActionClient
  .action(async ({ parsedInput }) => {
    // Complex logic here
    if (parsedInput.status === "COMPLETED" && !parsedInput.completedAt) {
      parsedInput.completedAt = new Date();
    }
    // ...
  });
```

```typescript
// ✅ DO
export const createLibraryItem = authorizedActionClient
  .action(async ({ parsedInput, ctx: { userId } }) => {
    return await libraryService.createLibraryItem({
      userId,
      ...parsedInput
    });
  });
```

**Anti-Pattern 2: Direct Repository Calls**

```typescript
// ❌ DON'T
export const getLibraryItems = authorizedActionClient
  .action(async ({ ctx: { userId } }) => {
    return await getManyLibraryItems({ userId });
  });
```

```typescript
// ✅ DO
export const getLibraryItems = authorizedActionClient
  .action(async ({ ctx: { userId } }) => {
    return await libraryService.getLibraryItems({ userId });
  });
```

---

**Document Version:** 1.0
**Last Updated:** 2025-10-03
**Status:** Ready for Implementation
