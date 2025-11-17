# Component Testing Guide

> [toc]

## Quick Start

Component tests verify React components work correctly from the user's perspective using Vitest and React Testing Library.

**Philosophy:** "The more your tests resemble the way your software is used, the more confidence they can give you." — Kent C. Dodds

**Key Principles:**

- ✅ Test behavior, not implementation details
- ✅ Use semantic queries (roles, labels) over test IDs
- ✅ Simulate real user interactions with `userEvent`
- ✅ Focus on accessibility
- ✅ Keep tests simple and readable

## File Naming & Location

---

Component tests live next to the component they test:

```
features/profile/ui/
├── profile-settings-form.tsx
└── profile-settings-form.test.tsx
```

**Naming convention:** `[component-name].test.tsx`

## Test Structure Template

---

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { serverAction } from "../server-actions/action";
import { ComponentName } from "./component-name";

// 1. Mock dependencies (at top level)
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../server-actions/action", () => ({
  serverAction: vi.fn(),
}));

// 2. Create mock references
const mockServerAction = vi.mocked(serverAction);
const mockToastSuccess = vi.mocked(toast.success);

// 3. Define element queries (BDD style)
const elements = {
  getInput: () => screen.getByLabelText("Email"),
  getButton: () => screen.getByRole("button", { name: "Submit" }),
  queryError: () => screen.queryByRole("alert"),
};

// 4. Define user actions (BDD style)
const actions = {
  typeEmail: async (value: string) => {

    await userEventtype(elements.getInput(), value);
  },

  clickSubmit: async () => {

    await userEventclick(elements.getButton());
  },

  fillAndSubmit: async (email: string) => {
    await actions.typeEmail(email);
    await actions.clickSubmit();
  },
};

// 5. Test suite
describe("ComponentName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerAction.mockResolvedValue({ success: true });
  });

  describe("given initial render", () => {
    it("should display form elements", () => {
      render(<ComponentName />);

      expect(elements.getInput()).toBeInTheDocument();
      expect(elements.getButton()).toBeInTheDocument();
    });
  });

  describe("given user submits form", () => {
    it("should call server action with correct data", async () => {
      render(<ComponentName />);

      await actions.fillAndSubmit("test@example.com");

      await waitFor(() => {
        expect(mockServerAction).toHaveBeenCalledWith({
          email: "test@example.com",
        });
      });
    });

    it("should display success message", async () => {
      render(<ComponentName />);

      await actions.fillAndSubmit("test@example.com");

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("Success!");
      });
    });
  });

  describe("given server action fails", () => {
    it("should display error message", async () => {
      mockServerAction.mockResolvedValue({
        success: false,
        error: "Invalid email",
      });

      render(<ComponentName />);
      await actions.fillAndSubmit("invalid");

      await waitFor(() => {
        expect(elements.queryError()).toHaveTextContent("Invalid email");
      });
    });
  });
});
```

## Query Methods & Priority

---

### Query Priority Hierarchy

Always prefer queries in this order:

1. **`getByRole`** (best for accessibility)
2. **`getByLabelText`** (forms)
3. **`getByPlaceholderText`** (forms if no label)
4. **`getByText`** (non-interactive content)
5. **`getByDisplayValue`** (form inputs with values)
6. **`getByAltText`** (images)
7. **`getByTitle`** (title attribute)
8. **`getByTestId`** (last resort)
9. **`container.querySelector`** (never use - anti-pattern)

### Query Variants

| Variant    | Returns           | Use Case               |
| ---------- | ----------------- | ---------------------- |
| `getBy*`   | Element or throws | Element should exist   |
| `queryBy*` | Element or null   | Checking absence       |
| `findBy*`  | Promise<Element>  | Async/awaited elements |

### Examples

```typescript
// ✅ Best: Semantic role
const button = screen.getByRole("button", { name: "Submit" });
const button = screen.getByRole("button", { name: /submit/i }); // case-insensitive

// ✅ Good: Label association
const input = screen.getByLabelText("Email");

// ✅ Good: Placeholder (if no label)
const input = screen.getByPlaceholderText("Enter email");

// ✅ Good: Text content
const heading = screen.getByText("Welcome");

