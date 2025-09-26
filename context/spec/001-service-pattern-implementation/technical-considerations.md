# Technical Specification: Service Pattern Implementation

- **Functional Specification:** `context/spec/001-service-pattern-implementation/functional-spec.md`
- **Status:** Draft
- **Author(s):** Technical Architect

---

## 1. High-Level Technical Approach

Implement a unified service layer architecture following a CQRS-inspired pattern where business logic is centralized in services that orchestrate server actions (commands). Server actions will be moved from feature directories into service-specific `actions/` directories, creating a clear separation between business logic (services) and operational commands (actions).

The architecture follows: **Route Handlers/Server Components → Services → Server Actions → Repository → Prisma/Database**

All services will be server-only components that extend the existing `BaseService` class, maintaining consistency with the established `CollectionService` and `IgdbService` patterns. The `BaseService` will be enhanced with authentication methods to centralize user context management across all services.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### Architecture Changes

**Enhanced BaseService with Authentication:**

```typescript
export abstract class BaseService {
  // Existing error handling methods...

  protected async getCurrentUserId(): Promise<string> {
    const userId = await getServerUserId();
    if (!userId) {
      throw new Error("Authentication required");
    }
    return userId;
  }

  protected async getCurrentUserIdOptional(): Promise<string | undefined> {
    return await getServerUserId();
  }

  protected handleError(error: unknown): ServiceError {
    /* existing implementation */
  }
  protected createSuccessResponse<T>(data: T): ServiceResponse<T> {
    /* existing implementation */
  }
  protected createErrorResponse(error: ServiceError): ServiceResponse<never> {
    /* existing implementation */
  }
}
```

**Service Directory Structure:**

```
shared/services/
├── user/
│   ├── service.ts                    # UserService with business logic
│   ├── actions/                      # Server actions as commands
│   │   ├── create-user.ts
│   │   ├── update-user.ts
│   │   └── delete-user.ts
│   ├── types.ts                      # Service-specific TypeScript types
│   └── service.unit.test.ts          # Comprehensive unit tests
├── review/
│   ├── service.ts                    # ReviewService
│   ├── actions/
│   │   ├── create-review.ts
│   │   ├── update-review.ts
│   │   └── delete-review.ts
│   └── types.ts
├── steam/
│   ├── service.ts                    # SteamService
│   ├── actions/
│   │   ├── authenticate-steam.ts
│   │   ├── import-games.ts
│   │   └── sync-achievements.ts
│   └── types.ts
├── dashboard/
│   ├── service.ts                    # DashboardService
│   ├── actions/
│   │   ├── get-user-stats.ts
│   │   └── get-recent-activity.ts
│   └── types.ts
└── game-management/
    ├── service.ts                    # Complete existing partial implementation
    ├── actions/
    │   ├── add-to-collection.ts      # Move from current location
    │   └── remove-from-collection.ts
    └── types.ts
```

**Service Implementation Pattern with Authentication:**

```typescript
import "server-only";

import { BaseService, type ServiceResponse } from "../types";
import { createUser, updateUser } from "./actions";
import type { CreateUserParams, UserResult } from "./types";

export class UserService extends BaseService {
  async updateProfile(
    params: UpdateProfileParams
  ): Promise<ServiceResponse<UserResult>> {
    try {
      const userId = await this.getCurrentUserId(); // Throws if not authenticated

      // Business logic validation and orchestration here
      const result = await updateUserProfile({ ...params, userId });
      return this.createSuccessResponse(result);
    } catch (error) {
      return this.createErrorResponse(this.handleError(error));
    }
  }

  async getPublicUserInfo(
    targetUserId: string
  ): Promise<ServiceResponse<PublicUserInfo>> {
    try {
      const currentUserId = await this.getCurrentUserIdOptional(); // Optional for public methods

      const result = await getPublicUserInfo({ targetUserId, currentUserId });
      return this.createSuccessResponse(result);
    } catch (error) {
      return this.createErrorResponse(this.handleError(error));
    }
  }
}
```

### Migration Strategy

**Phase 1: Complete Partially Implemented Services**

1. **GameManagementService:**
   - Move `shared/services/game-management/add-to-collection.ts` to `shared/services/game-management/actions/add-to-collection.ts`
   - Create `shared/services/game-management/service.ts` with business logic and authentication
   - Add comprehensive unit tests following existing patterns

**Phase 2: Enhance BaseService**

