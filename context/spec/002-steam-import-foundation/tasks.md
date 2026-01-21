# Tasks: Steam Library Integration - Stage 1 Technical Foundation

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Technical Specification:** [technical-considerations.md](./technical-considerations.md)

---

## Slice 1: Steam Connection UI Scaffold

Display a Steam connection card on the settings page that shows connection status (not functional yet).

- [x] Create `features/steam-import/` directory structure with `ui/`, `server-actions/`, `hooks/`, `schemas.ts`, `types.ts` **[Agent: nextjs-expert]**
- [x] Create `SteamConnectCard` component that shows "Connect Steam" button (non-functional placeholder) **[Agent: nextjs-expert]**
- [x] Add Steam import section to settings page that renders `SteamConnectCard` **[Agent: nextjs-expert]**

---

## Slice 2: Manual Steam ID Connection (End-to-End)

Allow users to connect Steam via manual ID entry and see their connection status.

- [x] Create database migration to add indexes for ImportedGame filtering (`userId + playtime`, `userId + lastPlayedAt`) - no schema changes yet, just indexes **[Agent: nextjs-expert]**
- [x] Create `SteamService` in `data-access-layer/services/steam/` with `resolveVanityURL()`, `getPlayerSummary()`, and `validateSteamId()` methods **[Agent: nextjs-expert]**
- [x] Create `steam-connect.handler.ts` that validates input and calls SteamService **[Agent: nextjs-expert]**
- [x] Create `POST /api/steam/connect` route that uses the handler **[Agent: nextjs-expert]**
- [x] Update `SteamConnectCard` with manual ID form, loading states, and connection status display **[Agent: nextjs-expert]**
- [x] Create `use-steam-connection.ts` hook for connection status management **[Agent: nextjs-expert]**
- [x] Add unit tests for SteamService (MSW mocks for Steam API) **[Agent: typescript-test-expert]**
- [x] Add integration tests for connect handler **[Agent: typescript-test-expert]**

---

## Slice 3: Steam OpenID Authentication

Allow users to connect via Steam OpenID 2.0 as the primary method.

- [x] Create `SteamOpenIdService` with `getAuthUrl()` and `validateCallback()` methods **[Agent: nextjs-expert]**
- [x] Create `GET /api/steam/auth` route that redirects to Steam login **[Agent: nextjs-expert]**
- [x] Create `GET /api/steam/auth/callback` route that validates OpenID response and updates user **[Agent: nextjs-expert]**
- [x] Update `SteamConnectCard` to add "Sign in with Steam" button **[Agent: nextjs-expert]**
- [x] Add unit tests for SteamOpenIdService **[Agent: typescript-test-expert]**

---

## Slice 4: Fetch Steam Games (Manual Import)

Allow users to fetch their owned games from Steam and store in ImportedGame table.

- [x] Extend ImportedGame schema with `playtimeWindows`, `playtimeMac`, `playtimeLinux`, `lastPlayedAt` fields and run migration **[Agent: nextjs-expert]**
- [x] Create `ImportedGameRepository` with `upsertMany()`, `findByUserId()`, `countByUserId()` methods **[Agent: nextjs-expert]**
- [x] Add `getOwnedGames()` method to SteamService **[Agent: nextjs-expert]**
- [x] Create `fetch-steam-games.handler.ts` that fetches from Steam and upserts to database **[Agent: nextjs-expert]**
- [x] Create `POST /api/steam/games` route for fetching Steam library **[Agent: nextjs-expert]**
- [x] Create `ImportPathSelector` component with "Fetch & Curate" button (manual path only) **[Agent: nextjs-expert]**
- [x] Create `use-fetch-steam-games.ts` mutation hook **[Agent: nextjs-expert]**
- [x] Add integration tests for fetch handler and repository **[Agent: typescript-test-expert]**

---

## Slice 5: View Imported Games List (Basic)

Display the imported games with pagination.

- [x] Create `imported-games.handler.ts` with pagination support **[Agent: nextjs-expert]**
- [x] Create `GET /api/steam/games` route for listing imported games **[Agent: nextjs-expert]**
- [x] Create `ImportedGameCard` component showing name, playtime, last played **[Agent: nextjs-expert]**
- [x] Create `ImportedGamesList` component with pagination controls **[Agent: nextjs-expert]**
- [x] Create `use-imported-games.ts` TanStack Query hook for list fetching **[Agent: nextjs-expert]**
- [x] Add component tests for ImportedGameCard and ImportedGamesList **[Agent: typescript-test-expert]**

---

## Slice 6: Search and Filter Imported Games

Add search, filtering, and sorting capabilities to the imported games list.

- [x] Extend `imported-games.handler.ts` with search, filter, and sort parameters **[Agent: nextjs-expert]**
- [x] Update `ImportedGamesList` with search input (debounced) **[Agent: nextjs-expert]**
- [x] Add filter dropdowns (playtime status, playtime range, platform, last played) **[Agent: nextjs-expert]**
- [x] Add sort selector (name, playtime, last played, recently added) **[Agent: nextjs-expert]**
- [x] Add filter chips and "Clear all filters" action **[Agent: nextjs-expert]**
- [x] Add integration tests for filter combinations **[Agent: typescript-test-expert]**

---

## Slice 7: Disconnect Steam Account

Allow users to disconnect their Steam account.

- [x] Create `disconnect-steam.ts` server action (only updates User record, no Steam API) **[Agent: nextjs-expert]**
- [x] Update `SteamConnectCard` to show disconnect option when connected **[Agent: nextjs-expert]**
- [x] Add tests for disconnect action **[Agent: typescript-test-expert]**

---

## Slice 8: Feature Flag and Background Sync Scaffold

Add feature flag for background sync and scaffold the UI.

- [x] Add `ENABLE_STEAM_BACKGROUND_SYNC` to `env.mjs` with validation **[Agent: nextjs-expert]**
- [x] Create `features/steam-import/config.ts` with `steamImportConfig` **[Agent: nextjs-expert]**
- [x] Update `ImportPathSelector` to show "Background Sync" option with "Coming Soon" badge when flag is OFF **[Agent: nextjs-expert]**
- [x] Create `POST /api/steam/sync` route that returns 403 when feature is disabled **[Agent: nextjs-expert]**

---

## Slice 9: Background Sync Lambda Integration (Development Only)

Connect to the existing Lambda pipeline via SQS (feature-flagged).

- [x] Create Terraform module for SQS queue and DLQ in `infra/modules/steam-import/` **[Agent: terraform-infrastructure]**
- [x] Add SQS event source mapping for Lambda **[Agent: terraform-infrastructure]**
- [x] Create `trigger-background-sync.ts` server action that pushes to SQS **[Agent: nextjs-expert]**
- [x] Update `POST /api/steam/sync` to enable when feature flag is ON **[Agent: nextjs-expert]**
- [x] Create `ImportStatusToast` component for background sync notifications **[Agent: nextjs-expert]**
- [x] Update `ImportPathSelector` to enable Background Sync button when flag is ON **[Agent: nextjs-expert]**

---

## Slice 10: Error Handling Polish

Implement user-friendly error messages for all failure scenarios.

- [x] Add error handling for private Steam profiles with link to privacy settings **[Agent: nextjs-expert]**
- [x] Add error handling for invalid Steam ID format **[Agent: nextjs-expert]**
- [x] Add error handling for Steam API unavailability **[Agent: nextjs-expert]**
- [x] Add error handling for rate limiting **[Agent: nextjs-expert]**
- [x] Add "Try Again" / "Retry" actions to all error states **[Agent: nextjs-expert]**
- [x] Add error handling tests **[Agent: typescript-test-expert]**
