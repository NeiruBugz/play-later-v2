# Technical Specification: Social Engagement

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Nail

---

## 1. High-Level Technical Approach

Social Engagement is a **savepoint-app-only** feature — no Lambda or Terraform changes. It introduces three capabilities on top of the existing architecture:

1. **Public profiles** — new `isPublicProfile` field on `User`, new public route at `/u/[username]`
2. **Follow system** — new `Follow` join table, new `SocialService` + `follow-repository`
3. **Activity feed** — derived from existing `LibraryItem` records joined with `Follow`, no separate event table. A new `statusChangedAt` field on `LibraryItem` enables distinguishing "added" vs "status changed" events.

**Architecture fit:** New `features/social/` feature slice + extended `features/profile/`. New `SocialService` and `ActivityFeedService` in the DAL. Feed widget follows the existing dashboard RSC pattern (async Server Component wrapped in `<Suspense>`).

---

## 2. Proposed Solution & Implementation Plan

### Data Model Changes

**User table — add field:**

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `isPublicProfile` | `Boolean` | `false` | Controls profile page visibility and feed eligibility |

**LibraryItem table — add field:**

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `statusChangedAt` | `DateTime?` | `null` | Set on status mutations only; enables feed event type detection |

**New Follow table:**

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `followerId` | `String` | FK → User | The user who follows |
| `followingId` | `String` | FK → User | The user being followed |
| `createdAt` | `DateTime` | `@default(now())` | When the follow happened |

- Composite PK: `@@id([followerId, followingId])` — prevents duplicate follows
- Indexes: `@@index([followerId])`, `@@index([followingId])` — efficient lookups in both directions
- Self-referential relation on `User` (two relation fields: `followers Follow[]` and `following Follow[]`)
- `onDelete: Cascade` on both FKs — deleting a user removes all follow relationships

**Migration strategy:**
- Single migration adding `isPublicProfile` (default `false`), `statusChangedAt` (nullable), and `Follow` table
- No backfill needed — existing users default to private, `statusChangedAt` stays null for historical items
- Non-destructive: all changes are additive

### Activity Feed — Derived Query Design

The feed is a **query over existing `LibraryItem` records**, filtered to followed users with public profiles.

**Feed query logic:**

```
SELECT li.*, u.name, u.username, u.image, g.title, g.coverImage, g.slug
FROM LibraryItem li
JOIN Follow f ON f.followingId = li.userId
JOIN User u ON u.id = li.userId
JOIN Game g ON g.id = li.gameId
WHERE f.followerId = :currentUserId
  AND u.isPublicProfile = true
ORDER BY GREATEST(li.createdAt, COALESCE(li.statusChangedAt, li.createdAt)) DESC
LIMIT 20
OFFSET :cursor
```

**Event type detection:**
- `statusChangedAt IS NULL` → "added [Game] to their library" (display with `createdAt` timestamp)
- `statusChangedAt IS NOT NULL` → "marked [Game] as [Status]" (display with `statusChangedAt` timestamp)

**Popular feed (empty state):** Same query structure but without the `Follow` join — query `LibraryItem` from users with `isPublicProfile = true`, ordered by recency, limited to distinct actors.

**Pagination:** Cursor-based using the computed timestamp (`GREATEST(createdAt, statusChangedAt)`). Pass the last item's timestamp as cursor for next page.

**Limitations (accepted tradeoffs):**
- Each game shows only its **latest** activity per user (not full history)
- Cannot show "changed from X to Y" — only "marked as Y"
- Infinite scroll loads from the most recent `statusChangedAt` or `createdAt` backward

### Repository Layer

**New `repository/follow/follow-repository.ts`:**

| Function | Purpose |
|----------|---------|
| `createFollow(followerId, followingId)` | Insert follow row. Throw `DuplicateError` if exists |
| `deleteFollow(followerId, followingId)` | Remove follow row. Throw `NotFoundError` if not exists |
| `findFollowers(userId, opts?)` | Paginated list of users following this user |
| `findFollowing(userId, opts?)` | Paginated list of users this user follows |
| `countFollowers(userId)` | Follower count |
| `countFollowing(userId)` | Following count |
| `isFollowing(followerId, followingId)` | Boolean check |

**New `repository/activity-feed/activity-feed-repository.ts`:**

| Function | Purpose |
|----------|---------|
| `findFeedForUser(userId, cursor?, limit?)` | Derived feed query: LibraryItem + Follow + User + Game join |
| `findPopularFeed(cursor?, limit?)` | Public activity from most active public users |

