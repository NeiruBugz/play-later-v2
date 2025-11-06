# Testing Refactoring Strategy

## Overview

This document outlines the step-by-step strategy to modernize the SavePoint testing suite based on the [Testing Analysis & Modernization Plan (2025)](./testing-analysis-2025.md).

**Goal:** Align testing practices with 2025 standards while maintaining existing test coverage and stability.

**Timeline:** 2-3 weeks (depending on team size)

---

## Phase 1: Documentation Restructure (Week 1)

### Objective
Split the monolithic [test/README.md](../savepoint-app/test/README.md) into focused, maintainable guides.

### Tasks

#### 1.1 Create Component Testing Guide
**File:** `savepoint-app/test/guides/COMPONENT_TESTING.md`

**Content:**
- BDD-style testing with `elements` and `actions` helpers
- Query priority hierarchy (role > label > placeholder > text > testId)
- userEvent patterns and best practices
- Mocking server actions and external dependencies
- Accessibility testing patterns
- Form validation testing (client + server errors)
- MSW for API mocking
- Common anti-patterns to avoid

**Template structure:**
```markdown
# Component Testing Guide

## Quick Start
## Query Methods & Priority
## BDD-Style Pattern (elements & actions)
## User Interactions (userEvent)
## Mocking Dependencies
## Testing Async Behavior
## Accessibility Testing
## Common Patterns
## Anti-Patterns to Avoid
## Examples
```

**Effort:** 4-6 hours

---

#### 1.2 Create Integration Testing Guide
**File:** `savepoint-app/test/guides/INTEGRATION_TESTING.md`

**Content:**
- Repository layer testing philosophy
- Database setup and lifecycle management
- Using test database (Docker Compose)
- Factory functions for test data
- Testing complex queries and multi-table operations
- Transaction rollback patterns
- What NOT to test (simple CRUD)

**Template structure:**
```markdown
# Integration Testing Guide

## Philosophy: What to Test
## Database Setup
## Test Lifecycle (beforeAll, beforeEach, afterAll)
## Factory Functions
## Testing Complex Queries
## Result Type Assertions
## Common Patterns
## Examples
```

**Effort:** 3-4 hours

---

#### 1.3 Create Backend/Service Testing Guide
**File:** `savepoint-app/test/guides/BACKEND_TESTING.md`

**Content:**
- Service layer testing with mocked repositories
- Server action testing patterns
- Result type assertions (`success: true/false`)
- Error handling and edge cases
- Testing business logic in isolation
- Utility/library function testing

**Template structure:**
```markdown
# Backend & Service Testing Guide

## Service Layer Tests
## Server Action Tests
## Utility Tests
## Result Type Patterns
## Mocking Strategy
## Error Handling
## Examples
```

**Effort:** 3-4 hours

---

#### 1.4 Update Main README
**File:** `savepoint-app/test/README.md`

**Changes:**
- Keep overview, architecture diagram, and test types
- Keep running tests section
- Keep coverage requirements
- Add links to specialized guides
- Remove detailed component/integration sections (now in guides/)
- Keep E2E section (already well-documented)

**New structure:**
```markdown
# Testing Guide

## Overview
## Test Types & Architecture Diagram
## Testing Guides (links to new files)
  - Component Testing
  - Integration Testing
  - Backend Testing
  - E2E Testing (existing content)
## Running Tests
## Coverage Requirements
## Quick Reference
```

**Effort:** 2-3 hours

---

### Phase 1 Deliverables
- [x] `test/guides/COMPONENT_TESTING.md`
- [x] `test/guides/INTEGRATION_TESTING.md`
- [x] `test/guides/BACKEND_TESTING.md`
- [x] Updated `test/README.md` with links

**Total Effort:** 12-17 hours

---

## Phase 2: Quick Wins (Week 1-2)

### Objective
Address high-impact, low-effort issues across the test suite.

### Tasks

#### 2.1 Verify and Configure ESLint Plugins
**Impact:** Automated detection of testing anti-patterns

**Steps:**
1. Check if plugins are installed:
   ```bash
   cd savepoint-app
   grep -E "eslint-plugin-(testing-library|jest-dom)" package.json
   ```

2. If missing, install:
   ```bash
   pnpm add -D eslint-plugin-testing-library eslint-plugin-jest-dom
   ```

