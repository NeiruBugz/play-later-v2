# Tasks: Faster Signed-In Pages on Desktop

> Vertical slices. After each slice, the app builds, runs, and a measurable improvement is observable on at least one route.

### Slice 1: Dashboard streams immediately on navigation
- [x] Parallelize the three top-level awaits in `app/(protected)/dashboard/page.tsx` (`checkSetupStatus`, `getProfileWithStats`, `getStatusCounts`) into a single `Promise.all`. Move `username` lookup into `QuickLogHero` (already inside Suspense). **[Agent: nextjs-expert]**
- [x] Add `app/(protected)/dashboard/loading.tsx` mirroring the page's Suspense skeleton structure (hero + checklist + 2-col grid + recently-added). Reuse `Skeleton` variants. **[Agent: react-frontend]**
- [ ] Verify locally: `pnpm --filter savepoint dev`, hard-navigate to `/dashboard` while signed in. Page heading + skeletons must appear within ~0.5s; previous page must not linger. Throttle DevTools to "Slow 4G" and confirm shell still renders <1s. **[Agent: testing]**

### Slice 2: Library streams immediately on navigation
- [x] Parallelize `getSteamConnectionStatus` + `getStatusCounts` in `app/(protected)/library/page.tsx` via `Promise.all`. Wrap `LibraryPageView` in `<Suspense fallback={<LibraryViewSkeleton />}>`. **[Agent: nextjs-expert]**
- [x] Add `app/(protected)/library/loading.tsx` (filters bar + grid of `gameCard` skeletons). **[Agent: react-frontend]**
- [ ] Verify `/library` renders shell within 0.5s on local dev; navigation from `/dashboard` shows new shell immediately. **[Agent: testing]**

### Slice 3: Protected layout no longer blocks every page on profile fetch
- [x] Create `widgets/sidebar/sidebar-user.tsx` server component that fetches profile and renders avatar + display name. **[Agent: nextjs-expert]**
- [x] Update `app/(protected)/layout.tsx`: remove top-level `getProfile` await, render `<Suspense fallback={<SidebarUserSkeleton />}><SidebarUser userId={userId} /></Suspense>` inside `AppSidebar`. **[Agent: nextjs-expert]**
- [ ] Verify all protected routes (dashboard, library, journal, profile, settings) still render correctly with sidebar avatar/name appearing progressively. **[Agent: testing]**
- [x] Component test: `SidebarUser` falls back to defaults if profile fetch throws. **[Agent: typescript-test-expert]**

