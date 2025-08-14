# Comprehensive Testing Guide

This document outlines the complete testing strategy for both components and server actions in the Play Later application, covering the Vitest configuration with separate test environments.

## Overview

The application uses a comprehensive testing strategy with Vitest configured for two separate test environments:

- **Component tests**: Run in JSDOM environment with React Testing Library
- **Server action tests**: Run in Node.js environment with mocked dependencies

This separation ensures proper isolation and optimal performance for each test type.

## Test Configuration

### Vitest Project Structure

The application uses Vitest's project feature to run different test types in appropriate environments:

```typescript
// vitest.config.ts
projects: [
  {
    // Component tests - JSDOM environment
    name: "components",
    environment: "jsdom",
    setupFiles: ["./test/setup/client-setup.ts"],
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      "**/*.server-action.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "**/server-actions/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
  },
  {
    // Server action tests - Node.js environment
    name: "server",
    environment: "node",
    include: [
      "**/*.server-action.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "**/server-actions/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
  },
];
```

### File Naming Conventions

**Component Tests:**

- `*.test.tsx` - for React component tests
- `*.test.ts` - for utility/hook tests
- Run in JSDOM environment with React Testing Library

**Server Action Tests:**

- `*.server-action.test.ts` - for files anywhere in the project
- `*.test.ts` - for files in `server-actions/` directories
- Run in Node.js environment with mocked dependencies

## Component Testing

### Test Setup and Environment

Component tests use React Testing Library with a comprehensive test provider setup:

```typescript
// test/utils/test-provider.tsx
export function renderWithTestProviders(ui: React.ReactElement) {
  return render(ui, { wrapper: TestProviders });
}

// Provides:
// - NextThemes Provider for theme testing
// - SessionProvider for auth testing
// - QueryClientProvider for TanStack Query
```

### Client Setup (test/setup/client-setup.ts)

The client setup file provides:

- **NextAuth mocking**: Authenticated user session by default
- **MSW server**: API request mocking with realistic responses
- **Browser API mocks**: matchMedia, ResizeObserver, IntersectionObserver
- **IGDB API mocking**: Search endpoint with fixture data

### Component Test Structure

```typescript
import { renderWithTestProviders } from "@/test/utils/test-provider";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { YourComponent } from "./your-component";

// Element selectors using semantic queries
const elements = {
  getSubmitButton: () => screen.getByRole("button", { name: "Submit" }),
  getTextInput: () => screen.getByLabelText("Your input"),
  getAllRatingButtons: () => screen.getAllByRole("button", { name: /Set rating to/ }),
};

// User actions for better test readability
const actions = {
  clickSubmit: async () => {
    await userEvent.click(elements.getSubmitButton());
  },
  typeInInput: async (text: string) => {
    await userEvent.type(elements.getTextInput(), text);
  },
};

describe("YourComponent", () => {
  beforeEach(() => {
    renderWithTestProviders(<YourComponent prop="value" />);
  });

  it("should render correctly", () => {
    expect(elements.getSubmitButton()).toBeVisible();
  });

  it("should handle user interactions", async () => {
    await actions.typeInInput("test input");
    await actions.clickSubmit();

    await waitFor(() => {
      expect(elements.getSubmitButton()).toBeDisabled();
    });
  });
});
```

### Component Testing Patterns

**Dialog/Modal Testing:**

```typescript
const actions = {
  openDialog: async () => {
    await userEvent.click(elements.getDialogTriggerButton());
  },
};

// Test dialog opens and displays content
it("should display dialog content when opened", async () => {
  await actions.openDialog();
  expect(elements.getDialogTitle("Game Title")).toBeVisible();
});
```

**Form Interaction Testing:**

```typescript
// Test form validation and submission
it("should enable submit button when form is valid", async () => {
  await actions.setRating(5);
  await waitFor(() => {
    expect(elements.getSubmitButton()).toBeEnabled();
  });
});
```

