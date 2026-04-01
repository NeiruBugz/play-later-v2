# Tasks: Social Engagement

- **Spec:** [functional-spec.md](functional-spec.md) | [technical-considerations.md](technical-considerations.md)
- **Status:** Ready

---

- [x] **Slice 1: Schema Migration + Follow Repository**
  - [x] Add `isPublicProfile Boolean @default(false)` field to `User` model in `prisma/schema.prisma` **[Agent: prisma-database]**
  - [x] Add `statusChangedAt DateTime?` field to `LibraryItem` model in `prisma/schema.prisma` **[Agent: prisma-database]**
  - [x] Create `Follow` model with composite PK `@@id([followerId, followingId])`, both FKs to User with `onDelete: Cascade`, `createdAt`, indexes on `followerId` and `followingId` **[Agent: prisma-database]**
  - [x] Add `followers Follow[]` and `following Follow[]` relation fields to `User` model **[Agent: prisma-database]**
  - [x] Run `prisma migrate dev` to generate and apply migration **[Agent: prisma-database]**
  - [x] Create `repository/follow/follow-repository.ts` with: `createFollow`, `deleteFollow`, `findFollowers`, `findFollowing`, `countFollowers`, `countFollowing`, `isFollowing` **[Agent: nextjs-fullstack]**
  - [x] Create `repository/follow/types.ts` with `FollowWithUser` type for paginated results **[Agent: nextjs-fullstack]**
  - [x] Export from `repository/index.ts` **[Agent: nextjs-fullstack]**
  - [x] Write integration tests for follow-repository: create, duplicate prevention, delete, counts, cascade on user delete **[Agent: typescript-test-expert]**
  - [x] Verify: `pnpm --filter savepoint test:backend` passes; migration applies cleanly **[Agent: nextjs-fullstack]**

- [x] **Slice 2: SocialService + Follow/Unfollow Server Actions**
  - [x] Create `services/social/social-service.ts` (class-based) with: `followUser`, `unfollowUser`, `isFollowing`, `getFollowCounts`, `getFollowers`, `getFollowing` **[Agent: nextjs-fullstack]**
  - [x] `followUser` validates: not self-follow, target user exists and `isPublicProfile = true`, then delegates to repo **[Agent: nextjs-fullstack]**
  - [x] Create `services/social/types.ts` with service-specific types **[Agent: nextjs-fullstack]**
  - [x] Export from `services/index.ts` **[Agent: nextjs-fullstack]**
  - [x] Create `features/social/` directory structure: `ui/`, `server-actions/`, `hooks/`, `types.ts`, `index.ts`, `index.server.ts` **[Agent: nextjs-fullstack]**
  - [x] Create `features/social/server-actions/follow-user.ts` using `createServerAction` with `requireAuth`, Zod schema for `followingId` **[Agent: nextjs-fullstack]**
  - [x] Create `features/social/server-actions/unfollow-user.ts` using same pattern **[Agent: nextjs-fullstack]**
  - [x] Write unit tests for SocialService: self-follow prevention, target not public, duplicate follow, happy path follow/unfollow **[Agent: typescript-test-expert]**
  - [x] Verify: `pnpm --filter savepoint test` passes **[Agent: nextjs-fullstack]**

- [x] **Slice 3: Public Profile Visibility Toggle in Settings**
  - [x] Extend `UpdateProfileInput` Zod schema in `features/profile/lib/schemas.ts` with `isPublicProfile: z.boolean().optional()` **[Agent: nextjs-fullstack]**
  - [x] Extend `ProfileWithStats` type in `features/profile/types.ts` with `isPublicProfile: boolean` **[Agent: nextjs-fullstack]**
  - [x] Update profile data preparation to include `isPublicProfile` from User record **[Agent: nextjs-fullstack]**
  - [x] Create `features/profile/ui/profile-visibility-toggle.tsx` — Switch component with label "Public profile", description text, calls `updateProfile` server action **[Agent: react-frontend]**
  - [x] Add `ProfileVisibilityToggle` to the settings page at `app/(protected)/profile/settings/page.tsx` as a new Card section **[Agent: react-frontend]**
  - [x] Write component test for toggle: renders current state, toggles on click, calls server action **[Agent: typescript-test-expert]**
  - [x] Verify: dev server running, toggle visible in settings, state persists after page reload **[Agent: nextjs-fullstack]**

