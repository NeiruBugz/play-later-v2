# Server Action Unit Testing Guide

This document outlines the testing approach for server actions in the Play Later application.

## Overview

Server actions are tested using unit tests with mocked dependencies. The tests run in a Node.js environment (not jsdom) to properly simulate the server-side execution context.

## Test Configuration

### Environment Setup

Server action tests automatically run in Node.js environment through vitest configuration:

```typescript
// vitest.config.ts
environmentMatchGlobs: [
  [
    "**/*.server-action.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    "node",
  ],
  [
    "**/server-actions/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    "node",
  ],
],
```

### File Naming Convention

Server action tests should follow this naming pattern:
- `*.server-action.test.ts` - for files anywhere in the project
- `*.test.ts` - for files in `server-actions/` directories

## Test Structure

### Basic Test Setup

```typescript
import { getServerUserId } from "@/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/shared/lib/db";
import { yourServerAction } from "./your-server-action";

// Type the mocked function for better IntelliSense
const mockGetServerUserId = vi.mocked(getServerUserId);

describe("yourServerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Tests go here
});
```

### Authentication Testing

All server actions should test both authenticated and unauthenticated scenarios:

```typescript
describe("when user is not authenticated", () => {
  it("should throw authentication error", async () => {
    mockGetServerUserId.mockResolvedValue(undefined);
    
    const result = await yourServerAction(/* params */);
    
    expect(result.serverError).toBe(
      "Authentication required. Please sign in to continue."
    );
  });
});

describe("when user is authenticated", () => {
  beforeEach(() => {
    mockGetServerUserId.mockResolvedValue("test-user-id");
  });

  // Authenticated test cases
});
```

### Validation Testing

Test input validation using invalid data:

```typescript
describe("when input is invalid", () => {
  it("should throw validation error", async () => {
    mockGetServerUserId.mockResolvedValue("test-user-id");
    
    const result = await yourServerAction({
      // @ts-expect-error - we want to test the validation error
      requiredField: 123, // should be string
    });

    expect(result.serverError).toBeUndefined();
    expect(result.validationErrors?.fieldErrors).toBeDefined();
    expect(result.validationErrors?.fieldErrors?.requiredField).toEqual([
      "Expected string, received number",
    ]);
  });
});
```

### Database Operation Testing

Mock Prisma operations and verify they're called correctly:

```typescript
describe("when input is valid", () => {
  it("should create resource successfully", async () => {
    mockGetServerUserId.mockResolvedValue("test-user-id");
    
    // Mock the database operation
    vi.mocked(prisma.resource.create).mockResolvedValue({
      id: 1,
      name: "Test Resource",
      userId: "test-user-id",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await yourServerAction({
      name: "Test Resource",
    });

    expect(result.serverError).toBeUndefined();
    expect(result.validationErrors).toBeUndefined();
    
    // Verify database was called with correct parameters
    expect(prisma.resource.create).toHaveBeenCalledWith({
      data: {
        name: "Test Resource",
        userId: "test-user-id",
      },
    });
  });
});
```

## Common Patterns

### Form Data Testing

For server actions that accept FormData:

```typescript
describe("formDataAction", () => {
  let formData: FormData;

  beforeEach(() => {
    vi.clearAllMocks();
    formData = new FormData();
    formData.append("field1", "value1");
    formData.append("field2", "value2");
  });

  it("should process form data correctly", async () => {
    mockGetServerUserId.mockResolvedValue("test-user-id");
    
    const result = await formDataAction(formData);
    
    expect(result.serverError).toBeUndefined();
  });
});
```

### Error Handling Testing

Test business logic error scenarios:

```typescript
describe("when resource not found", () => {
  it("should return not found error", async () => {
    mockGetServerUserId.mockResolvedValue("test-user-id");
    vi.mocked(prisma.resource.findUnique).mockResolvedValue(null);

    const result = await yourServerAction({ id: "non-existent" });

    expect(result.serverError).toBe("Resource not found");
  });
});
```

### Service Integration Testing

Mock external services and verify interactions:

```typescript
describe("when external service is called", () => {
  it("should call service with correct parameters", async () => {
    mockGetServerUserId.mockResolvedValue("test-user-id");
    
    const revalidationSpy = vi.spyOn(RevalidationService, "revalidateCollection");
    
    await yourServerAction(/* params */);
    
    expect(revalidationSpy).toHaveBeenCalledWith("your-collection");
  });
});
```

## Best Practices

### 1. Mock All External Dependencies

- Always mock `getServerUserId` for authentication tests
- Mock all Prisma operations with realistic return values
- Mock external services (revalidation, APIs, etc.)

### 2. Test All Code Paths

- Unauthenticated requests
- Invalid input validation
- Business logic errors (not found, unauthorized, etc.)
- Successful operations

### 3. Use Descriptive Test Names

```typescript
// Good
it("should throw authentication error when user is not authenticated")
it("should create review when valid data is provided")
it("should return validation error when rating is not a number")

// Bad
it("should work")
it("should fail")
it("should validate")
```

### 4. Clear Mocks Between Tests

Always include `vi.clearAllMocks()` in `beforeEach` to ensure test isolation.

### 5. Type Your Mocks

Use `vi.mocked()` for better TypeScript support:

```typescript
const mockGetServerUserId = vi.mocked(getServerUserId);
```

## Example Test File

See `features/add-review/server-actions/create-review.server-action.test.ts` for a complete example following these patterns.

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run with coverage
bun test:coverage
```

Server action tests will automatically run in Node.js environment based on the file naming convention.