// ⚠️ Acceptable: Test ID (when semantic queries fail)
const element = screen.getByTestId("complex-widget");

// ❌ Never: Container queries
const { container } = render(<Component />);
const element = container.querySelector(".some-class"); // WRONG!
```

### Asserting Absence

```typescript
// ✅ Correct: Use queryBy* for absence checks
expect(screen.queryByText("Error")).not.toBeInTheDocument();

// ❌ Wrong: getBy* will throw
expect(screen.getByText("Error")).not.toBeInTheDocument(); // Throws before assertion
```

### Async Queries

```typescript
// ✅ Good: findBy* for async elements
const element = await screen.findByText("Loaded data");

// ⚠️ Verbose: waitFor with getBy
await waitFor(() => {
  expect(screen.getByText("Loaded data")).toBeInTheDocument();
});

// ❌ Wrong: findBy* in waitFor
await waitFor(() => {
  await screen.findByText("Loaded data"); // Redundant
});
```

### Visibility vs Presence Assertions

**⚠️ IMPORTANT: Prefer `toBeVisible()` over `toBeInTheDocument()` for user-facing elements**

Users care whether they can _see_ elements, not just whether they exist in the DOM. Hidden elements (`display: none`, `visibility: hidden`, `opacity: 0`, or `hidden` attribute) will pass `toBeInTheDocument()` but fail `toBeVisible()`, making `toBeVisible()` the more accurate assertion for most cases.

**✅ Migration Completed (Nov 2025):** All component tests have been systematically migrated to use `toBeVisible()` for user-facing elements. 181 assertions were updated across 25 test files, with 61 absence checks correctly preserved as `not.toBeInTheDocument()`.

```typescript
// ✅ Best: Verify element is visible to users
const icon = screen.getByTestId("status-icon");
expect(icon).toBeVisible();

// ⚠️ Less accurate: Only checks DOM presence
expect(icon).toBeInTheDocument(); // Passes even if display: none

// ✅ Use toBeInTheDocument for absence checks
expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
```

**When to use each:**

- **`toBeVisible()`**: When testing UI elements users should see (buttons, text, images, icons)
- **`toBeInTheDocument()`**: When checking element presence in DOM (structural tests, presence/absence)
- **`not.toBeInTheDocument()`**: When asserting elements should not exist at all

**Example:**

```typescript
// ✅ Good: Test visibility for user-facing elements
const submitButton = screen.getByRole("button", { name: "Submit" });
expect(submitButton).toBeVisible();

const errorMessage = screen.getByRole("alert");
expect(errorMessage).toBeVisible();

// ✅ Good: Test DOM presence for structural elements
const hiddenInput = screen.getByTestId("csrf-token");
expect(hiddenInput).toBeInTheDocument(); // Present but intentionally hidden

// ✅ Good: Test absence
expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
```

**Migration Guide for Existing Tests:**

If you're updating an existing test, evaluate each `toBeInTheDocument()` assertion:

```typescript
// Step 1: Identify the element type
const button = screen.getByRole("button", { name: "Submit" });
const icon = screen.getByTestId("menu-icon");
const text = screen.getByText("Welcome");
const input = screen.getByLabelText("Email");

// Step 2: Ask "Should the user see this element?"
// YES → Use toBeVisible()
expect(button).toBeVisible();
expect(icon).toBeVisible();
expect(text).toBeVisible();
expect(input).toBeVisible();

// NO (hidden input, structural element) → Keep toBeInTheDocument()
const csrfToken = screen.getByTestId("csrf-token");
expect(csrfToken).toBeInTheDocument();

