# 04 - Error Handling Standardization

## Problem Statement

The codebase has **three different error handling patterns** that coexist, creating inconsistent user experience, poor debugging capabilities, and unpredictable error behavior.

### Current Error Handling Anti-Patterns

#### ❌ Pattern 1: Silent Failures with console.log

```typescript
// features/manage-user-info/server-actions/get-user-info.ts
export async function getUserInfo(userId?: string) {
  try {
    // ... business logic
    return user;
  } catch (error) {
    console.error(error); // ❌ Silent failure
    // ❌ Returns undefined - UI doesn't know there was an error
  }
}

// features/view-collection/server-actions/get-game-with-backlog-items.ts
export async function getUserGamesWithGroupedBacklogPaginated() {
  try {
    // ... business logic
    return { collection: games, count: totalGames };
  } catch (error) {
    console.error("Error fetching user game collection:", error);
    return { collection: [], count: 0 }; // ❌ Silent failure - looks like empty result
  }
}
```

#### ❌ Pattern 2: Inconsistent Manual Error Returns

```typescript
// features/add-review/server-actions/action.ts
export async function createReviewAction(prevState, rating, input) {
  const userId = await getServerUserId();
  if (!userId) {
    return { message: "User not authenticated", type: "error" as const }; // ❌ Inconsistent format
  }

  try {
    // ... business logic
    return { message: "Review created successfully", type: "success" as const };
  } catch (error) {
    console.error("Error creating review:", error);
    return { message: "An unexpected error occurred", type: "error" as const }; // ❌ Generic message
  }
}
```

#### ❌ Pattern 3: Result Types Without Proper Integration

```typescript
// domain/shared/result.ts - Good pattern but inconsistently used
export const wrapWithResult = <T>(fn: () => Promise<T>, errorMsg: string): Promise<Result<T>> => {
  return fn()
    .then((value) => success(value))
    .catch((error) => {
      console.error(`${errorMsg}:`, error); // ❌ Still using console.error
      return failure(error);
    });
};
```

## Why Error Handling Standardization Matters

### User Experience Issues

- **Silent failures**: Users don't know when operations fail
- **Generic error messages**: Users can't understand what went wrong
- **Inconsistent error states**: Different parts of UI handle errors differently

### Developer Experience Issues

- **Hard to debug**: Console logs disappear in production
- **Inconsistent patterns**: Different error handling in each feature
- **Poor monitoring**: No structured error reporting

### Production Issues

- **Hidden bugs**: Silent failures mask real problems
- **Poor observability**: Can't track error rates or patterns
- **Difficult troubleshooting**: No context in error reports

## Standardized Error Handling Strategy

### 1. Enhanced Domain Error Types

```typescript
// domain/shared/errors.ts (Enhanced)
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  public readonly context?: Record<string, unknown>;
  public readonly userMessage?: string;

  constructor(
    message: string,
    context?: Record<string, unknown>,
    userMessage?: string,
    cause?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    this.userMessage = userMessage;
    this.cause = cause;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      context: this.context,
      statusCode: this.statusCode,
    };
  }
}

export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";
  readonly statusCode = 400;

  constructor(message: string, context?: Record<string, unknown>) {
    super(
      message,
      context,
      "Please check your input and try again."
    );
  }
}

export class AuthenticationError extends DomainError {
  readonly code = "AUTHENTICATION_ERROR";
  readonly statusCode = 401;

  constructor(message = "User not authenticated", context?: Record<string, unknown>) {
    super(
      message,
      context,
      "Please sign in to continue."
    );
  }
}

export class AuthorizationError extends DomainError {
  readonly code = "AUTHORIZATION_ERROR";
  readonly statusCode = 403;

  constructor(message = "Access denied", context?: Record<string, unknown>) {
    super(
      message,
      context,
      "You don't have permission to perform this action."
    );
  }
}

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND_ERROR";
  readonly statusCode = 404;

  constructor(
    entity: string,
    identifier: string | number,
    context?: Record<string, unknown>
  ) {
    super(
      `${entity} with id ${identifier} not found`,
      { entity, identifier, ...context },
      "The requested item could not be found."
    );
  }
}

export class DatabaseError extends DomainError {
  readonly code = "DATABASE_ERROR";
  readonly statusCode = 500;

  constructor(message: string, context?: Record<string, unknown>) {
    super(
      message,
      context,
      "A database error occurred. Please try again."
    );
  }
}

export class ExternalServiceError extends DomainError {
  readonly code = "EXTERNAL_SERVICE_ERROR";
  readonly statusCode = 502;

  constructor(
    service: string,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(
      `${service} service error: ${message}`,
      { service, ...context },
      "An external service is currently unavailable. Please try again later."
    );
  }
}
```

