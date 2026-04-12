# Technical Specification: Next.js 16 Feature Adoption

- **Functional Specification:** [functional-spec.md](functional-spec.md)
- **Status:** Completed
- **Author(s):** Nail Badiullin

---

## 1. High-Level Technical Approach

All changes are within `savepoint-app/` only. No new dependencies, no architecture changes, no database migrations.

Three config flags are added to `next.config.mjs`:
- `cacheComponents: true` — enables React Activity-based state preservation and unlocks `"use cache"` directive
- `experimental.viewTransition: true` — enables View Transitions API integration

Then three migration/implementation tracks:
1. **`"use cache"` migration** — replace `unstable_cache` in 3 production files (handler + use-case) with the `"use cache"` directive + `cacheLife()` + `cacheTag()`. Add caching to 2 platform handlers that have none.
2. **View transitions** — audit shared visual elements across route boundaries, add `view-transition-name` styled by IGDB ID to the `GameCoverImage` component in source (grid cards) and destination (game detail sidebar).
3. **State preservation validation** — `cacheComponents` handles this automatically. All four target pages (Library, Search, Journal, Steam Import) use `useSearchParams` + TanStack React Query, whose in-memory state is preserved by React's `<Activity>` component. No code changes needed — only manual verification.

**ESLint section dropped** — `eslint-config-next` is already at 16.2.3 with native flat config. PLA-109 is resolved.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Configuration Changes

**File:** `savepoint-app/next.config.mjs`

| Property | Value | Purpose |
|---|---|---|
| `cacheComponents` | `true` | Enables Activity-based state preservation + `"use cache"` directive |
| `experimental.viewTransition` | `true` | Enables native View Transitions API for route changes |

Both are top-level / experimental config flags, no other config changes.

### 2.2 `"use cache"` Migration — IGDB Search Handler

**File:** `savepoint-app/data-access-layer/handlers/igdb/igdb-handler.ts`

Current pattern (lines 25–51):
```
unstable_cache(fn, [keys], { revalidate: 300, tags: ["igdb:search", `igdb:search:${query}`] })
```

Migration:
- Replace `getCachedIgdbSearch` wrapper with an async function using `'use cache'` directive
- Use `cacheTag("igdb:search", `igdb:search:${normalizedQuery}`)` for tag-based invalidation
- Use `cacheLife({ revalidate: 300 })` for 5-minute TTL
- Remove `unstable_cache` import

The handler already owns the cache boundary — this is a 1:1 API swap.

### 2.3 `"use cache"` Migration — Game Detail Use-Case

**File:** `savepoint-app/features/game-detail/use-cases/get-game-details.ts`

Two cached wrappers to migrate:

| Function | Current TTL | Current Tags | New Pattern |
|---|---|---|---|
| `getCachedGameBySlug(slug)` | 300s | `igdb-game-detail` | `'use cache'` + `cacheLife({ revalidate: 300 })` + `cacheTag("igdb-game-detail")` |
| `getCachedTimesToBeat(igdbId)` | 3600s | `igdb-times-to-beat` | `'use cache'` + `cacheLife({ revalidate: 3600 })` + `cacheTag("igdb-times-to-beat")` |

**Architectural note:** These live in a use-case, not a handler. The game detail page calls this use-case directly — there is no handler in between. The use-case IS the entry point, so caching stays here. This is consistent with the "handler layer" intent: cache at the outermost orchestration point.

Remove `unstable_cache` import, add `cacheLife` and `cacheTag` imports from `next/cache`.

### 2.4 New Caching — Platform Handlers

Two handlers currently have zero caching despite returning near-static data.

**File:** `savepoint-app/data-access-layer/handlers/platform/get-unique-platforms.ts`
- Add `'use cache'` to the handler's core data-fetching logic
- `cacheLife({ revalidate: 86400 })` — 24h TTL (platform list almost never changes)
- `cacheTag("platforms:unique")`

**File:** `savepoint-app/data-access-layer/handlers/platform/get-platforms-handler.ts`
- Add `'use cache'` to the handler's core data-fetching logic
- `cacheLife({ revalidate: 86400 })` — 24h TTL
- `cacheTag("platforms:game", `platforms:game:${igdbId}`)`

**Note:** Since `'use cache'` marks an async function (not a route handler returning NextResponse), the cache boundary will wrap the data-fetching portion inside each handler, not the full GET handler itself. Extract the data-fetch into a separate async function with the directive if needed.

### 2.5 View Transitions — Shared Element Audit & Implementation

**Config:** `experimental.viewTransition: true` in `next.config.mjs`

**Transition name key:** IGDB ID (`game-cover-{igdbId}`)

**Source components (grid cards):**

| File | Component | Element | Transition Name |
|---|---|---|---|
| `features/game-search/ui/game-grid-card.tsx` | `GameGridCard` | `<GameCoverImage>` (line 32) | `game-cover-{game.id}` |
| `features/library/ui/library-card.tsx` | `LibraryCard` | `<GameCoverImage>` (line ~80) | `game-cover-{igdbId}` |