// Checking absence? → Use not.toBeInTheDocument()
expect(screen.queryByText("Error")).not.toBeInTheDocument();
```

**Quick Search & Replace Guide:**

Search your test file for these patterns and evaluate each:

- `expect(button).toBeInTheDocument()` → `expect(button).toBeVisible()`
- `expect(icon).toBeInTheDocument()` → `expect(icon).toBeVisible()`
- `expect(text).toBeInTheDocument()` → `expect(text).toBeVisible()`
- `expect(image).toBeInTheDocument()` → `expect(image).toBeVisible()`
- `expect(element).not.toBeInTheDocument()` → Keep as-is (correct)

## BDD-Style Pattern (elements & actions)

---

### Why BDD Style?

The `elements` and `actions` pattern provides:

- **Clarity:** Test intent is obvious
- **Reusability:** Avoid query duplication
- **Maintainability:** Update queries in one place
- **Readability:** Tests read like user stories

### Elements Object

**Purpose:** Encapsulate all DOM queries

**Naming conventions:**

- `get*` → Element should exist (throws if not found)
- `query*` → Element may not exist (returns null)
- `find*` → Async element (returns Promise)

```typescript
const elements = {
  // Form inputs
  getUsernameInput: () => screen.getByLabelText("Username"),
  getPasswordInput: () => screen.getByLabelText("Password"),

  // Buttons
  getSubmitButton: () => screen.getByRole("button", { name: /submit/i }),
  getCancelButton: () => screen.getByRole("button", { name: /cancel/i }),

  // Dynamic states
  getSavingButton: () => screen.getByRole("button", { name: /saving/i }),

  // Conditional elements (use query*)
  queryErrorMessage: () => screen.queryByRole("alert"),
  querySuccessToast: () => screen.queryByText(/success/i),

  // Sections
  getFormDescription: () => screen.getByText(/enter your details/i),
  getHeading: () => screen.getByRole("heading", { name: "Sign In" }),
};
```

### Actions Object

**Purpose:** Encapsulate user interactions

**Naming conventions:**

- Use verb + noun: `typeUsername`, `clickSubmit`, `selectOption`
- Make async with `async/await`
- Always call `userEvent.setup()` per action

```typescript
const actions = {
  // Simple actions
  typeUsername: async (value: string) => {
    await userEventtype(elements.getUsernameInput(), value);
  },

  clickSubmit: async () => {
    await userEventclick(elements.getSubmitButton());
  },

  // Complex actions (combining multiple steps)
  fillAndSubmitForm: async (username: string, password: string) => {
    await actions.typeUsername(username);
    await actions.typePassword(password);
    await actions.clickSubmit();
  },

  // Actions with options
  selectStatus: async (statusLabel: string) => {
    await userEventclick(elements.getStatusDropdown());
    await userEventclick(screen.getByRole("option", { name: statusLabel }));
  },
};
```

### Real-World Example

From [profile-settings-form.test.tsx](../../features/profile/ui/profile-settings-form.test.tsx):

```typescript
const elements = {
  getUsernameInput: () => screen.getByLabelText("Username"),
  getSubmitButton: () => screen.getByRole("button", { name: /save changes/i }),
  queryValidationError: () => screen.queryByText(/username must/i),
};

const actions = {
  typeUsername: async (value: string) => {

    const input = elements.getUsernameInput();
    await userEventclear(input);
    await userEventtype(input, value);
  },

  typeAndSubmit: async (username: string) => {
    await actions.typeUsername(username);
    await actions.submitForm();
  },
};

describe("ProfileSettingsForm", () => {
  describe("given user types invalid username", () => {
    it("should show validation error", async () => {
      render(<ProfileSettingsForm currentUsername="test" currentAvatar={null} />);

      await actions.typeUsername("ab"); // Too short

      await waitFor(() => {
        expect(elements.queryValidationError()).toHaveTextContent(
          "Username must be at least 3 characters"
        );
      });
    });
  });
});
```

## User Interactions (userEvent)

---

### Always Use userEvent (Not fireEvent)

```typescript
// ✅ Good: userEvent simulates real user behavior
const user = userEvent.setup();
await userEventtype(input, "text");

// ❌ Bad: fireEvent is too low-level
fireEvent.change(input, { target: { value: "text" } });
```

### Common userEvent Patterns

```typescript
const user = userEvent.setup();

// Typing
await userEventtype(input, "hello");
await userEventclear(input);
await userEventtype(input, "{Enter}"); // Special keys

// Clicking
await userEventclick(button);
await userEventdblClick(button);

// Selection
await userEventselectOptions(select, "option1");
await userEventselectOptions(select, ["option1", "option2"]); // Multi-select

// Keyboard navigation
await userEventtab(); // Focus next element
await userEventtab({ shift: true }); // Focus previous
await userEventkeyboard("{Escape}"); // Press Escape

// Hover
await userEventhover(element);
await userEventunhover(element);

