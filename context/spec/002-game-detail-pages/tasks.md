# Tasks: Game Detail Pages

**Specification:** [functional-spec.md](./functional-spec.md) | [technical-considerations.md](./technical-considerations.md)

**Status:** In Progress

**Last Updated:** 2025-11-05

---

## Implementation Strategy

This task list follows the **Vertical Slicing** principle. Each main task represents a small, end-to-end, runnable increment of the feature. After completing each slice, the application remains in a working, deployable state.

---

## Task List

### **Slice 1: Basic game detail page with static IGDB data (title + description only)**
- [x] Add `slug` and `franchiseId` fields to `Game` model in Prisma schema
- [x] Create and run Prisma migration for Game model updates
- [x] Add `getGameDetailsBySlug()` method to `IgdbService` (fetches game by slug from IGDB)
- [x] Update IGDB types to include `slug` field in `SearchResponse` and `FullGameInfoResponse`
- [x] Create `app/games/[slug]/page.tsx` (Server Component) that fetches game from IGDB and displays title + description only
- [x] Create basic `GameDetailLayout` component (simple single-column layout for now)
- [x] Verify navigation: Update search results to link to `/games/[slug]` route
- [x] Test: Navigate from search to a game detail page and see title + description

---

### **Slice 2: Display game cover image with placeholder support**
- [x] Create `GameCoverImage` component that displays cover or placeholder ("No cover available")
- [x] Add `GameCoverImage` to the game detail page layout
- [x] Write component tests for `GameCoverImage` (cover exists vs. placeholder)
- [x] Test: View a game with cover image and a game without cover image

---

### **Slice 3: Display release date**
- [x] Add release date display logic to game detail page (format: "MMM dd, yyyy" or "N/A")
- [x] Test: View game with release date and game without release date

---

### **Slice 4: Display platforms as badges**
- [x] Move `PlatformBadges` component from `features/game-search/ui/` to `shared/components/`
- [x] Update imports in search feature to use new path
- [x] Add `PlatformBadges` to game detail page
- [x] Test: Verify search page still works and game detail shows platform badges

---

### **Slice 5: Display genres as badges**
- [x] Create `GenreBadges` component (reusable, similar to `PlatformBadges`)
- [x] Add `GenreBadges` to game detail page
- [x] Write component tests for `GenreBadges`
- [x] Test: View game with genres and game without genres

---

### **Slice 6: Display times to beat (or dashes if unavailable)**
- [x] Add `getTimesToBeat()` method to `IgdbService` (queries IGDB `game_time_to_beats` endpoint)
- [x] Create `TimesToBeatSection` component (displays "Main Story" and "100% Completion" or dashes)
- [x] Integrate `TimesToBeatSection` into game detail page (fetch times to beat in parallel with main game data)
- [x] Write component tests for `TimesToBeatSection`
- [x] Test: View game with time data and game without time data

---

### **Slice 7: Implement two-column responsive layout with sticky sidebar**
- [x] Update `GameDetailLayout` to use two-column layout (left: cover + actions, right: metadata)
- [x] Add sticky positioning for cover image on desktop
- [x] Implement mobile responsive layout (stacked vertical)
- [x] Test: Verify layout on desktop and mobile, test sticky cover scroll behavior

---

### **Slice 8: Database population - create Genre and Platform tables**
- [x] Create Prisma migration for `Genre`, `Platform`, `GameGenre`, `GamePlatform` tables
- [x] Run migration
- [x] Implement `genre-repository.ts` with `upsertGenre()` and `upsertGenres()` functions
- [x] Implement `platform-repository.ts` with `upsertPlatform()` and `upsertPlatforms()` functions
- [x] Write integration tests for genre and platform repositories
- [x] Test: Verify tables exist and upsert operations work

---

### **Slice 9: Background database population for games**
- [x] Implement `game-repository.ts` with `createGameWithRelations()`, `findGameBySlug()`, `findGameByIgdbId()`, and `gameExistsByIgdbId()` functions
- [x] Create `GameDetailService` with `populateGameInDatabase()` method (background fire-and-forget job)
- [x] Create `use-cases/get-game-details.ts` that orchestrates: IGDB fetch → background population → return game data
- [x] Update `app/games/[slug]/page.tsx` to call the use-case instead of calling IGDB directly
- [x] Write integration tests for game repository and service
- [x] Test: Navigate to game detail page, verify game is populated in database (check via Prisma Studio)

---

### **Slice 10: Display related games (franchise games) with expand/collapse**
- [x] Add `getFranchiseGames()` method to `IgdbService`
- [x] Create `RelatedGamesSection` component (displays first 5 games, with "View More" button if > 5)
- [x] Integrate `RelatedGamesSection` into game detail page (fetch franchise games in parallel)
- [x] Write component tests for `RelatedGamesSection` (5 games, 10 games, expand/collapse)
- [x] Test: View game with related games, test expand/collapse behavior

---

