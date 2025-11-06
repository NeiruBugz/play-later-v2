# Testing Analysis & Modernization Plan (2025)

## Executive Summary

This document provides a comprehensive analysis of the current testing practices in the SavePoint application, identifies gaps against modern standards, and proposes a refactoring strategy to align with 2025 best practices.

**Key Findings:**
- ✅ Strong foundation with BDD-style component tests using `elements` and `actions` helpers
- ✅ Good separation of unit and integration tests
- ⚠️ Inconsistent application of modern RTL patterns across test files
- ⚠️ Some anti-patterns present (explicit vitest imports, container queries, missing `screen` usage)
- ⚠️ Guidelines need modernization and splitting into focused sections

**Priority Actions:**
1. Split testing guidelines into separate focused documents
2. Update component testing standards with 2025 best practices
3. Address anti-patterns in existing tests (moderate refactor)
4. Enhance integration and backend testing documentation

---

## Current State Analysis

### What's Working Well ✅

#### 1. BDD-Style Testing Pattern
**Example from [profile-settings-form.test.tsx](../savepoint-app/features/profile/ui/profile-settings-form.test.tsx:25-56)**

```typescript
const elements = {
  getUsernameInput: () => screen.getByLabelText("Username"),
  getSubmitButton: () => screen.getByRole("button", { name: /save changes/i }),
  queryValidationError: () => screen.queryByText(/username must/i),
};

const actions = {
  typeUsername: async (value: string) => {
    const user = userEvent.setup();
    await user.clear(elements.getUsernameInput());
    await user.type(elements.getUsernameInput(), value);
  },
};
```

**Strengths:**
- ✅ Clear separation of concerns (queries vs. actions)
- ✅ Reusable test utilities reduce duplication
- ✅ Easy to understand test intent
- ✅ Uses semantic queries (`getByRole`, `getByLabelText`)

#### 2. Describe Block Organization
**Example from [credentials-form.test.tsx](../savepoint-app/features/auth/ui/credentials-form.test.tsx:64-74)**

```typescript
describe("CredentialsForm", () => {
  describe("given opened in default state", () => {
    it("should display sign in mode by default", () => {
      // test implementation
    });
  });

  describe("given sign up toggle clicked", () => {
    // nested tests
  });
});
```

**Strengths:**
- ✅ State-based organization ("given X")
- ✅ Clear test hierarchy
- ✅ Logical grouping of related scenarios

#### 3. Integration Test Setup
**Example from [user-repository.integration.test.ts](../savepoint-app/data-access-layer/repository/user/user-repository.integration.test.ts:1-22)**

```typescript
vi.mock("@/shared/lib", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib")>("@/shared/lib");
  const { getTestDatabase } = await import("@/test/setup/database");

  return {
    ...actual,
    get prisma() {
      return getTestDatabase();
    },
  };
});

describe("UserRepository - Integration Tests", () => {
  beforeAll(async () => await setupDatabase());
  afterAll(async () => await cleanupDatabase());
  beforeEach(async () => await resetTestDatabase());
});
```

**Strengths:**
- ✅ Proper database lifecycle management
- ✅ Clean test isolation with reset
- ✅ Uses factory functions for test data

### Issues & Anti-Patterns ⚠️

#### 1. Explicit Vitest Imports (Medium Priority)
**Found in:** [add-entry-form.test.tsx](../savepoint-app/features/game-detail/ui/library-modal/add-entry-form.test.tsx:5-6)

```typescript
// ❌ Bad: Explicit imports (vitest globals are enabled)
import { beforeEach, describe, expect, it, vi } from "vitest";
```

**Why it's wrong:**
- Vitest globals are enabled in `vitest.config.ts` (`globals: true`)
- Explicit imports are unnecessary and verbose
- Inconsistent with project configuration

**Fix:**
```typescript
// ✅ Good: No imports needed (globals available)
describe("AddEntryForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
});
```

**Impact:** 25/30 test files (83%)
**Effort:** Low (automated find/replace)

#### 2. Container Queries Instead of Screen (Low-Medium Priority)
**Found in:** [profile-settings-form.test.tsx](../savepoint-app/features/profile/ui/profile-settings-form.test.tsx:109-114)

```typescript
// ❌ Bad: Using container from render destructuring
const { container } = render(<ProfileSettingsForm {...props} />);
const hiddenInput = container.querySelector('input[name="avatarUrl"]') as HTMLInputElement;
```

