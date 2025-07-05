# 02 - Server Actions Standardization

## Problem Statement

The codebase currently has **two different patterns** for implementing server actions, creating inconsistency, security vulnerabilities, and maintenance overhead.

### Current Problematic Patterns

#### ❌ Pattern 1: Manual Auth + FormData (Legacy)

```typescript
// features/add-review/server-actions/action.ts
export async function createReviewAction(
  prevState: { message: string; type: "error" | "success" },
  rating: number,
  input: FormData
) {
  // Manual auth check (repeated everywhere)
  const userId = await getServerUserId();
  if (!userId) {
    return { message: "User not authenticated", type: "error" as const };
  }

  // Manual FormData extraction (error-prone)
  const gameId = input.get("gameId") as string;

  // Manual error handling (inconsistent)
  try {
    // Business logic...
  } catch (error) {
    console.error("Error creating review:", error);
    return { message: "An unexpected error occurred", type: "error" as const };
  }
}
```

#### ✅ Pattern 2: next-safe-action (Modern)

```typescript
// features/add-review/server-actions/create-review.ts
export const createReview = authorizedActionClient
  .metadata({ actionName: "createReview" })
  .inputSchema(CreateReviewSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    await ReviewService.create(parsedInput, userId);
    revalidatePath(`/game/${parsedInput.gameId}`);
  });
```

## Why Standardization Matters

### Security Benefits

- **Automatic authentication**: No manual auth checks needed
- **Input validation**: Zod schemas prevent invalid data
- **Type safety**: Compile-time validation of inputs and outputs

### Developer Experience Benefits

- **Less boilerplate**: No manual FormData extraction
- **Consistent error handling**: Centralized error management
- **Better testing**: Easier to mock and test

### Maintenance Benefits

- **Single source of truth**: One way to write server actions
- **Easier refactoring**: Consistent patterns across codebase
- **Reduced bugs**: Less manual code means fewer opportunities for errors

## Standard Pattern Implementation

### 1. Base Client Configuration

#### Current Implementation (Good)

```typescript
// shared/lib/safe-action-client.ts
const safeActionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
    });
  },
  defaultValidationErrorsShape: "flattened",
  handleServerError: (error) => {
    console.error("Action error:", error.message);
    return "Oh no, something went wrong!";
  },
});

const authorizedActionClient = safeActionClient.use(async ({ next }) => {
  const userId = await getServerUserId();
  if (!userId) {
    throw new Error("Authentication required. Please sign in to continue.");
  }
  return next({ ctx: { userId } });
});
```

#### Improvements Needed

```typescript
// shared/lib/safe-action-client.ts (Enhanced)
import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { getServerUserId } from "@/auth";
import { logger } from "@/shared/lib/logger"; // To be implemented

const safeActionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
      requiresAuth: z.boolean().default(true),
    });
  },
  defaultValidationErrorsShape: "flattened",
  handleServerError: (error, { metadata }) => {
    // Structured logging instead of console.error
    logger.error("Server action error", {
      actionName: metadata?.actionName,
      error: error.message,
      stack: error.stack,
    });

    // Don't leak internal errors to client
    return "Something went wrong. Please try again.";
  },
});

const authenticatedActionClient = safeActionClient.use(async ({ next, metadata }) => {
  if (metadata.requiresAuth) {
    const userId = await getServerUserId();
    if (!userId) {
      throw new Error("Authentication required. Please sign in to continue.");
    }
    return next({ ctx: { userId } });
  }
  return next({ ctx: {} });
});

// For actions that don't require authentication
const publicActionClient = safeActionClient.use(async ({ next }) => {
  return next({ ctx: {} });
});

export { safeActionClient, authenticatedActionClient, publicActionClient };
```

### 2. Standard Server Action Structure

#### Template for New Server Actions

```typescript
// features/[feature]/server-actions/[action-name].ts
"use server";

import { authenticatedActionClient } from "@/shared/lib/safe-action-client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// 1. Define input schema
const ActionInputSchema = z.object({
  field1: z.string().min(1, "Field1 is required"),
  field2: z.number().positive("Field2 must be positive"),
  // ... other fields
});

// 2. Define output schema (optional but recommended)
const ActionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    // ... response data
  }).optional(),
});

// 3. Implement the server action
export const actionName = authenticatedActionClient
  .metadata({
    actionName: "actionName",
    requiresAuth: true, // explicit declaration
  })
  .inputSchema(ActionInputSchema)
  .outputSchema(ActionOutputSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // 4. Call domain service
    const result = await DomainService.method(parsedInput, userId);

    // 5. Handle domain result
    if (result.isFailure) {
      throw new Error(result.error.message);
    }

    // 6. Revalidate cache if needed
    revalidatePath("/relevant-path");

    // 7. Return structured response
    return {
      success: true,
      message: "Operation completed successfully",
      data: result.value,
    };
  });
```

### 3. Migration Strategy

#### Phase 1: Stop Adding Legacy Patterns

- [ ] All new server actions MUST use `authenticatedActionClient`
- [ ] Code review checklist includes server action pattern verification
- [ ] ESLint rule to prevent legacy patterns (if possible)

#### Phase 2: Migrate High-Risk Legacy Actions

