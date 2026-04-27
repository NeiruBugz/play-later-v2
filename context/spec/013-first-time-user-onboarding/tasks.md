# Tasks: First-Time User Onboarding (Guided Tour)

- **Spec:** [`functional-spec.md`](./functional-spec.md)
- **Tech:** [`technical-considerations.md`](./technical-considerations.md)

Each slice keeps the app runnable and ships one user-visible (or developer-verifiable) increment. Sub-tasks include a verification step before the slice is considered done. E2E coverage is intentionally out of scope — the current Playwright suite will be refreshed separately.

---

## Slice 1: Persist tour state on `User` (schema + repository + service)

- [ ] **Slice 1: A user's tour status (`tourCompletedAt`, `tourSkippedAt`) is readable and writable through the existing onboarding service**
  - [ ] Add Prisma migration `add_user_tour_timestamps`: two new nullable `DateTime?` columns on `User` — `tourCompletedAt`, `tourSkippedAt`. **[Agent: prisma-database]**
  - [ ] Add `getUserTourStatus({ userId })` and `updateUserTourStatus({ userId, completed?, skipped? })` to `data-access-layer/repository/user/user-repository.ts`. **[Agent: prisma-database]**
  - [ ] Extend `OnboardingService` (`data-access-layer/services/onboarding/onboarding-service.ts`) with `getTourStatus`, `markTourCompleted`, `markTourSkipped` (idempotent). Existing checklist methods unchanged. **[Agent: nextjs-expert]**
  - [ ] Repository integration test: null/null new user, completed-only, skipped-only, both-set; partial updates (`completed` only, `skipped` only, both at once). **[Agent: typescript-test-expert]**
  - [ ] Service unit test: `shouldAutoStart` is `true` only when both timestamps are null; `mark*` methods are idempotent. **[Agent: typescript-test-expert]**
  - [ ] Verification: `pnpm --filter savepoint test:backend`; run `prisma migrate dev`; confirm typecheck + lint clean. **[Agent: testing]**

## Slice 2: Server actions for tour completion / skip

- [ ] **Slice 2: Two authenticated server actions write tour timestamps**
  - [ ] Add `features/onboarding/server-actions/mark-tour-completed.ts` (schema `z.object({})`, calls `OnboardingService.markTourCompleted({ userId })`). **[Agent: nextjs-expert]**
  - [ ] Add `features/onboarding/server-actions/mark-tour-skipped.ts` (same shape). **[Agent: nextjs-expert]**
  - [ ] Re-export both from `features/onboarding/server-actions/index.ts`. **[Agent: nextjs-expert]**
  - [ ] Action integration tests: auth required (rejects unauth); writes timestamp; idempotent on second call. **[Agent: typescript-test-expert]**
  - [ ] Verification: `pnpm --filter savepoint test:backend` + typecheck/lint. **[Agent: testing]**

## Slice 3: Tour runner scaffolding — single library stop behind a dev trigger

- [ ] **Slice 3: A `<TourRunner>` mounts in the protected layout and runs a single Library stop, triggered manually**
  - [ ] Add `driver.js` to `savepoint-app/package.json` dependencies (`^1.x`). Run `pnpm install`. **[Agent: nextjs-expert]**
  - [ ] Create `features/onboarding/tour/` namespace:
    - `tour-types.ts` — `TourStop`, `TourPosition`, `TourCallbacks`.
    - `tour-content.ts` — initial export with one stop: `library-hero-search` targeting `[data-tour="library-hero-search"]`.
    - `tour-popover.tsx` — custom popover renderer wrapping shadcn `Card` + `Button` (Next / Back / Skip / Close).
    - `tour-runner.tsx` — client component; lazy-imports `driver.js`; exposes `useTour()` via context with `start` / `stop` / `isRunning`. No auto-start logic yet.
    - `use-tour.ts` — re-export of the hook for ergonomic imports. **[Agent: react-frontend]**
  - [ ] Add `data-tour="library-hero-search"` to the existing hero-search input in `features/library/ui/hero-search.tsx`. **[Agent: react-frontend]**
  - [ ] Mount `<TourRunner shouldAutoStart={false}>` in `app/(protected)/layout.tsx`. Add a temporary dev-only "Start tour" button anywhere convenient (e.g., gated by `process.env.NODE_ENV === "development"`) wired to `useTour().start()`. **[Agent: nextjs-expert]**
  - [ ] Re-export `TourRunner`, `useTour` from `features/onboarding/index.ts` / `index.server.ts`. **[Agent: react-frontend]**
  - [ ] Component test: `tour-popover.tsx` renders `Step n of N`, Next/Back/Skip/Close fire callbacks, `Esc` triggers Skip, `Enter` triggers Next. **[Agent: typescript-test-expert]**
  - [ ] Verification: `pnpm --filter savepoint dev`; click the dev trigger; confirm popover appears at the hero search input with shadcn styling; Esc closes; bundle does not include `driver.js` until `start()` is called (verify via Next.js dev tools network tab). **[Agent: testing]**

