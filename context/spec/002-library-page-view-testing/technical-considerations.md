# Technical Specification: Library Page View Component Testing

- **Functional Specification:** `context/spec/002-library-page-view-testing/functional-spec.md`
- **Status:** Approved
- **Author(s):** Claude

---

## 1. High-Level Technical Approach

This implementation adds comprehensive component testing infrastructure for `LibraryPageView` by:

1. **Stateful Navigation Mock** - A local utility that synchronizes `router.push` with `useSearchParams` return values
2. **MSW Handlers** - Local API mocks for `/api/library` and `/api/library/unique-platforms` with filter/sort support
3. **Test Fixtures** - Shared fixtures in `test/fixtures/library.ts` for library items and platforms
4. **Comprehensive Test Suite** - BDD-style tests covering filtering, sorting, and edge cases

No architectural changes required - this extends existing test infrastructure patterns.

---

## 2. Proposed Solution & Implementation Plan

### Component Breakdown

**New Files:**
| File | Purpose |
|------|---------|
| `test/fixtures/library.ts` | Library items and platforms fixture data |
| (Updated) `features/library/ui/library-page-view.test.tsx` | Expanded test suite |

**No changes to:**
- `test/setup/client-setup.ts` (MSW handlers are local to test file)
- `test/setup/common-mocks.ts` (navigation mock override is local)

---

### Implementation Details

#### 2.1 Stateful Navigation Mock (in test file)

```typescript
// features/library/ui/library-page-view.test.tsx
import { useRouter, useSearchParams } from "next/navigation";

const createNavigationMock = () => {
  let currentParams = new URLSearchParams();

  const mockPush = vi.fn((url: string) => {
    const urlObj = new URL(url, "http://localhost");
    currentParams = urlObj.searchParams;
  });

  vi.mocked(useRouter).mockReturnValue({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  });

  vi.mocked(useSearchParams).mockImplementation(() => currentParams);

  return { mockPush, getParams: () => currentParams };
};
```

#### 2.2 Test Fixtures

```typescript
// test/fixtures/library.ts
import type { LibraryItemWithGameDomain } from "@/shared/types";
import type { UniquePlatformResult } from "@/shared/types/platform";

export const libraryItemsFixture: LibraryItemWithGameDomain[] = [
  {
    id: "lib-1",
    status: "CURIOUS_ABOUT",
    platform: { id: "plat-1", name: "PC (Windows)", igdbId: 6 },
    game: {
      id: "game-1",
      name: "The Witcher 3",
      slug: "the-witcher-3",
      coverUrl: "/covers/witcher3.jpg",
    },
    createdAt: new Date("2024-01-15"),
    startedAt: null,
    completedAt: null,
  },
  {
    id: "lib-2",
    status: "CURRENTLY_EXPLORING",
    platform: { id: "plat-2", name: "PlayStation 5", igdbId: 167 },
    game: {
      id: "game-2",
      name: "Elden Ring",
      slug: "elden-ring",
      coverUrl: "/covers/eldenring.jpg",
    },
    createdAt: new Date("2024-01-10"),
    startedAt: new Date("2024-01-12"),
    completedAt: null,
  },
  {
    id: "lib-3",
    status: "EXPERIENCED",
    platform: { id: "plat-1", name: "PC (Windows)", igdbId: 6 },
    game: {
      id: "game-3",
      name: "Hades",
      slug: "hades",
      coverUrl: "/covers/hades.jpg",
    },
    createdAt: new Date("2024-01-05"),
    startedAt: new Date("2024-01-06"),
    completedAt: new Date("2024-01-20"),
  },
  // Additional items for each status...
];

export const uniquePlatformsFixture: UniquePlatformResult[] = [
  { id: "plat-1", name: "PC (Windows)", igdbId: 6 },
  { id: "plat-2", name: "PlayStation 5", igdbId: 167 },
  { id: "plat-3", name: "Nintendo Switch", igdbId: 130 },
];

// Helper for empty/error state testing
export const emptyLibraryFixture: LibraryItemWithGameDomain[] = [];
```

#### 2.3 Local MSW Handlers (in test file)

```typescript
// features/library/ui/library-page-view.test.tsx
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { libraryItemsFixture, uniquePlatformsFixture } from "@/test/fixtures/library";

const createLibraryHandlers = (items = libraryItemsFixture) => [
  http.get("/api/library", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const platform = url.searchParams.get("platform");
    const search = url.searchParams.get("search");
    const sortBy = url.searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") ?? "desc";

    let filtered = [...items];

    if (status) {
      filtered = filtered.filter((item) => item.status === status);
    }
    if (platform) {
      filtered = filtered.filter((item) => item.platform?.name === platform);
    }
    if (search) {
      filtered = filtered.filter((item) =>
        item.game.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a];
      const bVal = b[sortBy as keyof typeof b];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return HttpResponse.json({ success: true, data: filtered });
  }),

  http.get("/api/library/unique-platforms", () => {
    return HttpResponse.json({
      success: true,
      data: { platforms: uniquePlatformsFixture },
    });
  }),
];

const server = setupServer(...createLibraryHandlers());
```

