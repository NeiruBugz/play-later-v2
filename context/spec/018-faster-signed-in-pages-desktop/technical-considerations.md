# Technical Specification: Faster Signed-In Pages on Desktop

- **Functional Specification:** [./functional-spec.md](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Nail Badiullin

---

## 1. High-Level Technical Approach

The current page/layout pattern blocks every signed-in render on a chain of sequential awaits before any HTML can flush. `app/(protected)/layout.tsx` awaits a profile fetch; the page (`dashboard/page.tsx`, `library/page.tsx`) then awaits 2–3 more service calls in series. The Suspense boundaries inside the page bodies never get a chance to stream because the page function itself never returns until all top-level awaits resolve. Result: TTFB + 3–5 serial DB roundtrips before first paint.

The fix has five parts:

1. **Strip top-level awaits down to authentication** in every protected page and the protected layout. Profile, status counts, setup status, etc. move into Suspense-wrapped server components.
2. **Add a `loading.tsx` for every protected route segment**, matching the visible skeleton structure of the page.
3. **Wrap each section in a per-section error boundary** with inline retry, using `react-error-boundary`.
4. **Mark hot reads with `"use cache"`** and tag by user identity so they dedupe across requests and navigations and can be invalidated on mutation via `revalidateTag`.
5. **Pin Vercel function region to match the Neon Postgres region** and address Neon's cold-start contribution to TTFB.

Empty-library and needs-setup checks remain page-level (they gate which top-level layout renders) but run in parallel via `Promise.all` instead of sequentially.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Streaming structure — protected layout

**File:** `app/(protected)/layout.tsx`

- Remove the top-level `profileService.getProfile` await.
- Pass `userId` into a new server component `widgets/sidebar/sidebar-user.tsx` that fetches its own profile and is rendered inside `<Suspense fallback={<SidebarUserSkeleton />}>` within `AppSidebar`.
- Keep `requireServerUserId` at the top — it's already React-`cache`-deduped and necessary for routing.

### 2.2 Streaming structure — Dashboard

**File:** `app/(protected)/dashboard/page.tsx`

- Replace the three sequential awaits (`checkSetupStatus`, `getProfileWithStats`, `getStatusCounts`) with a single `Promise.all` call. `setupStatus` and `hasEmptyLibrary` decide branching and stay at page level. `username` moves into the `QuickLogHero` server component, which already runs inside Suspense.
- All other section components already render inside `<Suspense>` and remain unchanged structurally.

### 2.3 Streaming structure — Library

**File:** `app/(protected)/library/page.tsx`

- Replace sequential `getSteamConnectionStatus` + `getStatusCounts` with `Promise.all`.
- `LibraryPageView` becomes the streamed boundary: keep the page body returning `<Suspense fallback={<LibraryViewSkeleton />}><LibraryPageView ... /></Suspense>` so the filters + grid stream independently of the Steam-connected check.

### 2.4 Streaming structure — other protected routes

Apply the same pattern to all signed-in routes listed in the functional spec §2.4:

| Route | Action |
|---|---|
| `/dashboard` | §2.2 above |
| `/library` | §2.3 above |
| `/games/[slug]` | already has `loading.tsx`; audit for top-level sequential awaits and parallelize |
| `/journal` (or equivalent personal journal route) | audit, parallelize, add `loading.tsx` if missing |
| `/u/[username]` (own profile) | audit, parallelize, add `loading.tsx` if missing |
| `/settings/[section]` | audit, parallelize, add `loading.tsx` if missing |
| `/steam/games` | already has `loading.tsx`; audit page body |

### 2.5 Loading shells

For each route that does not yet have one, add `loading.tsx` next to `page.tsx`:

| File | Responsibility |
|---|---|
| `app/(protected)/dashboard/loading.tsx` | Dashboard skeleton: hero + checklist + 2-col grid of card skeletons + recently-added row |
| `app/(protected)/library/loading.tsx` | Library skeleton: filters bar + grid of `gameCard` skeletons |
| `app/(protected)/journal/loading.tsx` | Journal skeleton: timeline of entry skeletons |
| `app/u/[username]/loading.tsx` | Profile skeleton: header + tab strip + content slot |
| `app/(protected)/settings/[section]/loading.tsx` | Settings skeleton: form-section skeleton |

Reuse the existing `Skeleton` component (`@/shared/components/ui/skeleton`) with its `variant` prop (`gameCard`, `card`, `title`).

### 2.6 Per-section error boundaries

**New dependency:** `react-error-boundary` (≈3 KB gzipped, well-maintained).

**New shared component:** `shared/components/section-boundary.tsx` (client component)

Responsibilities:
- Wraps `react-error-boundary`'s `ErrorBoundary`.
- Renders an inline error card via `Skeleton` with a small "Couldn't load this — Retry" button calling `reset()`.
- Logs the error via the existing client-side error reporter.

Usage pattern at every section site:

```
<SectionBoundary>
  <Suspense fallback={<SectionSkeleton />}>
    <DashboardStats userId={userId} />
  </Suspense>
</SectionBoundary>
```

Replace the bare `<Suspense>` wrappers in `dashboard/page.tsx` and any equivalent multi-section page with this pattern.

### 2.7 Caching hot reads

Mark the following service methods with the `"use cache"` directive at the function body, with explicit `cacheTag` and `cacheLife` profiles. Neon's cold-start variance makes cache hits especially valuable here — a hit avoids the compute-wakeup hop entirely.

| Service method | `cacheTag` | `cacheLife` profile | Invalidate via `revalidateTag` on |
|---|---|---|---|
| `ProfileService.getProfile({ userId })` | `user:${userId}:profile` | `minutes` | profile update, avatar change, username change |
| `ProfileService.checkSetupStatus({ userId })` | `user:${userId}:setup` | `minutes` | profile setup completion |
| `ProfileService.getSteamConnectionStatus({ userId })` | `user:${userId}:steam-connection` | `minutes` | Steam connect/disconnect |
| `LibraryService.getStatusCounts({ userId })` | `user:${userId}:library:counts` | `seconds` (short) | library add/remove/status-change server actions |
| `ProfileService.getProfileWithStats({ userId })` | `user:${userId}:profile-stats` | `seconds` | journal entry, library mutation |

Existing mutation server actions (in `features/library/server-actions/`, `features/profile/server-actions/`, `features/journal/server-actions/`) gain `revalidateTag` calls for the relevant tags. A single `lib/cache-tags.ts` helper centralises tag construction (`userTags(userId).profile`, etc.) so call sites stay readable and refactor-safe.

### 2.8 Function region pinning (TTFB)

**File:** `vercel.json` (new) and verification via `mcp__vercel__get_project`.

- Identify the Neon project's region from the Neon console (likely `aws-eu-central-1` or `aws-us-east-1` — **confirm before changing anything**).
- Set Vercel function region in `vercel.json`:
  ```json
  { "regions": ["<neon-region-equivalent>"] }
  ```
  Vercel region codes (e.g. `fra1` for Frankfurt, `iad1` for US East) must map to the same physical region as the Neon compute. A region pin only helps if the two are co-located.
- Verify the connection string uses the **pooled** Neon hostname (`<project>-pooler.<region>.aws.neon.tech`), not the direct one. Pooled URL is required for serverless function workloads.
- Re-measure TTFB on a sample of requests post-deploy.

### 2.9 Neon cold-start mitigation

Neon auto-suspends the compute after ~5 minutes of inactivity on the free / launch tier. Cold-start to first query can be 500ms–2s — that's a credible chunk of the observed 0.82s TTFB and matches the desktop FCP "spike" pattern in Speed Insights (sparse traffic → cold compute on each visit).

Mitigations, in order of cost vs. impact:

| Option | Cost | Impact | Decision |
|---|---|---|---|
| Confirm Neon plan tier and current `suspend_timeout` | Free | Diagnostic | **Do first.** May already allow longer / disabled suspend. |
| Increase `suspend_timeout` (Neon Scale plan, `0` = never suspend) | Plan upgrade if not already on Scale | Eliminates cold starts entirely | Recommended once production RES baseline is established. |
| Keep-warm cron pinging a cheap endpoint every 4–5 min | ~$0 | Eliminates cold starts during business hours; cheap | Acceptable interim. Use Vercel Cron hitting `/api/health` that runs a single trivial query. |
| Prisma `previewFeatures = ["driverAdapters"]` + `@neondatabase/serverless` driver | Code change | Reduces per-request connection overhead via HTTP/WebSocket protocol; well-suited to serverless | Worth evaluating if pooled connection still shows latency after region pin. |

**Recommendation:** confirm tier + region first (no-op). If on Scale, set `suspend_timeout` to `0` for the production branch. Otherwise add a Vercel Cron keep-warm hitting `/api/health` every 4 minutes as the interim fix and revisit upgrading the plan.

---

## 3. Impact and Risk Analysis

### System Dependencies

- **Next.js 16 caching** (`cacheComponents: true`) — already enabled; no version bump.
- **`react-error-boundary`** — new dependency at the root of `savepoint-app/`.
- **Vercel project configuration** — region change requires a committed `vercel.json` (or dashboard change).
- **Neon Postgres** — region/tier configuration owned in Neon console; no Terraform module exists for it today.
- **Mutation server actions** — every action that updates profile, library status, journal entries, Steam connection must call `revalidateTag` for the relevant cached read. Missing one means stale data in the UI.

### Potential Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Stale cached profile/status counts after mutation | Centralise tag constants in `lib/cache-tags.ts`; add a unit test for each mutation server action that asserts the right `revalidateTag` calls fire. |
| Empty-library "flash" if gate moves into a child | Decided against: gate stays at page level via `Promise.all`, so the flash never occurs. |
| Region change has no effect because Neon and Vercel aren't co-located | Verify Neon region first; if Neon is in `aws-eu-central-1`, pin Vercel to `fra1`. Don't change Vercel without confirming Neon's location. |
| `react-error-boundary` adds tiny client-bundle overhead | Negligible (~3 KB); already pays for itself by preventing full-page crashes. |
| `"use cache"` on per-user methods balloons the cache key space | `cacheLife: "seconds"` for library counts keeps memory bounded. The Vercel data cache is already sized for per-user keys. |
| Splitting Suspense boundaries hides slow sections from regression detection | Speed Insights still measures route-level RES; mitigated by 7-day sustain requirement before declaring complete. |
| Mobile regression from new client-side boundaries | Verify on a preview deployment first; check mobile RES stays ≥ 90 for 48h before promoting to production (functional spec §2.5). |
| Keep-warm cron masks a real cold-start problem rather than fixing it | Acceptable as an interim; tracked as follow-up to upgrade Neon plan once RES is green. |

### Out of scope (rejected during planning)

- Moving to React Server Components streaming with the edge runtime: too large a change; current Node runtime is fine once region is fixed.
- Switching ORMs or query patterns: structural fix is sufficient; query-level tuning can come later if RES still misses target.
- Prefetching on hover: useful but separate concern; revisit if RES targets aren't met after this spec ships.
- Migrating Neon to a different provider: out of scope; Neon's serverless model is appropriate for this workload.

---

## 4. Testing Strategy

### Unit tests

- `lib/cache-tags.ts` — verify tag generation is stable for a given userId.
- Mutation server actions — assert `revalidateTag` is called with the correct tags on success (covers the staleness risk).
- `SectionBoundary` — renders children on success, renders fallback + retry on thrown error, calls `reset` on retry.

### Component tests

- Each new `loading.tsx` renders without crashing and matches the structure of its corresponding `page.tsx` (visual snapshot or DOM-shape assertion).
- `<SectionBoundary>` swallows section errors without escalating to the route-level `error.tsx`.

### Integration tests (Playwright, `e2e/`)

- Navigate to `/dashboard` while signed in; assert the page heading and at least one skeleton placeholder are visible within 1 second of click (DOM presence check, not RUM).
- Navigate to `/library` from `/dashboard`; assert the previous page does not remain on screen — the new shell is present immediately.
- Force a deliberate 500 from one dashboard section's data source (test-only feature flag); assert the section shows the inline retry control and other sections still render.

### Performance verification (post-deploy)

- Watch Vercel Speed Insights (Real Experience Score) for each route in §2.4 of the functional spec.
- Spec is **Completed** only when all listed routes hold RES ≥ 90 on desktop for 7 consecutive days, and mobile RES stays ≥ 90.
- Add a one-week post-deploy reminder for the author to verify and update the spec status.

### Local sanity check

- Run `pnpm --filter savepoint build && pnpm --filter savepoint start` and use Chrome DevTools Performance tab with "Slow 4G" throttling to confirm the page shell renders within ~1 second on every signed-in route (functional spec §2.6).

### Cold-start verification (Neon)

- After the keep-warm cron is in place (or `suspend_timeout` is increased), sample 20 cold-window requests across a 24-hour period and confirm TTFB stays below 400ms at p75. If not, escalate to driver-adapter migration in §2.9.
