# Tasks: Game Detail Pages

**Specification:** [functional-spec.md](./functional-spec.md) | [technical-considerations.md](./technical-considerations.md)

**Status:** Ready for Implementation

**Last Updated:** 2025-01-04

---

## Implementation Strategy

This task list follows the **Vertical Slicing** principle. Each main task represents a small, end-to-end, runnable increment of the feature. After completing each slice, the application remains in a working, deployable state.

---

## Task List

### **Slice 1: Basic game detail page with static IGDB data (title + description only)**
- [ ] Add `slug` and `franchiseId` fields to `Game` model in Prisma schema
- [ ] Create and run Prisma migration for Game model updates
- [ ] Add `getGameDetailsBySlug()` method to `IgdbService` (fetches game by slug from IGDB)
- [ ] Update IGDB types to include `slug` field in `SearchResponse` and `FullGameInfoResponse`
- [ ] Create `app/games/[slug]/page.tsx` (Server Component) that fetches game from IGDB and displays title + description only
- [ ] Create basic `GameDetailLayout` component (simple single-column layout for now)
- [ ] Verify navigation: Update search results to link to `/games/[slug]` route
- [ ] Test: Navigate from search to a game detail page and see title + description

---

### **Slice 2: Display game cover image with placeholder support**
- [ ] Create `GameCoverImage` component that displays cover or placeholder ("No cover available")
- [ ] Add `GameCoverImage` to the game detail page layout
- [ ] Write component tests for `GameCoverImage` (cover exists vs. placeholder)
- [ ] Test: View a game with cover image and a game without cover image

---

### **Slice 3: Display release date**
- [ ] Add release date display logic to game detail page (format: "MMM dd, yyyy" or "N/A")
- [ ] Test: View game with release date and game without release date

---

### **Slice 4: Display platforms as badges**
- [ ] Move `PlatformBadges` component from `features/game-search/ui/` to `shared/components/`
- [ ] Update imports in search feature to use new path
- [ ] Add `PlatformBadges` to game detail page
- [ ] Test: Verify search page still works and game detail shows platform badges

---

### **Slice 5: Display genres as badges**
- [ ] Create `GenreBadges` component (reusable, similar to `PlatformBadges`)
- [ ] Add `GenreBadges` to game detail page
- [ ] Write component tests for `GenreBadges`
- [ ] Test: View game with genres and game without genres

---

### **Slice 6: Display times to beat (or dashes if unavailable)**
- [ ] Add `getTimesToBeat()` method to `IgdbService` (queries IGDB `game_time_to_beats` endpoint)
- [ ] Create `TimesToBeatSection` component (displays "Main Story" and "100% Completion" or dashes)
- [ ] Integrate `TimesToBeatSection` into game detail page (fetch times to beat in parallel with main game data)
- [ ] Write component tests for `TimesToBeatSection`
- [ ] Test: View game with time data and game without time data

---

### **Slice 7: Implement two-column responsive layout with sticky sidebar**
- [ ] Update `GameDetailLayout` to use two-column layout (left: cover + actions, right: metadata)
- [ ] Add sticky positioning for cover image on desktop
- [ ] Implement mobile responsive layout (stacked vertical)
- [ ] Test: Verify layout on desktop and mobile, test sticky cover scroll behavior

---

### **Slice 8: Database population - create Genre and Platform tables**
- [ ] Create Prisma migration for `Genre`, `Platform`, `GameGenre`, `GamePlatform` tables
- [ ] Run migration
- [ ] Implement `genre-repository.ts` with `upsertGenre()` and `upsertGenres()` functions
- [ ] Implement `platform-repository.ts` with `upsertPlatform()` and `upsertPlatforms()` functions
- [ ] Write integration tests for genre and platform repositories
- [ ] Test: Verify tables exist and upsert operations work

---

### **Slice 9: Background database population for games**
- [ ] Implement `game-repository.ts` with `createGameWithRelations()`, `findGameBySlug()`, `findGameByIgdbId()`, and `gameExistsByIgdbId()` functions
- [ ] Create `GameDetailService` with `populateGameInDatabase()` method (background fire-and-forget job)
- [ ] Create `use-cases/get-game-details.ts` that orchestrates: IGDB fetch → background population → return game data
- [ ] Update `app/games/[slug]/page.tsx` to call the use-case instead of calling IGDB directly
- [ ] Write integration tests for game repository and service
- [ ] Test: Navigate to game detail page, verify game is populated in database (check via Prisma Studio)

---

### **Slice 10: Display related games (franchise games) with expand/collapse**
- [ ] Add `getFranchiseGames()` method to `IgdbService`
- [ ] Create `RelatedGamesSection` component (displays first 5 games, with "View More" button if > 5)
- [ ] Integrate `RelatedGamesSection` into game detail page (fetch franchise games in parallel)
- [ ] Write component tests for `RelatedGamesSection` (5 games, 10 games, expand/collapse)
- [ ] Test: View game with related games, test expand/collapse behavior