Priority order for migration:

1. **Authentication-related actions** (highest security risk)
2. **Data modification actions** (create, update, delete)
3. **Data reading actions** (lower risk)

#### Phase 3: Bulk Migration

- [ ] Migrate remaining actions during feature work
- [ ] Remove legacy helper functions
- [ ] Update documentation

### 4. Files Requiring Migration

#### High Priority (Security Risk)

```typescript
// ❌ MIGRATE FIRST - Authentication operations
features/manage-user-info/server-actions/get-user-info.ts
features/manage-user-info/server-actions/get-user-by-username.ts

// ❌ MIGRATE FIRST - Data modification without proper validation
features/add-review/server-actions/action.ts (keep create-review.ts)
features/manage-backlog-item/edit-backlog-item/server-actions/get-backlog-items.ts
features/view-backlogs/server-actions/get-backlogs.ts
features/view-wishlist/server-actions/get-wishlisted-items.ts
```

#### Medium Priority

```typescript
// Data reading operations
features/dashboard/server-actions/get-user-games-with-grouped-backlog.ts
features/view-collection/server-actions/get-game-with-backlog-items.ts
features/view-game-details/server-actions/get-game.ts
```

### 5. Before/After Examples

#### ❌ Before: Legacy Pattern

```typescript
// features/manage-backlog-item/edit-backlog-item/server-actions/get-backlog-items.ts
export async function getBacklogItems({ gameId }: { gameId: string }) {
  const userId = await getServerUserId();
  if (!userId) return []; // Silent failure!

  try {
    return await prisma.backlogItem.findMany({
      where: { gameId, userId },
      orderBy: { createdAt: "asc" },
    });
  } catch (e) {
    console.error("Error fetching backlog items for game:", e);
    return []; // Silent failure!
  }
}
```

#### ✅ After: Standard Pattern

```typescript
// features/manage-backlog-item/edit-backlog-item/server-actions/get-backlog-items.ts
"use server";

import { authenticatedActionClient } from "@/shared/lib/safe-action-client";
import { BacklogItemService } from "@/domain/backlog-item/service";
import { z } from "zod";

const GetBacklogItemsSchema = z.object({
  gameId: z.string().min(1, "Game ID is required"),
});

export const getBacklogItems = authenticatedActionClient
  .metadata({
    actionName: "getBacklogItems",
  })
  .inputSchema(GetBacklogItemsSchema)
  .action(async ({ parsedInput: { gameId }, ctx: { userId } }) => {
    const result = await BacklogItemService.getByGameAndUser(gameId, userId);

    if (result.isFailure) {
      throw new Error(result.error.message);
    }

    return {
      items: result.value,
    };
  });
```

### 6. Component Integration Changes

#### ❌ Before: useFormState with Legacy Action

```typescript
// Component using legacy pattern
import { useFormState } from "react-dom";
import { createReviewAction } from "../server-actions/action";

export function ReviewForm() {
  const [state, formAction] = useFormState(createReviewAction, {
    message: "",
    type: "success" as const,
  });

  return (
    <form action={formAction}>
      {/* form fields */}
    </form>
  );
}
```

#### ✅ After: useAction with next-safe-action

```typescript
// Component using standard pattern
import { useAction } from "next-safe-action/hooks";
import { createReview } from "../server-actions/create-review";

export function ReviewForm() {
  const { execute, result, isExecuting } = useAction(createReview, {
    onSuccess: ({ data }) => {
      toast.success(data?.message || "Review created successfully");
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Failed to create review");
    },
  });

  const handleSubmit = (formData: FormData) => {
    execute({
      gameId: formData.get("gameId") as string,
      rating: Number(formData.get("rating")),
      content: formData.get("content") as string,
      completedOn: formData.get("completedOn") as string,
    });
  };

  return (
    <form action={handleSubmit}>
      {/* form fields */}
      <button disabled={isExecuting}>
        {isExecuting ? "Creating..." : "Create Review"}
      </button>
    </form>
  );
}
```

## Implementation Checklist

### For Each Legacy Server Action Migration:

- [ ] Create Zod input schema
- [ ] Create Zod output schema (optional)
- [ ] Migrate to `authenticatedActionClient`
- [ ] Update error handling to use domain Result types
- [ ] Add proper revalidation
- [ ] Update component integration
- [ ] Add unit tests
- [ ] Remove legacy function

### Testing Requirements:

- [ ] Unit test for input validation
- [ ] Unit test for authentication requirement
- [ ] Unit test for success case
- [ ] Unit test for error cases
- [ ] Integration test with React component

## Benefits After Migration

### Security Improvements

- ✅ All inputs validated with Zod schemas
- ✅ Authentication handled consistently
- ✅ No silent failures on unauthorized access

### Developer Experience

- ✅ TypeScript auto-completion for inputs/outputs
- ✅ Centralized error handling
- ✅ Consistent patterns across codebase

### Maintenance

- ✅ Single source of truth for server action patterns
- ✅ Easier to add cross-cutting concerns (logging, monitoring)
- ✅ Better testability

---

**Next Document**: [03-authentication-security-patterns.md](./03-authentication-security-patterns.md)
