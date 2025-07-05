# 06 - Type Safety and Validation Improvements

## Problem Statement

The codebase has **type safety gaps** that create runtime errors, data inconsistencies, and security vulnerabilities. While TypeScript is used throughout, there are areas where type assertions, `any` usage, and missing runtime validation create risks.

### Current Type Safety Issues

#### ❌ Issue 1: Type Assertions Without Runtime Validation

```typescript
// features/add-review/server-actions/action.ts
export async function createReviewAction(prevState, rating, input) {
  const gameId = input.get("gameId") as string; // ❌ Type assertion without validation
  const content = input.get("content") as string; // ❌ Could be null
  const completedOn = input.get("completedOn") as string; // ❌ No date validation
}
```

#### ❌ Issue 2: Inconsistent Zod Schema Usage

```typescript
// domain/backlog-item/types.ts - Good pattern but inconsistent usage
export const BacklogItemSchema = z.object({
  backlogStatus: z.string().transform((val) => {
    try {
      return BacklogItemStatusSchema.parse(val as BacklogItemStatus);
    } catch (e) {
      return BacklogItemStatus.TO_PLAY; // ❌ Silent fallback hides validation errors
    }
  }),
});
```

## Enhanced Type Safety Standards

### 1. Comprehensive Zod Schema Strategy

```typescript
// shared/lib/validation/base-schemas.ts
import { z } from "zod";

export const NonEmptyStringSchema = z
  .string()
  .min(1, "This field is required")
  .trim();

export const EmailSchema = z
  .string()
  .email("Please enter a valid email address")
  .toLowerCase()
  .trim();

export const DateStringSchema = z
  .string()
  .refine((date) => !isNaN(Date.parse(date)), {
    message: "Please enter a valid date",
  })
  .transform((date) => new Date(date));

export const CuidSchema = z
  .string()
  .cuid("Invalid ID format");

export const RatingSchema = z
  .number()
  .min(1, "Rating must be at least 1")
  .max(10, "Rating cannot be more than 10")
  .int("Rating must be a whole number");
```

### 2. Runtime Validation Utilities

```typescript
// shared/lib/validation/runtime-validation.ts
import { z } from "zod";
import { ValidationError } from "@/domain/shared/errors";
import { failure, Result, success } from "@/domain/shared/result";

export const validateData = <T>(
  schema: z.ZodType<T>,
  data: unknown,
  context?: string
): Result<T, ValidationError> => {
  try {
    const validated = schema.parse(data);
    return success(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");

      return failure(
        new ValidationError(
          context ? `${context} validation failed: ${errorMessage}` : errorMessage,
          {
            context,
            issues: error.issues,
            receivedData: data,
          }
        )
      );
    }

    return failure(
      new ValidationError(
        `Unexpected validation error: ${error instanceof Error ? error.message : String(error)}`,
        { context, receivedData: data }
      )
    );
  }
};
```

### 3. Type-Safe Server Action Template

```typescript
// Enhanced server action with comprehensive validation
"use server";

import { authenticatedActionClient } from "@/shared/lib/safe-action-client";
import { validateData } from "@/shared/lib/validation/runtime-validation";
import { z } from "zod";

const ActionInputSchema = z.object({
  field1: z.string().min(1, "Field1 is required").max(100, "Field1 too long"),
  field2: z.number().positive("Field2 must be positive"),
  dateField: z.string().datetime("Invalid date format").optional(),
}).refine(
  (data) => {
    // Custom validation logic
    if (data.field1.includes("invalid")) {
      return false;
    }
    return true;
  },
  {
    message: "Field1 contains invalid content",
    path: ["field1"],
  }
);

export const actionName = authenticatedActionClient
  .metadata({
    actionName: "actionName",
  })
  .inputSchema(ActionInputSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // Input is automatically validated and typed
    const { field1, field2, dateField } = parsedInput;

    // Call domain service with validated data
    const result = await DomainService.performOperation({
      field1,
      field2,
      dateField: dateField ? new Date(dateField) : undefined,
    }, userId);

    if (result.isFailure) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      data: result.value,
    };
  });
```

## Migration Strategy

### Phase 1: Foundation (Week 1)

1. Implement base validation schemas
2. Create runtime validation utilities
3. Enhance safe action client with better error handling

### Phase 2: Server Actions (Week 2)

1. Migrate high-priority server actions to use enhanced schemas
2. Replace type assertions with proper validation
3. Add unit tests for validation logic

### Phase 3: Domain Services (Week 3)

1. Enhance domain service schemas with strict validation
2. Add query builder utilities for type-safe database access
3. Add integration tests for domain validation

## Critical Files for Type Safety Migration

### High Priority

- `features/add-review/server-actions/action.ts` - FormData extraction without validation
- `features/manage-user-info/server-actions/get-user-info.ts` - Optional parameters without validation
- `shared/lib/igdb.ts` - Inconsistent null/undefined handling

### Medium Priority

- `domain/backlog-item/types.ts` - Silent fallbacks in validation
- `domain/game/types.ts` - Loose validation for game data
- `shared/types/igdb.ts` - Complex types without runtime validation

## Benefits After Implementation

- ✅ **Compile-time safety**: Catch type errors before runtime
- ✅ **Data integrity**: All inputs validated at boundaries
- ✅ **Better IDE support**: Enhanced autocomplete and refactoring
- ✅ **Self-documenting code**: Schemas serve as documentation

---

**Next Document**: [07-database-query-optimization.md](./07-database-query-optimization.md)