## Slice 4: Auto-start on first authenticated visit + persistence

- [ ] **Slice 4: A new user lands on a protected route and the tour auto-starts once; completing or skipping persists server-side**
  - [ ] In `app/(protected)/layout.tsx`, fetch `OnboardingService.getTourStatus({ userId })` (alongside existing fetches; audit first sub-task) and pass `shouldAutoStart` as a prop to `<TourRunner>`. **[Agent: nextjs-expert]**
  - [ ] Implement auto-start in `tour-runner.tsx`: on mount, if `shouldAutoStart && !sessionStorage.getItem("savepoint:tour:starting")`, set the flag and call `start()` after a 500 ms `setTimeout`. **[Agent: react-frontend]**
  - [ ] Wire completion to `markTourCompletedAction()`; wire Skip / Close / Esc / mid-tour navigation to `markTourSkippedAction()`. Both fire-and-forget; transition state via `useTransition`. **[Agent: react-frontend]**
  - [ ] Component test: `tour-runner.tsx`:
    - auto-starts when `shouldAutoStart=true` and session flag absent;
    - does not start when flag already present;
    - does not start when `shouldAutoStart=false`;
    - calls `markTourSkipped` on Esc;
    - calls `markTourCompleted` on final-stop Done. **[Agent: typescript-test-expert]**
  - [ ] Remove the dev-only Start tour trigger from Slice 3. **[Agent: react-frontend]**
  - [ ] Verification: dev server; log in as a fresh user (or temporarily clear `tourCompletedAt`/`tourSkippedAt`); confirm tour auto-starts on first authenticated route; complete it; refresh; confirm it does not re-trigger; check DB column was written. **[Agent: testing]**

## Slice 5: Library tour stops (hero search, filters, card)

- [ ] **Slice 5: Tour walks the user through Library hero search, filters, and the first card (or empty hero)**
  - [ ] Add `data-tour` markers:
    - `library-filter-sidebar` on the desktop sidebar root (`features/library/ui/library-filter-sidebar.tsx`).
    - `library-filter-sidebar-rail` on the icon-rail variant.
    - `library-mobile-filters-trigger` on the mobile Filters button.
    - `library-card` on each library card root (or pick the first via `:first-of-type` selector).
    - `empty-library-hero` on the F#8 hero root.
    - The hero-search marker is already in place from Slice 3. **[Agent: react-frontend]**
  - [ ] Extend `tour-content.ts` with three Library stops (`library-hero-search`, `library-filters`, `library-card`); each declares `route: "/library"`, primary selector, and a fallback selector for empty state. **[Agent: react-frontend]**
  - [ ] Add `tour-navigator.ts` — given the next stop, push to its route via `next/navigation` if `pathname !== stop.route`, then poll for the selector (or fallback) for up to 2 s. On timeout, emit graceful skip. **[Agent: react-frontend]**
  - [ ] Unit test `tour-navigator.ts`: primary present → resolves immediately; primary missing + fallback present → uses fallback; both missing → timeout-skip; pushes route only when needed. **[Agent: typescript-test-expert]**
  - [ ] Verification: dev server; sign in fresh; tour visits hero search → filters (sidebar on desktop, sheet trigger on mobile) → card (or hero on empty library); Skip persists. **[Agent: testing]**