### 2. Enhanced Safe Action Client with Structured Error Handling

```typescript
// shared/lib/safe-action-client.ts (Enhanced)
import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { getServerUserId } from "@/auth";
import { DomainError } from "@/domain/shared/errors";
import { logger } from "@/shared/lib/logger"; // To be implemented

// Custom ActionError class for next-safe-action
export class ActionError extends Error {
  constructor(
    public readonly code: string,
    public readonly userMessage: string,
    public readonly statusCode: number = 500,
    public readonly context?: Record<string, unknown>
  ) {
    super(userMessage);
    this.name = "ActionError";
  }
}

const safeActionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
      requiresAuth: z.boolean().default(true),
    });
  },
  defaultValidationErrorsShape: "flattened",
  handleServerError: (error, { metadata }) => {
    const actionName = metadata?.actionName || "unknown";

    // Handle domain errors with proper user messages
    if (error instanceof DomainError) {
      logger.warn("Domain error in action", {
        actionName,
        code: error.code,
        message: error.message,
        context: error.context,
      });

      return error.userMessage || error.message;
    }

    // Handle custom action errors
    if (error instanceof ActionError) {
      logger.warn("Action error", {
        actionName,
        code: error.code,
        message: error.message,
        context: error.context,
      });

      return error.userMessage;
    }

    // Handle validation errors from Zod
    if (error.name === "ZodError") {
      logger.warn("Validation error in action", {
        actionName,
        issues: error.issues,
      });

      return "Invalid input provided. Please check your data and try again.";
    }

    // Handle unknown errors
    logger.error("Unexpected error in action", {
      actionName,
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Don't leak internal errors to client
    return "Something went wrong. Please try again.";
  },
});

export const authenticatedActionClient = safeActionClient.use(async ({ next, metadata }) => {
  if (metadata.requiresAuth) {
    const userId = await getServerUserId();
    if (!userId) {
      throw new ActionError(
        "AUTHENTICATION_REQUIRED",
        "Please sign in to continue.",
        401
      );
    }
    return next({ ctx: { userId } });
  }
  return next({ ctx: {} });
});

export const publicActionClient = safeActionClient.use(async ({ next }) => {
  return next({ ctx: {} });
});
```

### 3. Enhanced Result Type with Better Error Context

```typescript
// domain/shared/result.ts (Enhanced)
import { DomainError } from "./errors";
import { logger } from "@/shared/lib/logger";

export type Result<T, E = DomainError> = Success<T> | Failure<E>;

export class Success<T> {
  readonly value: T;
  readonly isSuccess = true;
  readonly isFailure = false;

  constructor(value: T) {
    this.value = value;
  }
}

export class Failure<E> {
  readonly error: E;
  readonly isSuccess = false;
  readonly isFailure = true;

  constructor(error: E) {
    this.error = error;
  }
}

export const success = <T>(value: T): Success<T> => new Success(value);
export const failure = <E>(error: E): Failure<E> => new Failure(error);

// Enhanced wrapper with better error handling
export const wrapWithResult = async <T>(
  operation: () => Promise<T>,
  context: {
    operation: string;
    metadata?: Record<string, unknown>;
  }
): Promise<Result<T, DomainError>> => {
  try {
    const result = await operation();
    return success(result);
  } catch (error) {
    // Convert known errors to domain errors
    if (error instanceof DomainError) {
      return failure(error);
    }

    // Handle Prisma errors
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };

      if (prismaError.code === "P2002") {
        logger.warn("Unique constraint violation", {
          operation: context.operation,
          metadata: context.metadata,
          error: prismaError.message,
        });

        return failure(new ValidationError(
          "A record with this information already exists",
          { prismaCode: prismaError.code, ...context.metadata }
        ));
      }

      if (prismaError.code === "P2025") {
        logger.warn("Record not found", {
          operation: context.operation,
          metadata: context.metadata,
        });

        return failure(new NotFoundError(
          "Record",
          "unknown",
          { prismaCode: prismaError.code, ...context.metadata }
        ));
      }
    }

    // Log unexpected errors
    logger.error("Unexpected error in operation", {
      operation: context.operation,
      metadata: context.metadata,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic database error for unknown errors
    return failure(new DatabaseError(
      `Failed to ${context.operation}`,
      context.metadata
    ));
  }
};
```