### **Slice 11: Display user's library status (if game is in library)**
- [x] Add `findMostRecentLibraryItemByGameId()` and `findAllLibraryItemsByGameId()` to `library-repository.ts`
- [x] Update `get-game-details.ts` use-case to fetch user library status (if game exists in DB)
- [x] Create `LibraryStatusDisplay` component (shows status + "Manage Library" button placeholder)
- [x] Integrate `LibraryStatusDisplay` into `GameDetailSidebar`
- [x] Test: Add a game to library manually (via Prisma Studio), verify status displays on detail page

---

### **Slice 12: Display journal entries (last 3) for the game**
- [x] Implement `journal-repository.ts` with `findJournalEntriesByGameId()` and `countJournalEntriesByGameId()`
- [x] Update `get-game-details.ts` use-case to fetch journal entries (if game exists in DB)
- [x] Create `JournalEntriesSection` component (displays last 3 entries or "No journal entries yet")
- [x] Add "Write Your First Entry" and "Write New Entry" button placeholders (no functionality yet)
- [x] Integrate `JournalEntriesSection` into game detail page
- [x] Write integration tests for journal repository
- [x] Test: Add journal entries manually (via Prisma Studio), verify they display on detail page

---

### **Slice 13: Implement "Add to Library" functionality**
- [x] Create `schemas.ts` with `AddToLibrarySchema`, `UpdateLibraryStatusSchema`, `UpdateLibraryEntrySchema`
- [x] Implement `addToLibraryAction` in `server-actions/library-actions.ts`
- [x] Create `AddToLibraryButton` component (opens modal)
- [x] Create `LibraryModal` component (unified modal for add/manage library)
- [x] Integrate "Add to Library" button into `GameDetailSidebar` (only shown if game NOT in library)
- [x] Wire up modal submit to call `addToLibraryAction`
- [x] Test: Add game to library via modal, verify it appears in database and page updates

---

### **Slice 14: Implement quick action buttons for library status updates**
- [x] Implement `updateLibraryStatusAction` in `server-actions/library-actions.ts`
- [x] Create `QuickActionButtons` component (all journey status buttons with icons)
- [x] Integrate `QuickActionButtons` into `GameDetailSidebar`
- [x] Wire up quick action buttons to call `updateLibraryStatusAction`
- [x] Highlight currently active status button
- [x] Test: Click quick action buttons, verify library status updates in real-time

---

### **Slice 15: Implement "Manage Library" modal for editing existing entries**
- [x] Implement `updateLibraryEntryAction` in `server-actions/library-actions.ts`
- [x] Update `LibraryModal` to support editing existing entries (show all library items for game)
- [x] Wire up "Manage Library" button in `LibraryStatusDisplay` to open modal
- [x] Test: Open "Manage Library" modal, edit status, verify updates persist

---

### **Slice 16: Loading states and skeleton UI**
- [x] Create `GameDetailSkeleton` component (mimics page structure with placeholders)
- [x] Add `Loading()` function to `app/games/[slug]/page.tsx`
- [x] Test: Navigate to game detail page with throttled network, verify skeleton displays

---

### **Slice 17: Error handling - "Not Found" page for invalid slugs**
- [x] Create `app/games/[slug]/not-found.tsx` (Not Found page with search input)
- [x] Update `page.tsx` to call `notFound()` if game not found in IGDB
- [x] Test: Navigate to `/games/invalid-slug`, verify "Not Found" page displays

---

### **Slice 18: Error handling - Missing IGDB data placeholders**
- [x] Add placeholder logic for missing description ("No description available")
- [x] Add placeholder logic for missing cover (already done in Slice 2)
- [x] Add placeholder logic for missing release date ("N/A")
- [x] Add placeholder logic for missing times to beat (dashes, already done in Slice 6)
- [x] Hide genres/platforms sections if no data
- [x] Hide related games section if no data
- [x] Test: View games with various missing fields, verify placeholders display correctly

---

### **Slice 19: Integration tests for server actions**
- [x] Write integration tests for `addToLibraryAction`
- [x] Write integration tests for `updateLibraryStatusAction`
- [x] Write integration tests for `updateLibraryEntryAction`
- [x] Test: Run all server action tests, verify 80%+ coverage

---

### **Slice 20: Final polish and accessibility**
- [ ] Verify mobile responsive layout (all breakpoints)
- [ ] Test sticky cover image positioning on various screen sizes
- [ ] Accessibility audit: keyboard navigation for quick actions and modals
- [ ] Accessibility audit: screen reader support for all interactive elements
- [ ] Performance testing: measure page load times for initial IGDB fetch
- [ ] Performance testing: verify background population doesn't block UI
- [ ] Test: Complete end-to-end flow from search → detail → add to library → quick action update

---

## Progress Summary

**Total Slices:** 20
**Completed:** 19
**In Progress:** 0
**Remaining:** 1

---

## Notes

- Each slice is designed to be independently testable and deployable
- After completing each slice, run the application to verify it still works
- Some slices build on previous slices (e.g., Slice 9 depends on Slice 8)
- Testing is integrated throughout - verify each slice works before moving to the next
- The application remains in a runnable state after every completed slice