**Extend `repository/user/user-repository.ts`:**
- `updateUserProfile` already accepts open `data` param — no signature change needed for `isPublicProfile`
- Add `findUserByUsername(username)` if not already present — needed for public profile page

**Extend `repository/library/library-repository.ts`:**
- Update `updateLibraryItem` to accept optional `statusChangedAt` field

### Service Layer

**New `services/social/social-service.ts` (class-based, same pattern as LibraryService):**

| Method | Purpose |
|--------|---------|
| `followUser(followerId, followingId)` | Validate target is public, not self, create follow |
| `unfollowUser(followerId, followingId)` | Delete follow |
| `getFollowers(userId, page?)` | Paginated follower list with profile data |
| `getFollowing(userId, page?)` | Paginated following list with profile data |
| `isFollowing(followerId, followingId)` | Boolean check for UI state |
| `getFollowCounts(userId)` | `{ followers: number, following: number }` |

**New `services/activity-feed/activity-feed-service.ts`:**

| Method | Purpose |
|--------|---------|
| `getFeedForUser(userId, cursor?, limit?)` | Returns feed items with computed event type |
| `getPopularFeed(cursor?, limit?)` | Returns popular public activity |

**Extend `ProfileService`:**
- `updateProfile()` already handles arbitrary fields → `isPublicProfile` passes through naturally
- Add `getPublicProfile(username)` — fetches user profile data scoped to public fields only

### Feature Layer — `features/social/`

```
features/social/
├── ui/
│   ├── follow-button.tsx          # Client component, optimistic update
│   ├── activity-feed.tsx          # Async RSC for dashboard widget
│   ├── activity-feed-item.tsx     # Single feed item display
│   ├── activity-feed-empty.tsx    # Empty/popular state with inline follow buttons
│   ├── followers-list.tsx         # Modal/page showing followers
│   └── following-list.tsx         # Modal/page showing following
├── server-actions/
│   ├── follow-user.ts             # createServerAction wrapping SocialService
│   ├── unfollow-user.ts
│   └── get-feed.ts                # Server action for infinite scroll pagination
├── hooks/
│   ├── use-follow.ts              # Optimistic follow/unfollow mutation
│   └── use-activity-feed.ts       # Infinite scroll with TanStack Query
├── types.ts                       # FeedItem, FollowUser types
├── index.ts                       # Client-safe barrel
└── index.server.ts                # Server-only barrel (ActivityFeed RSC)
```

### Feature Layer — Extended `features/profile/`

- Add `PublicProfileView` component to `features/profile/ui/` — displays public-facing profile data
- Add `ProfileVisibilityToggle` component to `features/profile/ui/` — switch in settings
- Extend `UpdateProfileInput` schema in `features/profile/lib/schemas.ts` with `isPublicProfile: z.boolean().optional()`
- Extend `ProfileWithStats` type with `isPublicProfile`, `followersCount`, `followingCount`

### App Router — New Routes

**`app/u/[username]/page.tsx`** — Public profile page (outside `(protected)` group):
- Server Component that calls `ProfileService.getPublicProfile(username)`
- If profile not found or not public → show "Profile is private" message
- If viewer is logged in → show Follow/Following button (check via `getServerUserId()`, may return null)
- If viewer is the profile owner → show "View as public" context, no follow button
- Displays: name, avatar, game count, followers/following counts, recent activity (last 5 LibraryItem changes), library preview (up to 6 currently Playing/recently Played games)

**`app/u/[username]/followers/page.tsx`** and **`app/u/[username]/following/page.tsx`**:
- Simple paginated lists of users with links to their profiles
- Only visible if the profile user is public

### Dashboard Integration

In `app/(protected)/dashboard/page.tsx`, add:
```tsx
<Suspense fallback={<ActivityFeedSkeleton />}>
  <ActivityFeed userId={userId} />
</Suspense>
```

The `ActivityFeed` RSC (from `features/social/`) calls `ActivityFeedService.getFeedForUser()`, and if empty, calls `ActivityFeedService.getPopularFeed()`.

### Status Change Tracking (Server Action Integration)

In 3-4 existing server actions, after a successful library mutation, set `statusChangedAt`:

**Files to modify:**
- `features/library/server-actions/update-library-status.ts` — set `statusChangedAt = new Date()` on status change
- `features/manage-library-entry/server-actions/update-library-entry-action.ts` — set `statusChangedAt` if status field changed
- `features/manage-library-entry/server-actions/update-library-status-action.ts` — set `statusChangedAt` on status change

The `statusChangedAt` field is set via the existing `LibraryService.updateLibraryItem()` call — we pass it as an additional field. No new service calls needed; it's part of the same update payload.

