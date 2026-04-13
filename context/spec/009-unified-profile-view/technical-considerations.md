# Technical Specification: Unified Profile View

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Status:** Completed
- **Author(s):** Nail Badiullin

---

## 1. High-Level Technical Approach

Replace the two separate profile views (`ProfileView` at `/profile` and `PublicProfileView` at `/u/{username}`) with a single component tree rooted at `/u/[username]/`. Use Next.js App Router nested layouts to render a shared profile header plus a conditionally rendered tab bar. Each tab is a real route (Overview, Library, Activity), giving us shareable URLs, browser back/forward, and server-side data fetching for free.

**Key moves:**

- `/profile` becomes a redirect to `/u/{my-username}` (or `/profile/setup` when no username is set).
- Tab content lives in nested routes under a `(tabs)` route group so the tab bar only renders for Overview/Library/Activity — not on `/followers` or `/following`.
- A single use-case `getProfilePageData(username, viewerId?)` returns everything the layout needs, with viewer-aware field gating (email omitted for non-owners, minimal payload for private profiles).
- Privacy gating lives in the outer layout, before any tab page renders.
- Development follows a **TDD loop** (red → green → refactor) — tests come first for every new repository function, service method, use-case, and component.

**Systems affected:** `features/profile/`, `features/social/` (relocating one use-case), `app/u/[username]/`, `app/(protected)/profile/`, `data-access-layer/repository/activity-feed/`, `data-access-layer/services/profile/`.

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Routing Architecture

```
app/u/[username]/
├── layout.tsx              Fetches profile data. Renders ProfileHeader.
│                           Privacy gate: if private && !isOwner, render
│                           ProfilePrivateMessage and skip {children}.
├── (tabs)/
│   ├── layout.tsx          Renders ProfileTabNav + {children}.
│   ├── page.tsx            Overview tab.
│   ├── library/page.tsx    Library tab.
│   └── activity/page.tsx   Activity tab.
├── followers/page.tsx      Outside (tabs). No tab bar.
└── following/page.tsx      Outside (tabs). No tab bar.

app/(protected)/profile/
├── page.tsx                Redirect → /u/{username} or /profile/setup.
├── settings/page.tsx       Unchanged.
└── setup/page.tsx          Unchanged.
```

The `(tabs)` route group avoids pathname-based conditional rendering for the tab bar. Each tab page fetches the data it needs; layout data is memoized via `React.cache()` to prevent duplicate fetches in a single request.

### 2.2 Data Model Changes

No schema changes. Everything needed already exists in the current Prisma schema:

| Data need | Source |
|---|---|
| Profile header | `User` table (existing) |
| Social counts | `Follow` table (existing `countFollowers`/`countFollowing`) |
| Stats bar + library stats grid + recently played | Existing `getLibraryStatsByUserId` |
| Library preview (6 covers) | Existing `findLibraryPreview` |
| Library tab grid | Existing `findLibraryItemsWithFilters` |
| Privacy flag | Existing `User.isPublicProfile` |
| Activity tab | **New** repository query `findActivityByUserId` |

### 2.3 Repository Changes

**New function:** `findActivityByUserId(userId, cursor?, limit?)` in `data-access-layer/repository/activity-feed/activity-feed-repository.ts`.

- Mirrors `findFeedForUser` but removes the `Follow` join — it selects `LibraryItem` for a single user with `Game` and `User` joins.
- Returns the existing `PaginatedFeedResult` shape (`FeedItemRow[]` + `nextCursor`).
- Reuses `SELECT_COLUMNS`, `ORDER_BY`, `buildCursorCondition`, `buildNextCursor`, and `mapRawRows` helpers.

### 2.4 Service Layer Changes

**Activity retrieval:** A new method `getUserActivity(userId, cursor?, limit?)` backed by `findActivityByUserId`. Placement (extend `ProfileService` vs introduce `ActivityService`) is deferred to implementation — decided based on how the code reads once written. Either path is architecturally valid under current service conventions.

