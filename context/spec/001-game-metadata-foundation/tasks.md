# Implementation Tasks: Game Metadata Foundation

**Specification:** [functional-spec.md](./functional-spec.md) | [technical-considerations.md](./technical-considerations.md)

**Status:** Complete (9/9 slices complete)

**Implementation Strategy:** Vertical slicing - each main task delivers working, testable functionality

---

## **Slice 1: Basic Search Page Infrastructure (No Search Yet)**
*Goal: User can navigate to a public `/games/search` page with an input field*

- [x] **Slice 1: Create basic, non-functional search page**
  - [x] Create page component at `app/games/search/page.tsx` with header, description, and layout
  - [x] Create basic `GameSearchInput` component at `features/game-search/ui/game-search-input.tsx` with non-functional input field (no debouncing, no API calls)
  - [x] Add basic styling with Tailwind CSS
  - [x] Verify page loads at `http://localhost:6060/games/search` without errors

---

## **Slice 2: Display Hardcoded Search Results (UI Components Only)**
*Goal: User sees what search results will look like using mock data*

- [x] **Slice 2: Build search result UI with mock data**
  - [x] Create type definitions at `features/game-search/types.ts` for `SearchGameResult` and `GameSearchResponse`
  - [x] Create `GameCard` component at `features/game-search/ui/game-card.tsx` that accepts mock game data
  - [x] Create `GameCoverPlaceholder` component at `features/game-search/ui/game-cover-placeholder.tsx` for missing cover art
  - [x] Create `PlatformBadges` component at `features/game-search/ui/platform-badges.tsx` with tooltip for overflow (max 5 visible)
  - [x] Create `GameSearchResults` component at `features/game-search/ui/game-search-results.tsx` that renders hardcoded mock data (3-4 games)
  - [x] Update `GameSearchInput` to render `GameSearchResults` with mock data when user types ≥3 characters
  - [x] Verify all UI components render correctly with mock data, including cover images, platforms, release dates, and placeholder states

---

## **Slice 3: Backend API Route with Rate Limiting**
*Goal: API endpoint works and can be tested with curl/Postman, returns real IGDB data*

- [x] **Slice 3: Create working API route connected to IGDB service**
  - [x] Create Zod validation schema at `features/game-search/schemas.ts` for search query validation (min 3 chars)
  - [x] Create rate limiting utility at `shared/lib/rate-limit.ts` with IP-based limiting (20 req/hour)
  - [x] Modify `SEARCH_RESULTS_LIMIT` in `data-access-layer/services/igdb/igdb-service.ts` from 20 to 10
  - [x] Create API route at `app/api/games/search/route.ts` with:
    - GET endpoint accepting `?q={query}&offset={offset}` parameters
    - Zod validation for query parameters
    - Rate limiting check
    - Call to `IgdbService.searchGamesByName()`
    - Proper error responses (400, 429, 500)
  - [x] Test API endpoint manually with curl/Postman: `curl "http://localhost:6060/api/games/search?q=zelda"`
  - [x] Verify real IGDB data is returned with proper structure
  - [x] Verify rate limiting works (test 21st request returns 429)

---

## **Slice 4: Connect Frontend to Real API (Basic Search Works)**
*Goal: User can search for games and see real results from IGDB*

- [x] **Slice 4: Wire up frontend to API route with TanStack Query**
  - [x] Create `useGameSearch` hook at `features/game-search/hooks/use-game-search.ts` using `useInfiniteQuery`
  - [x] Update `GameSearchInput` to use debounced value with `useDebouncedValue` hook (500ms delay)
  - [x] Update `GameSearchResults` to use `useGameSearch` hook instead of mock data
  - [x] Implement loading state with pulse animation skeletons (6 skeleton cards)
  - [x] Implement error state display with user-friendly message
  - [x] Implement empty state: "No games found matching '[query]'. Try a different search term."
  - [x] Verify search works end-to-end: type "zelda" → wait 500ms → see real IGDB results
  - [x] Verify minimum 3 characters requirement (no search triggered for 1-2 chars)
  - [x] Verify loading state appears during API call

---

## **Slice 5: Infinite Scroll with "Load More" Button**
*Goal: User can load additional search results beyond the first 10*