**Note:** `features/manage-library-entry/use-cases/add-game-to-library.ts` creates new LibraryItems — these have `statusChangedAt = null`, which the feed correctly interprets as "added to library."

### API Route for Infinite Scroll

**`app/api/social/feed/route.ts`** — GET endpoint for client-side feed pagination:
- Query params: `cursor` (ISO timestamp), `limit` (default 20, max 50)
- Returns: `{ items: FeedItem[], nextCursor: string | null }`
- Requires authentication
- Handler in `data-access-layer/handlers/social/activity-feed-handler.ts`

This follows the existing pattern of API routes for TanStack Query client-side fetching (see game-search handler).

### Cross-Feature Import Rules

| From | Imports From `social` | Justification |
|------|-----------------------|---------------|
| `app/u/[username]` | `profile` barrel, `social` barrel | Public profile page composition |
| `dashboard` | `social` barrel (`ActivityFeed` RSC) | Dashboard widget |
| `social` | `profile` barrel (profile types) | User display in feed items |

Update `features/CLAUDE.md` with these exceptions.

---

## 3. Impact and Risk Analysis

### System Dependencies

- **User table:** Adding `isPublicProfile` field — low risk, additive change with default `false`
- **LibraryItem table:** Adding `statusChangedAt` — low risk, nullable field, no impact on existing queries
- **Follow table:** New table with FK constraints to User — clean, no existing table modifications
- **Dashboard page:** Adding a new `<Suspense>` widget — isolated, cannot break existing widgets
- **Library server actions:** 3 files modified to pass `statusChangedAt` — small, testable changes

### Potential Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Feed query performance at scale (many follows × many library items) | Slow dashboard load | Composite index on `(userId, statusChangedAt)` + `(userId, createdAt)` already exist on LibraryItem. Follow table has indexes on both FKs. Monitor query plan with `EXPLAIN ANALYZE`. |
| Public profile URL conflicts with existing routes | 404s or route collisions | `/u/` prefix is unique — no existing routes use it. Username validation already prevents reserved words. |
| Privacy: profile toggled to private after having followers | Data leaks if cached | Query always checks `isPublicProfile = true` at read time. No caching of profile data. Followers preserved but profile inaccessible immediately. |
| N+1 queries in feed (loading game covers per item) | Slow feed rendering | Single JOIN query fetches all data — no N+1. Game cover URLs are already stored in the `Game` table. |
| `statusChangedAt` not set for historical items | Feed shows all old items as "added" | Acceptable tradeoff — only new activity after deploy shows accurate event types. Document in release notes. |

### Functional Spec Clarification Resolution

> "[NEEDS CLARIFICATION]: Should followers be notified when a user toggles profile to private?"

**Resolution:** Silent disappearance. No notification system is in scope. The user's profile becomes inaccessible and their activity stops appearing in feeds (filtered by `isPublicProfile = true` at query time). Existing follow relationships are preserved — if the user re-enables their public profile, followers see them again.

---

## 4. Testing Strategy

### Unit Tests

| Target | Key Scenarios |
|--------|---------------|
| `SocialService.followUser()` | Self-follow prevention, target not public, duplicate follow, happy path |
| `SocialService.unfollowUser()` | Not following error, happy path |
| `ActivityFeedService.getFeedForUser()` | Event type detection (null `statusChangedAt` → add, non-null → status change), empty state fallback to popular feed, pagination cursor handling |
| `statusChangedAt` setting in server actions | Verify field is set on status change, not set on non-status updates |

### Integration Tests

| Target | Key Scenarios |
|--------|---------------|
| `follow-repository` | Create/delete follow, duplicate prevention, follower/following counts, cascade on user delete |
| `activity-feed-repository` | Feed query with follows, privacy filtering, cursor pagination, popular feed fallback |
| Public profile query | Username lookup, private profile returns null, profile with stats + counts |

### Component Tests

| Target | Key Scenarios |
|--------|---------------|
| `FollowButton` | Optimistic follow/unfollow, loading states, error recovery |
| `ActivityFeedItem` | Renders "added" vs "marked as" correctly, user/game links, relative timestamps |
| `ProfileVisibilityToggle` | Toggle state, confirmation behavior |
| `FollowersList` / `FollowingList` | Renders user list, links to profiles, empty state |

### E2E Tests (Playwright)

| Flow | Steps |
|------|-------|
| Follow journey | Sign in → visit `/u/[username]` → click Follow → verify count increments → visit dashboard → see activity |
| Privacy toggle | Sign in → settings → enable public profile → verify `/u/[username]` is accessible → disable → verify private message |