**Accessibility Testing:**

```typescript
// Use semantic queries for accessibility
const elements = {
  getHeading: () => screen.getByRole("heading", { name: "Write a Review" }),
  getButton: (name: string) => screen.getByRole("button", { name }),
  getInput: (name: string) => screen.getByLabelText(name),
};
```

## Server Action Testing

### Server Action Test Setup

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

    const revalidationSpy = vi.spyOn(
      RevalidationService,
      "revalidateCollection"
    );

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
it("should throw authentication error when user is not authenticated");
it("should create review when valid data is provided");
it("should return validation error when rating is not a number");

// Bad
it("should work");
it("should fail");
it("should validate");
```

### 4. Clear Mocks Between Tests

Always include `vi.clearAllMocks()` in `beforeEach` to ensure test isolation.

### 5. Type Your Mocks

Use `vi.mocked()` for better TypeScript support:

```typescript
const mockGetServerUserId = vi.mocked(getServerUserId);
```

## Example Test Files

### Component Test Examples

- `features/add-review/components/add-review-dialog.test.tsx` - Dialog interaction testing
- `features/add-review/components/review-form.test.tsx` - Form validation and submission
- `features/add-game/components/add-game-form.test.tsx` - Complex form with external API

### Server Action Test Examples

- `features/add-review/server-actions/create-review.server-action.test.ts` - Authentication and validation
- `features/manage-user-info/server-actions/edit-user-action.server-action.test.ts` - User data updates
- `features/add-game/server-actions/create-game-action.server-action.test.ts` - Game creation flow

## Running Tests

**Important**: This project uses Vitest as the test runner. Always use `bun run` for test commands:

```bash
# Run all tests (both components and server actions)
bun run test

# Run tests in watch mode
bun run test:watch

# Run with coverage
bun run test:coverage

# Run specific test types (if needed)
npx vitest run --project=components  # Component tests only
npx vitest run --project=server      # Server action tests only
```

### Test Environment Behavior

- **Component tests**: Automatically run in JSDOM environment with React Testing Library
- **Server action tests**: Automatically run in Node.js environment with mocked dependencies
- **Coverage**: Includes both test types with 80% threshold across all metrics
- **Isolation**: Each test runs in isolation with proper cleanup

## Mock Service Worker (MSW) Integration

The application uses MSW for API mocking in component tests:

```typescript
// test/setup/client-setup.ts
export const server = setupServer(
  http.get("/api/igdb-search", async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";

    // Return fixture data or empty results
    if (query.length === 0) {
      return HttpResponse.json({ response: [] });
    }

    return HttpResponse.json(searchResponseFixture);
  })
);
```

### MSW Setup

- Automatically started before all tests
- Handlers reset after each test
- Unhandled requests cause test failures
- Realistic response delays for testing loading states

## Test Utilities and Factories

### Test Providers

- **renderWithTestProviders**: Wraps components with all necessary providers
- **ThemeProvider**: Enables theme-related testing
- **SessionProvider**: Provides authenticated user context
- **QueryClient**: Fresh instance for each test to prevent state leakage

### Test Patterns

**Element Selectors:**

```typescript
const elements = {
  // Use semantic queries for better accessibility
  getButton: (name: string) => screen.getByRole("button", { name }),
  getHeading: (name: string) => screen.getByRole("heading", { name }),
  getInput: (label: string) => screen.getByLabelText(label),
};
```

**User Actions:**

```typescript
const actions = {
  // Encapsulate user interactions
  submitForm: async () => {
    await userEvent.click(elements.getSubmitButton());
  },
  fillInput: async (value: string) => {
    await userEvent.type(elements.getInput(), value);
  },
};
```

**Async Testing:**

```typescript
// Always use waitFor for async assertions
it("should update state after user interaction", async () => {
  await actions.submitForm();

  await waitFor(() => {
    expect(elements.getSuccessMessage()).toBeVisible();
  });
});
```