### 4. Standard Server Action Error Handling Pattern

```typescript
// Template for server actions with proper error handling
"use server";

import { authenticatedActionClient, ActionError } from "@/shared/lib/safe-action-client";
import { DomainService } from "@/domain/service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ActionInputSchema = z.object({
  field1: z.string().min(1, "Field1 is required"),
  field2: z.number().positive("Field2 must be positive"),
});

export const actionName = authenticatedActionClient
  .metadata({
    actionName: "actionName",
  })
  .inputSchema(ActionInputSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // Call domain service which returns Result<T, DomainError>
    const result = await DomainService.performOperation(parsedInput, userId);

    // Handle domain result
    if (result.isFailure) {
      // Convert domain error to action error with proper user message
      throw new ActionError(
        result.error.code,
        result.error.userMessage || result.error.message,
        result.error.statusCode,
        {
          operation: "actionName",
          userId,
          input: parsedInput,
        }
      );
    }

    // Revalidate cache if needed
    revalidatePath("/relevant-path");

    return {
      success: true,
      message: "Operation completed successfully",
      data: result.value,
    };
  });
```

### 5. Component Error Handling Patterns

#### ✅ Standard useAction Pattern with Error Handling

```typescript
// Component with proper error handling
"use client";

import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { actionName } from "../server-actions/action-name";

export function ComponentWithAction() {
  const { execute, result, isExecuting } = useAction(actionName, {
    onSuccess: ({ data }) => {
      toast.success(data?.message || "Operation completed successfully");
    },
    onError: ({ error }) => {
      // error.serverError contains the user-friendly message from ActionError
      toast.error(error.serverError || "Something went wrong");
    },
    onSettled: () => {
      // Always runs after success or error
      console.log("Action completed");
    },
  });

  const handleSubmit = (formData: FormData) => {
    execute({
      field1: formData.get("field1") as string,
      field2: Number(formData.get("field2")),
    });
  };

  return (
    <form action={handleSubmit}>
      {/* form fields */}

      {/* Show validation errors */}
      {result?.validationErrors && (
        <div className="error-message">
          {Object.entries(result.validationErrors.fieldErrors).map(([field, errors]) => (
            <div key={field}>
              {field}: {errors?.[0]}
            </div>
          ))}
        </div>
      )}

      <button disabled={isExecuting}>
        {isExecuting ? "Processing..." : "Submit"}
      </button>
    </form>
  );
}
```

### 6. Global Error Boundary Implementation

```typitten
// shared/components/error-boundary.tsx
"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "@/shared/lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("React error boundary caught error", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-fallback">
            <h2>Something went wrong</h2>
            <p>We've been notified of this issue and are working to fix it.</p>
            <button onClick={() => this.setState({ hasError: false })}>
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Usage in layout
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
```

## Migration Strategy

### Phase 1: Infrastructure Setup (Week 1)

1. **Implement enhanced error types** in `domain/shared/errors.ts`
2. **Enhance safe action client** with `ActionError` class
3. **Implement logger service** for structured error logging
4. **Add global error boundary** to catch React errors

### Phase 2: Domain Service Migration (Week 2)

1. **Migrate domain services** to use enhanced `wrapWithResult`
2. **Update error handling** in all domain services
3. **Add proper error context** to all domain operations
4. **Test domain error propagation**

### Phase 3: Server Action Migration (Week 3-4)

1. **Migrate high-priority server actions** to standard pattern
2. **Replace silent failures** with proper error throwing
3. **Update component integrations** to handle new error format
4. **Add error handling tests**

## Files Requiring Error Handling Migration

### High Priority (Silent Failures)

```typescript
// ❌ CRITICAL: Silent failures hide real problems
features/manage-user-info/server-actions/get-user-info.ts
- Issue: Returns undefined on error
- Fix: Throw ActionError with proper message
- Impact: Auth failures become visible

features/view-collection/server-actions/get-game-with-backlog-items.ts
- Issue: Returns empty array on error
- Fix: Throw ActionError, remove try/catch
- Impact: Collection loading errors become visible

features/view-collection/server-actions/get-uniques-platforms.ts
- Issue: Returns empty array on error
- Fix: Use standard error handling pattern
- Impact: Filter loading errors become visible
```

