# Testing in Play Later

This project uses Vitest for unit and integration testing, and Playwright for end-to-end testing.

## Directory Structure

- `test/unit`: Unit tests for individual components and functions
- `test/integration`: Integration tests for features that interact with multiple components or services
- `e2e`: End-to-end tests that simulate user interactions with the application

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests once
bun test

# Run tests in watch mode during development
bun test:watch

# Run tests with UI
bun test:ui

# Run tests with coverage report
bun test:coverage
```

### End-to-End Tests

```bash
# Run all e2e tests
bun test:e2e

# Run e2e tests with UI
bun test:e2e:ui
```

## Writing Tests

### Unit Tests

Unit tests should be placed in the `test/unit` directory and should test individual components or functions in isolation. Use mocks for dependencies.

Example:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '../utils';
import { MyComponent } from '@/shared/components/ui/my-component';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Integration Tests

Integration tests should be placed in the `test/integration` directory and should test how multiple components or services work together.

Example:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { myFeatureFunction } from '@/features/my-feature/actions';

// Mock dependencies
vi.mock('@/shared/lib/service', () => ({
  someService: vi.fn(),
}));

describe('My Feature', () => {
  it('works correctly', async () => {
    // Setup mocks
    // Call the function
    // Assert results
  });
});
```

### End-to-End Tests

End-to-end tests should be placed in the `e2e` directory and should test the application from a user's perspective.

Example:

```ts
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Log in' }).click();
  // Fill in login form
  // Submit form
  // Assert user is logged in
});
```

## Test Utilities

The `test/utils.tsx` file provides a custom render function that includes all necessary providers for testing React components.

## Mocking

- Use `vi.mock()` to mock dependencies
- Use `vi.fn()` to create mock functions
- Use `vi.resetAllMocks()` in `beforeEach()` to reset mocks between tests

## Coverage

Run `bun test:coverage` to generate a coverage report. The report will be available in the `coverage` directory.
