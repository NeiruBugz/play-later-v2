# Technical Considerations: Related Games Categorization

## 1. Overview

This document outlines the technical approach for implementing the "Related Games Categorization" feature as described in functional specification `005-related-games-categorization`. The feature aims to enhance the game detail page by displaying related games (DLC, Ports, Remakes, Series) in a categorized, tabbed interface. The implementation will leverage existing IGDB service capabilities and the Next.js App Router architecture.

## 2. High-Level Approach

The core idea is to enrich the `getGameDetails` use-case to process and categorize related game data (DLCs, Ports/Originals, Remakes, and Series) directly from the `FullGameInfoResponse` provided by IGDB. This categorized data will then be passed to a redesigned client component responsible for rendering the tabbed interface.

## 3. Detailed Implementation Plan

### 3.1. Data Layer & Service Modifications

**A. Enhance IGDB Service (Minor Adjustments)**

1.  **Verify `IgdbService.getGameDetails`:** Confirm that the `getGameDetails` method in `savepoint-app/data-access-layer/services/igdb/igdb-service.ts` already fetches all necessary related game fields from IGDB: `dlcs`, `expansions`, `remakes`, `remasters`, `parent_game`, and `franchise/franchises` (for collections).
    *   **Current Status:** Review confirms these fields are already included in the query. No direct modification to the IGDB service query is expected for this feature.

**B. Introduce `categorizeRelatedGames` Helper Function**

1.  **Create New Helper:** A new helper function, `categorizeRelatedGames`, will be created within the `data-access-layer/services/igdb/igdb-helpers.ts` file (or a similar appropriate location for IGDB-specific helpers).
2.  **Function Signature:**
    ```typescript
    interface GameSummary {
        id: number;
        name: string;
        slug: string;
        coverImageId?: string;
    }

    interface CategorizedRelatedGames {
        dlcs: GameSummary[];
        ports: GameSummary[];
        remakes: GameSummary[];
        series: GameSummary[];
    }

    function categorizeRelatedGames(
        currentGame: FullGameInfoResponse,
        franchiseGames: GameSummary[] // Fetched separately for series
    ): CategorizedRelatedGames { /* ... */ }
    ```
3.  **Categorization Logic:**
    *   **DLC:** Combine `currentGame.dlcs`, `currentGame.expansions`, and `currentGame.standalone_expansions` arrays. Ensure uniqueness by ID.
    *   **Ports:** If `currentGame.parent_game` exists, add it to this list. This covers the "original version" use case (e.g., FF7 for FF7 Remake).
    *   **Remakes:** Combine `currentGame.remakes` and `currentGame.remasters` arrays. Ensure uniqueness by ID.
    *   **Series:**
        *   Start with the `franchiseGames` array provided as an argument (which will be fetched via `igdbService.getFranchiseGames`).
        *   Filter out any games from the `series` list that are already present in the `dlcs`, `ports`, or `remakes` categories to prevent duplication, as per functional requirements.
        *   The `getFranchiseGames` method already filters by `ALLOWED_FRANCHISE_GAME_CATEGORIES`, which typically includes "Main Games".

**C. Update `game-detail/use-cases/get-game-details.ts`**

1.  **Fetch Franchise Games:** After fetching the `FullGameInfoResponse` for the `currentGame` (via `igdbService.getGameDetailsBySlug`), extract the `franchiseId` (using `currentGame.franchise` or `currentGame.franchises`).
2.  **Call `igdbService.getFranchiseGames`:** If a `franchiseId` is found, call `igdbService.getFranchiseGames({ franchiseId: /* ... */, currentGameId: currentGame.id })` to get the full list of games in the series. This call supports pagination, which will be managed by the client component for the "Series" tab. The initial call here will fetch the first page of series games.
3.  **Call `categorizeRelatedGames`:** Pass the `currentGame` (FullGameInfoResponse) and the initially fetched `franchiseGames` list to the new `categorizeRelatedGames` helper.
4.  **Update Return Type:** Modify the return type of `getGameDetails` to include `categorizedRelatedGames`.
    ```typescript
    type GameDetailsResult = {
        // ... existing fields ...
        categorizedRelatedGames: CategorizedRelatedGames;
    }
    ```
5.  **Remove `franchiseIds`:** The separate `franchiseIds` field in `GameDetailsResult` will no longer be necessary as categorized games will encapsulate this.

### 3.2. Frontend & UI Component Modifications

**A. Update `savepoint-app/app/games/[slug]/page.tsx`**

1.  **Consume New Data:** The `page.tsx` will now receive the `categorizedRelatedGames` object directly from the `getGameDetails` use-case.
2.  **Pass to Client Component:** Pass this `categorizedRelatedGames` object (and the `igdbId` of the current game) to the (renamed/modified) client component responsible for displaying related games.
3.  **Remove `RelatedGamesServer`:** The existing `RelatedGamesServer` component and its call to `getFranchiseGames` will become redundant. The `page.tsx` will directly pass the already categorized data.

**B. Redesign `browse-related-games/ui/related-games-client.tsx` (or New Component)**