**Destination component (detail page):**

| File | Component | Element | Transition Name |
|---|---|---|---|
| `app/games/[slug]/page.tsx` | Game detail sidebar | `<GameCoverImage>` (line ~135) | `game-cover-{igdbId}` |

**Implementation approach:**
- Pass `style={{ viewTransitionName: `game-cover-${igdbId}` }}` to `GameCoverImage` or its wrapping `<div>` in all three locations.
- The `igdbId` is available in all three contexts: `game.id` in search results, the library item's IGDB ID, and the game detail's IGDB ID.
- Alternatively, add a `viewTransitionName` prop to the shared `GameCoverImage` component itself to avoid repeating the style in each consumer.

**Audit document:** Create `context/spec/010-nextjs-16-feature-adoption/view-transition-audit.md` cataloging all shared visual elements across route pairs with implement/exclude decisions.

**Accessibility:**
- View Transitions API respects `prefers-reduced-motion: reduce` at the browser/OS level — Next.js's integration honors this automatically.
- Browsers without View Transitions API support (Firefox as of writing) get instant cuts with no errors — the API is progressive enhancement.

### 2.6 State Preservation — No Code Changes

`cacheComponents: true` preserves component state via React `<Activity>` on back-navigation. The four target pages all manage state through mechanisms that survive Activity-based preservation:

| Page | State Mechanism | Preserved By |
|---|---|---|
| `/library` | `useSearchParams` + `useInfiniteQuery` | URL params survive; React Query cache in memory survives Activity |
| `/games` (search) | `useSearchParams` + `useInfiniteQuery` | Same |
| `/journal` | Server-rendered initial + client state | Activity preserves mounted component tree |
| Steam Import | `useQuery` + local filter state | Activity preserves mounted component tree |

**Potential concern:** If any component uses `useEffect` cleanup to reset state on unmount, Activity (which sets `mode="hidden"` instead of unmounting) may cause stale state. Manual testing of auth-gated content and forms is required to catch this.

---

## 3. Impact and Risk Analysis

### System Dependencies

| Dependency | Impact |
|---|---|
| `next/cache` exports | `unstable_cache` removed; `cacheLife`, `cacheTag` added. If any third-party code or test imports `unstable_cache`, it will break. |
| React Query cache | `cacheComponents` preserves the query cache across navigations. Stale queries from a prior visit may briefly show before refetching. `staleTime` / `gcTime` settings control this — no change needed for current config. |
| Existing `revalidateTag()` calls | Must continue to work with the new `cacheTag()` names. Verify that server actions calling `revalidateTag("igdb-game-detail")` still invalidate the migrated cache. |
| IGDB rate limiting | No change — caching reduces IGDB calls, same as before. |

### Potential Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| `cacheComponents` preserves stale auth state | Medium | Manual test: log out → back-nav should redirect to login, not show cached protected page. Next.js handles this via middleware redirect, but verify. |
| `'use cache'` on handler functions that throw errors | Medium | `unstable_cache` already caches thrown errors. `'use cache'` does the same — verify error responses are NOT cached (or cache only successful data). Extract data-fetch from error-handling logic if needed. |
| View transition flicker on slow connections | Low | Cover images use `next/image` with blur placeholder — transition should be smooth. Test on throttled connection. |
| Multiple cards with same IGDB ID on screen | Low | If the same game appears in both search and library views simultaneously, two elements share a `view-transition-name`, which is invalid. This can't happen in practice (different routes), but verify no single page renders duplicate IGDB IDs. |
| `cacheComponents` + forms | Medium | Form state (React Hook Form) preserved on back-nav could show stale submission state. Test the Add to Library modal and journal entry form after back-nav. |

---

## 4. Testing Strategy

### Unit Tests
- Update existing `igdb-handler.unit.test.ts` to mock `cacheLife`/`cacheTag` instead of `unstable_cache`
- Update existing `get-game-details.unit.test.ts` to mock the new caching API
- No new unit tests needed for config changes

### Component Tests
- No changes expected — `cacheComponents` and `viewTransition` are runtime behaviors

### E2E Tests (Manual + Playwright)
- **State preservation flows:** Library filter → game detail → back (verify filters). Search → result → back (verify query). Journal scroll → game → back (verify scroll). Steam Import filters → game → back (verify filters).
- **View transitions:** Library card → game detail (verify cover morphs). Search card → game detail (verify cover morphs). Test with `prefers-reduced-motion: reduce` (verify instant cut).
- **Auth boundary:** Log in → navigate → log out in another tab → back-nav (verify redirect, not cached protected page).
- **Forms:** Open Add to Library modal → submit → navigate → back → open modal again (verify clean state).

### Regression
- All existing suites: `test:components`, `test:backend`, `test:utilities`, `test:e2e`, `typecheck`, `lint`