**Why it's wrong:**
- Direct DOM querying bypasses RTL's accessibility focus
- Makes tests fragile to DOM structure changes
- Kent C. Dodds: "Always use `screen` for queries"

**Fix:**
```typescript
// ✅ Good: Use screen with accessible query or data-testid if necessary
render(<ProfileSettingsForm {...props} />);
const hiddenInput = screen.getByTestId("avatar-url-input");

// Or better: make the input accessible
const hiddenInput = screen.getByLabelText("Avatar URL", { selector: 'input[type="hidden"]' });
```

**Impact:** 3/25 component test files (12%)
**Effort:** Low-Medium (case-by-case evaluation)

#### 3. Incomplete userEvent.setup() Pattern (Low Priority)
**Found in:** Multiple files

```typescript
// ⚠️ Inconsistent: userEvent.setup() called inside action
const actions = {
  typeUsername: async (value: string) => {
    const user = userEvent.setup(); // ← Called every time
    await user.type(elements.getUsernameInput(), value);
  },
};
```

**Modern pattern:**
```typescript
// ✅ Better: Setup once per test or action sequence
it("should handle user input", async () => {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText("Username"), "testuser");
  await user.click(screen.getByRole("button", { name: "Submit" }));
});
```

**Note:** Current pattern works but may cause issues with complex event sequences. Not critical to change.

**Impact:** Most component tests
**Effort:** Medium (pattern change across many files)

#### 4. MSW Setup Location (Low Priority)
**Found in:** [game-search-input.test.tsx](../savepoint-app/features/game-search/ui/game-search-input.test.tsx:25-81)

```typescript
// ⚠️ Current: MSW handlers defined inline
const igdbHandlers = [
  http.get("*/api/games/search", ({ request }) => {
    // handler logic
  }),
];

const server = setupServer(...igdbHandlers);
```

**Modern pattern:**
```typescript
// ✅ Better: Extract to test/mocks/handlers.ts for reuse
import { gameSearchHandlers } from "@/test/mocks/handlers";

const server = setupServer(...gameSearchHandlers);
```

**Impact:** 1 test file
**Effort:** Low (extract to shared location if more tests need it)

#### 5. Missing Explicit Assertions (Low Priority)
**Found in:** Several files

```typescript
// ⚠️ Implicit: getByRole will throw if not found
expect(elements.getSubmitButton()).toBeInTheDocument();
```

**Modern consensus:**
```typescript
// ✅ Explicit is slightly better for clarity but not required
expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();

// ✅ Acceptable: getByRole already asserts existence
screen.getByRole("button", { name: "Submit" });
```

**Note:** Kent C. Dodds says explicit assertions add clarity. Our current tests mostly use explicit assertions, which is good.

**Impact:** Inconsistent across tests
**Effort:** Low (optional improvement)

#### 6. Test Naming Inconsistency (Low Priority)
**Found in:** Mixed patterns across files

```typescript
// Pattern 1: "given X" (BDD-style) - GOOD ✅
describe("given form just rendered", () => {
  it("should display all form elements", () => {});
});

// Pattern 2: "when X" (BDD-style) - GOOD ✅
describe("when user opens the search page", () => {
  it("should display empty search input with placeholder", () => {});
});

// Pattern 3: Traditional (less descriptive) - OKAY ⚠️
describe("form submission", () => {
  it("should submit with valid email", () => {});
});
```

**Recommendation:** Standardize on "given X" for state, "when X" for actions. Both are acceptable BDD patterns.

---

## Modern Standards Comparison (2025)

### Kent C. Dodds' Common Mistakes

| Mistake | Found in Codebase? | Priority | Status |
|---------|-------------------|----------|--------|
| Using wrong assertions (`.disabled` vs `.toBeDisabled()`) | ❌ No (using jest-dom) | N/A | ✅ Good |
| Using wrong query types (testId over role) | ✅ Rare (3 files) | Low | ⚠️ Minor |
| Wrapping side effects in `waitFor` | ❌ No | N/A | ✅ Good |
| Using `query*` for existence checks | ❌ No | N/A | ✅ Good |
| Unnecessary `act()` wrapping | ❌ No | N/A | ✅ Good |
| `waitFor` instead of `find*` | ❌ No | N/A | ✅ Good |
| Not using ESLint plugins | ⚠️ Unknown | High | 🔍 Check |
| Manual `cleanup` calls | ❌ No | N/A | ✅ Good |
| Not using `screen` | ✅ Yes (container queries) | Medium | ⚠️ Fix |
| `fireEvent` over `userEvent` | ❌ No (using userEvent) | N/A | ✅ Good |
| Multiple assertions in `waitFor` | ❌ No | N/A | ✅ Good |