## Slice 6: Dashboard tour stops (Quick Log + activity feed)

- [ ] **Slice 6: Tour stops on the dashboard introduce Quick Log and the activity feed, with empty-state narration**
  - [ ] Confirm the dashboard route (`/dashboard` or `/`) by inspecting `app/(protected)/`. Lock the value in `tour-content.ts`. **[Agent: react-frontend]**
  - [ ] Add `data-tour` markers:
    - `dashboard-quick-log-hero` on the Quick Log hero root.
    - `dashboard-quick-log-empty` on its existing empty-state CTA.
    - `dashboard-activity-feed` on the activity feed widget root (spec 008).
    - `dashboard-activity-feed-empty` on the existing 008 empty state. **[Agent: react-frontend]**
  - [ ] Extend `tour-content.ts` with two Dashboard stops, each with primary + empty-state fallback selectors. **[Agent: react-frontend]**
  - [ ] Verification: dev server; trigger tour as a user with no PLAYING games and no follows; confirm both Dashboard stops render against their empty-state fallbacks with appropriate copy; tour advances and ends cleanly. **[Agent: testing]**

## Slice 7: Add Game tour stop (navbar)

- [ ] **Slice 7: Tour points at the global Add Game entry point (navbar button)**
  - [ ] Add `data-tour="header-add-game-btn"` to the navbar Add Game button (lands in 012 Slice 20; coordinate ordering — if 012 Slice 20 has not landed when this slice starts, fall back to anchoring on the existing `⌘K` palette trigger and update the marker on a follow-up). **[Agent: react-frontend]**
  - [ ] Add the `add-game-navbar` stop to `tour-content.ts`. The stop does **not** programmatically open the palette; it only points at the trigger. **[Agent: react-frontend]**
  - [ ] Verification: dev server; tour reaches the Add Game stop on whatever route the user is currently on; popover anchors correctly at desktop and mobile widths. **[Agent: testing]**

## Slice 8: Profile / settings tour stops (visibility + follow)

- [ ] **Slice 8: Tour navigates to the user's profile and explains visibility and follow**
  - [ ] Add `data-tour` markers:
    - `profile-visibility-toggle` on the visibility toggle in `/u/[username]` (spec 009).
    - `profile-follow-list` on the follow surface.
    - `header-user-menu` on the user-menu trigger (used as fallback when the user has no `username` slug). **[Agent: react-frontend]**
  - [ ] Extend `tour-content.ts` with `profile-visibility` and `profile-follow` stops. Both target `route: "/u/<currentUsername>"`. The runner reads the current user's username from layout-passed props (or session) to compute the route at `start()` time. **[Agent: nextjs-expert]**
  - [ ] If the user has no `username` populated, both stops collapse to a single fallback stop on `header-user-menu` with copy directing the user to set up their profile. **[Agent: react-frontend]**
  - [ ] Verification: dev server; complete tour through profile; verify navigation pushes to the correct username slug; verify the no-username fallback. **[Agent: testing]**

## Slice 9: User-menu "Take the tour again" entry

- [ ] **Slice 9: Authenticated users can replay the tour from the header user menu**
  - [ ] Audit `widgets/header/ui/header.tsx` to locate the user-menu component (may need to split a small `<UserMenu>` from `header.tsx`; do the minimum). **[Agent: react-frontend]**
  - [ ] Add a **Take the tour again** menu item that calls `useTour().start()`. Visible to all authenticated users. Replay does **not** call `markTourCompleted` or `markTourSkipped`. **[Agent: react-frontend]**
  - [ ] Component test: header user-menu — entry visible for all signed-in states; clicking calls `useTour().start()`; neither timestamp action is dispatched. **[Agent: typescript-test-expert]**
  - [ ] Verification: dev server; from a user with `tourCompletedAt` set, click the menu entry; tour starts from stop 1; finish/skip; confirm DB timestamps did not change. **[Agent: testing]**