- [x] **Slice 5: Implement pagination with "Load More" functionality**
  - [x] Update `GameSearchResults` component to add "Load More" button at bottom of results
  - [x] Wire "Load More" button to `fetchNextPage()` from `useInfiniteQuery`
  - [x] Implement `getNextPageParam` logic in `useGameSearch` hook (return `pages.length * 10` if last page has 10 results)
  - [x] Show loading indicator on "Load More" button while fetching
  - [x] Hide "Load More" button when no more results are available (`hasNextPage === false`)
  - [x] Verify pagination: search "legend" → see 10 results → click "Load More" → see 20 results total
  - [x] Verify "Load More" disappears when all results are fetched

---

## **Slice 6: Error Handling and Edge Cases**
*Goal: Application handles all error states gracefully*

- [x] **Slice 6: Comprehensive error handling and edge cases**
  - [x] Update API route to handle IGDB service failures with proper error message
  - [x] Update `GameSearchResults` to display rate limit error (429) with message: "Rate limit exceeded. Try again later."
  - [x] Update `GameSearchResults` to display generic error message for 500 errors
  - [x] Test and verify error handling:
    - IGDB API down (mock service failure) → see "temporarily unavailable" message
    - Rate limit exceeded → see rate limit message
    - Search with special characters (e.g., "zelda@#$") → no errors, graceful handling
  - [x] Verify placeholder covers display when IGDB game has no `cover.image_id`
  - [x] Verify "Unspecified" displays for games with no release date (if applicable per IGDB data)

---

## **Slice 7: Testing and Quality Assurance**
*Goal: All code is tested and meets quality standards*

- [x] **Slice 7: Write comprehensive tests**
  - [x] Write unit tests for `shared/lib/rate-limit.unit.test.ts`:
    - Test first 20 requests allowed
    - Test 21st request denied
    - Test window expiry resets counter
  - [x] Write integration tests for `app/api/games/search/route.integration.test.ts` with MSW:
    - Test valid query returns 200 with games
    - Test query <3 chars returns 400
    - Test rate limit returns 429
    - Test IGDB failure returns 500
  - [x] Write component tests for `features/game-search/ui/game-search-input.test.tsx`:
    - Test debouncing (500ms delay)
    - Test minimum 3 characters before search
    - Test user modification scenarios (clearing, changing search)
  - [x] Run all tests and verify ≥80% coverage: `pnpm test --coverage`
  - [x] Run linting and type checking: `pnpm ci:check`

---

## **Slice 8: Mobile Responsiveness and Accessibility**
*Goal: Search works perfectly on mobile and meets accessibility standards*

- [x] **Slice 8: Mobile and accessibility enhancements**
  - [x] Test responsive grid layout at mobile (375px), tablet (768px), and desktop (1024px) breakpoints
  - [x] Verify game cards render correctly in 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
  - [x] Add `aria-label` to search input: "Search for games by name"
  - [x] Add `role="status"` to loading state for screen readers
  - [x] Add `aria-live="polite"` to search results container for dynamic content announcements
  - [x] Test keyboard navigation: Tab through input → results → "Load More" button
  - [x] Add `loading="lazy"` attribute to cover art images for performance
  - [x] Test on actual mobile device or Chrome DevTools mobile emulation
  - [x] Run Lighthouse audit and verify Performance score ≥90

---

## **Slice 9: Documentation and Final Review**
*Goal: Feature is documented and ready for deployment*

- [x] **Slice 9: Documentation and cleanup**
  - [x] Update `CLAUDE.md` if any new architectural patterns were introduced (likely not needed)
  - [x] Verify no `console.log` statements left in code
  - [x] Run final end-to-end smoke test: search → load more → verify UI/UX
  - [x] Create pull request with detailed description linking to functional spec
  - [x] Mark all acceptance criteria in `functional-spec.md` as completed

---

## Progress Tracking

**Completion Status:**
- [x] Slice 1: Basic search page infrastructure
- [x] Slice 2: UI components with mock data
- [x] Slice 3: Backend API with IGDB integration
- [x] Slice 4: Frontend connected to real API
- [x] Slice 5: Pagination with "Load More"
- [x] Slice 6: Error handling and edge cases
- [x] Slice 7: Testing and quality assurance
- [x] Slice 8: Mobile responsiveness and accessibility
- [x] Slice 9: Documentation and final review

---

**Key Principle:** After completing each slice, run `pnpm dev`, navigate to `/games/search`, and verify the application works without errors with incremental new functionality visible or testable.
