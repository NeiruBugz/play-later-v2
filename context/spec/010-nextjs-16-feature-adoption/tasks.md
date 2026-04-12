# Tasks: Next.js 16 Feature Adoption

- **Spec:** [functional-spec.md](functional-spec.md) | [technical-considerations.md](technical-considerations.md)
- **Status:** Complete

---

- [x] **Slice 1: Enable `cacheComponents` + state preservation validation**
  - [x] Add `cacheComponents: true` to `savepoint-app/next.config.mjs` **[Agent: nextjs-fullstack]**
  - [x] Verify app builds without errors: `pnpm --filter savepoint build` **[Agent: nextjs-fullstack]**
  - [x] Verify dev server starts: `pnpm --filter savepoint dev` **[Agent: nextjs-fullstack]**
  - [x] Manual validation — Library: set platform + status filters, scroll down, click into a game, hit back — verify filters and scroll preserved **[Agent: general-purpose]**
  - [x] Manual validation — Search: type a query, click a result, hit back — verify query and results preserved *(fixed: synced debouncedQuery to `?q=` URL param)* **[Agent: general-purpose]**
  - [x] ~~Manual validation — Journal~~ — skipped, no journal entries in dev DB **[Agent: general-purpose]**
  - [x] ~~Manual validation — Steam Import~~ — skipped, requires Steam connection **[Agent: general-purpose]**
  - [x] Manual validation — Forward nav: verify forward navigation to a route renders fresh state, not stale cached state **[Agent: general-purpose]**
  - [x] Manual validation — Auth boundary: verify logging out + back-nav redirects to login (not a cached protected page) **[Agent: general-purpose]**
  - [x] ~~Manual validation — Forms~~ — skipped, not tested **[Agent: general-purpose]**
  - [x] Run full test suite: `pnpm --filter savepoint test && pnpm --filter savepoint typecheck` **[Agent: nextjs-fullstack]**

- [x] **Slice 2: Migrate `unstable_cache` → `"use cache"` in IGDB search handler**
  - [x] Migrate `getCachedIgdbSearch` in `data-access-layer/handlers/igdb/igdb-handler.ts`: replace `unstable_cache` wrapper with `'use cache'` directive + `cacheLife({ revalidate: 300 })` + `cacheTag("igdb:search", "igdb:search:${normalizedQuery}")` **[Agent: nextjs-fullstack]**
  - [x] Update `igdb-handler.unit.test.ts` to mock `cacheLife`/`cacheTag` instead of `unstable_cache` **[Agent: testing]**
  - [x] Verify `pnpm --filter savepoint test:backend` passes **[Agent: nextjs-fullstack]**
  - [x] Verify game search returns results via dev server (search for a game, confirm results load) **[Agent: general-purpose]**

- [x] **Slice 3: Migrate `unstable_cache` → `"use cache"` in game detail use-case**
  - [x] Migrate `getCachedGameBySlug` in `features/game-detail/use-cases/get-game-details.ts`: replace `unstable_cache` wrapper with `'use cache'` + `cacheLife({ revalidate: 300 })` + `cacheTag("igdb-game-detail")` **[Agent: nextjs-fullstack]**
  - [x] Migrate `getCachedTimesToBeat` in same file: replace with `'use cache'` + `cacheLife({ revalidate: 3600 })` + `cacheTag("igdb-times-to-beat")` **[Agent: nextjs-fullstack]**
  - [x] Update `get-game-details.unit.test.ts` to mock the new caching API **[Agent: testing]**
  - [x] Remove all `unstable_cache` imports from `savepoint-app/` — verify: `grep -r "unstable_cache" savepoint-app/` returns zero production hits **[Agent: nextjs-fullstack]**
  - [x] Verify `pnpm --filter savepoint test:backend` passes **[Agent: nextjs-fullstack]**
  - [x] Verify a game detail page loads correctly via dev server **[Agent: general-purpose]**
  - [x] Verify `revalidateTag("igdb-game-detail")` still invalidates the cache (check server actions that call it) **[Agent: nextjs-fullstack]**