- [ ] **Slice 4: Public Profile Page at `/u/[username]`**
  - [ ] Add `getPublicProfile(username)` method to `ProfileService` — fetches user by username, returns null if not found or `isPublicProfile = false`, includes game count, followers/following counts **[Agent: nextjs-fullstack]**
  - [ ] Add `findUserByUsername(username)` to user-repository if not already present **[Agent: nextjs-fullstack]**
  - [ ] Create `features/profile/ui/public-profile-view.tsx` — displays name, avatar, game count, followers count, following count, library preview (up to 6 Playing/Played games as cover thumbnails) **[Agent: react-frontend]**
  - [ ] Create `app/u/[username]/page.tsx` (outside `(protected)` group) — RSC that calls `getPublicProfile`, shows "Profile is private" if null, shows `PublicProfileView` if public **[Agent: nextjs-fullstack]**
  - [ ] Handle authenticated vs unauthenticated viewer: use `getServerUserId()` (may return null), pass `isOwnProfile` and `isAuthenticated` flags to the view **[Agent: nextjs-fullstack]**
  - [ ] Create `app/u/[username]/layout.tsx` with minimal layout (no auth gate, basic page shell) **[Agent: nextjs-fullstack]**
  - [ ] Write unit test for `getPublicProfile`: returns data for public user, returns null for private user, returns null for non-existent username **[Agent: typescript-test-expert]**
  - [ ] Verify: visit `/u/[username]` for a public user → profile renders; for a private user → "private" message **[Agent: nextjs-fullstack]**

- [ ] **Slice 5: Follow Button on Public Profile**
  - [ ] Create `features/social/hooks/use-follow.ts` — optimistic follow/unfollow mutation using server actions, updates button state immediately **[Agent: react-frontend]**
  - [ ] Create `features/social/ui/follow-button.tsx` — client component showing "Follow" / "Following" states, hover reveals "Unfollow", uses `useFollow` hook **[Agent: react-frontend]**
  - [ ] Wire `FollowButton` into `PublicProfileView` — shown only when `isAuthenticated && !isOwnProfile`, pass initial `isFollowing` state from server **[Agent: react-frontend]**
  - [ ] Add `isFollowing` check to the public profile page RSC — call `SocialService.isFollowing()` when viewer is authenticated **[Agent: nextjs-fullstack]**
  - [ ] Follower/following counts update on follow/unfollow via `revalidatePath` in server actions **[Agent: nextjs-fullstack]**
  - [ ] Write component tests for FollowButton: renders Follow for non-followed user, renders Following for followed user, optimistic state change on click **[Agent: typescript-test-expert]**
  - [ ] Verify: log in, visit a public user's profile, click Follow → button changes to "Following", count increments; click again → unfollows **[Agent: nextjs-fullstack]**

- [ ] **Slice 6: Followers/Following Lists**
  - [ ] Create `features/social/ui/followers-list.tsx` — paginated list of follower users (avatar, display name, link to `/u/[username]`) **[Agent: react-frontend]**
  - [ ] Create `features/social/ui/following-list.tsx` — same structure for following **[Agent: react-frontend]**
  - [ ] Create `app/u/[username]/followers/page.tsx` — RSC calling `SocialService.getFollowers()`, only accessible if profile is public **[Agent: nextjs-fullstack]**
  - [ ] Create `app/u/[username]/following/page.tsx` — RSC calling `SocialService.getFollowing()`, only accessible if profile is public **[Agent: nextjs-fullstack]**
  - [ ] Make follower/following counts on `PublicProfileView` clickable links to these pages **[Agent: react-frontend]**
  - [ ] Write component tests for follower/following lists: renders user items, links to profiles, empty state **[Agent: typescript-test-expert]**
  - [ ] Verify: click followers count on public profile → navigates to list page → user items are clickable to their profiles **[Agent: nextjs-fullstack]**