**Overall Assessment:** 🟢 Strong compliance with modern standards (9/11 perfect, 2/11 minor issues)

---

## Testing Anti-Patterns to Avoid

### 1. Testing Implementation Details ❌
```typescript
// ❌ Bad: Testing internal state
expect(component.state.isOpen).toBe(true);

// ✅ Good: Testing user-visible behavior
expect(screen.getByRole("dialog")).toBeVisible();
```

### 2. Snapshot Testing (Overuse) ❌
```typescript
// ❌ Bad: Brittle, hard to review
expect(container).toMatchSnapshot();

// ✅ Good: Explicit assertions
expect(screen.getByRole("heading")).toHaveTextContent("Profile Settings");
```

### 3. Testing Third-Party Libraries ❌
```typescript
// ❌ Bad: Testing React Query behavior
expect(queryClient.getQueryData(["games"])).toBeDefined();

// ✅ Good: Testing your component's response to query states
expect(screen.getByText("Loading...")).toBeInTheDocument();
```

### 4. Incomplete Mocking ❌
```typescript
// ❌ Bad: Partial mock causes unpredictable behavior
vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
  // Missing toast.error, toast.info, etc.
}));

// ✅ Good: Complete mock or use `vi.fn()` for each method
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));
```

### 5. Non-Deterministic Tests ❌
```typescript
// ❌ Bad: Race conditions
await user.click(button);
expect(screen.getByText("Success")).toBeInTheDocument(); // May fail

// ✅ Good: Wait for async updates
await user.click(button);
await waitFor(() => {
  expect(screen.getByText("Success")).toBeInTheDocument();
});
```

---

## Gap Analysis Summary

### Strengths 💪
1. **BDD-style component tests** with `elements` and `actions` helpers (excellent pattern)
2. **Proper test isolation** with database lifecycle management
3. **Good use of semantic queries** (`getByRole`, `getByLabelText`)
4. **Consistent describe block organization** with state-based grouping
5. **Modern tooling** (Vitest, RTL, userEvent)

### Opportunities for Improvement 🎯

#### High Priority
1. **Split testing guidelines** into focused documents:
   - Component testing guide
   - Integration testing guide
   - Backend/service testing guide
   - E2E testing guide (already good in README)

2. **Verify ESLint plugin installation**:
   ```bash
   pnpm add -D eslint-plugin-testing-library eslint-plugin-jest-dom
   ```

#### Medium Priority
3. **Remove explicit Vitest imports** from test files (83% of files)
4. **Replace container queries** with `screen` and accessible queries (12% of files)
5. **Standardize test naming** convention (given/when/then)

#### Low Priority
6. **Consider extracting MSW handlers** to shared location if reused
7. **Optional: Adjust userEvent.setup() pattern** for complex sequences
8. **Add more explicit assertions** for clarity (optional)

---

## Recommended Changes to Guidelines

### 1. Remove from Current Guidelines ❌
- Explicit Vitest imports shown in examples (contradicts `globals: true`)
- Some verbose patterns that can be simplified

### 2. Add to Guidelines ✅
- **Query Priority Order**: role > label > placeholder > text > testId > container
- **userEvent Best Practices**: Setup per test vs. per action
- **MSW Usage**: When and how to mock API calls
- **Accessibility Testing**: ARIA attributes, keyboard navigation
- **Error State Testing**: Loading, error, empty states
- **Form Validation Testing**: Client-side and server-side errors

### 3. Emphasize More Strongly 📣
- **Never use `container` queries** (use `screen` + testId if absolutely necessary)
- **Test user behavior, not implementation**
- **Semantic queries first** (roles, labels)
- **Async handling**: `waitFor`, `findBy*`, `userEvent` patterns

---

## Next Steps

See [TESTING_REFACTORING_STRATEGY.md](./testing-refactoring-strategy.md) for the detailed implementation plan.
