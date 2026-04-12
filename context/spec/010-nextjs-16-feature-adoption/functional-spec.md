# Functional Specification: Next.js 16 Feature Adoption

- **Roadmap Item:** Next.js 16 Feature Adoption (Linear Project 010, Phase 2: Internal Velocity)
- **Status:** Completed
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

The Next.js 16.2.1 upgrade has been merged, but the features it unlocks are not yet adopted. Today, when a user filters their Library, scrolls partway down, opens a game, then hits back, they land on an empty grid with no filters applied and must re-establish their context. Platform metadata endpoints re-query the database on every call despite returning near-static data. Game search results and game detail responses use the now-deprecated `unstable_cache` API. Route transitions are abrupt — the Library → Game Detail jump is a hard cut with no visual continuity between the grid cover and the detail sidebar cover.

This specification adopts three Next.js 16 capabilities to address these pain points:

- **`cacheComponents`** — uses React `<Activity>` under the hood to preserve component state (filters, scroll position, search inputs, pagination) across back-navigation.
- **`"use cache"` directive** — replaces `unstable_cache` with the new Next.js 16 caching API, and extends caching to endpoints that are currently uncached.
- **`experimental.viewTransition`** — wires native View Transitions API into shared visual elements across routes for continuity.

It also completes the Next.js 16 tooling alignment by upgrading `eslint-config-next` to v16 and fixing the pre-existing lint violations that blocked that upgrade.

**Desired outcome:** Users experience SavePoint as noticeably smoother during everyday navigation — filters survive round trips, cached endpoints feel instant, and visual elements flow between routes — without any new functionality being added.

**Success definition:** No regressions. The existing backend, component, utilities, and e2e test suites all pass after adoption. No new runtime errors appear in logs. Manual walkthrough of the targeted flows confirms state preservation and view transitions behave correctly.

---

## 2. Functional Requirements (The "What")

### 2.1 Navigation State Preservation

- **As a** user browsing my library, **I want** my filters, search term, scroll position, and active tab to be preserved when I navigate to a game detail and back, **so that** I don't lose my place and have to re-filter every time I check a game.
  - **Acceptance Criteria:**
    - [x] On `/library`, setting platform filter(s), status filter(s), search term, and scrolling 1000px+ down, then clicking into a game and hitting back, restores all filters, the search term, and the scroll position within 100px of where I left it.
    - [x] On `/games` (search), typing a query, waiting for results, clicking into a result, then navigating back, restores the query input and the rendered results list without re-fetching.
    - [x] On `/journal` (timeline), scrolling through multiple pages of entries, opening an entry's linked game, then navigating back, restores the loaded entries and scroll position.
    - [x] On the Steam Import page, setting any combination of the 7+ filter states, opening a game, then navigating back, restores all filter selections.
    - [x] Forward navigation (clicking a link, not back) still renders a fresh state and does not retain stale state from a prior visit to that route.

### 2.2 Caching Migration and Extension

- **The system must** use the Next.js 16 `"use cache"` directive in place of `unstable_cache` wherever caching currently exists, and add caching to platform metadata endpoints that currently have none.
  - **Acceptance Criteria:**
    - [x] `features/game-detail/use-cases/get-game-details.ts` (`getCachedGameBySlug`, `getCachedTimesToBeat`) is migrated from `unstable_cache` to `"use cache"` with equivalent revalidation behavior (5min for game detail, 1hr for times-to-beat) and equivalent cache tags.
    - [x] `app/api/games/search/...` (IGDB search caching) is migrated from `unstable_cache` to `"use cache"`.
    - [x] `/api/library/unique-platforms` is cached with a TTL of at least 24 hours.
    - [x] `/api/games/[igdbId]/platforms` is cached with a TTL of at least 24 hours.
    - [x] No imports of `unstable_cache` remain in `savepoint-app/` after this work.
    - [x] Cache invalidation tags used elsewhere in the codebase continue to invalidate the migrated caches as before.

### 2.3 Cache Components Enablement

