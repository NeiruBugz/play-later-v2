# Technical Specification: First-Time User Onboarding (Guided Tour)

- **Functional Specification:** [`functional-spec.md`](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Nail Badiullin

---

## 1. High-Level Technical Approach

`savepoint-app`-only feature. The tour is a small, declarative layer over `driver.js` (already chosen during scoping — ~10 KB, no React-specific dependency, popover + spotlight + keyboard out of the box). The existing `features/onboarding/` slice already owns the empty-library hero (012 F#8) and the Getting Started checklist; we add a **`tour/`** sub-namespace inside it for the new guided tour.

Two sources of truth for tour state:

1. **Server** — two new nullable timestamps on `User` (`tourCompletedAt`, `tourSkippedAt`). Migrated via a single Prisma migration. The existing `onboardingDismissedAt` is left alone — it belongs to the Getting Started checklist, which keeps working unchanged.
2. **Client (per tab/session only)** — a small `sessionStorage` flag `savepoint:tour:starting` that prevents the tour from re-triggering on intra-tab route changes after it has begun in this tab.

The tour is rendered by a single `<TourRunner />` mounted once in the authenticated layout. Auto-start is driven by an effect inside `<TourRunner />` that reads pre-fetched state from props (passed down from the Server Component layout) — no client-side fetch on first paint, no flash.

The four tour stops live in a single content file (`features/onboarding/tour/tour-content.ts`) keyed by stop id. Each stop declares a CSS selector, copy, fallback selector for the empty-surface case, and the route the tour should be on before the stop runs. The runner navigates between routes using `next/navigation`'s `useRouter`.

Reuse map (no changes to these surfaces):
- Library hero search input, sidebar/mobile filter triggers, library card, empty-library hero — all from spec 012.
- Quick Log hero, dashboard activity feed widget — from existing dashboard slice / spec 008.
- Navbar **Add Game** button — from spec 012 F#2.11.3.
- Profile visibility toggle, follow surface — from spec 009.

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Architecture Changes

No new architectural layer. Existing four-layer DAL (Handler → Service → Repository) and FSD slices are sufficient. New work fits inside `features/onboarding/tour/` and `data-access-layer/services/onboarding/`.

### 2.2 Data Model / Database Changes

Single migration adding two nullable timestamps to `User`:

| Column | Type | Notes |
|---|---|---|
| `tourCompletedAt` | `DateTime?` | Null until user finishes the tour. |
| `tourSkippedAt` | `DateTime?` | Null until user skips, closes, or auto-skips via timeout. |

Existing columns (`onboardingDismissedAt`, `profileSetupCompletedAt`, `isPublicProfile`, `username`, etc.) remain unchanged. Migration name: `add_user_tour_timestamps`.

### 2.3 Repository Layer Additions

| Function | Inputs | Returns | Notes |
|---|---|---|---|
| `getUserTourStatus({ userId })` | `{ userId }` | `{ tourCompletedAt: Date \| null; tourSkippedAt: Date \| null }` | Single `findUnique` selecting just the two new columns. Lives in `user-repository.ts`. |
| `updateUserTourStatus({ userId, completed?, skipped? })` | `{ userId, completed?: boolean; skipped?: boolean }` | `void` | Sets the requested timestamp(s) to `now()`. Both can be set in one call. |

### 2.4 Service Layer Additions

| Service | Method | Returns | Notes |
|---|---|---|---|
| `OnboardingService` (existing) | `getTourStatus({ userId })` | `ServiceResult<{ shouldAutoStart: boolean; tourCompletedAt: Date \| null; tourSkippedAt: Date \| null }>` | `shouldAutoStart` is `true` iff both timestamps are null. |
| `OnboardingService` | `markTourCompleted({ userId })` | `ServiceResult<void>` | Calls `updateUserTourStatus({ userId, completed: true })`. |
| `OnboardingService` | `markTourSkipped({ userId })` | `ServiceResult<void>` | Calls `updateUserTourStatus({ userId, skipped: true })`. Idempotent — safe to call after `tourCompletedAt` is already set. |

The existing `OnboardingService` (`data-access-layer/services/onboarding/onboarding-service.ts`) gains the three methods above. Existing checklist methods (`getOnboardingProgress`, `dismissOnboarding`) are not modified.

### 2.5 Server Actions

Two new actions under `features/onboarding/server-actions/` (alongside the existing `dismiss-onboarding` for the checklist):

| File | Schema | Purpose |
|---|---|---|
| `mark-tour-completed.ts` | `z.object({})` | Calls `OnboardingService.markTourCompleted({ userId })`; revalidates nothing (state is read on layout render only). |
| `mark-tour-skipped.ts` | `z.object({})` | Calls `OnboardingService.markTourSkipped({ userId })`; revalidates nothing. |

Both use `createServerAction` with `requireAuth: true`. They do not return data (other than the standard `{ success: true }`).

### 2.6 Page / Layout Wiring

The authenticated layout (`app/(protected)/layout.tsx`) already exists. The change:

- The Server Component layout fetches `OnboardingService.getTourStatus({ userId })` once per layout render alongside whatever it fetches today (audit at implementation start; likely user/session info).
- The result is passed as a prop into a new `<TourRunner shouldAutoStart={...} />` client component mounted in the layout, just below the existing header / page content.

This avoids a client-side fetch on first paint and ensures the tour either auto-starts or remains dormant deterministically.

### 2.7 Component Breakdown

New components inside `features/onboarding/tour/`:

| Path | Type | Purpose |
|---|---|---|
| `features/onboarding/tour/tour-runner.tsx` | client | Reads `shouldAutoStart` prop. On mount, if `shouldAutoStart && !sessionStorage.has("savepoint:tour:starting")`, sets the flag and starts the tour. Owns the `driver.js` instance lifecycle (init → start → destroy on unmount). Exposes a `useTour()` hook via React context for imperative restart. |
| `features/onboarding/tour/tour-content.ts` | pure | The single content/configuration file. Exports `TOUR_STOPS: TourStop[]`. Each stop has `{ id, route, selector, fallbackSelector?, title, description, position, onBeforeShow?, onAfterHide? }`. |
| `features/onboarding/tour/tour-types.ts` | types | `TourStop`, `TourPosition`, `TourCallbacks`. |
| `features/onboarding/tour/use-tour.ts` | client hook | `useTour()` returns `{ start: () => void, stop: () => void, isRunning: boolean }`. Used by the user-menu entry. |
| `features/onboarding/tour/tour-popover.tsx` | client | Custom popover renderer passed to `driver.js` so popovers reuse our shadcn `Card` / `Button` styling. Renders Next / Back / Skip / Close, an `aria-live` step announcer, and respects `prefers-reduced-motion`. |
| `features/onboarding/tour/tour-navigator.ts` | pure-ish | Helper that, given the next stop's `route`, decides whether to call `router.push(route)` and waits (with a ≤2 s timeout) for the `selector` (or `fallbackSelector`) to be present in the DOM before resolving. |

Modifications to existing files:

| Path | Change |
|---|---|
| `app/(protected)/layout.tsx` | Add `getTourStatus` server fetch; mount `<TourRunner shouldAutoStart={...}>` in the layout tree. |
| `widgets/header/ui/header.tsx` (or its user-menu component) | Add a **Take the tour again** menu item that calls `useTour().start()`. Visible to all authenticated users. |
| `features/onboarding/index.ts` / `index.server.ts` | Re-export the public surface (`TourRunner`, `useTour`). |
| `package.json` | Add `driver.js` (`^1.x`) as a runtime dependency. No dev deps required. |

### 2.8 Tour Content (Stop Map)

Defined entirely in `tour-content.ts`. Selectors are stable test-id-style data attributes. New `data-tour="..."` attributes are added at the targeted elements — these are zero-cost markers, and we already use `data-testid` heavily.

| Stop | Route | Anchor (`data-tour`) | Empty-state fallback | Copy summary |
|---|---|---|---|---|
| `library-hero-search` | `/library` | `library-hero-search` | — (always present) | "Find any game in your library. Press `/` to focus from anywhere." |
| `library-filters` | `/library` | `library-filter-sidebar` (≥1280px) ⁄ `library-mobile-filters-trigger` (≤640px) | `library-filter-sidebar-rail` (768–1279px) | "Filter by status, platform, and rating. Counts update as you filter." |
| `library-card` | `/library` | first `library-card` element | `empty-library-hero` (012 F#8) | "Each game has a status badge, a quick action, and a `⋮` menu." |
| `dashboard-quicklog` | `/dashboard` (or current dashboard route) | `dashboard-quick-log-hero` | `dashboard-quick-log-empty` | "Log a session for any game you're playing. Reflect adds a journal entry." |
| `dashboard-activity-feed` | dashboard | `dashboard-activity-feed` | `dashboard-activity-feed-empty` (008 empty state) | "Status changes and adds from people you follow show up here." |
| `add-game-navbar` | current | `header-add-game-btn` | — (always present) | "Add a game from anywhere — click here, or press `⌘K` (or `Ctrl K`)." |
| `profile-visibility` | `/u/[username]` | `profile-visibility-toggle` | `header-user-menu` (when no username) | "Your profile is public/private. Toggle it any time." |
| `profile-follow` | `/u/[username]` | `profile-follow-list` | same fallback as above | "Follow other gamers from their profiles to see their activity on your dashboard." |

Adding the `data-tour` attributes is a one-liner per anchor; these are part of the same PR as the runner.

### 2.9 Lifecycle, Navigation, Empty Surfaces

- **Auto-start**: `<TourRunner shouldAutoStart={true}>` → on mount, set `sessionStorage["savepoint:tour:starting"] = "1"` → 500 ms `setTimeout` → call `tour.start()`. The session flag prevents a second mount (e.g., an intra-tab route change) from re-starting.
- **Per-stop navigation**: `tour-navigator.ts` checks `pathname` against `stop.route`; if different, calls `router.push(stop.route)` and awaits the anchor selector (≤2 s polling via `MutationObserver` or `requestAnimationFrame` loop). On timeout, emits the graceful skip per F#2.8.
- **Empty surfaces**: `tour-navigator.ts` first probes for `selector`; if absent, probes for `fallbackSelector`; if both absent, treats as graceful skip (timeout path).
- **Skip / close / Esc / mid-tour navigation**: all funnel through `markTourSkipped` server action and `tour.destroy()`.
- **Completion**: last stop's "Done" button calls `markTourCompleted` and `tour.destroy()`.

### 2.10 Accessibility

- Custom popover uses focus trap inside the popover only (`tabbable` from headless dialog libraries already used by shadcn `<Dialog>`, or a tiny inline trap). The page outside is not focus-trapped.
- Each popover is rendered as `role="dialog"` with `aria-labelledby` (title) and an `aria-live="polite"` region announcing `Step n of N: <title>`.
- Keyboard: Tab cycles within the popover; Enter advances; Esc skips; arrow keys are passed through to the underlying page.
- Reduced motion: when `window.matchMedia("(prefers-reduced-motion: reduce)").matches`, popovers fade rather than animate; spotlight transitions instantaneously.

### 2.11 Internationalization-Readiness

All copy lives in `tour-content.ts` keyed by stop id. The signature accepts a `string | (lang: string) => string` so a future i18n pass can swap the strings without touching the runner.

---

## 3. Impact and Risk Analysis

### System Dependencies

- **`features/onboarding/`** — adds the `tour/` sub-namespace; existing checklist code is unchanged.
- **`data-access-layer/services/onboarding/`** — `OnboardingService` gains three methods.
- **`data-access-layer/repository/user/`** — gains `getUserTourStatus`, `updateUserTourStatus`.
- **`app/(protected)/layout.tsx`** — adds one server fetch and one mount.
- **`widgets/header/`** — adds one user-menu entry.
- **Anchored surfaces** — receive new `data-tour="..."` attributes only. No behavioral changes.
- **No external integrations** (IGDB, Steam, Cognito, S3, Lambdas) affected.

### Potential Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `driver.js` does not match shadcn theming out of the box | Use its custom-popover render hook to inject our own popover component (`tour-popover.tsx`). Keeps shadcn / dark-mode look. |
| Tour auto-starts during future E2E runs, breaking unrelated flows | E2E is out of scope here, but when the suite is refreshed, the runner accepts an `enabled` prop or honors `process.env.NEXT_PUBLIC_E2E === "true"` to short-circuit auto-start. Document the hook for the future E2E spec; do not wire it now. |
| Mounting the runner in the protected layout causes hydration mismatch | Pass `shouldAutoStart` via props from the Server Component; runner reads from props only on client mount. No `localStorage` reads during render. |
| Selector-targeted elements move or get renamed by future refactors | Selectors are namespaced `data-tour` attributes — code-review checklist for changes that delete `data-tour` markers. Add a unit test that asserts each `TOUR_STOPS[i].selector` is present in the codebase via `rg`. |
| `prefers-reduced-motion` users still see pulsing spotlights | Disable `driver.js` animation in the runner setup when the media query matches. |
| Mid-tour navigation across routes may unmount the runner | The runner is mounted in the **layout**, not a page, so it persists across child route changes. Confirm by testing dashboard → library navigation mid-tour. |
| Existing `<GettingStarted>` checklist competes with the tour for attention on the dashboard | Tour stops do not point at the checklist. Checklist remains its existing dismissal-via-`onboardingDismissedAt`. Document in PR. |
| Two-second mount timeout may be too tight for slow networks | Accept; graceful skip with replay-from-menu is the recovery. Revisit if reported. |
| Tour content drifts from real surfaces | Annual review — checklist in PR template for any spec touching surfaces named in `tour-content.ts`. |
| `driver.js` adds ~10 KB to the bundle for users who never see the tour again | Lazy-load via dynamic import inside `<TourRunner>` — only loaded when `shouldAutoStart === true` or `useTour().start()` is called. |
| Adding `data-tour` attributes diverges from shared types if anchor markup is reused | Use plain DOM attributes; do not add to component prop types. Selectors live in `tour-content.ts`, not in JSX as imported constants, so the coupling stays loose. |

---

## 4. Testing Strategy

- **Unit tests (Vitest):**
  - `tour-navigator.ts` — selector resolution with primary present, primary missing + fallback present, both missing (timeout-skip path), route push triggered when `pathname !== stop.route`.
  - `OnboardingService.getTourStatus` — `shouldAutoStart` true only when both timestamps are null; false when either is set.
  - `OnboardingService.markTourCompleted` / `markTourSkipped` — idempotency (calling twice does not error; second call is a no-op or rewrites timestamp — pick one and assert).
- **Integration tests (Postgres via Docker):**
  - `getUserTourStatus` repository — null/null new user, completed-only, skipped-only, both set.
  - `updateUserTourStatus` repository — partial updates (`completed: true` only; `skipped: true` only; both at once).
  - `mark-tour-completed.ts` and `mark-tour-skipped.ts` server actions — auth required, write timestamp, error path.
- **Component tests (Vitest + RTL):**
  - `tour-runner.tsx` — mounts; auto-starts when `shouldAutoStart=true` and session flag absent; does not start when flag present; calls `markTourSkipped` on Esc; calls `markTourCompleted` on final-stop Done.
  - `tour-popover.tsx` — `Step n of N` rendered, `aria-live` announces, Next/Back/Skip/Close buttons fire correct callbacks; keyboard Enter advances, Esc skips.
  - User-menu — **Take the tour again** entry calls `useTour().start()` without writing timestamps.
- **E2E**: out of scope for this spec. The current Playwright suite is outdated; tour E2E coverage will be addressed in a separate E2E-refresh effort.
- **CI gates**: standard `pnpm --filter savepoint ci:check` (lint, format, typecheck, component, backend, utilities tests, migration validation).

---

## 5. Open Questions / Items for `/awos:tasks`

1. Confirm the user-menu component path — likely under `widgets/header/ui/` but not present today (see `header.tsx`, `mobile-nav.tsx`). May require splitting a small `<UserMenu>` out, or extending whichever element renders sign-out.
2. The protected layout's existing server fetches were not yet inspected; first sub-task of slice 2 should confirm `app/(protected)/layout.tsx` shape before adding the tour status fetch.
3. The dashboard route used by stop `dashboard-*` should be confirmed (`/dashboard` vs `/`); verify in the existing routes before locking the route field in `tour-content.ts`.
4. E2E coverage deferred — picked up by the future E2E-refresh spec, not 013.
