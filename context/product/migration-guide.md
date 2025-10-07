# Service Layer Migration Guide

This guide provides step-by-step instructions for migrating features from direct repository calls to the service layer pattern.

## Table of Contents

- [Critical Migration Rule](#critical-migration-rule)
- [Migration Overview](#migration-overview)
- [Step-by-Step Migration Process](#step-by-step-migration-process)
- [Before and After Examples](#before-and-after-examples)
- [Feature Refactoring Checklist](#feature-refactoring-checklist)
- [Verification and Testing](#verification-and-testing)
- [Common Migration Scenarios](#common-migration-scenarios)
- [Rollback Procedures](#rollback-procedures)
- [Migration Timeline and Prioritization](#migration-timeline-and-prioritization)

## Critical Migration Rule

**ALL repository imports must be removed from server actions and moved to service classes.**

After migration, this command MUST return ZERO results:

```bash
grep -r "from '@/shared/lib/repository'" features/
```

Any matches indicate incomplete migration and architecture violations.

## Migration Overview

### What Changes

**Before Migration:**

```
Server Action → Repository → Database
```

**After Migration:**

```
Server Action → Service → Repository → Database
```

### Migration Scope

Each feature migration involves:

1. Creating a new service class (or updating existing)
2. Moving business logic from server actions to services
3. Updating server actions to call services
4. Removing repository imports from server actions
5. Adding comprehensive service unit tests
6. Updating integration tests

## Validation Strategy During Migration

**CRITICAL:** As you migrate features to the service layer, you MUST also migrate validation to follow the Zod-first pattern.

### Validation Migration Rules

**Where to Put Validation:**

1. **Zod Schemas** → `features/[feature-name]/lib/validation.ts`
   - Input shape validation
   - Type coercion
   - Format constraints
   - String sanitization

2. **Business Rules** → `shared/services/[service-name]/[service-name]-service.ts`
   - Duplicate checks
   - Authorization checks
   - State transitions
   - Cross-entity validation

### Migration Checklist: Validation

When migrating a feature, follow these steps for validation:

- [ ] Create `features/[feature-name]/lib/validation.ts` if it doesn't exist
- [ ] Move ALL input shape validation from service to Zod schemas
- [ ] Remove input type checks from service methods (e.g., `if (!input.userId)`)
- [ ] Keep ONLY business validation in services (e.g., duplicate checks)
- [ ] Update server actions to use `.inputSchema(ZodSchema)`
- [ ] Update service input types to use `z.infer<typeof Schema>`
- [ ] Remove redundant validation tests from service tests
- [ ] Add Zod schema validation tests if needed

### Example: Migrating Validation

#### Before Migration (Bad Pattern)

```typescript
// ❌ Server action with no validation
export const createItemAction = authorizedActionClient.action(
  async ({ parsedInput, ctx: { userId } }) => {
    return await libraryService.createItem({
      userId,
      ...parsedInput,
    });
  }
);

// ❌ Service validates everything (input shape + business rules)
class LibraryService {
  async createItem(input: any) {
    // Input validation (should be in Zod)
    if (!input.gameId || typeof input.gameId !== "string") {
      return this.error("gameId is required and must be a string");
    }
    if (input.platform && typeof input.platform !== "string") {
      return this.error("platform must be a string");
    }

    // Business validation (correct location)
    const exists = await this.repo.findByUserAndGame(
      input.userId,
      input.gameId
    );
    if (exists) {
      return this.error("Game already in library");
    }

    // ...
  }
}
```

#### After Migration (Correct Pattern)

```typescript
// ✅ Zod schema for input validation
// features/library/lib/validation.ts
import { LibraryItemStatus } from "@prisma/client";
import { z } from "zod";

// ✅ Service validates ONLY business rules
// shared/services/library/library-service.ts
import type { CreateLibraryItemInput } from "@/features/library/lib/validation";

// ✅ Server action uses Zod schema
// features/library/server-actions/create-item-action.ts
import { CreateLibraryItemSchema } from "../lib/validation";

export const CreateLibraryItemSchema = z.object({
  gameId: z.string().min(1, "Game ID is required"),
  platform: z.string().optional(),
  status: z.nativeEnum(LibraryItemStatus).optional(),
});

export type CreateLibraryItemInput = z.infer<typeof CreateLibraryItemSchema>;

export const createItemAction = authorizedActionClient
  .inputSchema(CreateLibraryItemSchema) // Zod validates here
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // Input is pre-validated and typed
    return await libraryService.createItem({
      userId,
      ...parsedInput,
    });
  });

class LibraryService {
  async createItem(input: CreateLibraryItemInput & { userId: string }) {
    // NO input shape validation - Zod already did this!

    // ✅ Business validation only
    const exists = await this.repo.findByUserAndGame(
      input.userId,
      input.gameId
    );
    if (exists) {
      return this.error("Game already in library", ServiceErrorCode.CONFLICT);
    }

    // Business logic
    const item = await this.repo.create({
      ...input,
      status: input.status ?? LibraryItemStatus.CURIOUS_ABOUT,
    });

    return this.success({ item });
  }
}
```

### Benefits of This Migration

1. **Type Safety**: `z.infer<>` gives you compile-time types
2. **Clarity**: Clear separation between input validation (Zod) and business validation (service)
3. **Performance**: Validation happens once at the boundary
4. **Testability**: Service tests focus on business logic only
5. **Reusability**: Services work with any consumer without duplicating validation

## Step-by-Step Migration Process

### Step 1: Analyze Current Implementation

Before starting, understand what needs to be migrated:

```bash
# Find all repository imports in the feature
grep -r "from '@/shared/lib/repository'" features/[feature-name]/

# List all server actions
find features/[feature-name]/ -name "*.ts" -path "*/server-actions/*"
```

**Document:**

- Which repository functions are called
- What business logic exists in server actions
- What data transformations are performed
- What validation rules are applied

### Step 2: Create or Update Service

#### 2.1 Create Service Directory Structure

If the service doesn't exist:

```bash
mkdir -p shared/services/[service-name]
touch shared/services/[service-name]/[service-name]-service.ts
touch shared/services/[service-name]/[service-name]-service.test.ts
touch shared/services/[service-name]/types.ts
touch shared/services/[service-name]/index.ts
```

#### 2.2 Define Service Types

Create type definitions in `types.ts`:

```typescript
// shared/services/[service-name]/types.ts
import type { BaseService, ServiceResponse } from '../types';

export interface Create[Entity]Input {
  userId: string;
  // ... other required fields
}

export interface Update[Entity]Input {
  id: string;
  userId: string;
  // ... fields to update
}

export interface [Entity]Result {
  [entity]: [Entity];
}

export interface [Entity]Service extends BaseService {
  create[Entity](input: Create[Entity]Input): Promise<ServiceResponse<[Entity]Result>>;
  update[Entity](input: Update[Entity]Input): Promise<ServiceResponse<[Entity]Result>>;
  delete[Entity](id: string, userId: string): Promise<ServiceResponse<void>>;
  get[Entity](id: string): Promise<ServiceResponse<[Entity]Result>>;
}
```

#### 2.3 Implement Service Class

Create the service implementation:

```typescript
// shared/services/[service-name]/[service-name]-service.ts
import {
  create[Entity],
  update[Entity],
  delete[Entity],
  get[Entity]
} from '@/shared/lib/repository';  // ✅ OK to import in services

import { BaseService, type ServiceResponse } from '../types';
import type {
  Create[Entity]Input,
  Update[Entity]Input,
  [Entity]Result,
  [Entity]Service as [Entity]ServiceInterface
} from './types';

export class [Entity]Service
  extends BaseService
  implements [Entity]ServiceInterface
{
  async create[Entity](
    input: Create[Entity]Input
  ): Promise<ServiceResponse<[Entity]Result>> {
    try {
      // 1. Validate input
      if (!input.userId) {
        return this.createErrorResponse({
          message: "User ID is required",
          code: "INVALID_INPUT"
        });
      }

      // 2. Apply business logic
      // ... your business rules here

      // 3. Transform data
      // ... prepare data for repository

      // 4. Call repository
      const entity = await create[Entity]({
        // ... repository input
      });

      if (!entity) {
        return this.createErrorResponse({
          message: "Failed to create [entity]",
          code: "CREATE_FAILED"
        });
      }

      // 5. Return success response
      return this.createSuccessResponse({ [entity]: entity });
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to create [entity]",
        code: "CREATE_FAILED",
        cause: serviceError.cause
      });
    }
  }

  // ... implement other methods
}
```

#### 2.4 Create Service Exports

```typescript
// shared/services/[service-name]/index.ts
export { [Entity]Service } from './[service-name]-service';
export type * from './types';
```

#### 2.5 Update Service Barrel Export

```typescript
// shared/services/index.ts
export { [Entity]Service } from './[service-name]';
export type * from './[service-name]/types';
```

### Step 3: Write Service Tests

Create comprehensive unit tests BEFORE updating server actions:

```typescript
// shared/services/[service-name]/[service-name]-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { [Entity]Service } from './[service-name]-service';
import * as repository from '@/shared/lib/repository';

vi.mock('@/shared/lib/repository', () => ({
  create[Entity]: vi.fn(),
  update[Entity]: vi.fn(),
  delete[Entity]: vi.fn(),
  get[Entity]: vi.fn()
}));

describe('[Entity]Service', () => {
  let service: [Entity]Service;

  beforeEach(() => {
    service = new [Entity]Service();
    vi.clearAllMocks();
  });

  describe('create[Entity]', () => {
    it('should create [entity] successfully', async () => {
      const mockEntity = { id: '1', userId: 'user-1', /* ... */ };
      vi.mocked(repository.create[Entity]).mockResolvedValue(mockEntity);

      const result = await service.create[Entity]({
        userId: 'user-1',
        // ... input data
      });

      expect(result.success).toBe(true);
      expect(result.data?.[entity]).toEqual(mockEntity);
    });

    it('should return error when userId is missing', async () => {
      const result = await service.create[Entity]({
        userId: '',
        // ... input data
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_INPUT');
      expect(repository.create[Entity]).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      vi.mocked(repository.create[Entity]).mockRejectedValue(
        new Error('Database error')
      );

      const result = await service.create[Entity]({
        userId: 'user-1',
        // ... input data
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CREATE_FAILED');
    });
  });

  // ... test other methods
});
```

**Run tests to ensure service works correctly:**

```bash
pnpm run test:unit [service-name]-service
```

### Step 4: Update Server Actions

Now refactor server actions to use the service:

#### 4.1 Update Imports

**BEFORE:**

```typescript
import { create[Entity] } from '@/shared/lib/repository';  // ❌ Remove this
```

**AFTER:**

```typescript
import { [Entity]Service } from '@/shared/services';  // ✅ Add this

const [entity]Service = new [Entity]Service();
```

#### 4.2 Refactor Action Logic

**BEFORE:**

```typescript
export const create[Entity]Action = authorizedActionClient
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // ❌ Business logic in server action
    const data = {
      ...parsedInput,
      createdAt: new Date(),
      status: parsedInput.status ?? "DEFAULT"
    };

    // ❌ Direct repository call
    const entity = await create[Entity]({
      userId,
      ...data
    });

    if (!entity) {
      return { error: "Failed to create [entity]" };
    }

    return entity;
  });
```

**AFTER:**

```typescript
export const create[Entity]Action = authorizedActionClient
  .metadata({
    actionName: "create[Entity]",
    requiresAuth: true
  })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // ✅ Simple service call (thin wrapper)
    const result = await [entity]Service.create[Entity]({
      userId,
      ...parsedInput
    });

    // ✅ Handle service response
    if (!result.success) {
      throw new Error(result.error ?? "Failed to create [entity]");
    }

    return result.data;
  });
```

### Step 5: Verify Migration

#### 5.1 Run Verification Commands

```bash
# Check for remaining repository imports in feature
grep -r "from '@/shared/lib/repository'" features/[feature-name]/

# Expected: NO results (if migration is complete)

# Check service imports
grep -r "from '@/shared/services'" features/[feature-name]/server-actions/

# Expected: Should find service imports
```

#### 5.2 Run Tests

```bash
# Run service unit tests
pnpm run test:unit [service-name]-service

# Run integration tests for the feature
pnpm run test:integration [feature-name]

# Run all tests
pnpm run test
```

#### 5.3 Type Check

```bash
pnpm typecheck
```

### Step 6: Update Integration Tests

Update any integration tests to reflect the new architecture:

```typescript
// features/[feature-name]/server-actions/action.integration.test.ts
describe('create[Entity] server action', () => {
  it('should create [entity] through service layer', async () => {
    // This test verifies the full flow:
    // Server Action → Service → Repository → Database
    const result = await create[Entity]Action({
      // ... test input
    });

    expect(result).toBeDefined();
    // ... assertions
  });
});
```

### Step 7: Code Review and Documentation

1. Review the changes to ensure:
   - ✅ No repository imports in server actions
   - ✅ Server actions are thin wrappers (< 15 lines)
   - ✅ All business logic is in service
   - ✅ Service has comprehensive tests
   - ✅ Error handling follows standards
   - ✅ Type safety is maintained

2. Update feature CLAUDE.md documentation if it exists

3. Add comments to complex business logic in service

## Before and After Examples

### Example 1: Create Library Item

#### ❌ BEFORE Migration

```typescript
// features/manage-library-item/create-library-item/server-actions/action.ts
"use server";

import { type LibraryItemStatus } from "@prisma/client";
import { zfd } from "zod-form-data";

// ❌ Direct repository import
import { createLibraryItem as createLibraryItemCommand } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { RevalidationService } from "@/shared/ui/revalidation";

export const createLibraryItem = authorizedActionClient
  .metadata({
    actionName: "createLibraryItem",
    requiresAuth: true,
  })
  .inputSchema(
    zfd.formData({
      gameId: zfd.text(),
      platform: zfd.text(),
      status: zfd.text(),
      startedAt: zfd.text().optional(),
      completedAt: zfd.text().optional(),
    })
  )
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // ❌ Business logic and data transformation in server action
    const libraryItem = await createLibraryItemCommand({
      libraryItem: {
        status: parsedInput.status as LibraryItemStatus,
        platform: parsedInput.platform,
        startedAt: parsedInput.startedAt
          ? new Date(parsedInput.startedAt)
          : undefined,
        completedAt: parsedInput.completedAt
          ? new Date(parsedInput.completedAt)
          : undefined,
        acquisitionType: "DIGITAL", // ❌ Business rule in server action
      },
      userId,
      gameId: parsedInput.gameId,
    });

    if (!libraryItem) {
      return {
        message: "Failed to create library item",
      };
    }

    RevalidationService.revalidateCollection();
  });
```

**Problems:**

- ❌ Imports from `@/shared/lib/repository`
- ❌ Contains business logic (date transformation, default values)
- ❌ Calls repository directly
- ❌ Not testable in isolation
- ❌ Not reusable

#### ✅ AFTER Migration

**Step 1: Create Service**

```typescript
// shared/services/library/library-service.ts
import { createLibraryItem } from "@/shared/lib/repository"; // ✅ OK in services

import { BaseService, type ServiceResponse } from "../types";
import type { CreateLibraryItemInput, LibraryItemResult } from "./types";

export class LibraryService extends BaseService {
  async createLibraryItem(
    input: CreateLibraryItemInput
  ): Promise<ServiceResponse<LibraryItemResult>> {
    try {
      // ✅ Business validation
      if (!input.userId || !input.gameId) {
        return this.createErrorResponse({
          message: "User ID and Game ID are required",
          code: "INVALID_INPUT",
        });
      }

      // ✅ Data transformation and business rules in service
      const libraryItemData = {
        status: input.status,
        platform: input.platform,
        startedAt: input.startedAt ? new Date(input.startedAt) : undefined,
        completedAt: input.completedAt
          ? new Date(input.completedAt)
          : undefined,
        acquisitionType: input.acquisitionType ?? "DIGITAL", // ✅ Business rule here
      };

      // ✅ Repository call from service
      const item = await createLibraryItem({
        libraryItem: libraryItemData,
        userId: input.userId,
        gameId: input.gameId,
      });

      if (!item) {
        return this.createErrorResponse({
          message: "Failed to create library item",
          code: "CREATE_FAILED",
        });
      }

      return this.createSuccessResponse({ item });
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to create library item",
        code: "CREATE_FAILED",
        cause: serviceError.cause,
      });
    }
  }
}
```

**Step 2: Update Service Types**

```typescript
// shared/services/library/types.ts
import type {
  AcquisitionType,
  LibraryItem,
  LibraryItemStatus,
} from "@prisma/client";

import type { ServiceResponse } from "../types";

export interface CreateLibraryItemInput {
  userId: string;
  gameId: string;
  status: LibraryItemStatus;
  platform: string;
  acquisitionType?: AcquisitionType;
  startedAt?: string;
  completedAt?: string;
}

export interface LibraryItemResult {
  item: LibraryItem;
}
```

**Step 3: Update Server Action**

```typescript
// features/manage-library-item/create-library-item/server-actions/action.ts
"use server";

import { zfd } from "zod-form-data";

import { authorizedActionClient } from "@/shared/lib/safe-action-client";
// ✅ Import service instead of repository
import { LibraryService } from "@/shared/services";
import { RevalidationService } from "@/shared/ui/revalidation";

const libraryService = new LibraryService();

export const createLibraryItem = authorizedActionClient
  .metadata({
    actionName: "createLibraryItem",
    requiresAuth: true,
  })
  .inputSchema(
    zfd.formData({
      gameId: zfd.text(),
      platform: zfd.text(),
      status: zfd.text(),
      startedAt: zfd.text().optional(),
      completedAt: zfd.text().optional(),
    })
  )
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // ✅ Simple service call (thin wrapper)
    const result = await libraryService.createLibraryItem({
      userId,
      gameId: parsedInput.gameId,
      platform: parsedInput.platform,
      status: parsedInput.status as LibraryItemStatus,
      startedAt: parsedInput.startedAt,
      completedAt: parsedInput.completedAt,
    });

    // ✅ Handle service response
    if (!result.success) {
      throw new Error(result.error ?? "Failed to create library item");
    }

    // ✅ Side effect (cache revalidation) stays in server action
    RevalidationService.revalidateCollection();

    return result.data;
  });
```

**Benefits:**

- ✅ No repository imports in server action
- ✅ Business logic isolated in service
- ✅ Server action is a thin wrapper (~15 lines)
- ✅ Testable in isolation with mocked repositories
- ✅ Reusable across different consumers

### Example 2: Create Review

#### ❌ BEFORE Migration

```typescript
// features/add-review/server-actions/create-review.ts
"use server";

import { revalidatePath } from "next/cache";

// ❌ Direct repository import
import { createReview as createReviewCommand } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

import { CreateReviewSchema } from "../lib/validation";

export const createReview = authorizedActionClient
  .metadata({
    actionName: "createReview",
    requiresAuth: true,
  })
  .inputSchema(CreateReviewSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // ❌ Direct repository call with no business logic validation
    await createReviewCommand({
      userId,
      gameId: parsedInput.gameId,
      review: {
        rating: parsedInput.rating,
        content: parsedInput.content,
        completedOn: parsedInput.completedOn,
      },
    });
    revalidatePath(`/game/${parsedInput.gameId}`);
  });
```

**Problems:**

- ❌ Imports from `@/shared/lib/repository`
- ❌ No validation for duplicate reviews
- ❌ No rating range validation
- ❌ Calls repository directly
- ❌ Not testable in isolation

#### ✅ AFTER Migration

**Step 1: Create Service**

```typescript
// shared/services/review/review-service.ts
import { createReview, getReviewsByGame } from "@/shared/lib/repository";

import { BaseService, type ServiceResponse } from "../types";
import type { CreateReviewInput, ReviewResult } from "./types";

export class ReviewService extends BaseService {
  async createReview(
    input: CreateReviewInput
  ): Promise<ServiceResponse<ReviewResult>> {
    try {
      // ✅ Business validation
      if (!input.userId || !input.gameId) {
        return this.createErrorResponse({
          message: "User ID and Game ID are required",
          code: "INVALID_INPUT",
        });
      }

      // ✅ Rating validation (business rule)
      if (input.rating < 1 || input.rating > 10) {
        return this.createErrorResponse({
          message: "Rating must be between 1 and 10",
          code: "INVALID_RATING",
        });
      }

      // ✅ Check for duplicate review (business rule)
      const existingReviews = await getReviewsByGame({
        gameId: input.gameId,
        userId: input.userId,
      });

      if (existingReviews.length > 0) {
        return this.createErrorResponse({
          message: "You have already reviewed this game",
          code: "DUPLICATE_REVIEW",
        });
      }

      // ✅ Repository call
      const review = await createReview({
        userId: input.userId,
        gameId: input.gameId,
        review: {
          rating: input.rating,
          content: input.content,
          completedOn: input.completedOn,
        },
      });

      return this.createSuccessResponse({ review });
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to create review",
        code: "CREATE_FAILED",
        cause: serviceError.cause,
      });
    }
  }
}
```

**Step 2: Update Server Action**

```typescript
// features/add-review/server-actions/create-review.ts
"use server";

import { revalidatePath } from "next/cache";

import { authorizedActionClient } from "@/shared/lib/safe-action-client";
// ✅ Import service instead of repository
import { ReviewService } from "@/shared/services";

import { CreateReviewSchema } from "../lib/validation";

const reviewService = new ReviewService();

export const createReview = authorizedActionClient
  .metadata({
    actionName: "createReview",
    requiresAuth: true,
  })
  .inputSchema(CreateReviewSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // ✅ Service call with business logic
    const result = await reviewService.createReview({
      userId,
      gameId: parsedInput.gameId,
      rating: parsedInput.rating,
      content: parsedInput.content,
      completedOn: parsedInput.completedOn,
    });

    // ✅ Handle service response
    if (!result.success) {
      throw new Error(result.error ?? "Failed to create review");
    }

    // ✅ Cache revalidation (side effect)
    revalidatePath(`/game/${parsedInput.gameId}`);

    return result.data;
  });
```

**Benefits:**

- ✅ Added duplicate review prevention
- ✅ Added rating range validation
- ✅ Business logic in service
- ✅ Testable validation rules
- ✅ Consistent error handling

### Example 3: Update Library Item

#### ❌ BEFORE Migration

```typescript
// features/manage-library-item/edit-library-item/server-actions/action.ts
"use server";

import { type LibraryItemStatus } from "@prisma/client";
import { zfd } from "zod-form-data";

// ❌ Direct repository import
import { updateLibraryItem as updateLibraryItemCommand } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { RevalidationService } from "@/shared/ui/revalidation";

export const editLibraryItem = authorizedActionClient
  .inputSchema(
    zfd.formData({
      id: zfd.text(),
      platform: zfd.text(),
      status: zfd.text(),
      startedAt: zfd.text().optional(),
      completedAt: zfd.text().optional(),
    })
  )
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // ❌ Business logic in server action
    const updatedLibraryItem = await updateLibraryItemCommand({
      id: parsedInput.id,
      userId,
      updates: {
        platform: parsedInput.platform,
        status: parsedInput.status as LibraryItemStatus,
        startedAt: parsedInput.startedAt
          ? new Date(parsedInput.startedAt)
          : null,
        completedAt: parsedInput.completedAt
          ? new Date(parsedInput.completedAt)
          : null,
      },
    });

    if (!updatedLibraryItem) {
      return {
        message: "Failed to update library item",
      };
    }

    RevalidationService.revalidateCollection();
  });
```

#### ✅ AFTER Migration

**Service Method:**

```typescript
// shared/services/library/library-service.ts
export class LibraryService extends BaseService {
  async updateLibraryItem(
    input: UpdateLibraryItemInput
  ): Promise<ServiceResponse<LibraryItemResult>> {
    try {
      // ✅ Validation
      if (!input.id || !input.userId) {
        return this.createErrorResponse({
          message: "Library item ID and User ID are required",
          code: "INVALID_INPUT",
        });
      }

      // ✅ Transform dates
      const updateData = {
        ...input,
        startedAt: input.startedAt ? new Date(input.startedAt) : null,
        completedAt: input.completedAt ? new Date(input.completedAt) : null,
      };

      // ✅ Repository call
      const item = await updateLibraryItem({
        id: input.id,
        userId: input.userId,
        updates: updateData,
      });

      if (!item) {
        return this.createErrorResponse({
          message: "Library item not found or unauthorized",
          code: "NOT_FOUND",
        });
      }

      return this.createSuccessResponse({ item });
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to update library item",
        code: "UPDATE_FAILED",
        cause: serviceError.cause,
      });
    }
  }
}
```

**Updated Server Action:**

```typescript
// features/manage-library-item/edit-library-item/server-actions/action.ts
"use server";

import { zfd } from "zod-form-data";

import { authorizedActionClient } from "@/shared/lib/safe-action-client";
// ✅ Import service
import { LibraryService } from "@/shared/services";
import { RevalidationService } from "@/shared/ui/revalidation";

const libraryService = new LibraryService();

export const editLibraryItem = authorizedActionClient
  .metadata({
    actionName: "editLibraryItem",
    requiresAuth: true,
  })
  .inputSchema(
    zfd.formData({
      id: zfd.text(),
      platform: zfd.text(),
      status: zfd.text(),
      startedAt: zfd.text().optional(),
      completedAt: zfd.text().optional(),
    })
  )
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // ✅ Service call
    const result = await libraryService.updateLibraryItem({
      id: parsedInput.id,
      userId,
      platform: parsedInput.platform,
      status: parsedInput.status as LibraryItemStatus,
      startedAt: parsedInput.startedAt,
      completedAt: parsedInput.completedAt,
    });

    if (!result.success) {
      throw new Error(result.error ?? "Failed to update library item");
    }

    RevalidationService.revalidateCollection();

    return result.data;
  });
```

## Feature Refactoring Checklist

Use this checklist for each feature migration:

### Planning Phase

- [ ] Identify all server actions with repository imports
- [ ] Document business logic in server actions
- [ ] Document data transformations
- [ ] Document validation rules
- [ ] Identify which service(s) to create/update

### Service Creation Phase

- [ ] Create service directory structure
- [ ] Define service types in `types.ts`
- [ ] Implement service class with all methods
- [ ] Add comprehensive JSDoc comments
- [ ] Export service from `index.ts`
- [ ] Add service to barrel export

### Testing Phase

- [ ] Write unit tests for all service methods
- [ ] Test success paths
- [ ] Test error paths
- [ ] Test validation rules
- [ ] Test edge cases
- [ ] Achieve >90% test coverage
- [ ] All tests pass

### Server Action Update Phase

- [ ] Remove repository imports
- [ ] Add service imports
- [ ] Instantiate service
- [ ] Replace repository calls with service calls
- [ ] Remove business logic from actions
- [ ] Add proper error handling
- [ ] Keep cache revalidation in actions

### Verification Phase

- [ ] Run verification command (no repository imports in features/)
- [ ] Run type checking (`pnpm typecheck`)
- [ ] Run unit tests (`pnpm run test:unit`)
- [ ] Run integration tests (`pnpm run test:integration`)
- [ ] Manual testing of feature
- [ ] Code review

### Documentation Phase

- [ ] Update feature CLAUDE.md if exists
- [ ] Update architecture documentation references
- [ ] Add migration notes to commit message
- [ ] Document any breaking changes

## Verification and Testing

### Automated Verification

Create a verification script:

```bash
#!/bin/bash
# scripts/verify-architecture.sh

echo "Checking for repository imports in features..."

VIOLATIONS=$(grep -r "from '@/shared/lib/repository'" features/ || true)

if [ -n "$VIOLATIONS" ]; then
  echo "❌ ARCHITECTURE VIOLATION: Found repository imports in features/"
  echo ""
  echo "$VIOLATIONS"
  echo ""
  echo "ALL repository calls must go through the service layer."
  echo "See context/product/migration-guide.md for refactoring instructions."
  exit 1
else
  echo "✅ No architecture violations found"
  exit 0
fi
```

Add to package.json:

```json
{
  "scripts": {
    "verify:architecture": "bash scripts/verify-architecture.sh"
  }
}
```

Run before committing:

```bash
pnpm verify:architecture
```

### Testing Checklist

For each migrated feature:

#### Unit Tests

```bash
# Test the service in isolation
pnpm run test:unit [service-name]-service

# Check coverage
pnpm run test:coverage -- [service-name]-service

# Expected: >90% coverage
```

#### Integration Tests

```bash
# Test server actions with real service
pnpm run test:integration [feature-name]

# Test full stack
pnpm run test
```

#### Type Checking

```bash
# Ensure no type errors
pnpm typecheck
```

#### Manual Testing

- Test all CRUD operations
- Test error scenarios
- Test edge cases
- Test UI interactions

## Common Migration Scenarios

### Scenario 1: Simple CRUD Feature

**Features:** manage-library-item, add-review

**Steps:**

1. Create service with CRUD methods
2. Move validation to service
3. Update server actions to thin wrappers
4. Add comprehensive tests

**Complexity:** Low
**Time Estimate:** 2-4 hours

### Scenario 2: Feature with Complex Business Logic

**Features:** steam-integration, view-collection

**Steps:**

1. Identify all business rules
2. Create service with complex validation
3. Handle multi-step operations
4. Add transaction support if needed
5. Comprehensive edge case testing

**Complexity:** Medium
**Time Estimate:** 4-8 hours

### Scenario 3: Feature with Multiple Related Operations

**Features:** dashboard (multiple widgets)

**Steps:**

1. Create or update multiple services
2. Handle service composition
3. Optimize for performance
4. Add caching strategies
5. Extensive integration testing

**Complexity:** High
**Time Estimate:** 8-16 hours

### Scenario 4: Quick Action Buttons

**Features:** edit-library-item quick actions

**Pattern:**

```typescript
// Before: Direct repository call in hook
const { execute } = useAction(async () => {
  await updateLibraryItem({ id, status: "EXPERIENCED" });
});

// After: Service call through server action
const { execute } = useAction(updateLibraryItemAction, {
  onSuccess: () => toast.success("Updated!"),
  onError: () => toast.error("Failed"),
});

// Server action (thin wrapper)
export const updateLibraryItemAction = authorizedActionClient.action(
  async ({ parsedInput, ctx: { userId } }) => {
    const result = await libraryService.updateLibraryItem({
      id: parsedInput.id,
      userId,
      status: parsedInput.status,
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  }
);
```

## Rollback Procedures

If migration causes issues:

### Immediate Rollback

```bash
# Revert the commit
git revert HEAD

# Or reset to previous commit
git reset --hard HEAD~1

# Push rollback
git push origin [branch-name]
```

### Partial Rollback

If only part of the migration is problematic:

1. Keep the service implementation
2. Temporarily restore server action to call repository
3. Add TODO comment to track incomplete migration
4. File issue to complete migration later

```typescript
// features/[feature]/server-actions/action.ts
// TODO: Complete migration to service layer
// Issue: #123

import { createEntity } from "@/shared/lib/repository"; // Temporary

// ... old implementation (temporarily restored)
```

### Testing After Rollback

```bash
# Ensure application works
pnpm typecheck
pnpm run test
pnpm dev

# Manual testing
```

## Migration Timeline and Prioritization

### Priority 1: High Traffic Features (Weeks 1-2)

Migrate features with most user interaction first:

1. **manage-library-item** (create, edit, delete)
   - Most frequently used CRUD operations
   - Clear business logic boundaries
   - Good candidate for reference implementation

2. **add-review** (create review)
   - User-facing feature
   - Needs duplicate review validation
   - Rating validation required

3. **view-collection** (list, filter, search)
   - Already has CollectionService
   - Verify compliance
   - Update any remaining direct calls

**Verification:**

```bash
grep -r "from '@/shared/lib/repository'" features/manage-library-item/ features/add-review/ features/view-collection/
```

### Priority 2: Dashboard and Aggregations (Weeks 3-4)

Dashboard features with complex queries:

1. **dashboard** (various widgets)
   - Multiple services needed
   - Service composition
   - Performance optimization

2. **view-game-details** (game info, reviews)
   - Multiple data sources
   - Review aggregation
   - Library item status

**Complexity:** Medium-High

### Priority 3: User Management (Week 5)

User profile and settings:

1. **manage-user-info** (profile updates)
2. **manage-integrations** (Steam integration)

**Complexity:** Medium

### Priority 4: Specialized Features (Week 6)

Less frequently used features:

1. **view-imported-games** (Steam imports)
2. **view-wishlist** (wishlist management)
3. **view-backlogs** (backlog views)

**Complexity:** Low-Medium

### Priority 5: Verification and Documentation (Week 7)

Final verification and cleanup:

```bash
# Full architecture verification
grep -r "from '@/shared/lib/repository'" features/

# Expected: ZERO results

# Documentation updates
- Update all CLAUDE.md files
- Update architecture.md
- Update this migration guide with lessons learned
```

### Migration Progress Tracking

Track progress with a simple table:

| Feature             | Status         | Service Created   | Tests Added | Verified | Notes                    |
| ------------------- | -------------- | ----------------- | ----------- | -------- | ------------------------ |
| manage-library-item | ✅ Done        | LibraryService    | ✅ 95%      | ✅       | Reference implementation |
| add-review          | 🔄 In Progress | ReviewService     | ⏳          | ⏳       | Needs duplicate check    |
| view-collection     | ✅ Done        | CollectionService | ✅ 92%      | ✅       | Already migrated         |
| dashboard           | ⏳ Planned     | Multiple          | ⏳          | ⏳       | Complex composition      |
| ...                 | ...            | ...               | ...         | ...      | ...                      |

Update this table as you complete each feature.

## Summary

Migration to the service layer is a systematic process that:

1. **Improves Architecture** - Clear separation of concerns
2. **Increases Testability** - Business logic isolated and testable
3. **Enhances Maintainability** - Changes localized to services
4. **Ensures Consistency** - Standard patterns across features
5. **Enables Reusability** - Services work across consumers

**Key Success Factors:**

- Follow the step-by-step process
- Write comprehensive tests first
- Verify each migration completely
- Document any deviations
- Track progress systematically

**Remember:** The goal is ZERO repository imports in `features/`. Every server action should be a thin wrapper around a service call.

For questions or issues during migration, refer to:

- [Service Layer Guide](./service-layer-guide.md) - Implementation patterns
- [Architecture Documentation](./architecture.md) - System overview
- Existing implementations (view-collection, CollectionService)