- [ ] **Slice 7: `statusChangedAt` Tracking in Library Server Actions**
  - [ ] Update `LibraryService.updateLibraryItem()` to accept optional `statusChangedAt` field and pass to repository **[Agent: nextjs-fullstack]**
  - [ ] Update `features/library/server-actions/update-library-status.ts` — pass `statusChangedAt: new Date()` when status changes **[Agent: nextjs-fullstack]**
  - [ ] Update `features/manage-library-entry/server-actions/update-library-entry-action.ts` — pass `statusChangedAt: new Date()` if status field changed **[Agent: nextjs-fullstack]**
  - [ ] Update `features/manage-library-entry/server-actions/update-library-status-action.ts` — pass `statusChangedAt: new Date()` on status change **[Agent: nextjs-fullstack]**
  - [ ] Write unit tests: verify `statusChangedAt` is set on status mutation, not set on non-status updates **[Agent: typescript-test-expert]**
  - [ ] Verify: `pnpm --filter savepoint test` passes; change a game status in dev → `statusChangedAt` column populated in DB **[Agent: nextjs-fullstack]**

- [ ] **Slice 8: Activity Feed Service + Repository**
  - [ ] Create `repository/activity-feed/activity-feed-repository.ts` with `findFeedForUser(userId, cursor?, limit?)` — derived JOIN query: LibraryItem + Follow + User + Game, filtered by `isPublicProfile = true`, ordered by `GREATEST(createdAt, COALESCE(statusChangedAt, createdAt)) DESC` **[Agent: nextjs-fullstack]**
  - [ ] Add `findPopularFeed(cursor?, limit?)` — same query structure without Follow join, from public users, ordered by recency **[Agent: nextjs-fullstack]**
  - [ ] Create `repository/activity-feed/types.ts` with `FeedItemRow` type **[Agent: nextjs-fullstack]**
  - [ ] Export from `repository/index.ts` **[Agent: nextjs-fullstack]**
  - [ ] Create `services/activity-feed/activity-feed-service.ts` with `getFeedForUser(userId, cursor?, limit?)` and `getPopularFeed(cursor?, limit?)` — maps repo rows to `FeedItem` type with computed `eventType` ("LIBRARY_ADD" or "STATUS_CHANGE") **[Agent: nextjs-fullstack]**
  - [ ] Create `features/social/types.ts` with `FeedItem`, `FeedEventType` types **[Agent: nextjs-fullstack]**
  - [ ] Write integration tests for activity-feed-repository: feed with follows, privacy filtering, cursor pagination, popular feed fallback **[Agent: typescript-test-expert]**
  - [ ] Write unit tests for ActivityFeedService: event type detection (null `statusChangedAt` → add, non-null → status change) **[Agent: typescript-test-expert]**
  - [ ] Verify: `pnpm --filter savepoint test` passes **[Agent: nextjs-fullstack]**

- [ ] **Slice 9: Activity Feed Widget on Dashboard (RSC)**
  - [ ] Create `features/social/ui/activity-feed-item.tsx` — displays single feed event: user avatar + name (linked to `/u/[username]`), game cover + title (linked to game detail), event text ("added X to library" / "marked X as Playing"), relative timestamp **[Agent: react-frontend]**
  - [ ] Create `features/social/ui/activity-feed.tsx` — async RSC that calls `ActivityFeedService.getFeedForUser()`, renders list of `ActivityFeedItem` components, shows first 20 items **[Agent: react-frontend]**
  - [ ] Create `features/social/ui/activity-feed-skeleton.tsx` — loading skeleton for Suspense fallback **[Agent: react-frontend]**
  - [ ] Export `ActivityFeed` from `features/social/index.server.ts` **[Agent: nextjs-fullstack]**
  - [ ] Add `<Suspense fallback={<ActivityFeedSkeleton />}><ActivityFeed userId={userId} /></Suspense>` to `app/(protected)/dashboard/page.tsx` **[Agent: nextjs-fullstack]**
  - [ ] Write component tests for ActivityFeedItem: renders "added" event correctly, renders "status change" event correctly, links to user profile and game detail **[Agent: typescript-test-expert]**
  - [ ] Verify: dashboard shows activity feed widget; follow a public user who has library items → their activity appears in feed **[Agent: nextjs-fullstack]**