## Slice 10: Accessibility, reduced-motion, mount-timeout polish

- [ ] **Slice 10: Tour meets the spec's a11y bar and gracefully handles slow mounts**
  - [ ] In `tour-popover.tsx`: confirm `role="dialog"`, `aria-labelledby`, and an `aria-live="polite"` region announcing `Step n of N: <title>`. **[Agent: react-frontend]**
  - [ ] Implement focus trap inside the popover only (cycling Tab through the popover's interactive elements; outer page is not trapped). **[Agent: react-frontend]**
  - [ ] When `window.matchMedia("(prefers-reduced-motion: reduce)").matches` returns true, configure `driver.js` to disable spotlight animation and use fade-only transitions. **[Agent: react-frontend]**
  - [ ] In `tour-runner.tsx`, on mount-timeout (≤2 s without target/fallback present), end the tour with a non-blocking notice via the existing toast primitive ("Skipped a step that wasn't ready — you can replay the tour any time from the menu"). Persist `markTourSkipped`. **[Agent: react-frontend]**
  - [ ] Component test extensions: `aria-live` announces; reduced-motion path disables animation (assert via `matchMedia` mock); mount-timeout fires `markTourSkipped` and shows the toast. **[Agent: typescript-test-expert]**
  - [ ] Verification: dev server with `prefers-reduced-motion` toggled in OS settings; with throttled CPU; confirm popover accessibility via keyboard-only navigation. **[Agent: testing]**

---

## Final validation

- [ ] **Run full CI suite locally** — `pnpm --filter savepoint ci:check` (lint, format, typecheck, component tests, backend tests, utilities tests, migration validation). **[Agent: testing]**
- [ ] **Manual sweep** — `pnpm --filter savepoint dev`; sign up as a new user; confirm: auto-start, walk through all four surfaces (Library, Dashboard, Add Game, Profile), Skip persists, refresh does not re-trigger, **Take the tour again** replays without writing timestamps, empty-surface narration on a brand-new account is sensible. **[Agent: testing]**
- [ ] **Update spec status** to `In Review` once acceptance criteria from Section 2 of the functional spec are verified. **[Agent: general-purpose]**

---

## Subagent / dependency notes

| Task / Slice | Issue | Recommendation |
|---|---|---|
| Slice 3 — driver.js bundle weight | Adds ~10 KB to authenticated routes if not lazy-loaded | Use a dynamic `import("driver.js")` inside `tour-runner.tsx` so the chunk is only fetched when `start()` is called. Verify via Next.js bundle analysis. |
| Slice 4 — protected layout shape | `app/(protected)/layout.tsx` shape was not inspected during tech spec | First sub-task of Slice 4 reads the layout to confirm where to add the server fetch and the runner mount. |
| Slice 6 — dashboard route | `/dashboard` vs `/` not yet confirmed | Inspect `app/(protected)/dashboard/` first; lock the route value in `tour-content.ts` once. |
| Slice 7 — depends on 012 Slice 20 | Navbar Add Game button is being added by spec 012 Slice 20 | If 012 Slice 20 has not landed, anchor the stop on the existing `⌘K` palette trigger as a temporary marker and switch in a follow-up. |
| Slice 9 — `<UserMenu>` may not exist | Header may not have a separate user-menu component yet | Split a minimal `<UserMenu>` out of `header.tsx`; keep behavior identical otherwise. |
| Final validation → "Update spec status" | Assigned to `general-purpose` (no specialist exists for spec-status bookkeeping) | Acceptable; trivial markdown edit. |
| E2E coverage | Out of scope — current Playwright suite is outdated | Picked up by a future E2E-refresh spec. The runner exposes a hook (`enabled` prop or `NEXT_PUBLIC_E2E` env) for that future work but it is not wired in this spec. |