**No changes to:**
- `LibraryService` — the Library tab calls `getLibraryItems({ userId })` directly with the profile user's ID.
- `SocialService` — follow counts and `isFollowing` methods are reused as-is.
- `ProfileService.getProfileWithStats` / `getPublicProfile` — still used by the new use-case.

### 2.5 Use-Case Layer

**New:** `getProfilePageData(username, viewerId?)` in `features/profile/use-cases/`.

Replaces `getPublicProfilePageData` from `features/social/use-cases/` (that file is deleted; its import sites move to the new use-case). Orchestrates:

1. `ProfileService.getProfileWithStats` **or** `ProfileService.getPublicProfile` depending on whether the viewer is the owner.
2. `SocialService.getFollowCounts`.
3. `SocialService.isFollowing` — only when viewer is authenticated and not the owner.

Returns a shape like:

```
{
  profile: { id, username, name, image, createdAt, isPublicProfile, email? },
  stats?: LibraryStats,            // omitted when private && !isOwner
  libraryPreview?: Game[],         // omitted when private && !isOwner
  socialCounts: { followers, following },
  viewer: { isOwner, isAuthenticated, isFollowing? },
  isPrivate: boolean               // true means layout should gate children
}
```

**Field-level gating rules enforced in the use-case (not the UI):**
- `email` is present only when `isOwner === true`.
- `stats` and `libraryPreview` are absent when `isPrivate && !isOwner`.

Wrapped with `React.cache()` so layout + page calls in the same request share a single execution.

### 2.6 Component Breakdown

**Deleted:**
- `features/profile/ui/profile-view.tsx`
- `features/profile/ui/public-profile-view.tsx`
- `features/social/use-cases/getPublicProfilePageData.ts`

**New in `features/profile/ui/`:**

| Component | Type | Responsibility |
|---|---|---|
| `ProfileHeader` | Server (with client islands) | Avatar, name, @username, social counts. Conditionally renders email + Edit Profile + Logout (owner), Follow button (authenticated visitor), or nothing (unauthenticated visitor / owner looking at self). |
| `ProfileTabNav` | Client | Horizontal tab bar with `<Link>` elements for Overview/Library/Activity. Active state derived from `usePathname()`. |
| `ProfilePrivateMessage` | Server | "This profile is private" block shown below header when gated. |
| `OverviewTab` | Server | Composes `ProfileStatsBar`, library stats grid (hidden when `< 10` games), recently played section (hidden when empty), library preview (hidden when empty). |
| `LibraryGrid` | Server | Read-only cover grid with status badges on each cover. Links each cover to its game detail page. |
| `ActivityLog` | Client | Chronological list of library actions (added / status changed). Cursor-paginated, infinite scroll. |

**Reused as-is:** `ProfileStatsBar`, `FollowButton` (`features/social/`), `LogoutButton`, game card primitives from `widgets/game-card/`.

### 2.7 Page Implementations

| File | Role |
|---|---|
| `app/u/[username]/layout.tsx` | Calls `getProfilePageData(username, viewerId)`. Renders `ProfileHeader`. If `isPrivate && !isOwner` → renders `ProfilePrivateMessage` and skips children. |
| `app/u/[username]/(tabs)/layout.tsx` | Renders `ProfileTabNav` + `{children}`. |
| `app/u/[username]/(tabs)/page.tsx` | Overview tab — renders `OverviewTab` using data from the cached use-case. |
| `app/u/[username]/(tabs)/library/page.tsx` | Fetches library items via `LibraryService.getLibraryItems({ userId })`; renders `LibraryGrid`. |
| `app/u/[username]/(tabs)/activity/page.tsx` | Fetches via the new activity service method; renders `ActivityLog`. |
| `app/u/[username]/followers/page.tsx` | Unchanged structurally — outside `(tabs)` so no tab bar. |
| `app/u/[username]/following/page.tsx` | Unchanged structurally — outside `(tabs)` so no tab bar. |
| `app/(protected)/profile/page.tsx` | Authenticated + has username → `redirect(/u/{username})`; no username → `redirect(/profile/setup)`. |
| `app/(protected)/profile/settings/page.tsx` | Unchanged. |
| `app/(protected)/profile/setup/page.tsx` | Unchanged. |