### Medium Priority (Inconsistent Patterns)

```typescript
// ❌ Inconsistent manual error handling
features/add-review/server-actions/action.ts
- Issue: Manual error state management
- Fix: Migrate to next-safe-action pattern
- Impact: Consistent error UX

features/view-backlogs/server-actions/get-backlogs.ts
- Issue: Console.error with silent failure
- Fix: Use wrapWithResult pattern
- Impact: Backlog loading errors handled properly
```

### Lower Priority (Already Using Result Types)

```typescript
// ✅ Good patterns but need enhancement
domain/backlog-item/service.ts
domain/review/service.ts
domain/game/service.ts
- Issue: Using old wrapWithResult
- Fix: Migrate to enhanced wrapWithResult
- Impact: Better error context and logging
```

## Before/After Examples

### ❌ Before: Silent Failure Pattern

```typescript
export async function getUserUniquePlatforms(): Promise<(string | null)[]> {
  const userId = await getServerUserId();

  try {
    const platforms = await prisma.backlogItem.findMany({
      where: { userId: userId },
      select: { platform: true },
      distinct: ["platform"],
    });
    return platforms.map((item) => item.platform).filter(Boolean);
  } catch (error) {
    console.error("Error fetching user game collection:", error);
    return []; // ❌ Silent failure - UI shows empty state
  }
}
```

### ✅ After: Standard Error Handling

```typescript
export const getUserUniquePlatforms = authenticatedActionClient
  .metadata({
    actionName: "getUserUniquePlatforms",
  })
  .inputSchema(z.object({}))
  .action(async ({ ctx: { userId } }) => {
    const result = await wrapWithResult(
      async () => {
        const platforms = await prisma.backlogItem.findMany({
          where: { userId },
          select: { platform: true },
          distinct: ["platform"],
        });
        return platforms.map((item) => item.platform).filter(Boolean);
      },
      {
        operation: "getUserUniquePlatforms",
        metadata: { userId },
      }
    );

    if (result.isFailure) {
      throw new ActionError(
        result.error.code,
        result.error.userMessage || result.error.message,
        result.error.statusCode,
        { operation: "getUserUniquePlatforms", userId }
      );
    }

    return {
      platforms: result.value,
    };
  });
```

## Testing Error Handling

### Unit Tests for Error Scenarios

```typescript
describe("Error Handling", () => {
  it("should throw ActionError for authentication failures", async () => {
    vi.mocked(getServerUserId).mockResolvedValue(undefined);

    const { serverError } = await actionName({});

    expect(serverError).toBe("Please sign in to continue.");
  });

  it("should handle domain errors properly", async () => {
    vi.mocked(DomainService.method).mockResolvedValue(
      failure(new ValidationError("Invalid input"))
    );

    const { serverError } = await actionName({ validInput: true });

    expect(serverError).toBe("Please check your input and try again.");
  });

  it("should handle database errors gracefully", async () => {
    vi.mocked(prisma.table.create).mockRejectedValue(
      new Error("Connection failed")
    );

    const { serverError } = await actionName({ validInput: true });

    expect(serverError).toBe("Something went wrong. Please try again.");
  });
});
```

## Benefits After Migration

### User Experience Improvements

- ✅ **Clear error messages**: Users understand what went wrong
- ✅ **Consistent error UX**: Same error handling patterns across app
- ✅ **No silent failures**: Users are always informed of issues
- ✅ **Actionable feedback**: Error messages guide users on next steps

### Developer Experience Improvements

- ✅ **Structured logging**: Easy to debug issues in development/production
- ✅ **Type-safe errors**: Compile-time error handling verification
- ✅ **Consistent patterns**: Same error handling approach everywhere
- ✅ **Better testing**: Predictable error scenarios

### Production Benefits

- ✅ **Error monitoring**: Track error rates and patterns
- ✅ **Better debugging**: Rich error context for troubleshooting
- ✅ **Performance insights**: Identify failing operations
- ✅ **User satisfaction**: Fewer confused users due to clear feedback

---

**Next Document**: [05-testing-strategy-implementation.md](./05-testing-strategy-implementation.md)