3. Update `eslint.config.mjs`:
   ```javascript
   import testingLibrary from 'eslint-plugin-testing-library';
   import jestDom from 'eslint-plugin-jest-dom';

   export default [
     // ... existing config
     {
       files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
       plugins: {
         'testing-library': testingLibrary,
         'jest-dom': jestDom,
       },
       rules: {
         'testing-library/await-async-queries': 'error',
         'testing-library/no-await-sync-queries': 'error',
         'testing-library/no-container': 'warn',
         'testing-library/no-debugging-utils': 'warn',
         'testing-library/prefer-screen-queries': 'error',
         'jest-dom/prefer-checked': 'error',
         'jest-dom/prefer-enabled-disabled': 'error',
         'jest-dom/prefer-required': 'error',
         'jest-dom/prefer-to-have-attribute': 'error',
       },
     },
   ];
   ```

4. Run linter to identify issues:
   ```bash
   pnpm lint
   ```

**Effort:** 2-3 hours (including fixing discovered issues)
**Priority:** HIGH

---

#### 2.2 Remove Explicit Vitest Imports
**Impact:** 25/30 test files (83%)

**Automated approach:**

1. Create a script to find affected files:
   ```bash
   cd savepoint-app
   grep -r "from ['\"]vitest['\"]" **/*.test.{ts,tsx} > /tmp/vitest-imports.txt
   ```

2. Create a codemod script (`scripts/remove-vitest-imports.js`):
   ```javascript
   const fs = require('fs');
   const path = require('path');
   const glob = require('glob');

   const files = glob.sync('**/*.test.{ts,tsx}', { cwd: process.cwd() });

   files.forEach(file => {
     let content = fs.readFileSync(file, 'utf8');

     // Remove import statements
     content = content.replace(
       /import\s*{[^}]*}\s*from\s*['"]vitest['"];?\s*\n?/g,
       ''
     );

     // Remove standalone imports
     content = content.replace(
       /import\s*['"]vitest['"];?\s*\n?/g,
       ''
     );

     fs.writeFileSync(file, content, 'utf8');
     console.log(`✅ Processed: ${file}`);
   });
   ```

3. Run the script:
   ```bash
   node scripts/remove-vitest-imports.js
   ```

4. Verify tests still pass:
   ```bash
   pnpm test
   ```

**Manual fallback:** Use find/replace in IDE with regex:
- Find: `import\s*{[^}]*}\s*from\s*['"]vitest['"];?\s*\n?`
- Replace: (empty)

**Effort:** 1-2 hours (automated) or 3-4 hours (manual)
**Priority:** MEDIUM

---

#### 2.3 Replace Container Queries with Screen
**Impact:** 3-4 files

**Affected files:**
1. `features/profile/ui/profile-settings-form.test.tsx` (line 109)
2. Other files with `container.querySelector()`

**Manual approach (recommended):**

For each file:

**Before:**
```typescript
const { container } = render(<Component />);
const hiddenInput = container.querySelector('input[name="avatarUrl"]') as HTMLInputElement;
expect(hiddenInput).toBeInTheDocument();
expect(hiddenInput.value).toBe("https://example.com/avatar.jpg");
```

**After Option 1 (data-testid):**
```typescript
render(<Component />);
const hiddenInput = screen.getByTestId("avatar-url-input");
expect(hiddenInput).toBeInTheDocument();
expect(hiddenInput).toHaveValue("https://example.com/avatar.jpg");

// Add to component:
<input type="hidden" name="avatarUrl" data-testid="avatar-url-input" value={avatarUrl} />
```

**After Option 2 (accessible name - preferred):**
```typescript
render(<Component />);
const hiddenInput = screen.getByLabelText("Avatar URL", { selector: 'input[type="hidden"]' });
expect(hiddenInput).toHaveValue("https://example.com/avatar.jpg");

// Add to component:
<label htmlFor="avatar-url" className="sr-only">Avatar URL</label>
<input id="avatar-url" type="hidden" name="avatarUrl" value={avatarUrl} />
```

**Steps:**
1. Find all uses:
   ```bash
   grep -r "container.querySelector" **/*.test.tsx
   ```