### 2.8 Privacy Gating

Gating happens in two places, defense in depth:

1. **Use-case:** `getProfilePageData` returns `isPrivate: true` and omits sensitive fields (`email`, `stats`, `libraryPreview`) for non-owner viewers of private profiles.
2. **Layout:** `app/u/[username]/layout.tsx` checks `isPrivate && !isOwner` and renders `ProfilePrivateMessage` instead of `{children}`. This guarantees direct URLs to `/library` and `/activity` on private profiles never render tab content.

Tab pages additionally call the cached use-case and short-circuit if the profile is private and the viewer is not the owner — belt-and-suspenders against future refactors that might change the layout boundary.

---

## 3. Impact and Risk Analysis

### System Dependencies

- `features/social/use-cases/getPublicProfilePageData` → moved/renamed. All imports updated.
- `features/profile/index.ts` barrel → removes `ProfileView`/`PublicProfileView` exports; adds new components.
- `app/u/[username]/page.tsx` → changes from rendering `PublicProfileView` to rendering Overview tab content.
- `app/(protected)/profile/page.tsx` → changes from rendering `ProfileView` to a redirect.

### Potential Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `/profile` bookmarks break | Preserved via redirect — zero link breakage. |
| Email leaks to non-owners | Gated at use-case level (not UI) — `email` field is omitted when `isOwner === false`. |
| Private profile data leaks via tab URLs | Layout gates `{children}` when private && !owner; tab pages additionally short-circuit. |
| Duplicate data fetching between layout and page | `getProfilePageData` wrapped in `React.cache()` for request-level memoization. |
| Library tab loads too many items for large libraries | v1: render all items from a single `getLibraryItems` call. Paginate in a follow-up if real-world libraries push rendering costs past acceptable thresholds. |
| Obsolete component tests for deleted views | Delete tests alongside deleted components; replace with tests for new components (enforced by TDD order). |
| Activity tab query regresses ordering/pagination | Integration test in the activity-feed repository covers ordering (most recent first), cursor behavior, and joins before implementation begins. |

---

## 4. Testing Strategy

**Methodology:** TDD throughout. For each new unit (repository function, service method, use-case, component), tests are written first, observed to fail, then implemented until green, then refactored.

**Out of scope:** E2E tests. The existing Playwright suite is outdated and will be addressed in a separate refactoring spec.

| Layer | What we test | Type |
|---|---|---|
| Repository | `findActivityByUserId` — ordering by `GREATEST(createdAt, statusChangedAt) DESC, id DESC`; cursor pagination correctness; User + Game joins; zero-result case. | Integration (real Postgres via Docker) |
| Service | `getUserActivity` — success path, repository error propagation, structured logging. | Unit (mocked repository) |
| Use-case | `getProfilePageData` — owner path (includes email, no follow status), authenticated visitor on public profile (no email, includes follow status), unauthenticated visitor on public profile (no email, no follow status), any visitor on private profile (minimal fields, `isPrivate: true`), owner on own private profile (full data, `isPrivate: false` or ignored by layout). | Unit (mocked ProfileService + SocialService) |
| Component | `ProfileHeader` — renders correct controls per viewer type (owner, authenticated visitor, unauthenticated visitor, owner-viewing-self). `ProfileTabNav` — active state from pathname. `OverviewTab` — section visibility rules (hides stats grid when `< 10` games, hides recently-played and library-preview when empty). `LibraryGrid` — status badge rendering, link targets. `ActivityLog` — renders "added" vs "status changed" events, paginates. `ProfilePrivateMessage` — copy and structure. | Component (Vitest + Testing Library) |

**Deleted tests:** any tests covering `ProfileView`, `PublicProfileView`, or `getPublicProfilePageData`.

**Coverage target:** ≥80% for branches, functions, lines, statements (project-wide threshold, enforced in CI).
