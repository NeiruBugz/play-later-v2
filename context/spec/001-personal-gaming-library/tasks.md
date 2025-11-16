# Task List: Personal Gaming Library

**Feature:** Personal Gaming Library (Add Games to Library, Journey Status Tracking, Library View & Organization)

**Specification:** [functional-spec.md](./functional-spec.md) | [technical-considerations.md](./technical-considerations.md)

**Status:** Ready for Implementation

---

## Overview

This task list breaks down the Personal Gaming Library feature into vertical slices. Each main task represents a complete, runnable increment of functionality. The application will remain in a working state after completing each slice.

**Architecture Flow:** Repository → Service → Handler → API/Action → UI

**Available Domain Experts:**
- **nextjs-backend-expert**: Next.js backend (API routes, Server Actions, Prisma, services, handlers)
- **nextjs-ui-expert**: Next.js UI (React components with Next.js integration, TanStack Query)
- **react-expert**: Pure React components and patterns
- **testing-expert**: All testing (component, backend, integration)

---

## Phase 1: Repository Layer Foundation

### Slice 1: Repository functions for library data retrieval

- [x] Add `findLibraryItemsWithFilters()` function to `library-repository.ts` with filtering (status, platform, search), sorting (createdAt, releaseDate, startedAt, completedAt), and deduplication support **[Agent: nextjs-backend-expert]**
- [x] Add `findPlatformsForGame()` function to `platform-repository.ts` that returns platforms grouped by support status (supported vs other) **[Agent: nextjs-backend-expert]**
- [x] Write integration tests for both repository functions with real PostgreSQL database covering all filter combinations, sort orders, and edge cases **[Agent: testing-expert]**

---

## Phase 2: Service Layer Enhancement

### Slice 2: Service methods for library operations

- [x] Add `getLibraryItems()` method to `LibraryService` with input validation and Result type pattern **[Agent: nextjs-backend-expert]**
- [x] Add `deleteLibraryItem()` method to `LibraryService` with authorization checks **[Agent: nextjs-backend-expert]**
- [x] Add status transition validation to `updateLibraryItem()` method (block backwards transitions to Wishlist, allow forward progression) **[Agent: nextjs-backend-expert]**
- [x] Write unit tests for all service methods with mocked repositories testing both success and error paths **[Agent: testing-expert]**

---

## Phase 3: Handler and API Layer

### Slice 3: GET /api/library endpoint with handler

- [x] Create `get-library-handler.ts` with Zod input validation, service orchestration, and HandlerResult type **[Agent: nextjs-backend-expert]**
- [x] Create `/app/api/library/route.ts` with authentication check, query parameter parsing, and JSON response formatting **[Agent: nextjs-backend-expert]**
- [x] Write unit tests for handler with mocked services **[Agent: testing-expert]**
- [x] Write integration tests for API route with real authentication and query parameter combinations **[Agent: testing-expert]**

---

## Phase 4: Basic Library View UI

### Slice 4: Library page with empty state (no data fetching yet)

- [x] Create `/app/library/page.tsx` as Server Component with authentication redirect **[Agent: nextjs-ui-expert]**
- [x] Create `features/library/ui/library-empty-state.tsx` component for when no games exist **[Agent: react-expert]**
- [x] Create basic page layout with header and container **[Agent: react-expert]**

### Slice 5: Display library items in a grid

- [x] Create `features/library/hooks/use-library-data.ts` TanStack Query hook to fetch from `/api/library` **[Agent: nextjs-ui-expert]**
- [x] Create `features/library/ui/library-grid.tsx` client component with loading skeleton and error states **[Agent: react-expert]**
- [x] Create `features/library/ui/library-card.tsx` with game cover image, status badge, and hover tooltip for title **[Agent: react-expert]**
- [x] Add library item count badge that shows when multiple entries exist for same game **[Agent: react-expert]**
- [x] Write component tests for grid, card, and empty state using React Testing Library **[Agent: testing-expert]**

---

## Phase 5: Filtering and Sorting

### Slice 6: Client-side filter controls with URL state management

- [x] Create `features/library/hooks/use-library-filters.ts` hook to read URL search params **[Agent: nextjs-ui-expert]**
- [x] Create `features/library/ui/library-filters.tsx` with status dropdown, platform dropdown, and debounced search input that updates URL **[Agent: react-expert]**
- [x] Create `features/library/ui/library-sort-select.tsx` dropdown for sort options **[Agent: react-expert]**
- [x] Wire filters to TanStack Query hook to trigger refetch on URL changes **[Agent: nextjs-ui-expert]**
- [x] Write component tests for filter controls verifying URL updates and debouncing **[Agent: testing-expert]**

---

## Phase 6: Quick Status Updates

### Slice 7: Quick status change from library cards

