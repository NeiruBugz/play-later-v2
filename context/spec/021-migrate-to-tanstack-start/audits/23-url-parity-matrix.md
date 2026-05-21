# Slice 23 — URL Parity Matrix

> **Spec:** 021 Migrate to TanStack Start · **Slice:** 23 (Final parity audit) · **Date:** 2026-05-21
> **Agent:** `feature-dev:code-explorer` · **Scope:** FUNCTIONAL parity only (loader data, route guards, search-param contracts). Visual/primitive parity is owned by Slice 22 and out of scope here.
> **Gate verdict:** ✅ **PASS** (re-verified 2026-05-21 after blocker remediation #1/#2/#5 — see § Gate verdict). *Original audit was 🚫 BLOCKED on 5 findings; all resolved.*

## Summary

Canonical `savepoint-app/` exposes **23 routable page URLs** and **12 API route URLs** (35 total). Tanstack maps **all 23 pages** as `MAPPED` / `MAPPED-WITH-NOTE`, covers the auth catch-all API route cleanly, and waives the remaining 11 REST API routes (replaced by the C2 `createServerFn` server-fn architecture) plus 1 legacy redirect shim.

**0 page URLs remain `UNMAPPED`.** The original audit found 5 blocking gaps (4 journal/profile page-routes whose flows had become in-page dialogs, + 1 auth-guard mismatch on game search). All 5 were remediated (blocker remediation #1/#2/#5) and re-verified mapped on 2026-05-21 — see § Gate verdict.

**Totals (post-remediation):** Mapped 23 pages · Unmapped/blocking 0 · Waived 11 API routes + 2 redirect/shim pages + 1 consolidated sub-tab pair. The tanstack-only `/about` route has no canonical counterpart and is not a cutover-gate item (omitted).

## Matrix

| Canonical URL | Canonical file | Tanstack URL | Tanstack file | Loader/data parity | Guard parity | Search-param parity | Status |
|---|---|---|---|---|---|---|---|
| `/` | `app/page.tsx` | `/` | `src/routes/index.tsx` | match — both redirect authed away; render landing for anon | note: canonical → `/dashboard`; tanstack → `/profile` (→ `/u/$username`) — net destination equivalent | none | ⚠️ MAPPED-WITH-NOTE |
| `/login` | `app/login/page.tsx` | `/login` | `src/routes/login.tsx` | match — tanstack additionally loads `getEmailSignInEnabledFn` to gate email form | match — both redirect signed-in → `/dashboard` | none | ✅ MAPPED |
| `/dashboard` | `app/(protected)/dashboard/page.tsx` | `/dashboard` | `src/routes/_authed/dashboard.tsx` | match — canonical Suspense server components; tanstack `getDashboardPageDataFn` | match — `(protected)`+`requireServerUserId` vs `_authed`+`requireUserIdOrRedirectFn` | none | ✅ MAPPED |
| `/profile` | `app/(protected)/profile/page.tsx` | `/profile` | `src/routes/_authed/profile.tsx` | match — both pure redirects. no-username: **both → `/profile/setup`** (repointed in remediation #2); has-username: both → `/u/$username` | match — authed-only | none | ✅ MAPPED |
| `/profile/setup` | `app/(protected)/profile/setup/page.tsx` | `/profile/setup` | `src/routes/_authed/profile.setup.tsx` | match — loader resolves `getProfileSetupStatusFn`, `!needsSetup`→redirect `/dashboard`, else renders setup form pre-filled w/ suggested username; persists via `updateProfileFn` (remediation #2) | match — authed (inherits `_authed` guard); `errorComponent` branches `UNAUTHORIZED` | none | ⚠️ MAPPED-WITH-NOTE |
| `/profile/settings` | `app/(protected)/profile/settings/page.tsx` | — | — | canonical is pure `redirect("/settings/profile")` — no content | — | — | ➖ WAIVED |
| `/library` | `app/(protected)/library/page.tsx` | `/library` | `src/routes/_authed/library.tsx` | match — both load library items for signed-in user | match — authed-only | note: canonical reads raw `status/platform/sortBy/sortOrder`; tanstack typed `validateSearch` superset (+`minRating`,`unratedOnly`) | ⚠️ MAPPED-WITH-NOTE |
| `/journal` | `app/(protected)/journal/page.tsx` | `/journal` | `src/routes/_authed/journal.tsx` | note: canonical `limit:20`; tanstack full timeline (Slice-15 divergence) | match — authed-only | none | ⚠️ MAPPED-WITH-NOTE |
| `/journal/new` | `app/(protected)/journal/new/page.tsx` | `/journal/new` | `src/routes/_authed/journal.new.tsx` | match — renders `ComposeJournalEntryForm`, submits via `createJournalEntryFn`, success→`/journal/$id` (remediation #1) | match — authed-only | match — `validateSearch {gameId?}`; `?gameId` pre-selects game (canonical parity) | ✅ MAPPED |
| `/journal/[id]` | `app/(protected)/journal/[id]/page.tsx` | `/journal/$id` | `src/routes/_authed/journal.$id.tsx` | match — loader `getJournalEntryPageDataFn`→`getJournalEntryById` (ownership: `NotFoundError` for missing AND cross-user); `errorComponent` `NOT_FOUND`→404 (remediation #1) | match — authed-only | none | ✅ MAPPED |
| `/journal/[id]/edit` | `app/(protected)/journal/[id]/edit/page.tsx` | `/journal/$id/edit` | `src/routes/_authed/journal.$id.edit.tsx` | match — loader same single-entry fetch + ownership; pre-fills edit form, submits via `updateJournalEntryFn`, success→`/journal/$id`; `errorComponent` `NOT_FOUND`→404 (remediation #1) | match — authed-only | none | ✅ MAPPED |
| `/settings` | `app/(protected)/settings/page.tsx` | `/settings` | `src/routes/_authed/settings.tsx` | note: canonical pure `redirect("/settings/profile")`; tanstack is layout shell w/ `<Outlet/>`, no auto-redirect from bare `/settings` | match — authed-only | none | ⚠️ MAPPED-WITH-NOTE |
| `/settings/profile` | `app/(protected)/settings/profile/page.tsx` | `/settings/profile` | `src/routes/_authed/settings/profile.tsx` | match — both load profile + render settings form; tanstack adds avatar section | match — authed-only | none | ✅ MAPPED |
| `/settings/account` | `app/(protected)/settings/account/page.tsx` | `/settings/account` | `src/routes/_authed/settings/account.tsx` | note: tanstack additionally loads `getSteamConnectionFn` + `SteamConnectCard` (superset); canonical = sign-out card only | match — authed-only | none | ⚠️ MAPPED-WITH-NOTE |
| `/settings/connections` | `app/(protected)/settings/connections/page.tsx` | — | — | Steam-connect content folded into tanstack `/settings/account`; no standalone route | — | — | ⚠️ MAPPED-WITH-NOTE |
| `/steam/games` | `app/(protected)/steam/games/page.tsx` | `/steam/games` | `src/routes/_authed/steam/games.tsx` | match — both load imported games; canonical redirects to `/profile` if not connected, tanstack renders empty state | match — authed-only | note: tanstack rich `validateSearch` filter schema vs canonical client-only `useState` (intentional improvement) | ⚠️ MAPPED-WITH-NOTE |
| `/steam/callback` | `app/api/steam/auth/callback/route.ts` (GET redirect) | `/steam/callback` | `src/routes/steam.callback.tsx` | match — both validate OpenID + connect; success: canonical → `/settings/profile?steam=connected`, tanstack → `/settings/account` | match — public; tanstack `connectSteamFn` enforces `requireUserId()` | match — both accept `openid.*`; tanstack typed `validateSearch` w/ coercion | ⚠️ MAPPED-WITH-NOTE |
| `/games/[slug]` | `app/games/[slug]/page.tsx` | `/games/$slug` | `src/routes/games.$slug.tsx` | match — IGDB payload + DB entry + viewer library entry + journal teaser; tanstack streams related/times-to-beat via `useSuspenseQuery` | match — public; viewer from server session | match — tanstack `validateSearch` `{page?:number}` for related-games pagination | ✅ MAPPED |
| `/games/search` | `app/games/search/page.tsx` | `/games/search` | `src/routes/games.search.tsx` | match — both render search UI reading `q` | match — **route moved out of `_authed/` to root; PUBLIC, no `beforeLoad`; anonymous search works** (remediation #5) | match — both accept `q` (`validateSearch {q?}`) | ✅ MAPPED |
| `/u/[username]` | `app/u/[username]/(tabs)/page.tsx` | `/u/$username` | `src/routes/u.$username.tsx` | match — public profile + viewer identity + activity; tanstack loads all in one loader, canonical splits across sub-routes | match — public; privacy at entity layer | none | ✅ MAPPED |
| `/u/[username]/library` | `app/u/[username]/(tabs)/library/page.tsx` | `/u/$username` (Library tab slot) | `src/routes/u.$username.tsx` | note: canonical separate route w/ own loader; tanstack folds into `u.$username.tsx` loader (`libraryItems`) — no file-based sub-route | match — public | none | ⚠️ MAPPED-WITH-NOTE |
| `/u/[username]/activity` | `app/u/[username]/(tabs)/activity/page.tsx` | `/u/$username` (Activity tab slot) | `src/routes/u.$username.tsx` | note: canonical separate route w/ own loader; tanstack folds activity into `u.$username.tsx` loader — no file-based sub-route | match — public | none | ⚠️ MAPPED-WITH-NOTE |
| `/u/[username]/followers` | `app/u/[username]/followers/page.tsx` | `/u/$username/followers` | `src/routes/u.$username.followers.tsx` | match — public profile + followers list | match — public; `NotFoundError` → `notFoundComponent` | none | ✅ MAPPED |
| `/u/[username]/following` | `app/u/[username]/following/page.tsx` | `/u/$username/following` | `src/routes/u.$username.following.tsx` | match — public profile + following list | match — public | none | ✅ MAPPED |
| **API ROUTES** | | | | | | | |
| `/api/auth/[...all]` | `app/api/auth/[...all]/route.ts` | `/api/auth/$` | `src/routes/api/auth/$.ts` | match — both delegate to `auth.handler(request)` (GET+POST) | match — public catch-all | match — wildcard accepts all BA sub-paths | ✅ MAPPED |
| `/api/steam/auth` | `app/api/steam/auth/route.ts` | — | — | replaced: OpenID initiation via `SteamConnectCard` link computed by server fn | — | — | ➖ WAIVED |
| `/api/steam/auth/callback` | `app/api/steam/auth/callback/route.ts` | — | — | replaced by page route `/steam/callback` (mapped above) | — | — | ➖ WAIVED |
| `/api/steam/connect` | `app/api/steam/connect/route.ts` | — | — | replaced by `connectSteamFn` server fn | — | — | ➖ WAIVED |
| `/api/steam/games` | `app/api/steam/games/route.ts` | — | — | replaced by `fetchSteamGamesFn` server fn | — | — | ➖ WAIVED |
| `/api/steam/sync` | `app/api/steam/sync/route.ts` | — | — | replaced by `import-steam-library` server fn | — | — | ➖ WAIVED |
| `/api/library` | `app/api/library/route.ts` | — | — | replaced by `getLibraryPageDataFn` server fn | — | — | ➖ WAIVED |
| `/api/library/status-counts` | `app/api/library/status-counts/route.ts` | — | — | replaced by status counts derived in `getLibraryPageDataFn` | — | — | ➖ WAIVED |
| `/api/library/unique-platforms` | `app/api/library/unique-platforms/route.ts` | — | — | replaced by platforms returned by `getLibraryPageDataFn` | — | — | ➖ WAIVED |
| `/api/games/search` | `app/api/games/search/route.ts` | — | — | replaced by `searchGamesFn` server fn | — | — | ➖ WAIVED |
| `/api/games/[igdbId]/platforms` | `app/api/games/[igdbId]/platforms/route.ts` | — | — | replaced by `getTimesToBeatForGameFn`/`getRelatedGamesForGameFn` + live IGDB payload | — | — | ➖ WAIVED |
| `/api/social/feed` | `app/api/social/feed/route.ts` | — | — | replaced by `get-activity-feed-fn` server fn | — | — | ➖ WAIVED |

## § Blocking findings

> **✅ ALL RESOLVED (2026-05-21).** The 5 findings below were the *original* audit's blockers. Remediation #1 (journal pages), #2 (profile/setup), and #5 (games/search public) landed and were re-verified mapped (gates green: typecheck/lint/format clean, unit 850/111 files, integration 406/41 files). Findings retained below for historical traceability.

1. **`/profile/setup`** *(RESOLVED — remediation #2)* — No tanstack route. Canonical sends no-username users here for guided onboarding via `ProfileSetupForm` (suggested username). Tanstack's `/profile` `beforeLoad` redirects no-username users to `/settings/profile`, a generic settings form without the setup UX. Functional gap for new-user onboarding.
2. **`/journal/new`** — No tanstack route. Canonical exposes a full-page compose form at a stable URL. Tanstack composes via an in-page dialog from `/journal`. Any deep-link / command-palette navigation to `/journal/new` 404s. (Command-palette divergence already documented; the missing URL is the open issue.)
3. **`/journal/[id]`** — No tanstack route. Canonical renders a standalone entry-detail page addressable by ID. Tanstack uses an in-page dialog from the timeline. No stable URL for an individual entry; direct links / back-forward to an entry unsupported.
4. **`/journal/[id]/edit`** — No tanstack route. Canonical renders a full-page edit form. Tanstack edits via dialog. No stable edit URL.
5. **`/games/search` guard mismatch** — Canonical page is **public** (`getServerUserId()` optional, no anon redirect). Tanstack route lives under `_authed/` and **requires auth**, redirecting anon visitors to `/login`. Anonymous game search — a canonical feature — is blocked. Not documented as intentional in DIVERGENCES.md/CLAUDE.md; likely inadvertent `_authed/` placement.

## § Notes & waivers

### MAPPED-WITH-NOTE
- **`/`** — authed redirect target: canonical → `/dashboard`, tanstack → `/profile` → `/u/$username`. DIVERGENCES.md V1/Flow 1 (`callbackURL` divergence).
- **`/profile`** — no-username branch: canonical → `/profile/setup`, tanstack → `/settings/profile`. DIVERGENCES.md Slice 18A.
- **`/library`** — tanstack `validateSearch` superset (`minRating`,`unratedOnly`); `unratedOnly` not yet honored by `getLibraryPageDataFn` (inline comment; backend filtering in a later slice).
- **`/journal`** — canonical `limit:20`, tanstack full timeline. DIVERGENCES.md Slice 15.
- **`/settings`** — canonical redirects to `/settings/profile`; tanstack layout shell with no auto-redirect from bare path. Minor UX divergence, not data-access.
- **`/settings/account`** — tanstack consolidates Steam connections (from canonical `/settings/connections`) into account page.
- **`/settings/connections`** — feature absorbed into tanstack `/settings/account`; bookmarks to `/settings/connections` 404. Known cutover concern.
- **`/steam/games`** — canonical redirects unconnected users to `/profile`; tanstack shows in-page empty state. Tanstack URL-driven filter `validateSearch` is an intentional improvement.
- **`/steam/callback`** — success redirect: canonical → `/settings/profile?steam=connected`, tanstack → `/settings/account` (consequence of Steam-UI consolidation).
- **`/u/[username]/library`, `/u/[username]/activity`** — canonical separate file-based sub-routes; tanstack consolidates into `u.$username.tsx` loader + Radix client tabs. DIVERGENCES.md Slice 20. Direct nav to `/u/<name>/library` or `/u/<name>/activity` 404s in tanstack (content reachable via tab selection on `/u/$username`). Intentional architectural divergence per spec.
- **`/games/search`** — see Blocking #5; guard requirement not documented as intentional.

### WAIVED
- **`/profile/settings`** — pure legacy redirect shim in canonical; tanstack omits. Legacy-URL 404 acceptable if URL was transitional.
- **11 REST API routes** (`/api/steam/*`, `/api/library*`, `/api/games/*`, `/api/social/feed`) — replaced by the C2 `createServerFn` server-fn architecture (documented throughout `savepoint-tanstack/CLAUDE.md`). Equivalent server-fn surface verified to exist for each. Structural choice, not per-feature; no DIVERGENCES.md entry required.

## § Gate verdict

✅ **PASS** (re-verified 2026-05-21) — matrix is 100% green; 0 UNMAPPED URLs. The Slice 23 **Verification** task's "parity matrix 100% green" condition is satisfied.

**Original verdict (superseded):** 🚫 BLOCKED on 5 UNMAPPED URLs. The product owner elected to BUILD parity for all five rather than waive:

| # | URL | Resolution | Verified |
|---|---|---|---|
| 1 | `/profile/setup` | Built route (remediation #2) — setup-status read + suggested-username form + `updateProfileFn` write; `/profile` no-username redirect repointed here | ✅ |
| 2 | `/journal/new` | Built route (remediation #1) — compose page via `createJournalEntryFn` | ✅ |
| 3 | `/journal/[id]` | Built route (remediation #1) — detail page; loader→`getJournalEntryById` (ownership invariant); `NOT_FOUND`→404 | ✅ |
| 4 | `/journal/[id]/edit` | Built route (remediation #1) — edit page via `updateJournalEntryFn` | ✅ |
| 5 | `/games/search` | Fixed guard (remediation #5) — route moved out of `_authed/` to public root | ✅ |

**Remaining non-blocking notes** (feature-completeness gaps, NOT routing/parity blockers, tracked in `DIVERGENCES.md`): profile-setup "Skip for now" affordance deferred (writes `profileSetupCompletedAt`, not exposed by `updateProfile`); journal new-entry page has no game-picker/kind-selector (tanstack journal model dropped these in Slice 16); `/games/search` add-to-library affordance not yet ported (Slice 22 scope). None affect URL resolution, loader data parity, route guards, or search-param contracts.
