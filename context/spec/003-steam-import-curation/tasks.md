# Tasks: Steam Import Curation

**Spec:** [functional-spec.md](./functional-spec.md) | [technical-considerations.md](./technical-considerations.md)

---

## Slice 1: Display smart status badge on game cards

*Smallest visible change - show the auto-calculated status (Owned/Playing/Played) on each imported game card.*

- [x] Create `calculateSmartStatus` helper function with unit tests **[Agent: nextjs-expert]**
  - 0 playtime → OWNED
  - Playtime + last played within 7 days → PLAYING
  - Playtime + last played > 7 days ago → PLAYED
- [x] Add smart status badge to `ImportedGameCard` component **[Agent: nextjs-expert]**
  - Display calculated status as a colored badge (e.g., "Owned", "Playing", "Played")
- [x] Write component test for status badge display **[Agent: typescript-test-expert]**

---

## Slice 2: Add "Dismiss" action to game cards

*Users can remove games from the curation list without importing them.*

- [x] Add `updateImportedGameStatus` repository function **[Agent: nextjs-expert]**
  - Updates `igdbMatchStatus` with authorization check
  - Write integration test
- [x] Create `dismissImportedGameAction` server action **[Agent: nextjs-expert]**
  - Sets status to IGNORED
  - Revalidates `/steam/games` path
- [x] Create `useDismissGame` mutation hook **[Agent: nextjs-expert]**
  - Invalidates `imported-games` query
  - Shows success toast
- [x] Add dismiss button (X icon) to `ImportedGameCard` **[Agent: nextjs-expert]**
  - Calls dismiss action on click
  - Shows loading state during mutation

---

## Slice 3: Update list filter to hide dismissed/imported games

*Dismissed and already-imported games should be hidden by default.*

- [x] Add `matchStatus` filter option to repository query **[Agent: nextjs-expert]**
  - Support filtering by PENDING, MATCHED, UNMATCHED, IGNORED
  - Write integration test for filter
- [x] Update `ImportedGamesList` default filter **[Agent: nextjs-expert]**
  - Default to showing only PENDING and UNMATCHED
  - Add filter option to show "Already imported" (MATCHED)
- [x] Update `useImportedGames` hook to pass matchStatus parameter **[Agent: nextjs-expert]**

---

## Slice 4: IGDB matcher service (port from Lambda)

*Core matching logic that looks up Steam games in IGDB via external_games table.*

- [x] Create `matchSteamGameToIgdb` function in `igdb-matcher.ts` **[Agent: nextjs-expert]**
  - Construct Steam Store URL from App ID
  - Query IGDB `external_games.url` field
  - Return IgdbGame or null
- [x] Write unit tests for matcher service **[Agent: typescript-test-expert]**
  - Correct URL construction
  - Returns game on match
  - Returns null on no match
  - Handles API errors

---

## Slice 5: Basic import action (auto-match happy path)

*Users can click "Import" on a game card and have it added to their library via IGDB auto-match.*

- [x] Create `importGameToLibrary` use-case **[Agent: nextjs-expert]**
  - Fetch ImportedGame by ID
  - Call matcher service
  - Find or create Game record
  - Create LibraryItem
  - Update status to MATCHED
- [x] Create `importToLibraryAction` server action **[Agent: nextjs-expert]**
  - Schema validation
  - Call use-case
  - Revalidate paths
- [x] Create `useImportGame` mutation hook **[Agent: nextjs-expert]**
  - Handle success (toast, invalidate queries)
  - Handle errors (including NO_MATCH)
- [x] Add "Import" button to `ImportedGameCard` **[Agent: nextjs-expert]**
  - Triggers import action with smart status default
  - Shows loading state
  - Shows success/error feedback
- [x] Write unit tests for use-case **[Agent: typescript-test-expert]**
  - Happy path
  - NOT_FOUND error
  - DUPLICATE error

---

## Slice 6: Import modal with status selector

*Users can review game info and optionally override the status before importing.*

- [x] Create `ImportGameModal` component **[Agent: nextjs-expert]**
  - Display game name, playtime, last played
  - Show smart status as default in dropdown
  - Status selector with all 4 options
  - "Import" button triggers action
  - Loading state during import
  - Close on success with toast
- [x] Update `ImportedGameCard` to open modal instead of direct import **[Agent: nextjs-expert]**
  - Click "Import" → open modal
  - Modal handles the action
- [x] Write component tests for modal **[Agent: typescript-test-expert]**
  - Shows correct smart status default
  - User can change status
  - Loading and success states

---

## Slice 7: Manual IGDB search (when auto-match fails)

*When auto-match returns NO_MATCH, users can search IGDB manually.*

- [x] Create `IgdbManualSearch` component **[Agent: nextjs-expert]**
  - Search input with 300ms debounce
  - Uses existing game search API
  - Display results: cover, title, release year
  - "Select" button on each result
- [x] Integrate manual search into `ImportGameModal` **[Agent: nextjs-expert]**
  - On NO_MATCH error, transition to manual search view
  - Selection calls import action with `manualIgdbId`
  - Success closes modal
- [x] Write component tests for manual search **[Agent: typescript-test-expert]**
  - Debounce works correctly
  - Results display
  - Selection triggers import

---

## Slice 8: Entry points from Library and Profile pages

*Users can access the Steam import curation from multiple locations.*

- [x] Add "Import from Steam" button to Library page **[Agent: nextjs-expert]**
  - Navigate to `/steam/games` curation screen
  - Visible to authenticated users with Steam connected
- [x] Add Steam Import option in Profile/Settings **[Agent: nextjs-expert]**
  - Under connected accounts section
  - Navigate to same curation screen

---

## Slice 9: Error handling polish

*Ensure all error states are handled gracefully.*

- [x] Handle IGDB rate limiting errors **[Agent: nextjs-expert]**
  - Detect rate limit response
  - Show user-friendly message: "Please try again in a moment"
- [x] Handle network errors during import **[Agent: nextjs-expert]**
  - Show error toast with retry option
  - Game stays in list for retry
- [x] Update ImportedGame to UNMATCHED on auto-match failure **[Agent: nextjs-expert]**
  - Verify status updates correctly
  - User can retry or search manually