#### 2.4 Test Suite Structure

```typescript
// features/library/ui/library-page-view.test.tsx

const elements = {
  getHeading: () => screen.getByRole("heading", { name: "My Library" }),
  getSortSelect: () => screen.getByRole("combobox", { name: "Sort by" }),
  getPlatformFilter: () => screen.getByRole("combobox", { name: "Filter by platform" }),
  getSearchInput: () => screen.getByRole("searchbox", { name: "Search games by title" }),
  getAllStatusesButton: () => screen.getByRole("button", { name: "Show all statuses" }),
  getStatusButton: (status: string) => screen.getByRole("button", { name: `Filter by ${status}` }),
  getClearFiltersButton: () => screen.getByRole("button", { name: "Clear all filters" }),
  getLibraryGrid: () => screen.getByRole("feed", { name: "Your game library" }),
  queryEmptyState: () => screen.queryByText(/no games/i),
  queryErrorState: () => screen.queryByText(/failed to load/i),
};

const actions = {
  clickStatusButton: (status: string) => userEvent.click(elements.getStatusButton(status)),
  clickAllStatuses: () => userEvent.click(elements.getAllStatusesButton()),
  clickClearFilters: () => userEvent.click(elements.getClearFiltersButton()),
  typeSearch: (value: string) => userEvent.type(elements.getSearchInput(), value),
  selectSort: async (option: string) => {
    await userEvent.click(elements.getSortSelect());
    await userEvent.click(screen.getByRole("option", { name: option }));
  },
};

describe("LibraryPageView", () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });
  afterAll(() => server.close());

  beforeEach(() => {
    createNavigationMock();
  });

  describe("given page renders", () => {
    it("displays all filter controls", async () => { /* ... */ });
    it("displays all status buttons", async () => { /* ... */ });
    it("displays sort select with default value", async () => { /* ... */ });
  });

  describe("given user filters by status", () => {
    it("updates aria-pressed state on clicked status", async () => { /* ... */ });
    it("clears aria-pressed on All Statuses when status selected", async () => { /* ... */ });
    it("calls router.push with correct status param", async () => { /* ... */ });
  });

  describe("given user filters by platform", () => {
    it("displays platforms from API in combobox", async () => { /* ... */ });
    it("calls router.push with correct platform param", async () => { /* ... */ });
  });

  describe("given user searches", () => {
    it("debounces search input before updating URL", async () => { /* ... */ });
    it("calls router.push with search param after debounce", async () => { /* ... */ });
  });

  describe("given user clears filters", () => {
    it("removes all filter params from URL", async () => { /* ... */ });
    it("resets all filter UI to default state", async () => { /* ... */ });
  });

  describe("given user changes sort", () => {
    it("calls router.push with sortBy and sortOrder params", async () => { /* ... */ });
    it("displays selected sort option", async () => { /* ... */ });
  });

  describe("given empty library", () => {
    it("displays empty state component", async () => { /* ... */ });
  });

  describe("given API error", () => {
    it("displays error state component", async () => { /* ... */ });
  });
});
```

---

## 3. Impact and Risk Analysis

### System Dependencies
- **Test infrastructure only** - No production code changes
- **Existing MSW setup** - Handlers are local, no conflict with `client-setup.ts`
- **TanStack Query** - Tests rely on QueryClientProvider from `TestProviders`

### Potential Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Navigation mock doesn't trigger re-renders | Medium | Use `act()` wrapper or trigger manual re-render after `router.push` |
| Debounce timing causes flaky tests | Medium | Use `vi.useFakeTimers()` to control debounce timing |
| MSW handler conflicts with global setup | Low | Local handlers take precedence; use `server.use()` for overrides |

---

## 4. Testing Strategy

This spec IS the testing strategy. Verification that the implementation is correct:

1. **Run test suite:** `pnpm test features/library/ui/library-page-view.test.tsx`
2. **Verify all acceptance criteria** from functional spec pass
3. **Check coverage:** Filter/sort code paths should show coverage increase

**Success Criteria:**
- [ ] All 15+ test cases pass
- [ ] No flaky tests on repeated runs
- [ ] Status filter `aria-pressed` states verified
- [ ] Sort selection updates URL correctly
- [ ] Empty and error states render appropriately