- [x] Create `features/library/server-actions/update-library-status.ts` server action calling LibraryService **[Agent: nextjs-backend-expert]**
- [x] Create `features/library/hooks/use-update-library-status.ts` TanStack Query mutation hook with optimistic updates and rollback **[Agent: nextjs-ui-expert]**
- [x] Create `features/library/ui/library-card-quick-actions.tsx` dropdown menu with status options and disabled state for Wishlist transition **[Agent: react-expert]**
- [x] Add toast notifications for success/error feedback **[Agent: react-expert]**
- [x] Write server action tests with mocked services **[Agent: testing-expert]**
- [x] Write component tests for quick actions dropdown and mutation hook **[Agent: testing-expert]**

---

## Phase 7: Enhanced Add to Library Form

### Slice 8: Platform selection (required) in Add to Library form

- [x] Update `AddToLibrarySchema` in `features/game-detail/schemas.ts` to make platform required **[Agent: nextjs-backend-expert]**
- [x] Create platform Combobox component in `features/game-detail/ui/library-modal/` showing supported platforms at top with divider **[Agent: react-expert]**
- [x] Fetch platforms for game using repository function and display in grouped dropdown **[Agent: nextjs-ui-expert]**
- [x] Update service and repository to persist platform with library item **[Agent: nextjs-backend-expert]**
- [x] Write component tests for platform selection with supported/other grouping **[Agent: testing-expert]**

### Slice 9: Optional date fields in Add to Library form

- [x] Update `AddToLibrarySchema` to accept optional `startedAt` and `completedAt` dates **[Agent: nextjs-backend-expert]**
- [x] Add DatePicker components for Started At and Completed At fields **[Agent: react-expert]**
- [x] Update `LibraryService.addGameToLibrary()` to accept and persist date fields **[Agent: nextjs-backend-expert]**
- [x] Write form tests verifying date field validation and submission **[Agent: testing-expert]**

---

## Phase 8: Library Management Modal

### Slice 10: View all library items for a game

- [x] Enhance `features/game-detail/ui/library-modal/library-modal.tsx` to fetch and display all library items using existing service **[Agent: nextjs-ui-expert]**
- [x] Display list of entries showing platform, status, dates, and created/updated timestamps **[Agent: react-expert]**
- [x] Write component tests for library item list display **[Agent: testing-expert]**

### Slice 11: Delete library items from modal

- [x] Create `features/game-detail/server-actions/delete-library-item.ts` server action **[Agent: nextjs-backend-expert]**
- [x] Add delete button with confirmation dialog to each library entry **[Agent: react-expert]**
- [x] Implement page revalidation after successful deletion **[Agent: nextjs-ui-expert]**
- [x] Write server action tests and component tests for delete functionality **[Agent: testing-expert]**

### Slice 12: Edit restrictions for platform field

- [x] Make platform field read-only in edit mode with explanatory message **[Agent: react-expert]**
- [x] Allow editing of status, startedAt, and completedAt fields **[Agent: react-expert]**
- [x] Write component tests verifying platform field is disabled in edit mode **[Agent: testing-expert]**

---

## Phase 9: Polish and Quality Assurance

### Slice 13: Accessibility and responsive design

- [x] Ensure all components support keyboard navigation and screen readers **[Agent: react-expert]**
- [x] Test mobile responsive layouts for library grid and filters **[Agent: react-expert]**
- [x] Verify WCAG AA compliance for color contrast and interactive elements **[Agent: react-expert]**

### Slice 14: Performance testing and optimization

- [ ] Test library view with 500+ games and measure query performance **[Agent: nextjs-backend-expert]**
- [ ] Add logging for slow queries (> 500ms threshold) **[Agent: nextjs-backend-expert]**
- [ ] Verify TanStack Query caching strategy (staleTime: 30s, gcTime: 5min) **[Agent: nextjs-ui-expert]**

### Slice 15: End-to-end testing and cross-browser validation

- [ ] Manual testing of complete user flow: sign in → add game → view library → filter → update status → manage library items → delete **[Agent: general-purpose]**
- [ ] Cross-browser testing (Chrome, Firefox, Safari) **[Agent: general-purpose]**
- [ ] Verify toast notifications, loading states, and error messages display correctly **[Agent: general-purpose]**

---

## Implementation Notes

**Vertical Slicing Approach:**
- Each main task slice adds a complete piece of user-visible functionality
- The application remains in a runnable state after each slice
- Slices can be deployed independently (though full feature requires all slices)
- Follows the architecture: Repository → Service → Handler → API/Action → UI

**Agent Assignment Rationale:**
- **nextjs-backend-expert**: All backend layers (repository, service, handler, API routes, server actions) and Prisma
- **nextjs-ui-expert**: Next.js-specific UI concerns (TanStack Query, Server Components, URL state)
- **react-expert**: Pure React components and UI patterns
- **testing-expert**: All testing regardless of layer
- **general-purpose**: Manual testing and cross-browser validation

**Testing Coverage Target:**
- ≥80% coverage for repository, service, handler, and component code
- Integration tests for all repository functions with real database
- Unit tests for services with mocked repositories
- Component tests for all UI elements
- Server action tests for all mutations

**Database:**
- No migrations required (existing schema supports all features)
- Existing indexes support all query patterns
- Platform data already populated from IGDB

---

**Next Step:** Execute tasks with `/awos:implement` command
