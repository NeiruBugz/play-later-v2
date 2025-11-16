# Testing Guide

This document provides an overview of testing practices for the SavePoint application. For detailed testing patterns and examples, see the specialized guides linked below.

## Table of Contents

- [Overview](#overview)
- [Test Types & Architecture](#test-types--architecture)
- [Testing Guides](#testing-guides)
- [File Naming Conventions](#file-naming-conventions)
- [Running Tests](#running-tests)
- [Coverage Requirements](#coverage-requirements)
- [Quick Reference](#quick-reference)

## Overview

Our testing strategy follows a **layered approach** matching the application architecture:

```
┌─────────────────────────────────────┐
│ E2E Tests (Playwright)              │  End-to-end user journeys
├─────────────────────────────────────┤
│ Component Tests (Vitest + RTL)      │  UI components (BDD style)
├─────────────────────────────────────┤
│ Server Action Tests (Vitest)        │  Next.js server actions
├─────────────────────────────────────┤
│ Service Layer Tests (Vitest)        │  Business logic (unit)
├─────────────────────────────────────┤
│ Repository Layer Tests (Vitest)     │  Database operations (integration)
├─────────────────────────────────────┤
│ Utility Tests (Vitest)              │  Pure functions
└─────────────────────────────────────┘
```

**Test Philosophy:**

- **Unit tests** for business logic (services, utilities)
- **Integration tests** for complex database operations
- **Component tests** using BDD style for UI
- **E2E tests** for critical user flows
- **High coverage** (80%+) focused on meaningful code, not boilerplate

## Testing Guides

For detailed testing patterns, examples, and best practices, see these specialized guides:

### 📘 [Component Testing Guide](./guides/COMPONENT_TESTING.md)

Comprehensive guide for testing React components with React Testing Library:
- BDD-style testing with `elements` and `actions` helpers
- Query priority hierarchy (role > label > placeholder > text > testId)
- User interactions with `userEvent`
- Mocking server actions and dependencies
- Testing async behavior and accessibility
- API mocking with MSW
- Common patterns and anti-patterns

### 📗 [Integration Testing Guide](./guides/INTEGRATION_TESTING.md)

Guide for testing repository layer with real PostgreSQL database:
- Testing philosophy (what to test, what to skip)
- Database lifecycle management (setup, cleanup, reset)
- Using factory functions for test data
- Testing complex queries, constraints, and transactions
- Result type assertions
- Common patterns and troubleshooting

### 📙 [Backend Testing Guide](./guides/BACKEND_TESTING.md)

Guide for testing services and server actions with mocked dependencies:
- Service layer testing with mocked Prisma
- Server action patterns with mocked services
- Testing business logic in isolation
- Result type patterns
- Error handling and edge cases
- Mocking strategies

### 🎭 [E2E Testing with Playwright](#e2e-testing-with-playwright)

End-to-end testing with Playwright is documented below in this file.

---

## Test Types & Architecture

### Unit Tests

- **What:** Test individual functions/methods in isolation
- **Mocking:** All external dependencies (repositories, services, APIs)
- **Speed:** Fast (< 10ms per test)
- **Examples:** Service tests, utility tests

### Integration Tests

- **What:** Test interactions with real database/external systems
- **Mocking:** Minimal (uses real PostgreSQL via Docker)
- **Speed:** Slower (50-200ms per test)
- **Examples:** Repository tests, some server action tests

### Component Tests

- **What:** Test React components with user interactions
- **Mocking:** External dependencies (server actions, hooks)
- **Speed:** Medium (20-50ms per test)
- **Style:** BDD with `elements` and `actions` helpers

### E2E Tests

- **What:** Test complete user journeys in browser
- **Mocking:** None (real application state)
- **Speed:** Slowest (1-5s per test)
- **Tool:** Playwright

## File Naming Conventions

Tests are co-located with the code they test and follow strict naming patterns:

```
feature/
├── ui/
│   ├── component.tsx
│   └── component.test.tsx              # Component test
├── server-actions/
│   ├── action.ts
│   └── action.server-action.test.ts    # Server action test
├── hooks/
│   ├── use-hook.ts
│   └── use-hook.test.ts                # Hook test
└── lib/
    ├── utils.ts
    └── utils.unit.test.ts              # Utility test (optional .unit suffix)

data-access-layer/
├── services/
│   └── game/
│       ├── game-service.ts
│       └── game-service.unit.test.ts   # Service unit test (mocked repos)
└── repository/
    └── game/
        ├── game-repository.ts
        └── game-repository.integration.test.ts  # Repository integration test (real DB)
```

**Naming Rules:**

- `*.test.ts(x)` - General test (component, hook, utility)
- `*.unit.test.ts` - Explicitly unit test (mocked dependencies)
- `*.integration.test.ts` - Integration test (real database)
- `*.server-action.test.ts` - Server action test (Node environment)
- `*.spec.ts` - E2E test (Playwright)

## Test Structure Standards

### Standard Test Template

All tests follow this structure:

```typescript
// 1. Imports (grouped and ordered)
// Note: Vitest globals (describe, it, expect, vi, beforeEach, etc.) are available globally
// No need to import them!
import { internalModule } from "@/internal/path";
import { externalDependency } from "external-lib";

import { relativeImport } from "../relative/path";
import type { TypeImport } from "./types";

// 2. Mocks (at top level, before describe)
vi.mock("@/path/to/dependency", () => ({
  dependencyFunction: vi.fn(),
}));

// 3. Mock references
const mockDependency = vi.mocked(dependencyFunction);

// 4. Test suite
describe("ComponentOrFunctionName", () => {
  // 5. Setup (if needed)
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 6. Nested describe for methods/features
  describe("methodName", () => {
    // 7. Test cases
    it("should handle success case", () => {
      // Arrange
      mockDependency.mockResolvedValue(mockData);

      // Act
      const result = methodName(params);

      // Assert
      expect(result).toBe(expected);
    });

    it("should handle error case", () => {
      // Arrange, Act, Assert
    });
  });
});
```

### Import Order

Maintain consistent import order:

```typescript
// 1. Testing library imports (NOT vitest - globals available!)

// 2. Internal application imports (@/ alias)
import { GameService } from "@/data-access-layer/services";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// 4. Type-only imports
import type { Game } from "@/shared/types";

// 3. Relative imports (../, ./)
import { ComponentName } from "./component-name";
import type { Props } from "./types";
```

**Note on Vitest Globals:**

This project uses Vitest's global test APIs (`globals: true` in `vitest.config.ts`). This means you **don't need to import** `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`, etc. They're available globally in all test files.

**Configuration:**

- `vitest.config.ts`: `globals: true`
- `tsconfig.json`: `types: ["vitest/globals"]`

## Writing Tests - Quick Start

For detailed testing patterns with complete examples, see the specialized guides linked in the [Testing Guides](#testing-guides) section above.

**Quick reference:**

- **Component tests:** See [Component Testing Guide](./guides/COMPONENT_TESTING.md) for BDD-style patterns with `elements` and `actions` helpers
- **Service tests:** See [Backend Testing Guide](./guides/BACKEND_TESTING.md) for testing business logic with mocked dependencies
- **Repository tests:** See [Integration Testing Guide](./guides/INTEGRATION_TESTING.md) for testing complex database operations
- **Server action tests:** See [Backend Testing Guide](./guides/BACKEND_TESTING.md) for testing Next.js server actions
- **Utility tests:** See [Backend Testing Guide](./guides/BACKEND_TESTING.md) for testing pure functions

## Test Utilities

The `test/` directory provides shared utilities:

### Test Helpers

**`test/helpers/service-test-helpers.ts`**

```typescript
import {
  buildMockGame,
  buildMockUser,
  expectServiceError,
  expectServiceSuccess,
} from "@/test/helpers/service-test-helpers";

const result = await service.getUser({ userId: "1" });
expectServiceSuccess(result); // Asserts and narrows type
expect(result.data.name).toBe("Test User");

const user = buildMockUser({ id: "user-1", email: "custom@test.com" });
```

### Database Factories

**`test/setup/db-factories/`**

```typescript
import {
  createGame,
  createLibraryItem,
  createUser,
} from "@/test/setup/db-factories";

const user = await createUser({ username: "testuser" });
const game = await createGame({ title: "Test Game" });
const item = await createLibraryItem({
  userId: user.id,
  gameId: game.id,
  status: "CURRENTLY_EXPLORING",
});
```

### Database Setup

**`test/setup/database.ts`**

```typescript
import {
  cleanupDatabase,
  getTestDatabase,
  resetTestDatabase,
  setupDatabase,
} from "@/test/setup/database";

beforeAll(() => setupDatabase());
afterAll(() => cleanupDatabase());
beforeEach(() => resetTestDatabase());
```

## Running Tests

### All Tests

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage report
```

### Run by Project

```bash
pnpm test:components    # UI and hook tests
pnpm test:backend       # Service and server action tests
pnpm test:utilities     # Shared library tests
pnpm test:integration   # Integration tests with real database
```

### Specific Tests

```bash
pnpm test path/to/file.test.ts           # Single file
pnpm test -t "test name pattern"         # By pattern
pnpm test -- --project=components        # Specific project
```

### Test Projects

Tests are organized into Vitest projects:

- **utilities** - Node environment (shared lib tests)
- **components** - jsdom environment (UI + hooks)
- **backend** - Node environment (services, unit tests, server actions)
- **integration** - Node environment (repository integration tests with real DB)
  - Uses `pool: "forks"` with `singleFork: true` for database isolation
  - Longer timeouts (15s) for database operations
  - Run separately: `pnpm test:integration`

## Coverage Requirements

**Global Thresholds:** 80% for branches, functions, lines, statements

**Excluded from Coverage:**

- `app/` - App Router pages (thin, delegate to features)
- `shared/components/ui/` - shadcn/ui vendor components
- `shared/providers/` - Third-party provider wrappers
- `shared/config/` - Static configuration
- `**/types/**` - Type definitions
- `**/*.config.*` - Configuration files
- `domain/` - Domain models (placeholder)

**Run Coverage:**

```bash
pnpm test:coverage
# Open: savepoint-app/coverage/index.html
```

## Best Practices

### Do's ✅

1. **Use Arrange-Act-Assert** pattern
2. **Test behavior, not implementation**
3. **Write descriptive test names** ("should return error when user not found")
4. **Use helper objects** (`elements`, `actions`) in component tests
5. **Mock at boundaries** (repository, external APIs)
6. **Use factory functions** for test data
7. **Test edge cases** (null, undefined, empty arrays)
8. **Use semantic queries** (`getByRole`, `getByLabelText`)
9. **Clean up mocks** (`vi.clearAllMocks()` in `beforeEach`)
10. **Use type narrowing** with Result types (`if (result.success)`)

### Don'ts ❌

1. **Don't test implementation details** (state, internal methods)
2. **Don't use snapshots** (brittle, hard to maintain)
3. **Don't mock what you don't own** (test with real instances when possible)
4. **Don't write tests just for coverage** (test meaningful behavior)
5. **Don't duplicate test logic** (use helpers and factories)
6. **Don't use `any` types** in tests (maintain type safety)
7. **Don't test library code** (trust React Testing Library, Vitest)
8. **Don't forget to reset state** between tests
9. **Don't use `waitFor` unnecessarily** (use only for async state)
10. **Don't test simple getters/setters** (focus on logic)

### Test Naming

**Good:**

```typescript
it("should return user when ID exists");
it("should display error message on failed submission");
it("should disable submit button while loading");
```

**Bad:**

```typescript
it("works"); // Too vague
it("test getUser function"); // Doesn't describe behavior
it("should call mockFunction"); // Tests implementation
```

### Mocking Strategy

**Mock at service boundaries:**

```typescript
// ✅ Good - Mock repository in service test
vi.mock("@/data-access-layer/repository");

// ✅ Good - Mock service in server action test
vi.mock("@/data-access-layer/services");

// ❌ Bad - Mocking Prisma directly in service test
vi.mock("@prisma/client");
```

**Use `vi.mocked()` consistently:**

```typescript
// ✅ Preferred
const mockFunction = vi.mocked(functionName);

// ❌ Avoid - Verbose
let mockFunction: ReturnType<typeof vi.fn>;
mockFunction = vi.mocked(functionName);
```

### Async Testing

**Always use `async/await`:**

```typescript
// ✅ Good
it("should fetch data", async () => {
  const result = await service.getData();
  expect(result).toBeDefined();
});

// ❌ Bad - Missing await
it("should fetch data", () => {
  const result = service.getData();
  expect(result).toBeDefined(); // Promise, not actual result
});
```

**Use `waitFor` for async UI updates:**

```typescript
// ✅ Good
await waitFor(() => {
  expect(screen.getByText("Success")).toBeInTheDocument();
});

// ❌ Bad - No wait for async update
expect(screen.getByText("Success")).toBeInTheDocument();
```

## E2E Testing with Playwright

### Overview

E2E tests verify complete user journeys in a real browser environment. We use Playwright to test critical user flows without mocking.

**Key Characteristics:**

- **Real browser execution**: Tests run in actual Chromium browser
- **Full application stack**: Database, server, and frontend all active
- **Sequential execution**: Single worker to prevent database conflicts
- **Comprehensive assertions**: Test what users see and experience

### Test Location and Structure

```
e2e/
├── example.spec.ts                    # Basic smoke tests
├── profile.spec.ts                    # Profile display and stats
├── profile-settings.spec.ts           # Profile settings form
├── pages/                              # Page Object Models (POM)
│   ├── profile.page.ts                 # Public profile screen
│   └── profile-settings.page.ts        # Profile Settings screen
└── helpers/
    ├── auth.ts                        # Authentication helpers
    └── db.ts                          # Database seeding/cleanup
```

### Page Objects (POM)

We use lightweight Page Objects to encapsulate semantic locators and common actions per screen. This keeps tests readable and reduces flakiness when UI structure changes.

Key principles:

- Prefer role-based selectors with stable accessible names.
- Scope locators to relevant regions when helpful (e.g., toast region).
- Expose intentful actions (e.g., `changeUsername()`, `submitAvatarUpload()`).

Example (excerpt from `e2e/pages/profile-settings.page.ts`):

```ts
avatarUploadButton(): Locator {
  // Handle label variations like "Upload" vs "Upload selected avatar"
  return this.page.getByRole("button", {
    name: /^(Upload selected avatar|Upload)$/i,
  });
}

async submitAvatarUpload(): Promise<void> {
  await this.avatarUploadButton().click();
}
```

This pattern avoids brittle exact-text matches and stays aligned with accessibility.

### Selector Hierarchy (Most to Least Preferred)

**1. Semantic Queries (Preferred)**

```typescript
// ✅ Best: Accessible to users and screen readers
page.getByRole("button", { name: /save changes/i });
page.getByRole("heading", { name: "Profile Settings" });
page.getByLabel(/username/i);
page.getByText(/profile updated successfully/i);
page.getByPlaceholder("Enter your email");
```

**2. Test IDs (When Necessary)**

```typescript
// ⚠️ Acceptable: For complex layouts without semantic structure
page.getByTestId("profile-stats-grid");
page.getByTestId("profile-status-card");

// Use data-testid sparingly - only when semantic queries fail
```

**3. CSS/XPath Selectors (Avoid)**

```typescript
// ❌ Bad: Fragile, breaks with UI changes
page.locator('input[id="username"]'); // Use getByLabel instead
page.locator('li[data-type="success"]'); // Use getByText instead
page.locator("text=Save").locator(".."); // Use filter() instead
page.locator(".css-class-name"); // Brittle implementation detail
```

`★ Insight ─────────────────────────────────────`
**Why Semantic Selectors Matter:**
Test what users experience, not implementation details. Users don't see CSS classes or DOM structure—they see buttons, headings, and text. Semantic selectors make tests resilient to refactoring while ensuring accessibility.
`─────────────────────────────────────────────────`

### Authentication & Storage State

Authenticated E2E flows reuse a persisted Playwright storage state to avoid logging in in every test:

- `e2e/auth.setup.ts` signs in via the UI once and saves storage to `e2e/.auth/user.json`.
- `playwright.config.ts` defines a `setup` project and makes the main `chromium` project depend on it, reusing `storageState`.

Regenerate storage state on demand:

```bash
pnpm exec playwright test --project=setup
```

Ensure credentials-based auth is enabled for E2E in your `.env` (see app README).

### Global Setup/Teardown & DB Hygiene

Database state is cleaned before and after the E2E run to keep tests isolated and repeatable:

- `e2e/global-setup.ts` calls `clearTestData()` and closes the Prisma connection.
- `e2e/global-teardown.ts` calls `clearTestData()` again and closes the connection.
- `e2e/helpers/db.ts` centralizes user/game/library seeding and cleanup helpers.

Tip: Use clear, prefixed identifiers for seeded users (e.g., `e2e-` or `test-`) so cleanup patterns remain targeted and safe.

### Authentication Patterns

**Sign In Helper:**

```typescript
import { signInWithCredentials } from "./helpers/auth";

test("should display user profile", async ({ page }) => {
  await signInWithCredentials(page, "user@example.com", "password");
  await page.goto("/profile");
  // ... test assertions
});
```

**Database Seeding:**

```typescript
import { clearTestData, createTestUser } from "./helpers/db";

test.beforeAll(async () => {
  await clearTestData();
  testUser = await createTestUser({
    email: "e2e-test@example.com",
    username: "testuser",
    password: "TestPassword123!",
  });
});

test.afterAll(async () => {
  await clearTestData();
  await disconnectDatabase();
});
```

### Common Patterns

**Waiting for Page State:**

```typescript
// ✅ Good: Wait for network idle before assertions
await page.goto("/profile");
await page.waitForLoadState("networkidle");

// ✅ Good: Wait for specific elements
const saveButton = page.getByRole("button", { name: "Save Changes" });
await expect(saveButton).toBeVisible({ timeout: 10000 });
```

**Form Interactions:**

```typescript
// ✅ Good: Use semantic selectors
const usernameInput = page.getByLabel(/username/i);
await usernameInput.clear();
await usernameInput.fill("newusername");

const saveButton = page.getByRole("button", { name: "Save Changes" });
await saveButton.click();

// ✅ Good: Wait for success feedback
const successToast = page.getByText(/profile updated successfully/i);
await expect(successToast).toBeVisible({ timeout: 5000 });
```

**Validation Testing:**

```typescript
// ✅ Good: Test user-visible validation messages
const usernameInput = page.getByLabel(/username/i);
await usernameInput.fill("ab"); // Too short

const validationError = page.getByText(
  "Username must be at least 3 characters"
);
await expect(validationError).toBeVisible();

const saveButton = page.getByRole("button", { name: "Save Changes" });
await expect(saveButton).toBeDisabled();
```

**Complex Element Selection:**

```typescript
// ✅ Good: Use filter() for scoped queries
const curiousCard = page
  .getByTestId("profile-status-card")
  .filter({ hasText: "Curious About" });
await expect(curiousCard.getByText("3")).toBeVisible();

// ✅ Good: Use locator chaining when semantic queries insufficient
const statusCards = page.getByTestId("profile-status-card");
const firstCard = statusCards.first();
await expect(firstCard.getByTestId("profile-status-label")).toBeVisible();
```

### Running E2E Tests

```bash
# Run all E2E tests (starts dev server automatically)
pnpm test:e2e

# Run with UI mode (interactive debugging)
pnpm test:e2e:ui

# Run with debugger (step through tests)
pnpm test:e2e:debug

# Run specific test file
pnpm test:e2e e2e/profile.spec.ts

# Run tests matching pattern
pnpm test:e2e -g "should display user profile"
```

### Prerequisites

- Dev server: The config auto-starts `pnpm dev` via `webServer` at `http://localhost:6060`.
- Database: Ensure local PostgreSQL is available as per `.env` and project setup.
- S3/LocalStack (for avatar uploads): Start LocalStack per project docs so S3 operations succeed locally.
- Auth: Enable credentials-based auth for tests.

### Configuration

See `playwright.config.ts` for full configuration:

- **Base URL**: http://localhost:6060
- **Timeout**: 60s per test, 30s per action
- **Retries**: 2 on CI, 0 locally
- **Reporter**: GitHub Actions in CI, HTML locally
- **Video**: Recorded on failure
- **webServer**: Automatically starts `pnpm dev`

### Example: Avatar Upload Locator

We favor resilient, accessible locators for dynamic controls. For the avatar uploader, the button’s accessible name may vary (e.g., "Upload" vs "Upload selected avatar"). Use a role-based locator with a regex to cover both cases:

```ts
page.getByRole("button", { name: /^(Upload selected avatar|Upload)$/i });
```

This avoids flakes when the UI updates its label based on state.

### Best Practices

**DO:**

- Use semantic selectors (getByRole, getByLabel, getByText)
- Wait for `networkidle` before assertions
- Clean up test data in `beforeAll`/`afterAll` hooks
- Test user-visible behavior, not implementation details
- Use case-insensitive regex for text matching (`/save changes/i`)
- Add timeouts for elements that may load slowly

**DON'T:**

- Use CSS selectors or XPath unless absolutely necessary
- Test implementation details (CSS classes, internal state)
- Leave test data in database after test completion
- Assume elements are immediately visible (always wait)
- Use `test.only` or `test.skip` in committed code
- Access internal component state or props

### Debugging Failed Tests

**1. Check Screenshots:**

```bash
# Screenshots saved to test-results/ on failure
open savepoint-app/test-results/
```

**2. Watch Video Recording:**

```bash
# Videos saved for failed tests
open savepoint-app/test-results/
```

**3. View Trace:**

```bash
# Traces collected on first retry
pnpm exec playwright show-trace test-results/.../trace.zip
```

**4. Run with UI Mode:**

```bash
# Interactive debugging with step-through
pnpm test:e2e:ui
```

**5. Add Debug Logs:**

```typescript
// Temporary debugging
await page.screenshot({ path: "debug-screenshot.png" });
console.log(await page.content()); // Full page HTML
console.log(await page.locator("body").textContent()); // All text
```

### Performance Tips

**Current Limitations:**

- Sequential execution (1 worker) prevents database conflicts
- Each test authenticates separately (~2-3s overhead)
- Full page navigation for each test

**Future Optimizations:**

- Reuse authentication state across tests
- Parallel execution for read-only tests
- Database transactions for faster cleanup

---

## Quick Reference

### Common Test Commands

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# Specific projects
pnpm test:components
pnpm test:backend
pnpm test:integration

# Single file
pnpm test path/to/file.test.ts
```

### Test File Naming

| Pattern | Type | Example |
|---------|------|---------|
| `*.test.tsx` | Component test | `login-form.test.tsx` |
| `*.unit.test.ts` | Unit test (mocked deps) | `auth-service.unit.test.ts` |
| `*.integration.test.ts` | Integration test (real DB) | `user-repository.integration.test.ts` |
| `*.server-action.test.ts` | Server action test | `sign-in.server-action.test.ts` |

### Query Priority (Component Tests)

Always prefer semantic queries in this order:

1. `getByRole` - Accessible roles (button, heading, textbox)
2. `getByLabelText` - Form labels
3. `getByPlaceholderText` - Input placeholders
4. `getByText` - Visible text content
5. `getByTestId` - Last resort only

### Mocking Layers

```typescript
// Server Action Tests → Mock services
vi.mock("@/data-access-layer/services");

// Service Tests → Mock Prisma/repositories
vi.mock("@/shared/lib", () => ({
  prisma: { /* mocked methods */ }
}));

// Repository Tests → Real database (no mocks)
```

### Result Type Pattern

```typescript
const result = await service.method(input);

// Type guard for success/error
if (result.success) {
  console.log(result.data); // TypeScript knows data exists
} else {
  console.error(result.error); // TypeScript knows error exists
}
```

### Useful Links

- [Component Testing Guide](./guides/COMPONENT_TESTING.md)
- [Integration Testing Guide](./guides/INTEGRATION_TESTING.md)
- [Backend Testing Guide](./guides/BACKEND_TESTING.md)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)

---

**Last Updated:** January 2025
**Maintained By:** SavePoint Engineering Team
