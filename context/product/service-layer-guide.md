# Service Layer Implementation Guide

This guide provides comprehensive instructions for implementing and working with the service layer in the PlayLater application.

## Table of Contents

- [Strict Architecture Rules](#strict-architecture-rules)
- [Service Layer Overview](#service-layer-overview)
- [Standard Service Structure](#standard-service-structure)
- [Service Implementation Patterns](#service-implementation-patterns)
- [Server Action Integration (Thin Wrapper Pattern)](#server-action-integration-thin-wrapper-pattern)
- [WRONG vs RIGHT Patterns](#wrong-vs-right-patterns)
- [Error Handling](#error-handling)
- [Testing Services](#testing-services)
- [Service Composition](#service-composition)
- [Common Mistakes and Troubleshooting](#common-mistakes-and-troubleshooting)

## Strict Architecture Rules

### The Golden Rule

**ALL data access MUST go through the service layer. ZERO exceptions.**

```
UI Components → Server Actions → Service Layer → Repository Layer → Database
```

### Critical Requirements

1. **Server actions are thin wrappers** - They ONLY validate input, call services, and handle responses
2. **Services are the ONLY layer that calls repositories** - No direct repository access from server actions
3. **All business logic lives in services** - Server actions contain NO business logic
4. **Import restrictions are strictly enforced** - Feature code MUST NOT import from `@/shared/lib/repository`

### Verification Command

Before committing code, always run this verification:

```bash
grep -r "from '@/shared/lib/repository'" features/
```

**Expected result:** ZERO matches. Any matches indicate architecture violations that must be fixed.

## Service Layer Overview

### Purpose

The service layer provides a clear separation between:

- **Consumer Layer** (server actions, API routes) - HTTP concerns and input validation
- **Business Logic Layer** (services) - Domain rules, data transformation, orchestration
- **Data Access Layer** (repositories) - Database queries and operations

### Benefits

1. **Testability** - Business logic can be unit tested with mocked repositories
2. **Reusability** - Same service methods work across server actions, API routes, background jobs
3. **Consistency** - All features follow the same patterns and error handling
4. **Maintainability** - Business logic changes happen in one place
5. **Type Safety** - Clear interfaces and contracts between layers

## Zod-First Validation Strategy

**CRITICAL:** The PlayLater architecture enforces strict separation between input validation and business validation.

### Validation Responsibilities

**Zod Schemas (in Server Actions)**

Zod validates ALL input shape and type concerns:

- ✅ Required fields (`z.string()`, `z.number()`, etc.)
- ✅ Type coercion (`z.coerce.number()`, `z.coerce.date()`)
- ✅ Format validation (`z.email()`, `z.url()`, `z.regex()`)
- ✅ Length constraints (`z.string().min(3)`, `z.array().max(10)`)
- ✅ Enum validation (`z.nativeEnum(Status)`, `z.enum(['a', 'b'])`)
- ✅ String sanitization (`.trim()`, `.toLowerCase()`)
- ✅ Complex shapes (`z.object()`, `z.array()`, `z.union()`)

**Services (Business Logic Layer)**

Services validate ONLY business rules:

- ✅ Resource existence ("Does this game exist?")
- ✅ Duplicate prevention ("Is this already in user's library?")
- ✅ Authorization ("Does this resource belong to user?")
- ✅ State transitions ("Can user move from PLAYING to COMPLETED?")
- ✅ Cross-entity validation ("Does user have permission for this action?")
- ❌ **NEVER** validate input shape (Zod already did this)

### Why This Separation Matters

1. **Type Safety**: Zod's `z.infer<>` provides compile-time types
2. **Single Responsibility**: Each layer has one clear purpose
3. **Performance**: Validation happens once at the boundary
4. **Testability**: Services can assume valid inputs
5. **Reusability**: Services work with any consumer (actions, API routes, jobs)

### WRONG vs RIGHT: Validation Examples

#### ❌ WRONG: Service Validates Input Shape

```typescript
class LibraryService {
  async createItem(input: any) {
    // ❌ DON'T DO THIS - Zod should validate input shape
    if (!input.userId || typeof input.userId !== "string") {
      return this.error("Invalid userId");
    }
    if (!input.gameId || typeof input.gameId !== "string") {
      return this.error("Invalid gameId");
    }
    if (input.platform && typeof input.platform !== "string") {
      return this.error("Invalid platform");
    }
    // ...
  }
}
```

**Problems:**

- ❌ Duplicates validation logic (Zod should do this)
- ❌ Runtime-only validation (no compile-time safety)
- ❌ Makes service tests verbose and brittle
- ❌ Unclear separation of concerns

#### ✅ RIGHT: Zod Validates Shape, Service Validates Business Rules

```typescript
// features/library/lib/validation.ts
import { LibraryItemStatus } from "@prisma/client";
import { z } from "zod";

export const CreateLibraryItemSchema = z.object({
  gameId: z.string().min(1, "Game ID is required"),
  platform: z.string().optional(),
  status: z.nativeEnum(LibraryItemStatus).optional(),
});

export type CreateLibraryItemInput = z.infer<typeof CreateLibraryItemSchema>;

// shared/services/library/library-service.ts
class LibraryService {
  async createItem(input: CreateLibraryItemInput & { userId: string }) {
    // Input is pre-validated - skip to business logic

    // ✅ Business validation: Check duplicates
    const exists = await this.repo.findByUserAndGame(
      input.userId,
      input.gameId
    );
    if (exists) {
      return this.error("Game already in library", ServiceErrorCode.CONFLICT);
    }

    // ✅ Business logic: Create item
    const item = await this.repo.create({
      ...input,
      status: input.status ?? LibraryItemStatus.CURIOUS_ABOUT,
    });

    return this.success({ item });
  }
}

// features/library/server-actions/create-item-action.ts
export const createItemAction = authorizedActionClient
  .inputSchema(CreateLibraryItemSchema) // Zod validates here
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // Input is pre-validated and typed
    return await libraryService.createItem({ userId, ...parsedInput });
  });
```

**Benefits:**

- ✅ Clear separation: Zod handles shape, service handles business rules
- ✅ Type-safe inputs from `z.infer<>`
- ✅ Service tests focus on business logic only
- ✅ Consistent validation across all consumers

## Standard Service Structure

### Directory Organization

```
shared/services/
├── library/                    # Library item operations
│   ├── library-service.ts     # Service implementation
│   ├── library-service.test.ts # Unit tests
│   ├── types.ts               # Service-specific types
│   └── index.ts               # Public exports
├── game/                       # Game CRUD operations
│   ├── game-service.ts
│   ├── game-service.test.ts
│   ├── types.ts
│   └── index.ts
├── review/                     # Review management
├── user/                       # User operations
├── journal/                    # Journal entries
├── types.ts                    # Shared service types
└── index.ts                    # Barrel exports
```

### File Structure

Each service module should include:

1. **Service class file** (`{service-name}-service.ts`) - Core implementation
2. **Types file** (`types.ts`) - Service-specific interfaces and types
3. **Test file** (`{service-name}-service.test.ts`) - Comprehensive unit tests
4. **Index file** (`index.ts`) - Public API exports

## Service Implementation Patterns

### Base Service Class

All services extend the `BaseService` class which provides standardized response handling:

```typescript
// shared/services/types.ts
export interface ServiceError {
  message: string;
  code: string;
  cause?: unknown;
}

export interface ServiceResponse<TData = unknown> {
  success: boolean;
  data?: TData;
  error?: string;
  errorCode?: string;
}

export class BaseService {
  protected createSuccessResponse<TData>(data: TData): ServiceResponse<TData> {
    return {
      success: true,
      data,
    };
  }

  protected createErrorResponse(error: ServiceError): ServiceResponse {
    return {
      success: false,
      error: error.message,
      errorCode: error.code,
    };
  }

  protected handleError(error: unknown): ServiceError {
    if (error instanceof Error) {
      return {
        message: error.message,
        code: "UNKNOWN_ERROR",
        cause: error,
      };
    }
    return {
      message: "An unknown error occurred",
      code: "UNKNOWN_ERROR",
      cause: error,
    };
  }
}
```

### Standard Service Implementation

```typescript
// shared/services/library/library-service.ts
import {
  createLibraryItem,
  deleteLibraryItem,
  getManyLibraryItems,
  updateLibraryItem,
} from "@/shared/lib/repository";

// ✅ OK to import in services

import { BaseService, type ServiceResponse } from "../types";
import type {
  CreateLibraryItemInput,
  LibraryItemResult,
  LibraryItemsResult,
  UpdateLibraryItemInput,
} from "./types";

export class LibraryService extends BaseService {
  /**
   * Creates a new library item
   */
  async createLibraryItem(
    input: CreateLibraryItemInput
  ): Promise<ServiceResponse<LibraryItemResult>> {
    try {
      // 1. Validate business rules
      if (!input.userId || !input.gameId) {
        return this.createErrorResponse({
          message: "User ID and Game ID are required",
          code: "INVALID_INPUT",
        });
      }

      // 2. Apply business logic and transformations
      const libraryItemData = {
        status: input.status,
        platform: input.platform,
        startedAt: input.startedAt ? new Date(input.startedAt) : undefined,
        completedAt: input.completedAt
          ? new Date(input.completedAt)
          : undefined,
        acquisitionType: input.acquisitionType ?? "DIGITAL",
      };

      // 3. Call repository (ONLY services do this)
      const item = await createLibraryItem({
        libraryItem: libraryItemData,
        userId: input.userId,
        gameId: input.gameId,
      });

      // 4. Transform response if needed
      if (!item) {
        return this.createErrorResponse({
          message: "Failed to create library item",
          code: "CREATE_FAILED",
        });
      }

      // 5. Return standardized response
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

  /**
   * Updates an existing library item
   */
  async updateLibraryItem(
    input: UpdateLibraryItemInput
  ): Promise<ServiceResponse<LibraryItemResult>> {
    try {
      // Validate
      if (!input.id || !input.userId) {
        return this.createErrorResponse({
          message: "Library item ID and User ID are required",
          code: "INVALID_INPUT",
        });
      }

      // Transform dates
      const updateData = {
        ...input,
        startedAt: input.startedAt ? new Date(input.startedAt) : undefined,
        completedAt: input.completedAt
          ? new Date(input.completedAt)
          : undefined,
      };

      // Call repository
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

  /**
   * Deletes a library item
   */
  async deleteLibraryItem(
    itemId: string,
    userId: string
  ): Promise<ServiceResponse<void>> {
    try {
      if (!itemId || !userId) {
        return this.createErrorResponse({
          message: "Library item ID and User ID are required",
          code: "INVALID_INPUT",
        });
      }

      await deleteLibraryItem({ id: itemId, userId });

      return this.createSuccessResponse(undefined);
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to delete library item",
        code: "DELETE_FAILED",
        cause: serviceError.cause,
      });
    }
  }

  /**
   * Gets library items for a user's game
   */
  async getLibraryItems(
    userId: string,
    gameId: string
  ): Promise<ServiceResponse<LibraryItemsResult>> {
    try {
      if (!userId || !gameId) {
        return this.createErrorResponse({
          message: "User ID and Game ID are required",
          code: "INVALID_INPUT",
        });
      }

      const items = await getManyLibraryItems({
        where: {
          userId,
          gameId,
        },
      });

      return this.createSuccessResponse({ items });
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to fetch library items",
        code: "FETCH_FAILED",
        cause: serviceError.cause,
      });
    }
  }
}
```

### Service Type Definitions

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

export interface UpdateLibraryItemInput {
  id: string;
  userId: string;
  status?: LibraryItemStatus;
  platform?: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface LibraryItemResult {
  item: LibraryItem;
}

export interface LibraryItemsResult {
  items: LibraryItem[];
}

export interface LibraryService {
  createLibraryItem(
    input: CreateLibraryItemInput
  ): Promise<ServiceResponse<LibraryItemResult>>;
  updateLibraryItem(
    input: UpdateLibraryItemInput
  ): Promise<ServiceResponse<LibraryItemResult>>;
  deleteLibraryItem(
    itemId: string,
    userId: string
  ): Promise<ServiceResponse<void>>;
  getLibraryItems(
    userId: string,
    gameId: string
  ): Promise<ServiceResponse<LibraryItemsResult>>;
}
```

## Server Action Integration (Thin Wrapper Pattern)

### The Thin Wrapper Concept

Server actions should be **minimal wrappers** around service calls. They handle:

1. Input validation (Zod schemas)
2. Service method invocation
3. Error handling
4. Response formatting

They should NOT contain business logic, data transformation, or repository calls.

### Standard Server Action Pattern

```typescript
// ✅ CORRECT: features/manage-library-item/create-library-item/server-actions/action.ts
"use server";

import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { LibraryService } from "@/shared/services"; // ✅ Import service

import { CreateLibraryItemSchema } from "../lib/validation";

const libraryService = new LibraryService();

export const createLibraryItem = authorizedActionClient
  .metadata({
    actionName: "createLibraryItem",
    requiresAuth: true,
  })
  .inputSchema(CreateLibraryItemSchema) // ✅ Step 1: Input validation
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // ✅ Step 2: Call service method (thin wrapper)
    const result = await libraryService.createLibraryItem({
      userId,
      gameId: parsedInput.gameId,
      platform: parsedInput.platform,
      status: parsedInput.status,
      startedAt: parsedInput.startedAt,
      completedAt: parsedInput.completedAt,
    });

    // ✅ Step 3: Handle service errors
    if (!result.success) {
      throw new Error(result.error ?? "Failed to create library item");
    }

    // ✅ Step 4: Return service data
    return result.data;
  });
```

### Server Action Responsibilities

**DO:**

- ✅ Validate input using Zod schemas
- ✅ Call service methods
- ✅ Handle service errors
- ✅ Return formatted responses
- ✅ Trigger cache revalidation

**DO NOT:**

- ❌ Import from `@/shared/lib/repository`
- ❌ Contain business logic
- ❌ Transform data (service responsibility)
- ❌ Validate business rules (service responsibility)
- ❌ Access database directly

## WRONG vs RIGHT Patterns

### Pattern 1: Creating a Library Item

#### ❌ WRONG - Server Action with Direct Repository Call

```typescript
// ❌ BAD: features/manage-library-item/create-library-item/server-actions/action.ts
"use server";

import { createLibraryItem as createLibraryItemCommand } from "@/shared/lib/repository"; // ❌ WRONG
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const createLibraryItem = authorizedActionClient
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // ❌ Business logic in server action
    const libraryItemData = {
      status: parsedInput.status as LibraryItemStatus,
      platform: parsedInput.platform,
      startedAt: parsedInput.startedAt
        ? new Date(parsedInput.startedAt)
        : undefined,
      completedAt: parsedInput.completedAt
        ? new Date(parsedInput.completedAt)
        : undefined,
      acquisitionType: "DIGITAL",
    };

    // ❌ Direct repository call from server action
    const libraryItem = await createLibraryItemCommand({
      libraryItem: libraryItemData,
      userId,
      gameId: parsedInput.gameId,
    });

    if (!libraryItem) {
      return { message: "Failed to create library item" };
    }

    return libraryItem;
  });
```

**Problems:**

1. ❌ Imports from `@/shared/lib/repository` (architecture violation)
2. ❌ Contains business logic (date transformation, default values)
3. ❌ Calls repository directly (bypasses service layer)
4. ❌ Not testable in isolation
5. ❌ Not reusable across different consumers

#### ✅ RIGHT - Service + Thin Wrapper Server Action

```typescript
// ✅ GOOD: shared/services/library/library-service.ts
import { createLibraryItem } from "@/shared/lib/repository"; // ✅ OK in services

import { LibraryService } from "@/shared/services"; // ✅ Import service

export class LibraryService extends BaseService {
  async createLibraryItem(
    input: CreateLibraryItemInput
  ): Promise<ServiceResponse<LibraryItemResult>> {
    try {
      // ✅ Business validation in service
      if (!input.userId || !input.gameId) {
        return this.createErrorResponse({
          message: "User ID and Game ID are required",
          code: "INVALID_INPUT",
        });
      }

      // ✅ Data transformation in service
      const libraryItemData = {
        status: input.status,
        platform: input.platform,
        startedAt: input.startedAt ? new Date(input.startedAt) : undefined,
        completedAt: input.completedAt
          ? new Date(input.completedAt)
          : undefined,
        acquisitionType: input.acquisitionType ?? "DIGITAL",
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

// ✅ GOOD: features/manage-library-item/create-library-item/server-actions/action.ts
("use server");

const libraryService = new LibraryService();

export const createLibraryItem = authorizedActionClient
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // ✅ Simple service call (thin wrapper)
    const result = await libraryService.createLibraryItem({
      userId,
      ...parsedInput,
    });

    if (!result.success) {
      throw new Error(result.error ?? "Failed to create library item");
    }

    return result.data;
  });
```

**Benefits:**

1. ✅ No repository imports in server action
2. ✅ Business logic isolated in service
3. ✅ Server action is a thin wrapper
4. ✅ Testable in isolation with mocked repositories
5. ✅ Reusable across server actions, API routes, background jobs

### Pattern 2: Creating a Review

#### ❌ WRONG - Direct Repository Call

```typescript
// ❌ BAD: features/add-review/server-actions/create-review.ts
"use server";

import { revalidatePath } from "next/cache";

import { createReview as createReviewCommand } from "@/shared/lib/repository"; // ❌ WRONG
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const createReview = authorizedActionClient
  .inputSchema(CreateReviewSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // ❌ Direct repository call
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

#### ✅ RIGHT - Service Layer Pattern

```typescript
// ✅ GOOD: shared/services/review/review-service.ts
import { revalidatePath } from "next/cache";

import { createReview, getReviewsByGame } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { ReviewService } from "@/shared/services";

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

      if (input.rating < 1 || input.rating > 10) {
        return this.createErrorResponse({
          message: "Rating must be between 1 and 10",
          code: "INVALID_RATING",
        });
      }

      // ✅ Check for duplicate review (business logic)
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

// ✅ GOOD: features/add-review/server-actions/create-review.ts
("use server");

const reviewService = new ReviewService();

export const createReview = authorizedActionClient
  .inputSchema(CreateReviewSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // ✅ Service call
    const result = await reviewService.createReview({
      userId,
      ...parsedInput,
    });

    if (!result.success) {
      throw new Error(result.error ?? "Failed to create review");
    }

    // ✅ Cache revalidation (side effect, OK in server action)
    revalidatePath(`/game/${parsedInput.gameId}`);

    return result.data;
  });
```

### Pattern 3: Fetching Library Items

#### ❌ WRONG - Repository Call in Server Action

```typescript
// ❌ BAD
"use server";

import { getManyLibraryItems } from "@/shared/lib/repository"; // ❌ WRONG

export const getLibraryItems = authorizedActionClient.action(
  async ({ parsedInput, ctx: { userId } }) => {
    // ❌ Direct repository call
    const items = await getManyLibraryItems({
      where: {
        userId,
        gameId: parsedInput.gameId,
      },
    });

    return items;
  }
);
```

#### ✅ RIGHT - Service Method

```typescript
import { LibraryService } from "@/shared/services";

// ✅ GOOD: shared/services/library/library-service.ts
export class LibraryService extends BaseService {
  async getLibraryItems(
    userId: string,
    gameId: string
  ): Promise<ServiceResponse<LibraryItemsResult>> {
    try {
      if (!userId || !gameId) {
        return this.createErrorResponse({
          message: "User ID and Game ID are required",
          code: "INVALID_INPUT",
        });
      }

      const items = await getManyLibraryItems({
        where: { userId, gameId },
      });

      return this.createSuccessResponse({ items });
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to fetch library items",
        code: "FETCH_FAILED",
        cause: serviceError.cause,
      });
    }
  }
}

// ✅ GOOD: Server action
("use server");

const libraryService = new LibraryService();

export const getLibraryItems = authorizedActionClient.action(
  async ({ parsedInput, ctx: { userId } }) => {
    const result = await libraryService.getLibraryItems(
      userId,
      parsedInput.gameId
    );

    if (!result.success) {
      throw new Error(result.error ?? "Failed to fetch library items");
    }

    return result.data;
  }
);
```

## Error Handling

### Service Layer Error Handling

Services should use the standardized error response format:

```typescript
export class GameService extends BaseService {
  async getGame(gameId: string): Promise<ServiceResponse<GameResult>> {
    try {
      if (!gameId) {
        return this.createErrorResponse({
          message: "Game ID is required",
          code: "INVALID_INPUT",
        });
      }

      const game = await getGameById(gameId);

      if (!game) {
        return this.createErrorResponse({
          message: "Game not found",
          code: "NOT_FOUND",
        });
      }

      return this.createSuccessResponse({ game });
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to fetch game",
        code: "FETCH_FAILED",
        cause: serviceError.cause,
      });
    }
  }
}
```

### Server Action Error Handling

Server actions should handle service errors and throw appropriate exceptions:

```typescript
export const getGame = authorizedActionClient.action(
  async ({ parsedInput }) => {
    const result = await gameService.getGame(parsedInput.gameId);

    if (!result.success) {
      // Throw error with service error message
      throw new Error(result.error ?? "Failed to fetch game");
    }

    return result.data;
  }
);
```

### Error Code Standards

Use consistent error codes across services:

- `INVALID_INPUT` - Required fields missing or invalid
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - User lacks permission
- `DUPLICATE` - Resource already exists
- `CREATE_FAILED` - Failed to create resource
- `UPDATE_FAILED` - Failed to update resource
- `DELETE_FAILED` - Failed to delete resource
- `FETCH_FAILED` - Failed to fetch resource
- `UNKNOWN_ERROR` - Unexpected error

## Testing Services

### Unit Test Structure

Services should have comprehensive unit test coverage with mocked repositories:

```typescript
// shared/services/library/library-service.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as repository from "@/shared/lib/repository";

import { LibraryService } from "./library-service";

// Mock repository functions
vi.mock("@/shared/lib/repository", () => ({
  createLibraryItem: vi.fn(),
  updateLibraryItem: vi.fn(),
  deleteLibraryItem: vi.fn(),
  getManyLibraryItems: vi.fn(),
}));

describe("LibraryService", () => {
  let service: LibraryService;

  beforeEach(() => {
    service = new LibraryService();
    vi.clearAllMocks();
  });

  describe("createLibraryItem", () => {
    it("should create library item successfully", async () => {
      const mockItem = {
        id: "1",
        userId: "user-1",
        gameId: "game-1",
        platform: "PC",
        status: "CURRENTLY_EXPLORING",
      };

      vi.mocked(repository.createLibraryItem).mockResolvedValue(mockItem);

      const result = await service.createLibraryItem({
        userId: "user-1",
        gameId: "game-1",
        platform: "PC",
        status: "CURRENTLY_EXPLORING",
      });

      expect(result.success).toBe(true);
      expect(result.data?.item).toEqual(mockItem);
      expect(repository.createLibraryItem).toHaveBeenCalledWith({
        libraryItem: expect.objectContaining({
          platform: "PC",
          status: "CURRENTLY_EXPLORING",
        }),
        userId: "user-1",
        gameId: "game-1",
      });
    });

    it("should return error when userId is missing", async () => {
      const result = await service.createLibraryItem({
        userId: "",
        gameId: "game-1",
        platform: "PC",
        status: "CURRENTLY_EXPLORING",
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("INVALID_INPUT");
      expect(repository.createLibraryItem).not.toHaveBeenCalled();
    });

    it("should handle repository errors", async () => {
      vi.mocked(repository.createLibraryItem).mockRejectedValue(
        new Error("Database error")
      );

      const result = await service.createLibraryItem({
        userId: "user-1",
        gameId: "game-1",
        platform: "PC",
        status: "CURRENTLY_EXPLORING",
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("CREATE_FAILED");
    });
  });

  describe("updateLibraryItem", () => {
    it("should update library item successfully", async () => {
      const mockItem = {
        id: "1",
        userId: "user-1",
        gameId: "game-1",
        platform: "PlayStation 5",
        status: "EXPERIENCED",
      };

      vi.mocked(repository.updateLibraryItem).mockResolvedValue(mockItem);

      const result = await service.updateLibraryItem({
        id: "1",
        userId: "user-1",
        status: "EXPERIENCED",
      });

      expect(result.success).toBe(true);
      expect(result.data?.item).toEqual(mockItem);
    });

    it("should return error when item not found", async () => {
      vi.mocked(repository.updateLibraryItem).mockResolvedValue(null);

      const result = await service.updateLibraryItem({
        id: "1",
        userId: "user-1",
        status: "EXPERIENCED",
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("NOT_FOUND");
    });
  });

  describe("deleteLibraryItem", () => {
    it("should delete library item successfully", async () => {
      vi.mocked(repository.deleteLibraryItem).mockResolvedValue(undefined);

      const result = await service.deleteLibraryItem("1", "user-1");

      expect(result.success).toBe(true);
      expect(repository.deleteLibraryItem).toHaveBeenCalledWith({
        id: "1",
        userId: "user-1",
      });
    });

    it("should return error when parameters are invalid", async () => {
      const result = await service.deleteLibraryItem("", "user-1");

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("INVALID_INPUT");
      expect(repository.deleteLibraryItem).not.toHaveBeenCalled();
    });
  });

  describe("getLibraryItems", () => {
    it("should fetch library items successfully", async () => {
      const mockItems = [
        { id: "1", userId: "user-1", gameId: "game-1", platform: "PC" },
        {
          id: "2",
          userId: "user-1",
          gameId: "game-1",
          platform: "PlayStation 5",
        },
      ];

      vi.mocked(repository.getManyLibraryItems).mockResolvedValue(mockItems);

      const result = await service.getLibraryItems("user-1", "game-1");

      expect(result.success).toBe(true);
      expect(result.data?.items).toEqual(mockItems);
    });
  });
});
```

### Test Coverage Requirements

- **Target Coverage:** >90% for all service methods
- **Required Tests:**
  - Success paths for all methods
  - Input validation error scenarios
  - Business rule validation failures
  - Repository error handling
  - Edge cases and boundary conditions

### Integration Testing

While unit tests mock repositories, integration tests should verify the full stack:

```typescript
// features/manage-library-item/create-library-item/server-actions/action.integration.test.ts
describe("createLibraryItem server action", () => {
  it("should create library item through service layer", async () => {
    // This test uses real database and verifies full flow:
    // Server Action → Service → Repository → Database
    const result = await createLibraryItem({
      gameId: testGame.id,
      platform: "PC",
      status: "CURRENTLY_EXPLORING",
    });

    expect(result).toBeDefined();
    expect(result.item.platform).toBe("PC");
  });
});
```

## Service Composition

### Composing Multiple Services

Services can call other services to compose complex operations:

```typescript
export class UserProfileService extends BaseService {
  constructor(
    private libraryService = new LibraryService(),
    private reviewService = new ReviewService()
  ) {
    super();
  }

  async getUserProfile(
    userId: string
  ): Promise<ServiceResponse<UserProfileResult>> {
    try {
      // Call multiple services
      const libraryResult = await this.libraryService.getLibraryItems(userId);
      const reviewsResult = await this.reviewService.getUserReviews(userId);

      if (!libraryResult.success || !reviewsResult.success) {
        return this.createErrorResponse({
          message: "Failed to fetch user profile",
          code: "FETCH_FAILED",
        });
      }

      // Compose results
      return this.createSuccessResponse({
        userId,
        libraryItemCount: libraryResult.data.items.length,
        reviewCount: reviewsResult.data.reviews.length,
      });
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to fetch user profile",
        code: "FETCH_FAILED",
        cause: serviceError.cause,
      });
    }
  }
}
```

### Transaction Support

For operations requiring transactions, handle them in the service layer:

```typescript
export class LibraryService extends BaseService {
  async addGameToLibraryWithReview(
    input: AddGameWithReviewInput
  ): Promise<ServiceResponse<GameAdditionResult>> {
    try {
      // Use Prisma transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create library item
        const libraryItem = await tx.libraryItem.create({
          data: {
            userId: input.userId,
            gameId: input.gameId,
            platform: input.platform,
            status: "EXPERIENCED",
          },
        });

        // Create review
        const review = await tx.review.create({
          data: {
            userId: input.userId,
            gameId: input.gameId,
            rating: input.rating,
            content: input.reviewContent,
          },
        });

        return { libraryItem, review };
      });

      return this.createSuccessResponse(result);
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to add game with review",
        code: "TRANSACTION_FAILED",
        cause: serviceError.cause,
      });
    }
  }
}
```

## Common Mistakes and Troubleshooting

### Mistake 1: Importing Repositories in Server Actions

**Problem:**

```typescript
// ❌ WRONG
import { createLibraryItem } from "@/shared/lib/repository"; // Architecture violation
```

**Solution:**

```typescript
// ✅ CORRECT
import { LibraryService } from "@/shared/services";

const libraryService = new LibraryService();
```

### Mistake 2: Business Logic in Server Actions

**Problem:**

```typescript
// ❌ WRONG - Business logic in server action
export const createLibraryItem = authorizedActionClient.action(
  async ({ parsedInput, ctx: { userId } }) => {
    // ❌ Date transformation is business logic
    const startDate = parsedInput.startedAt
      ? new Date(parsedInput.startedAt)
      : undefined;

    // ❌ Default value is business logic
    const acquisitionType = parsedInput.acquisitionType ?? "DIGITAL";

    const item = await createLibraryItem({
      /* ... */
    });
    return item;
  }
);
```

**Solution:**

```typescript
// ✅ CORRECT - Business logic in service
export class LibraryService extends BaseService {
  async createLibraryItem(input: CreateLibraryItemInput) {
    // ✅ Business logic belongs here
    const libraryItemData = {
      ...input,
      startedAt: input.startedAt ? new Date(input.startedAt) : undefined,
      acquisitionType: input.acquisitionType ?? "DIGITAL",
    };

    const item = await createLibraryItem({
      /* ... */
    });
    return this.createSuccessResponse({ item });
  }
}

// ✅ Server action is thin wrapper
export const createLibraryItem = authorizedActionClient.action(
  async ({ parsedInput, ctx: { userId } }) => {
    const result = await libraryService.createLibraryItem({
      userId,
      ...parsedInput,
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  }
);
```

### Mistake 3: Not Handling Service Errors

**Problem:**

```typescript
// ❌ WRONG - Ignoring service error handling
const result = await libraryService.createLibraryItem(input);
return result.data; // ❌ What if success is false?
```

**Solution:**

```typescript
// ✅ CORRECT - Proper error handling
const result = await libraryService.createLibraryItem(input);

if (!result.success) {
  throw new Error(result.error ?? "Failed to create library item");
}

return result.data;
```

### Mistake 4: Inconsistent Error Codes

**Problem:**

```typescript
// ❌ WRONG - Inconsistent error codes
return this.createErrorResponse({
  message: "User not found",
  code: "user_not_found", // ❌ Inconsistent format
});

return this.createErrorResponse({
  message: "Invalid input",
  code: "InvalidInput", // ❌ Different format
});
```

**Solution:**

```typescript
// ✅ CORRECT - Consistent UPPER_SNAKE_CASE error codes
return this.createErrorResponse({
  message: "User not found",
  code: "NOT_FOUND",
});

return this.createErrorResponse({
  message: "Invalid input",
  code: "INVALID_INPUT",
});
```

### Mistake 5: Not Testing Services

**Problem:**

- Service implementation without unit tests
- Only testing server actions (integration tests)
- Not mocking repository dependencies

**Solution:**

- Write comprehensive unit tests for all service methods
- Mock repository functions using vi.mock
- Test success paths, error paths, and edge cases
- Aim for >90% code coverage

### Troubleshooting: Finding Architecture Violations

Run this command to find files that violate the architecture:

```bash
# Find all repository imports in features directory
grep -r "from '@/shared/lib/repository'" features/
```

If this returns any results, those files need to be refactored:

1. Create or update the appropriate service
2. Move business logic from server action to service
3. Update server action to call service instead of repository
4. Update imports to use `@/shared/services`
5. Add unit tests for the service
6. Verify the refactoring with integration tests

### Verification Checklist

Before committing code, verify:

- [ ] No repository imports in `features/` directory
- [ ] Server actions are thin wrappers (< 15 lines)
- [ ] All business logic is in services
- [ ] Services have >90% test coverage
- [ ] Error handling follows standard patterns
- [ ] Service responses use `ServiceResponse` type
- [ ] Error codes are consistent and documented

## Summary

The service layer provides a critical separation between consumer code (server actions, API routes) and data access code (repositories). By strictly enforcing that:

1. **Only services call repositories**
2. **Server actions are thin wrappers**
3. **All business logic lives in services**

We create a maintainable, testable, and scalable architecture that supports the long-term health of the codebase.

**Remember:** If you're importing from `@/shared/lib/repository` anywhere except `shared/services/`, you're doing it wrong. Move that logic to a service instead.