---

### **Slice 11: Display user's library status (if game is in library)**
- [ ] Add `findMostRecentLibraryItemByGameId()` and `findAllLibraryItemsByGameId()` to `library-repository.ts`
- [ ] Update `get-game-details.ts` use-case to fetch user library status (if game exists in DB)
- [ ] Create `LibraryStatusDisplay` component (shows status + "Manage Library" button placeholder)
- [ ] Integrate `LibraryStatusDisplay` into `GameDetailSidebar`
- [ ] Test: Add a game to library manually (via Prisma Studio), verify status displays on detail page

---

### **Slice 12: Display journal entries (last 3) for the game**
- [ ] Implement `journal-repository.ts` with `findJournalEntriesByGameId()` and `countJournalEntriesByGameId()`
- [ ] Update `get-game-details.ts` use-case to fetch journal entries (if game exists in DB)
- [ ] Create `JournalEntriesSection` component (displays last 3 entries or "No journal entries yet")
- [ ] Add "Write Your First Entry" and "Write New Entry" button placeholders (no functionality yet)
- [ ] Integrate `JournalEntriesSection` into game detail page
- [ ] Write integration tests for journal repository
- [ ] Test: Add journal entries manually (via Prisma Studio), verify they display on detail page

---

### **Slice 13: Implement "Add to Library" functionality**
- [ ] Create `schemas.ts` with `AddToLibrarySchema`, `UpdateLibraryStatusSchema`, `UpdateLibraryEntrySchema`
- [ ] Implement `addToLibraryAction` in `server-actions/library-actions.ts`
- [ ] Create `AddToLibraryButton` component (opens modal)
- [ ] Create `LibraryModal` component (unified modal for add/manage library)
- [ ] Integrate "Add to Library" button into `GameDetailSidebar` (only shown if game NOT in library)
- [ ] Wire up modal submit to call `addToLibraryAction`
- [ ] Test: Add game to library via modal, verify it appears in database and page updates

---

### **Slice 14: Implement quick action buttons for library status updates**
- [ ] Implement `updateLibraryStatusAction` in `server-actions/library-actions.ts`
- [ ] Create `QuickActionButtons` component (all journey status buttons with icons)
- [ ] Integrate `QuickActionButtons` into `GameDetailSidebar`
- [ ] Wire up quick action buttons to call `updateLibraryStatusAction`
- [ ] Highlight currently active status button
- [ ] Test: Click quick action buttons, verify library status updates in real-time

---

### **Slice 15: Implement "Manage Library" modal for editing existing entries**
- [ ] Implement `updateLibraryEntryAction` in `server-actions/library-actions.ts`
- [ ] Update `LibraryModal` to support editing existing entries (show all library items for game)
- [ ] Wire up "Manage Library" button in `LibraryStatusDisplay` to open modal
- [ ] Test: Open "Manage Library" modal, edit status, verify updates persist

---

### **Slice 16: Loading states and skeleton UI**
- [ ] Create `GameDetailSkeleton` component (mimics page structure with placeholders)
- [ ] Add `Loading()` function to `app/games/[slug]/page.tsx`
- [ ] Test: Navigate to game detail page with throttled network, verify skeleton displays

---

### **Slice 17: Error handling - "Not Found" page for invalid slugs**
- [ ] Create `app/games/[slug]/not-found.tsx` (Not Found page with search input)
- [ ] Update `page.tsx` to call `notFound()` if game not found in IGDB
- [ ] Test: Navigate to `/games/invalid-slug`, verify "Not Found" page displays

---

### **Slice 18: Error handling - Missing IGDB data placeholders**
- [ ] Add placeholder logic for missing description ("No description available")
- [ ] Add placeholder logic for missing cover (already done in Slice 2)
- [ ] Add placeholder logic for missing release date ("N/A")
- [ ] Add placeholder logic for missing times to beat (dashes, already done in Slice 6)
- [ ] Hide genres/platforms sections if no data
- [ ] Hide related games section if no data
- [ ] Test: View games with various missing fields, verify placeholders display correctly

---

### **Slice 19: Integration tests for server actions**
- [ ] Write integration tests for `addToLibraryAction`
- [ ] Write integration tests for `updateLibraryStatusAction`
- [ ] Write integration tests for `updateLibraryEntryAction`
- [ ] Test: Run all server action tests, verify 80%+ coverage

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
**Completed:** 0
**In Progress:** 0
**Remaining:** 20

---

## Notes

- Each slice is designed to be independently testable and deployable
- After completing each slice, run the application to verify it still works
- Some slices build on previous slices (e.g., Slice 9 depends on Slice 8)
- Testing is integrated throughout - verify each slice works before moving to the next
- The application remains in a runnable state after every completed slice