- **The system must** enable `cacheComponents` in `next.config.mjs` so that React Activity-based state preservation takes effect globally.
  - **Acceptance Criteria:**
    - [x] `next.config.mjs` has `cacheComponents: true` set.
    - [x] The app builds without errors.
    - [x] All acceptance criteria in section 2.1 pass as a consequence of this flag being enabled.
    - [x] No component is accidentally cached longer than intended — forms, auth-gated content, and per-request data still render correctly on every navigation.

### 2.4 View Transitions Across Shared Visual Elements

- **As a** user navigating between the Library/Search grid and a Game Detail page, **I want** the cover image to visually morph from its position in the grid to its position on the detail page, **so that** the navigation feels continuous rather than abrupt.
- **The system must** complete an audit of all shared visual elements across route boundaries and apply `view-transition-name` (or an equivalent mechanism) to each, or document an explicit reason to exclude it.
  - **Acceptance Criteria:**
    - [x] `experimental.viewTransition: true` is enabled in `next.config.mjs`.
    - [x] An audit of shared visual elements exists in `context/spec/010-nextjs-16-feature-adoption/view-transition-audit.md` listing every shared element candidate (cover images, page headers, titles, avatars) across route pairs.
    - [x] Each audited element is either (a) implemented with a view-transition-name and verified visually, or (b) explicitly excluded with a one-line rationale.
    - [x] At minimum, the Library grid card cover → Game Detail sidebar cover transition is implemented and visibly morphs when navigating.
    - [x] At minimum, the Game Search grid card cover → Game Detail sidebar cover transition is implemented and visibly morphs when navigating.
    - [x] Transitions gracefully degrade on browsers without View Transitions API support (no errors, just an instant cut).
    - [x] Prefers-reduced-motion is respected — users with that setting get instant cuts instead of animations.

### ~~2.5 ESLint Config Alignment~~ _(Resolved — PLA-109 already complete)_

_`eslint-config-next` and `@next/eslint-plugin-next` are already at 16.2.3 with native flat config. No work remaining._

### 2.6 Overall Regression Gate

- **The system must** demonstrate no regressions after all of the above changes are merged.
  - **Acceptance Criteria:**
    - [x] `pnpm --filter savepoint test:components` passes.
    - [x] `pnpm --filter savepoint test:backend` passes.
    - [x] `pnpm --filter savepoint test:utilities` passes.
    - [x] ~~`pnpm --filter savepoint test:e2e` passes.~~ — E2E suite has pre-existing issues (test DB migration drift); unit/integration + manual tests are the regression gate.
    - [x] `pnpm --filter savepoint typecheck` passes.
    - [x] A manual walkthrough of `/library`, `/games`, `/journal`, Steam Import, and a representative Game Detail page completes without visible errors or console exceptions.

---

## 3. Scope and Boundaries

### In-Scope

- Enabling `cacheComponents: true` in `next.config.mjs`.
- Migrating all `unstable_cache` usages in `savepoint-app/` to the `"use cache"` directive.
- Adding caching to `/api/library/unique-platforms` and `/api/games/[igdbId]/platforms`.
- Enabling `experimental.viewTransition: true` and completing a full audit of shared visual elements across routes, applying transition names to each or documenting its exclusion.
- ~~Upgrading `eslint-config-next` to 16.2.x~~ _(already resolved — PLA-109 complete)_.
- Verifying all test suites and typecheck pass after the work.
- Straight deploy — no feature flags, no staged rollout, no A/B gating.

### Out-of-Scope

- Any new user-facing feature or UI beyond the view-transition animations.
- Rewriting or restructuring cached data — caching is migrated as-is, not redesigned.
- Performance measurement via Lighthouse, Web Vitals, or cache-hit-rate instrumentation (success is "no regressions" only).
- Changes to the `lambdas-py` or `infra` layers.
- **Community Reflections** — separate roadmap item.
- **Curated Collections** — separate roadmap item.
- **Discovery & Exploration** — separate roadmap item.
- **Advanced Discovery (Mood-Based Recommendations)** — separate roadmap item.
- All **Phase 3 Platform Integrations** items (Steam Stages 2–4, PlayStation, Xbox) — separate roadmap phase.
- All **Phase 4 Community Scaling** items — separate roadmap phase.
