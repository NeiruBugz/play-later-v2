# Functional Specification: Library Page View Component Testing

- **Roadmap Item:** Technical Foundation & Refactoring (Component Testing Infrastructure)
- **Status:** Approved
- **Author:** Claude

---

## 1. Overview and Rationale (The "Why")

### Problem Statement
Developers cannot write comprehensive tests for the `LibraryPageView` component because the current test infrastructure lacks:
1. **Stateful navigation mocks** - `useSearchParams` returns static empty values and doesn't reflect URL changes after `router.push` is called
2. **API response mocks** - No MSW handlers exist for `/api/library` and `/api/library/unique-platforms` endpoints

This means filter/sort interactions cannot be verified through their UI effects (e.g., `aria-pressed` state changes), reducing confidence in code changes and allowing potential regressions.

### Desired Outcome
A complete test suite for `LibraryPageView` that verifies filtering and sorting behaviors through realistic user interactions, with proper mocks that simulate actual browser/API behavior.

### Success Metrics
- All filter buttons reflect correct `aria-pressed` state after user clicks
- Sort selection changes are verifiable through URL params
- Tests cover empty, loading, and populated library states
- Test suite runs reliably without flakiness

---

## 2. Functional Requirements (The "What")

### 2.1 Stateful Navigation Mock

**As a** developer writing component tests, **I want** `useSearchParams` to return updated values after `router.push` is called, **so that** I can verify URL-state-driven UI changes.

**Acceptance Criteria:**
- [ ] When a test clicks a status filter button, `router.push` is called with the correct URL params
- [ ] After `router.push`, subsequent renders read the updated `searchParams`
- [ ] The "All Statuses" button shows `aria-pressed="false"` when a specific status is selected
- [ ] The selected status button shows `aria-pressed="true"`
- [ ] Clicking "All Statuses" clears the status filter and reflects in UI

### 2.2 Library API Mock (`/api/library`)

**As a** developer writing component tests, **I want** the `/api/library` endpoint mocked with realistic responses, **so that** I can test grid rendering and filtering behavior.

**Acceptance Criteria:**
- [ ] Mock returns library items matching the requested `status` filter param
- [ ] Mock returns library items matching the requested `platform` filter param
- [ ] Mock returns library items matching the requested `search` query param
- [ ] Mock returns items sorted by the requested `sortBy` and `sortOrder` params
- [ ] Mock can simulate empty library (returns `[]`)
- [ ] Mock can simulate error state (returns error response)

### 2.3 Unique Platforms API Mock (`/api/library/unique-platforms`)

**As a** developer writing component tests, **I want** the `/api/library/unique-platforms` endpoint mocked, **so that** the platform filter combobox renders correctly.

**Acceptance Criteria:**
- [ ] Mock returns a list of platforms the user has in their library
- [ ] Platform filter combobox displays the mocked platforms
- [ ] Selecting a platform triggers filter update

### 2.4 Test Coverage for Filtering

**As a** developer, **I want** tests that verify filtering behavior, **so that** regressions are caught.

**Acceptance Criteria:**
- [ ] Test: Clicking a status button filters the library to that status
- [ ] Test: Clicking "All Statuses" shows all library items
- [ ] Test: Selecting a platform filters the library to that platform
- [ ] Test: Typing in search input filters library by game title (with debounce)
- [ ] Test: "Clear Filters" button resets all filters

### 2.5 Test Coverage for Sorting

**As a** developer, **I want** tests that verify sorting behavior, **so that** regressions are caught.

**Acceptance Criteria:**
- [ ] Test: Changing sort option updates URL params correctly
- [ ] Test: Default sort is "Recently Added" (createdAt desc)
- [ ] Test: Sort select displays current sort option

---

## 3. Scope and Boundaries

### In-Scope
- Stateful `next/navigation` mock for `LibraryPageView` test file
- MSW handlers for `/api/library` endpoint with filter/sort support
- MSW handlers for `/api/library/unique-platforms` endpoint
- Test cases for status, platform, and search filtering
- Test cases for sort selection
- Test fixtures for library items and platforms

### Out-of-Scope
- Generalizing the navigation mock to a shared utility (separate spec)
- Testing `LibraryCard` component interactions (e.g., quick actions, modal)
- E2E/Playwright tests for the library page
- Testing authentication flows
- Other roadmap items: Gaming Journal, Steam Integration, Discovery features