- [ ] **Slice 10: Infinite Scroll Feed with API Route + TanStack Query**
  - [ ] Create `data-access-layer/handlers/social/activity-feed-handler.ts` — validates `cursor` and `limit` query params, calls `ActivityFeedService`, returns `{ items, nextCursor }` **[Agent: nextjs-fullstack]**
  - [ ] Create `app/api/social/feed/route.ts` — GET endpoint using handler, requires authentication **[Agent: nextjs-fullstack]**
  - [ ] Create `features/social/hooks/use-activity-feed.ts` — TanStack Query `useInfiniteQuery` hook fetching from `/api/social/feed`, implements infinite scroll with `getNextPageParam` from `nextCursor` **[Agent: react-frontend]**
  - [ ] Convert `ActivityFeed` from RSC-only to hybrid: initial RSC render for first 20 items, then client-side infinite scroll for subsequent pages using `useActivityFeed` hook **[Agent: react-frontend]**
  - [ ] Add intersection observer for automatic loading on scroll (same pattern as `browse-related-games` infinite scroll) **[Agent: react-frontend]**
  - [ ] Write integration test for feed API route: authenticated access, cursor pagination, unauthorized returns 401 **[Agent: typescript-test-expert]**
  - [ ] Verify: scroll down on dashboard feed → older items load automatically; loading spinner visible during fetch **[Agent: nextjs-fullstack]**

- [ ] **Slice 11: Empty State / Popular Feed**
  - [ ] Create `features/social/ui/activity-feed-empty.tsx` — banner: "Showing popular activity. Follow gamers to personalize your feed." + feed items from popular public users, each with inline `FollowButton` next to user name **[Agent: react-frontend]**
  - [ ] Update `ActivityFeed` RSC: if user follows nobody (or feed is empty), call `ActivityFeedService.getPopularFeed()` and render `ActivityFeedEmpty` **[Agent: react-frontend]**
  - [ ] Once user follows at least one person, feed switches to showing only followed users' activity (existing behavior from Slice 9) **[Agent: nextjs-fullstack]**
  - [ ] Write component test for empty state: renders banner text, renders popular activity items, shows Follow buttons **[Agent: typescript-test-expert]**
  - [ ] Verify: new user with no follows → sees popular feed with Follow buttons; follow someone from feed → feed switches to personalized **[Agent: nextjs-fullstack]**

- [ ] **Slice 12: Final Validation + Documentation**
  - [ ] Update `features/CLAUDE.md` cross-feature import table with `social` feature exceptions **[Agent: general-purpose]**
  - [ ] Create `features/social/CLAUDE.md` (under 20 lines: purpose, segments, non-obvious context) **[Agent: general-purpose]**
  - [ ] Update `context/product/architecture.md` existing features table: add `social` feature entry **[Agent: general-purpose]**
  - [ ] Run full `pnpm build && pnpm lint && pnpm test` — all pass **[Agent: nextjs-fullstack]**
  - [ ] Verify zero ESLint boundary violations: `pnpm lint` passes with no import rule errors **[Agent: nextjs-fullstack]**
  - [ ] E2E smoke test: sign in → enable public profile → visit `/u/[username]` as another user → follow → dashboard shows activity **[Agent: testing]**