1. **Add Authentication Methods:** Extend `BaseService` with `getCurrentUserId()` and `getCurrentUserIdOptional()`
2. **Update Existing Services:** Modify `CollectionService` and `IgdbService` to use new authentication methods if needed
3. **Update Service Types:** Ensure all services import and extend the enhanced `BaseService`

**Phase 3: Implement Missing Services**

1. **UserService:** Consolidate user-related server actions from features into `shared/services/user/actions/`
2. **ReviewService:** Move review-related business logic and actions
3. **SteamService:** Consolidate Steam integration logic from `features/steam-integration/`
4. **DashboardService:** Implement dashboard data aggregation logic

**Phase 4: Feature Integration**

1. Update feature imports to reference new service locations
2. Modify features to call services instead of direct server actions
3. Update existing tests to reflect new import paths

### Server Action Migration

**Current Location:** `features/[feature-name]/server-actions/[action-name].ts`
**New Location:** `shared/services/[service-name]/actions/[action-name].ts`

**Import Updates Required:**

- Feature components importing server actions
- Other server actions with cross-feature dependencies
- Test files referencing moved actions

**Authentication Handling:**

- Server actions maintain their existing authentication patterns using `authorizedActionClient`
- Services add an additional authentication layer for business logic validation
- This dual approach ensures both server actions and services can handle authentication appropriately

---

## 3. Impact and Risk Analysis

### System Dependencies

**Affected Systems:**

- All feature directories with server actions
- Existing service consumers (Route Handlers, Server Components)
- Test suites referencing server actions
- Import statements throughout the codebase
- Authentication flow for all user-facing operations

**External Dependencies:**

- No changes to Prisma schema or external APIs
- Repository layer remains unchanged
- Next.js server actions patterns maintained
- NextAuth.js authentication flow unchanged

### Potential Risks & Mitigations

**Risk 1: Breaking Changes During Migration**

- **Mitigation:** Implement incremental migration by service, maintaining backward compatibility during transition
- **Strategy:** Use TypeScript path aliases to maintain existing imports during migration phase

**Risk 2: Authentication Layer Confusion**

- **Mitigation:** Clear documentation on when to use service vs server action authentication
- **Strategy:** Services handle business logic authentication, server actions maintain their existing auth patterns

**Risk 3: Test Coverage Gaps**

- **Mitigation:** Mandate 80% test coverage for all new services before merging
- **Strategy:** Use existing `vitest.config.ts` server environment for service testing

**Risk 4: Performance Impact**

- **Mitigation:** Services add minimal overhead as thin orchestration layers with single authentication check
- **Strategy:** Monitor performance metrics during rollout, particularly for high-traffic operations

**Risk 5: Developer Confusion**

- **Mitigation:** Clear documentation and consistent patterns across all services
- **Strategy:** Start with game-management service as reference implementation

---

## 4. Testing Strategy

### Unit Testing Approach

**Test Environment:** Vitest "server" project configuration for server-only services

**Authentication Testing Pattern:**

```typescript
// user/service.unit.test.ts
import { vi } from "vitest";

import { UserService } from "./service";

// Mock the auth function
vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

// Mock the actions
vi.mock("./actions/update-user-profile", () => ({
  updateUserProfile: vi.fn(),
}));

describe("UserService", () => {
  let userService: UserService;
  const mockGetServerUserId = vi.mocked(getServerUserId);

  beforeEach(() => {
    userService = new UserService();
    vi.clearAllMocks();
  });

  it("should require authentication for updateProfile", async () => {
    mockGetServerUserId.mockResolvedValue(undefined);

    const result = await userService.updateProfile({ name: "Test" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Authentication required");
  });

  it("should update profile successfully when authenticated", async () => {
    mockGetServerUserId.mockResolvedValue("user-123");

    // Test business logic without touching database
  });
});
```

**Coverage Requirements:**

- 80% coverage across branches, functions, lines, and statements
- Focus on business logic validation, authentication, and error handling
- Mock server actions and authentication to isolate service logic

**Test File Structure:**

- `service.unit.test.ts` - Service business logic and authentication tests
- Individual action tests remain in their current locations initially
- Integration tests at feature level to verify end-to-end workflows

### Integration Testing

- Feature-level tests verify services integrate correctly with UI components
- Repository integration tests remain unchanged
- Database integration tests continue using existing Docker setup
- Authentication flow testing through existing NextAuth.js patterns

---

This technical specification provides a clear path for implementing the service pattern with proper authentication handling while minimizing disruption to existing functionality. The CQRS-inspired approach creates better separation of concerns, improved testability, and centralized authentication management.