1.  **Rename/Refactor:** Consider renaming `RelatedGamesClient` to `CategorizedRelatedGamesDisplay` or similar to reflect its new purpose.
2.  **Props Update:** Update the component's props to accept the `igdbId` and the `CategorizedRelatedGames` object.
    ```typescript
    interface CategorizedRelatedGamesClientProps {
        igdbId: number;
        categorizedGames: CategorizedRelatedGames;
    }
    ```
3.  **Tab Rendering:**
    *   Use `shadcn/ui` Tabs to render the "DLC", "Ports", "Remakes", and "Series" tabs.
    *   **Tab Ordering:** Ensure the tabs appear in the order: DLC, Ports, Remakes, Series.
    *   **Empty Tab Handling:** Dynamically render `TabsTrigger` and `TabsContent` components only if the corresponding category in `categorizedGames` has items. If a category's list is empty, its tab should not be rendered.
4.  **Content Display:**
    *   Within each `TabsContent`, iterate over the respective game list (`categorizedGames.dlcs`, etc.) and render each game using the existing `GameGrid` and `GameCard` components.
    *   **Infinite Scroll for Series:** The `useInfiniteScroll` and `loadMoreFranchiseGames` logic will be retained and adapted specifically for the "Series" tab. When the "Series" tab is active and more games are available in the franchise, the `loadMoreFranchiseGames` server action will be triggered, fetching the next batch of games for the relevant franchise ID. For DLC, Ports, and Remakes, infinite scroll is not anticipated as these lists are generally fetched in full with the game details.

## 4. System Changes

*   **New File:** `data-access-layer/services/igdb/igdb-helpers.ts` (for `categorizeRelatedGames`).
*   **Modified Files:**
    *   `savepoint-app/features/game-detail/use-cases/get-game-details.ts`
    *   `savepoint-app/app/games/[slug]/page.tsx`
    *   `savepoint-app/features/browse-related-games/ui/related-games-client.tsx` (and its associated types)
    *   `savepoint-app/features/browse-related-games/ui/related-games-server.tsx` (will be removed or significantly altered/removed)
    *   `savepoint-app/features/browse-related-games/index.ts` (exports will change)
    *   `savepoint-app/features/browse-related-games/use-cases/get-franchise-games.ts` (might be simplified if `getFranchiseGames` is directly called from `getGameDetails` use-case).
    *   `savepoint-app/features/browse-related-games/server-actions/load-more-franchise-games.ts` (will be used exclusively for the "Series" tab).

## 5. Data Models

*   **No new database schemas are required.** All data is sourced directly from IGDB and processed for display.
*   New TypeScript interfaces (`GameSummary`, `CategorizedRelatedGames`) will be introduced in appropriate `shared/types` or feature-specific `types.ts` files.

## 6. API

*   **No new API routes are required.** The existing IGDB API (`/games` endpoint for `getGameDetails`, `/games` endpoint for `getFranchiseGames`) will be utilized.
*   The `loadMoreFranchiseGames` server action will continue to serve its purpose for paginating series games.

## 7. Risks and Mitigation

*   **Risk:** Complex logic for categorization within `categorizeRelatedGames` leading to errors or edge cases (e.g., duplicated games, incorrect assignments).
    *   **Mitigation:** Thorough unit testing for `categorizeRelatedGames` with various IGDB `FullGameInfoResponse` mock data to cover different relationship scenarios.
*   **Risk:** Performance degradation due to fetching large amounts of related game data, especially for games with many relationships or large franchises.
    *   **Mitigation:**
        *   Leverage Next.js Server Component caching.
        *   The existing `getGameDetails` already fetches many related fields, so additional load is minimal.
        *   The "Series" tab's pagination via `getFranchiseGames` and `loadMoreFranchiseGames` already handles large collections efficiently.
        *   Monitor performance metrics (API response times, page load times) post-implementation.
*   **Risk:** IGDB data inconsistencies or unexpected structures for game relationships.
    *   **Mitigation:** Defensive coding in `categorizeRelatedGames` (e.g., null checks, type guards). Flexible filtering logic for the "Series" tab to handle diverse `game_type` values if necessary.

## 8. Test Plan

*   **Unit Tests:**
    *   Create new unit tests for the `categorizeRelatedGames` helper function, ensuring it correctly processes `FullGameInfoResponse` into the `CategorizedRelatedGames` structure, handles edge cases (e.g., empty relationship arrays, missing `parent_game`), and correctly filters out duplicates.
*   **Integration Tests:**
    *   Modify existing integration tests for `game-detail/use-cases/get-game-details.ts` to assert that the `categorizedRelatedGames` object is correctly returned with expected content for various game types (e.g., a game with DLC, a remake, an original, a game in a large series).
*   **Component Tests:**
    *   Add/modify component tests for `RelatedGamesClient` (or its new name) to verify:
        *   Correct rendering of tabs for each category with available games.
        *   Tabs for empty categories are correctly hidden.
        *   Correct ordering of tabs.
        *   Game cards are rendered correctly within each tab.
        *   Infinite scroll functionality for the "Series" tab still works as expected.
*   **E2E Tests:**
    *   No new E2E tests are strictly required for this feature, as it primarily enhances an existing page. Existing E2E tests for the game detail page should still pass. If existing E2E tests specifically interact with related games sections, they might need updates to reflect the new tabbed UI.