2. Evaluate each case:
   - Can element be queried by role/label? → Use semantic query
   - Is element purely for testing? → Add data-testid
   - Is element hidden but important? → Add sr-only label

3. Update component if needed
4. Update test
5. Verify test passes

**Effort:** 2-3 hours
**Priority:** MEDIUM

---

### Phase 2 Deliverables
- [x] ESLint testing plugins installed and configured
- [x] Vitest imports removed from all test files
- [x] Container queries replaced with `screen` + accessible queries or testIds

**Total Effort:** 5-8 hours

---

## Phase 3: Pattern Standardization (Week 2-3)

### Objective
Ensure consistency across all test files with modern patterns.

### Tasks

#### 3.1 Standardize Test Naming Convention
**Impact:** All test files

**Decision:** Use "given/when/then" BDD pattern consistently

**Examples:**

**Before (mixed):**
```typescript
describe("ProfileSettingsForm", () => {
  describe("form submission", () => { // ⚠️ Not descriptive
    it("should submit with valid email", () => {});
  });
});
```

**After:**
```typescript
describe("ProfileSettingsForm", () => {
  describe("given user submits form with valid email", () => { // ✅ Clear state + action
    it("should call server action and display success toast", () => {});
  });
});
```

**Pattern guide:**
- `given X` → Initial state or precondition
- `when X` → User action or event
- `then X` → Expected outcome (in `it()` block)

**Effort:** 4-6 hours (review and update describe blocks)
**Priority:** LOW (but improves readability)

---

#### 3.2 Enhance Accessibility Testing
**Impact:** All component tests

**Add accessibility checks to existing tests:**

```typescript
describe("given accessibility features", () => {
  it("should have proper ARIA labels", () => {
    render(<Component />);

    const input = screen.getByLabelText("Username");
    expect(input).toHaveAttribute("aria-describedby");
    expect(input).toHaveAccessibleName("Username");
  });

  it("should set aria-invalid when validation fails", async () => {
    render(<Component />);

    await user.type(screen.getByLabelText("Username"), "ab");

    await waitFor(() => {
      expect(screen.getByLabelText("Username")).toHaveAttribute("aria-invalid", "true");
    });
  });

  it("should be keyboard navigable", async () => {
    render(<Component />);

    const input = screen.getByLabelText("Username");
    const button = screen.getByRole("button", { name: "Submit" });

    await user.tab();
    expect(input).toHaveFocus();

    await user.tab();
    expect(button).toHaveFocus();
  });
});
```

**Effort:** 6-8 hours (add to existing component tests)
**Priority:** MEDIUM

---

#### 3.3 Review and Optimize userEvent.setup() Pattern
**Impact:** All component tests

**Current pattern (works but not optimal for sequences):**
```typescript
const actions = {
  typeUsername: async (value: string) => {
    const user = userEvent.setup(); // ← Called every action
    await user.type(elements.getUsernameInput(), value);
  },
  clickSubmit: async () => {
    const user = userEvent.setup(); // ← Called again
    await user.click(elements.getSubmitButton());
  },
};
```

**Recommended pattern for test sequences:**
```typescript
it("should handle complete form submission flow", async () => {
  const user = userEvent.setup(); // ← Setup once for entire test

  render(<Component />);

  await user.type(screen.getByLabelText("Username"), "testuser");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Submit" }));

  await waitFor(() => {
    expect(mockServerAction).toHaveBeenCalledWith({
      username: "testuser",
      password: "password123",
    });
  });
});
```

**When to use actions helpers:**
- Complex sequences that are reused across tests
- When helper encapsulates multiple steps

**Decision:** Keep current pattern (works fine). Add note to guidelines about alternatives.

**Effort:** 0 hours (document only, no changes needed)
**Priority:** LOW

---

### Phase 3 Deliverables
- [x] Consistent "given/when/then" naming across test suite
- [x] Enhanced accessibility tests for key components
- [x] Documentation of userEvent.setup() patterns

**Total Effort:** 10-14 hours

---

## Phase 4: Validation & Documentation (Week 3)

### Objective
Ensure all changes are tested, documented, and team is trained.

### Tasks

#### 4.1 Run Full Test Suite
```bash
pnpm test:coverage
```

**Acceptance criteria:**
- All tests pass
- Coverage remains ≥80%
- No new console warnings/errors

