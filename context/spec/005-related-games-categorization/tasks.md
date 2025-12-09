- [ ] **Slice 1: Establish basic UI structure for Related Games tabs**
    - [ ] Sub-task: Define new TypeScript interfaces for `GameSummary` and `CategorizedRelatedGames` in `savepoint-app/shared/types/igdb-types.ts`. **[Agent: react-expert]**
    - [ ] Sub-task: Create a new client component `CategorizedRelatedGamesDisplay` (or rename `RelatedGamesClient`) in `savepoint-app/features/browse-related-games/ui/categorized-related-games-display.tsx`. This component should accept `CategorizedRelatedGames` as props and render the `shadcn/ui` Tabs component with placeholders for DLC, Ports, Remakes, and Series, but with no data yet. Ensure tabs are ordered: DLC, Ports, Remakes, Series. Tabs should initially be visible regardless of content. **[Agent: react-expert]**
    - [ ] Sub-task: Update `savepoint-app/app/games/[slug]/page.tsx` to import and render `CategorizedRelatedGamesDisplay`, passing empty mock data for `categorizedGames` to ensure the UI renders without errors. **[Agent: react-expert]**
    - [ ] Sub-task: Remove the existing `RelatedGamesServer` component from `savepoint-app/features/browse-related-games/ui/related-games-server.tsx` and related imports/exports. **[Agent: nextjs-backend-expert]**
    - [ ] Sub-task: Add a basic unit test for `CategorizedRelatedGamesDisplay` to verify it renders the tab structure (even with empty data). **[Agent: testing-expert]**

- [ ] **Slice 2: Implement `categorizeRelatedGames` helper and integrate with `getGameDetails` use-case for initial categories (DLC, Ports, Remakes)**
    - [ ] Sub-task: Create `categorizeRelatedGames` helper function in `savepoint-app/data-access-layer/services/igdb/igdb-helpers.ts` which takes `FullGameInfoResponse` and `franchiseGames` (initially an empty array) and returns `CategorizedRelatedGames`. Implement logic for DLC, Ports, and Remakes based on the spec. For Series, return an empty array for now. **[Agent: nextjs-backend-expert]**
    - [ ] Sub-task: Update `savepoint-app/features/game-detail/use-cases/get-game-details.ts` to call `categorizeRelatedGames` with the `currentGame` and an empty array for `franchiseGames`. Modify the return type of `getGameDetails` to include `categorizedRelatedGames`. **[Agent: nextjs-backend-expert]**
    - [ ] Sub-task: Update `savepoint-app/app/games/[slug]/page.tsx` to pass the actual `categorizedRelatedGames` from `getGameDetails` to `CategorizedRelatedGamesDisplay`. **[Agent: react-expert]**
    - [ ] Sub-task: Update `CategorizedRelatedGamesDisplay` to display game cards (using `GameGrid` and `GameCard`) for DLC, Ports, and Remakes categories, dynamically hiding tabs if a category is empty. **[Agent: react-expert]**
    - [ ] Sub-task: Add comprehensive unit tests for `categorizeRelatedGames` helper covering various scenarios for DLC, Ports, and Remakes, including edge cases like empty arrays, missing `parent_game`, and duplicates within a category. **[Agent: testing-expert]**
    - [ ] Sub-task: Update integration tests for `game-detail/use-cases/get-game-details.ts` to assert that `categorizedRelatedGames` is correctly populated for games with DLC, remakes, or original versions. **[Agent: testing-expert]**

- [ ] **Slice 3: Implement Series categorization with pagination**
    - [ ] Sub-task: Modify `savepoint-app/features/game-detail/use-cases/get-game-details.ts` to fetch initial `franchiseGames` using `igdbService.getFranchiseGames` if a `franchiseId` exists for the current game. Pass this to `categorizeRelatedGames`. **[Agent: nextjs-backend-expert]**
    - [ ] Sub-task: Update `categorizeRelatedGames` in `savepoint-app/data-access-layer/services/igdb/igdb-helpers.ts` to correctly filter out games from the `franchiseGames` (series) list that are already present in DLC, Ports, or Remakes categories. **[Agent: nextjs-backend-expert]**
    - [ ] Sub-task: Adapt `CategorizedRelatedGamesDisplay` to implement infinite scroll for the "Series" tab. This will involve using the existing `loadMoreFranchiseGames` server action and `useInfiniteScroll` pattern. The `igdbId` of the current game will be passed to `CategorizedRelatedGamesDisplay` to facilitate this. **[Agent: react-expert]**
    - [ ] Sub-task: Add unit tests for `categorizeRelatedGames` to ensure correct filtering logic for the Series tab. **[Agent: testing-expert]**
    - [ ] Sub-task: Add integration tests for `game-detail/use-cases/get-game-details.ts` to verify correct series categorization and filtering. **[Agent: testing-expert]**
    - [ ] Sub-task: Add component tests for `CategorizedRelatedGamesDisplay` to verify infinite scroll functionality for the Series tab. **[Agent: testing-expert]**

- [ ] **Slice 4: Final Polish and Cleanup**
    - [ ] Sub-task: Review all modified files for unused imports, dead code, and formatting issues. Run linting and formatting commands. **[Agent: general-purpose]**
    - [ ] Sub-task: Verify all E2E tests still pass. If any E2E tests specifically interacted with related games sections, update them to reflect the new tabbed UI. **[Agent: e2e-testing-expert]**
    - [ ] Sub-task: Update `savepoint-app/features/browse-related-games/index.ts` to export the new components and remove old ones. **[Agent: general-purpose]**