// Upload files
const file = new File(["hello"], "hello.png", { type: "image/png" });
await userEventupload(input, file);
```

### Setup Once Per Test vs. Per Action

**Option 1: Setup once per test (recommended for sequences)**

```typescript
it("should handle complete form flow", async () => {

  render(<Form />);

  await userEventtype(screen.getByLabelText("Email"), "test@example.com");
  await userEventtype(screen.getByLabelText("Password"), "password123");
  await userEventclick(screen.getByRole("button", { name: "Submit" }));

  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalled();
  });
});
```

**Option 2: Setup per action (current project pattern)**

```typescript
const actions = {
  typeEmail: async (value: string) => {
    // ← Setup inside action
    await userEventtype(elements.getEmailInput(), value);
  },
};

it("should handle email input", async () => {
  render(<Form />);
  await actions.typeEmail("test@example.com");
});
```

**Both patterns work.** Use per-test setup for complex flows, per-action setup for reusable helpers.

## Mocking Dependencies

---

### Server Actions

```typescript
vi.mock("../server-actions/action", () => ({
  serverAction: vi.fn(),
}));

const mockServerAction = vi.mocked(serverAction);

beforeEach(() => {
  vi.clearAllMocks();
  mockServerAction.mockResolvedValue({ success: true, data: {} });
});

it("should call server action", async () => {
  render(<Component />);

  await userEventclick(screen.getByRole("button", { name: "Submit" }));

  await waitFor(() => {
    expect(mockServerAction).toHaveBeenCalledWith({ id: 123 });
  });
});
```

### External Libraries (Toast, Router, etc.)

```typescript
// Sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
}));
```

### Hooks

```typescript
vi.mock("../hooks/use-profile", () => ({
  useProfile: vi.fn(),
}));

const mockUseProfile = vi.mocked(useProfile);

beforeEach(() => {
  mockUseProfile.mockReturnValue({
    profile: { id: "1", username: "testuser" },
    isLoading: false,
  });
});
```

## Testing Async Behavior

---

### Use waitFor for Async Updates

```typescript
it("should display success message after submission", async () => {
  render(<Form />);

  await userEventclick(screen.getByRole("button", { name: "Submit" }));

  // ✅ Good: Wait for async update
  await waitFor(() => {
    expect(screen.getByText("Success!")).toBeInTheDocument();
  });
});
```

### Don't Wrap Side Effects in waitFor

```typescript
// ❌ Bad: Side effect inside waitFor (may execute multiple times)
await waitFor(async () => {
  await userEventclick(button); // May click multiple times!
  expect(mockAction).toHaveBeenCalled();
});

// ✅ Good: Side effect outside, assertion inside
await userEventclick(button);
await waitFor(() => {
  expect(mockAction).toHaveBeenCalled();
});
```

### Use findBy\* for Async Elements

```typescript
// ✅ Best: findBy* (built-in wait)
const element = await screen.findByText("Loaded data");
expect(element).toBeInTheDocument();