**Effort:** 1 hour

---

#### 4.2 Update CLAUDE.md
**File:** `CLAUDE.md`

Add reference to new testing guides:

```markdown
## Testing

The project follows a **layered testing approach** with separate guides for each layer:

- **Component Tests:** See [test/guides/COMPONENT_TESTING.md](savepoint-app/test/guides/COMPONENT_TESTING.md)
- **Integration Tests:** See [test/guides/INTEGRATION_TESTING.md](savepoint-app/test/guides/INTEGRATION_TESTING.md)
- **Backend Tests:** See [test/guides/BACKEND_TESTING.md](savepoint-app/test/guides/BACKEND_TESTING.md)
- **E2E Tests:** See [test/README.md#e2e-testing-with-playwright](savepoint-app/test/README.md#e2e-testing-with-playwright)

**Coverage:** ≥80% for all code except `app/`, `shared/components/ui/`, and config files.
```

**Effort:** 30 minutes

---

#### 4.3 Create Testing Cheat Sheet
**File:** `savepoint-app/test/CHEATSHEET.md`

Quick reference for common patterns:

```markdown
# Testing Cheat Sheet

## Component Test Template
## Query Priority
## User Events
## Async Patterns
## Mocking
## Common Assertions
```

**Effort:** 2-3 hours

---

#### 4.4 Team Training (Optional)
**Format:** 1-hour session or recorded video

**Topics:**
1. New testing guide structure (5 min)
2. BDD-style patterns with elements/actions (10 min)
3. Query priority and accessibility (15 min)
4. Common anti-patterns to avoid (15 min)
5. Demo: Writing a component test from scratch (15 min)

**Effort:** 4-6 hours (prep + delivery)
**Priority:** MEDIUM

---

### Phase 4 Deliverables
- [x] All tests passing with ≥80% coverage
- [x] CLAUDE.md updated with testing guide links
- [x] Testing cheat sheet created
- [x] Optional: Team trained on new patterns

**Total Effort:** 4-7 hours (excluding training)

---

## Rollback Plan

If issues arise during refactoring:

### Critical Issues (Tests Failing)
1. Identify failing tests:
   ```bash
   pnpm test --reporter=verbose
   ```

2. Git revert specific commits:
   ```bash
   git log --oneline
   git revert <commit-hash>
   ```

### Non-Critical Issues (Linter Warnings)
1. Temporarily disable problematic rules in `eslint.config.mjs`:
   ```javascript
   'testing-library/no-container': 'off', // TODO: Fix container queries
   ```

2. Create tickets to address incrementally

---

## Success Metrics

### Quantitative
- ✅ All tests pass after refactoring
- ✅ Test coverage remains ≥80%
- ✅ 0 ESLint testing violations (or approved exceptions)
- ✅ 0 explicit Vitest imports in test files
- ✅ 0 container queries (or approved exceptions with testIds)

### Qualitative
- ✅ Testing guides are clear and easy to follow
- ✅ New developers can write tests using guidelines
- ✅ Tests are more maintainable (fewer changes needed during refactors)
- ✅ Tests better reflect user behavior

---

## Timeline Summary

| Phase | Duration | Effort | Priority |
|-------|----------|--------|----------|
| Phase 1: Documentation | Week 1 | 12-17 hours | HIGH |
| Phase 2: Quick Wins | Week 1-2 | 5-8 hours | HIGH |
| Phase 3: Standardization | Week 2-3 | 10-14 hours | MEDIUM |
| Phase 4: Validation | Week 3 | 4-7 hours | HIGH |
| **Total** | **2-3 weeks** | **31-46 hours** | - |

**Recommendation:** Start with Phase 1 (documentation) and Phase 2 (quick wins) for maximum impact with minimal risk.

---

## Next Actions

1. **Review this strategy** with the team
2. **Prioritize phases** based on current sprint goals
3. **Assign tasks** to team members
4. **Set target completion date** for each phase
5. **Start with Phase 1** (documentation restructure)

---

## Questions?

If you have questions about this refactoring strategy, please:
1. Check the [Testing Analysis](./testing-analysis-2025.md) for context
2. Review the [current test README](../savepoint-app/test/README.md)
3. Ask in the team chat or create a discussion issue