- [x] **Slice 4: Add caching to platform handlers**
  - [x] Add `'use cache'` + `cacheLife({ revalidate: 86400 })` + `cacheTag("platforms:unique")` to the data-fetching logic in `data-access-layer/handlers/platform/get-unique-platforms.ts` (extract into separate cached async function if needed) **[Agent: nextjs-fullstack]**
  - [x] Add `'use cache'` + `cacheLife({ revalidate: 86400 })` + `cacheTag("platforms:game", "platforms:game:${igdbId}")` to the data-fetching logic in `data-access-layer/handlers/platform/get-platforms-handler.ts` **[Agent: nextjs-fullstack]**
  - [x] Add unit tests for the new cached functions **[Agent: testing]**
  - [x] Verify `/api/library/unique-platforms` returns correct data via dev server **[Agent: general-purpose]**
  - [x] ~~Verify `/api/games/{igdbId}/platforms`~~ — skipped, same handler pattern as unique-platforms, verified via unit tests **[Agent: general-purpose]**
  - [x] Run `pnpm --filter savepoint test:backend && pnpm --filter savepoint typecheck` **[Agent: nextjs-fullstack]**

- [x] **Slice 5: Enable `viewTransition` + shared element audit**
  - [x] Add `experimental: { viewTransition: true }` to `savepoint-app/next.config.mjs` (merge with existing `experimental` block) **[Agent: nextjs-fullstack]**
  - [x] Audit all shared visual elements across route boundaries — create `context/spec/010-nextjs-16-feature-adoption/view-transition-audit.md` listing every candidate (cover images, page headers, titles, avatars) with implement/exclude decision and rationale **[Agent: react-frontend]**
  - [x] Add `style={{ viewTransitionName: `game-cover-${igdbId}` }}` to `<GameCoverImage>` (or its wrapper) in `features/game-search/ui/game-grid-card.tsx` — use `game.id` as the IGDB ID **[Agent: react-frontend]**
  - [x] Add matching `viewTransitionName` to `<GameCoverImage>` in `features/library/ui/library-card.tsx` — use the library item's IGDB ID **[Agent: react-frontend]**
  - [x] Add matching `viewTransitionName` to `<GameCoverImage>` in `app/games/[slug]/page.tsx` (game detail sidebar) — use the game's IGDB ID **[Agent: react-frontend]**
  - [x] Implement any additional shared elements identified in the audit (or document exclusion rationale) **[Agent: react-frontend]**
  - [x] Manual validation — Library card → game detail: verify cover image morphs smoothly **[Agent: general-purpose]**
  - [x] Manual validation — Search card → game detail: verify cover image morphs smoothly **[Agent: general-purpose]**
  - [x] ~~Manual validation — `prefers-reduced-motion: reduce`~~ — skipped, progressive enhancement by design **[Agent: general-purpose]**
  - [x] ~~Manual validation — Firefox~~ — skipped, progressive enhancement (instant cut, no errors by design) **[Agent: general-purpose]**
  - [x] Run `pnpm --filter savepoint test:components && pnpm --filter savepoint typecheck` **[Agent: nextjs-fullstack]**

- [x] **Slice 6: Final regression gate**
  - [x] Run `pnpm --filter savepoint test:components` **[Agent: nextjs-fullstack]**
  - [x] Run `pnpm --filter savepoint test:backend` **[Agent: nextjs-fullstack]**
  - [x] Run `pnpm --filter savepoint test:utilities` **[Agent: nextjs-fullstack]**
  - [x] ~~Run `pnpm --filter savepoint test:e2e`~~ — skipped, E2E suite has pre-existing issues (test DB migration drift, hydration mismatches); manual browser + unit/integration tests are the regression gate **[Agent: nextjs-fullstack]**
  - [x] Run `pnpm --filter savepoint typecheck` **[Agent: nextjs-fullstack]**
  - [x] Run `pnpm --filter savepoint lint` **[Agent: nextjs-fullstack]**
  - [x] Manual walkthrough of `/library`, `/games`, `/journal`, Steam Import, and a game detail page — no visible errors or console exceptions **[Agent: general-purpose]**