// ⚠️ Verbose: waitFor + getBy
await waitFor(() => {
  expect(screen.getByText("Loaded data")).toBeInTheDocument();
});
```

## Accessibility Testing

---

### ARIA Attributes

```typescript
describe("given accessibility features", () => {
  it("should have proper ARIA labels", () => {
    render(<Form />);

    const input = screen.getByLabelText("Username");
    expect(input).toHaveAccessibleName("Username");
  });

  it("should link error to input via aria-describedby", async () => {
    render(<Form />);

    await userEventtype(screen.getByLabelText("Username"), "ab");

    await waitFor(() => {
      const input = screen.getByLabelText("Username");
      const error = screen.getByText(/must be at least 3 characters/i);

      expect(input).toHaveAttribute("aria-describedby", error.id);
      expect(input).toHaveAttribute("aria-invalid", "true");
    });
  });
});
```

### Keyboard Navigation

```typescript
it("should be keyboard navigable", async () => {

  render(<Form />);

  const usernameInput = screen.getByLabelText("Username");
  const submitButton = screen.getByRole("button", { name: "Submit" });

  await userEventtab();
  expect(usernameInput).toHaveFocus();

  await userEventtab();
  expect(submitButton).toHaveFocus();

  await userEventkeyboard("{Enter}");

  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalled();
  });
});
```

### Screen Reader Testing

```typescript
it("should have accessible button labels", () => {
  render(<GameCard title="Zelda" />);

  // ✅ Descriptive accessible name
  const button = screen.getByRole("button", {
    name: "Add Zelda to your library",
  });

  expect(button).toBeInTheDocument();
});
```

## API Mocking with MSW

---

### Setup MSW Server

```typescript
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const handlers = [
  http.get("/api/games/search", ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    if (query === "zelda") {
      return HttpResponse.json({
        games: [{ id: 1, name: "The Legend of Zelda: Breath of the Wild" }],
      });
    }

    return HttpResponse.json({ games: [] });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Real Example

See [game-search-input.test.tsx](../../features/game-search/ui/game-search-input.test.tsx) for full MSW setup.

## Common Patterns

---

### Testing Form Validation

```typescript
describe("given user submits invalid data", () => {
  it("should display validation error for short username", async () => {
    render(<Form />);

    await userEventtype(screen.getByLabelText("Username"), "ab");
    await userEventclick(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(screen.getByText(/must be at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it("should disable submit button when validation fails", async () => {
    render(<Form />);

    await userEventtype(screen.getByLabelText("Username"), "ab");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    });
  });
});
```

### Testing Loading States

```typescript
it("should show loading state during submission", async () => {
  mockServerAction.mockImplementation(
    () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
  );

  render(<Form />);

  await userEventclick(screen.getByRole("button", { name: "Submit" }));

  expect(screen.getByRole("button", { name: "Submitting..." })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Submitting..." })).toBeDisabled();
});
```

### Testing Error States

```typescript
it("should display server error message", async () => {
  mockServerAction.mockResolvedValue({
    success: false,
    error: "Username already exists",
  });

  render(<Form />);

  await userEventtype(screen.getByLabelText("Username"), "taken");
  await userEventclick(screen.getByRole("button", { name: "Submit" }));

  await waitFor(() => {
    expect(screen.getByText("Username already exists")).toBeInTheDocument();
  });
});
```

## Anti-Patterns to Avoid

---

### ❌ Testing Implementation Details

```typescript
// ❌ Bad: Testing internal state
expect(component.state.isOpen).toBe(true);

// ✅ Good: Testing user-visible behavior
expect(screen.getByRole("dialog")).toBeVisible();
```

### ❌ Using Container Queries

```typescript
// ❌ Bad: Querying DOM directly
const { container } = render(<Component />);
const element = container.querySelector(".some-class");

// ✅ Good: Use screen with semantic query
const element = screen.getByRole("button");

// ✅ Acceptable: Use testId if semantic query fails
const element = screen.getByTestId("complex-widget");
```

### ❌ Testing Third-Party Libraries

```typescript
// ❌ Bad: Testing React Query internals
expect(queryClient.getQueryData(["games"])).toBeDefined();

// ✅ Good: Testing your component's response
expect(screen.getByText("Loading...")).toBeInTheDocument();
```

### ❌ Snapshot Testing (Overuse)

```typescript
// ❌ Bad: Brittle, hard to review
expect(container).toMatchSnapshot();

// ✅ Good: Explicit assertions
expect(screen.getByRole("heading")).toHaveTextContent("Profile Settings");
```

### ❌ Non-Deterministic Tests

```typescript
// ❌ Bad: Race condition
await userEventclick(button);
expect(screen.getByText("Success")).toBeInTheDocument(); // May fail

// ✅ Good: Wait for async update
await userEventclick(button);
await waitFor(() => {
  expect(screen.getByText("Success")).toBeInTheDocument();
});
```

## Running Tests

---

```bash
# Run all component tests
pnpm test --project=components

# Run single file
pnpm test profile-settings-form.test.tsx

# Run in watch mode
pnpm test:watch

# Run with UI
pnpm test --ui

# Run with coverage
pnpm test:coverage
```

## Further Reading

---

- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro)
- [Kent C. Dodds: Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Library Cheatsheet](https://testing-library.com/docs/dom-testing-library/cheatsheet)
- [userEvent API](https://testing-library.com/docs/user-event/intro)
- [MSW Documentation](https://mswjs.io/)

---

**Last Updated:** January 2025