### Slice 3.5: Remove the global spinner in favour of streaming
- [x] Remove the root `<Suspense fallback={<LoadingScreen />}>{children}</Suspense>` wrapper in `app/layout.tsx` — it was forcing the entire app tree to wait inside one boundary, defeating per-route streaming.
- [x] Delete `app/loading.tsx`. Routes now fall through to their own segment-level `loading.tsx` (which we're adding per the spec) or the App Router default (previous page stays until streaming begins).
- [x] Delete the now-unused `shared/components/loading-screen.tsx` and update `shared/CLAUDE.md` accordingly.

### Slice 4: One section failing doesn't break the page
- [x] Add `react-error-boundary` to `savepoint-app/package.json`. **[Agent: nextjs-fullstack]**
- [x] Create `shared/components/section-boundary.tsx` (client component) wrapping `ErrorBoundary` with inline "Couldn't load this — Retry" UI calling `reset()`. Log via existing client error reporter. **[Agent: react-frontend]**
- [x] Replace bare `<Suspense>` wrappers in `app/(protected)/dashboard/page.tsx` with `<SectionBoundary><Suspense>...</Suspense></SectionBoundary>`. **[Agent: react-frontend]**
- [x] Unit tests for `SectionBoundary`: renders children on success, renders fallback + retry on error, `reset` re-renders children. **[Agent: typescript-test-expert]**
- [ ] Manual verification: temporarily throw from inside one dashboard section component, confirm only that section shows the inline error and other sections render normally. Revert the temp throw. **[Agent: testing]**

### Slice 5: Hot reads cached with `"use cache"` + tag-based invalidation
- [x] Create `shared/lib/cache-tags.ts` with `userTags(userId)` returning `{ profile, setup, steamConnection, libraryCounts, profileStats }`. **[Agent: nextjs-fullstack]**
- [x] Mark `ProfileService.getProfile`, `checkSetupStatus`, `getSteamConnectionStatus`, `getProfileWithStats`, `LibraryService.getStatusCounts` with `"use cache"` + `cacheTag(...)` + `cacheLife(...)` per technical-considerations §2.7. **[Agent: nextjs-fullstack]**
- [x] Wire `revalidateTag` calls into mutation server actions: `features/profile/server-actions/*` (profile, avatar, username, Steam connect/disconnect, setup completion), `features/library/server-actions/*` (add/remove/status-change), `features/journal/server-actions/*` (journal entry mutations). **[Agent: nextjs-fullstack]**
- [x] Unit tests asserting each mutation server action calls `revalidateTag` with the correct tags on success. **[Agent: typescript-test-expert]**
- [ ] Manual verification: update profile name → refresh → sidebar updates without a hard reload. Add a game to library → status counts on dashboard reflect immediately. **[Agent: testing]**

### Slice 6: Remaining protected routes get the same treatment
- [x] Audit and parallelize top-level awaits in: `app/games/[slug]/page.tsx`, `app/(protected)/journal/page.tsx` (or equivalent path), `app/u/[username]/page.tsx`, `app/(protected)/settings/[section]/page.tsx`, `app/(protected)/steam/games/page.tsx`. Apply `Promise.all` and `<Suspense>` + `<SectionBoundary>` as needed. **[Agent: nextjs-expert]**
- [x] Add missing `loading.tsx` files for `journal`, `u/[username]`, `settings/[section]` — the others already have them. **[Agent: react-frontend]**
- [ ] Smoke-test every signed-in route: shell appears in <1s, sections fill in progressively, no console errors. **[Agent: testing]**

### Slice 7: TTFB — Vercel region matches Neon, cold starts mitigated
- [x] Neon region confirmed: **AWS US East 1 (N. Virginia)** → `vercel.json` `regions` set to `["iad1"]`. **[Agent: general-purpose]**
- [ ] **MANUAL** Confirm `DATABASE_URL` in Vercel env uses the pooled Neon hostname (`-pooler.<region>.aws.neon.tech`). **[Agent: nextjs-fullstack]**
- [x] Add `vercel.json` at `savepoint-app/` with `{ "regions": ["fra1"] }` (placeholder — adjust per the manual step above). **[Agent: nextjs-fullstack]**
- [x] Add a Vercel Cron in `vercel.json` calling `/api/health` every 4 minutes (interim cold-start mitigation; Neon is on Free tier so `suspend_timeout` cannot be disabled, keep-warm cron is the only option). **[Agent: nextjs-fullstack]**
- [x] Add `/api/health` route at `app/api/health/route.ts` that runs `SELECT 1` and returns 200. **[Agent: nextjs-fullstack]**
- [ ] **MANUAL / POST-DEPLOY** Pull cold-window TTFB samples (20 requests over 24h), confirm p75 < 400ms. Use `mcp__vercel__get_runtime_logs` and Speed Insights. **[Agent: testing]**

### Slice 8: Verify RES ≥ 90 on desktop and mobile

> Owner-monitored. No agent action required during the 7-day window — Nail will check Speed Insights manually and update the spec status when the window closes.

- [ ] Watch Vercel Speed Insights for 7 consecutive days after Slice 7 ships. Track desktop RES on `/dashboard`, `/library`, `/games/[slug]`, journal route, `/u/[username]` (own profile), each `/settings/[section]`, `/steam/games`. Mobile RES on the same routes must stay ≥ 90 (functional spec §2.5).
- [ ] On day 7, if all routes hold ≥ 90 desktop and ≥ 90 mobile, mark functional + technical specs as **Completed**. If any route drops below 90 for >2 consecutive days during the window, open a follow-up ticket and keep status as **In Review**.
