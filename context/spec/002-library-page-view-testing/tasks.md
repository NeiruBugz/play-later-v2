# Tasks: Library Page View Component Testing

## Overview

This task list implements comprehensive component testing for `LibraryPageView`. Each slice produces a runnable test suite that can be executed with `pnpm test`.

---

## Task List

- [x] **Slice 1: Create test fixtures for library data**
  - **Assigned to:** `testing-expert`
  - [x] Create `test/fixtures/library.ts` with `libraryItemsFixture` array (3+ items covering different statuses)
  - [x] Add `uniquePlatformsFixture` array with 3 platform entries
  - [x] Add `emptyLibraryFixture` export for empty state testing
  - [x] Verify fixtures match `LibraryItemWithGameDomain` and `UniquePlatformResult` types

- [x] **Slice 2: Add stateful navigation mock to test file**
  - **Assigned to:** `testing-expert`
  - [x] Create `createNavigationMock()` utility function in `library-page-view.test.tsx`
  - [x] Mock `useRouter` to return object with `mockPush` that updates internal state
  - [x] Mock `useSearchParams` to return the current params state
  - [x] Add `beforeEach` hook to initialize navigation mock

- [x] **Slice 3: Add MSW handlers for library API endpoints**
  - **Assigned to:** `testing-expert`
  - [x] Create `createLibraryHandlers()` function returning handlers array
  - [x] Add `/api/library` handler with status/platform/search filtering
  - [x] Add `/api/library` handler with sortBy/sortOrder support
  - [x] Add `/api/library/unique-platforms` handler returning fixtures
  - [x] Set up local MSW server with `beforeAll`/`afterAll`/`afterEach` lifecycle

- [x] **Slice 4: Test initial page render**
  - **Assigned to:** `testing-expert`
  - [x] Add `elements` object with queries for heading, sort select, platform filter, search input
  - [x] Add `elements` queries for all status buttons (All Statuses + 6 status types)
  - [x] Write test: "displays all filter controls"
  - [x] Write test: "displays all status buttons"
  - [x] Write test: "displays sort select with default value"

- [x] **Slice 5: Test status filtering behavior**
  - **Assigned to:** `testing-expert`
  - [x] Add `actions.clickStatusButton()` helper
  - [x] Add `actions.clickAllStatuses()` helper
  - [x] Write test: "updates aria-pressed state on clicked status"
  - [x] Write test: "clears aria-pressed on All Statuses when status selected"
  - [x] Write test: "calls router.push with correct status param"

- [x] **Slice 6: Test platform filtering behavior**
  - **Assigned to:** `testing-expert`
  - [x] Write test: "displays platforms from API in combobox"
  - [x] Write test: "calls router.push with correct platform param"

- [x] **Slice 7: Test search behavior with debounce**
  - **Assigned to:** `testing-expert`
  - [x] Add `actions.typeSearch()` helper
  - [x] Add `vi.useFakeTimers()` setup for debounce control
  - [x] Write test: "debounces search input before updating URL"
  - [x] Write test: "calls router.push with search param after debounce"

- [x] **Slice 8: Test clear filters behavior**
  - **Assigned to:** `testing-expert`
  - [x] Add `actions.clickClearFilters()` helper
  - [x] Write test: "removes all filter params from URL"
  - [x] Write test: "resets all filter UI to default state"

- [x] **Slice 9: Test sort selection behavior**
  - **Assigned to:** `testing-expert`
  - [x] Add `actions.selectSort()` helper
  - [x] Write test: "calls router.push with sortBy and sortOrder params"
  - [x] Write test: "displays selected sort option"

- [x] **Slice 10: Test empty and error states**
  - **Assigned to:** `testing-expert`
  - [x] Add `elements.queryEmptyState()` and `elements.queryErrorState()` queries
  - [x] Write test: "displays empty state component" (using `server.use()` to override)
  - [x] Write test: "displays error state component" (using `server.use()` with error response)
