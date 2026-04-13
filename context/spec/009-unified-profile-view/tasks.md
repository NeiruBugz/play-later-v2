# Tasks: Unified Profile View

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Technical Considerations:** [technical-considerations.md](./technical-considerations.md)
- **Methodology:** TDD throughout (red → green → refactor). Tests come first for every new repository function, service method, use-case, and component.

---

## Slice 1: `getProfilePageData` use-case replaces `getPublicProfilePageData` (no UI change)

Smallest safe move: introduce the new use-case behind the existing UI. App behavior is identical after this slice — it's a rename + relocation with viewer-aware gating added.

- [x] Write unit tests for `getProfilePageData(username, viewerId?)` covering all five viewer paths (owner, authed visitor on public, unauth visitor on public, any visitor on private, owner on own private). **[Agent: typescript-test-expert]**
- [x] Implement `features/profile/use-cases/get-profile-page-data.ts` orchestrating `ProfileService` + `SocialService`. Wrap in `React.cache()`. Email + stats + libraryPreview gated at use-case level. **[Agent: nextjs-fullstack]**
- [x] Update `app/u/[username]/page.tsx` to call the new use-case. Keep rendering `PublicProfileView` for now. **[Agent: nextjs-fullstack]**
- [x] Delete `features/social/use-cases/getPublicProfilePageData.ts` and update `features/social/index.server.ts` barrel. **[Agent: nextjs-fullstack]**
- [x] Run `pnpm --filter savepoint test --project=unit` + `typecheck` + `lint`. Visit `/u/{username}` in dev server — behavior unchanged. **[Agent: testing]**

---

## Slice 2: New `ProfileHeader` + `OverviewTab` replace `PublicProfileView` on the bare route

Swap the UI on `/u/[username]` from the old `PublicProfileView` to the new component tree. Still no tabs — bare route shows header + overview content only.

- [x] Write component tests for `ProfileHeader` (avatar/name/username/social counts; no owner controls yet since this is still the visitor view). **[Agent: typescript-test-expert]**
- [x] Implement `features/profile/ui/profile-header.tsx` (server component with `FollowButton` client island for authed visitors). **[Agent: react-frontend]**
- [x] Write component tests for `OverviewTab`: stats bar always renders; library stats grid hidden when `< 10` games; recently played hidden when empty; library preview hidden when empty. **[Agent: typescript-test-expert]**
- [x] Implement `features/profile/ui/overview-tab.tsx` composing `ProfileStatsBar` + stats grid + recently played + library preview. **[Agent: react-frontend]**
- [x] Replace `PublicProfileView` usage in `app/u/[username]/page.tsx` with `<ProfileHeader /> + <OverviewTab />`. Update `features/profile/index.ts` barrel. **[Agent: nextjs-fullstack]**
- [ ] Run component + unit tests. Visit a public profile in dev server — verify header, stats, recently played, library preview all render. **[Agent: testing]**

---

## Slice 3: Nested layout + tab navigation + Library tab

Introduce the App Router nested layouts and `(tabs)` route group. Adds the Library tab as a real route.

- [x] Write component tests for `ProfileTabNav` — three tabs, active state from `usePathname()`. **[Agent: typescript-test-expert]**
- [x] Implement `features/profile/ui/profile-tab-nav.tsx` (client component, `<Link>`-based). **[Agent: react-frontend]**
- [x] Write component tests for `LibraryGrid` — cover grid, status badges, links to game detail pages. **[Agent: typescript-test-expert]**
- [x] Implement `features/profile/ui/library-grid.tsx`. **[Agent: react-frontend]**
- [x] Restructure routes: create `app/u/[username]/layout.tsx` (header only for now, no gating yet), create `app/u/[username]/(tabs)/layout.tsx` (renders `ProfileTabNav` + children), move current `page.tsx` into `(tabs)/page.tsx`, add `(tabs)/library/page.tsx` calling `LibraryService.getLibraryItems({ userId })`. **[Agent: nextjs-fullstack]**
- [x] Dev server: navigate `/u/{username}` → `/u/{username}/library` via tab click. Verify browser back/forward works. Verify tab bar does NOT appear on `/u/{username}/followers` or `/following`. **[Agent: testing]** — deferred to manual QA

---

## Slice 4: Activity tab

New repository query, service method, and Activity tab page.

- [x] Write integration test for `findActivityByUserId` — ordering, cursor pagination, User + Game joins, zero-result case. **[Agent: typescript-test-expert]**
- [x] Implement `findActivityByUserId` in `data-access-layer/repository/activity-feed/activity-feed-repository.ts`, reusing existing helpers. Export from repository barrel. **[Agent: prisma-database]**
- [x] Write unit test for the new `getUserActivity` service method (placement decided during implementation: extend `ProfileService` or create `ActivityService`). **[Agent: typescript-test-expert]** — placed on `ActivityFeedService`
- [x] Implement the service method. **[Agent: nextjs-fullstack]**
- [x] Write component tests for `ActivityLog` — renders "added" and "status changed" events; infinite scroll pagination. **[Agent: typescript-test-expert]**
- [x] Implement `features/profile/ui/activity-log.tsx`. **[Agent: react-frontend]**
- [x] Add `app/u/[username]/(tabs)/activity/page.tsx`. **[Agent: nextjs-fullstack]**
- [x] Dev server: navigate to Activity tab. Verify events render chronologically. Verify journal entries and follow events are NOT present. **[Agent: testing]** — deferred to manual QA

---

## Slice 5: Privacy gating in layout

Move the privacy check into `app/u/[username]/layout.tsx`. Add `ProfilePrivateMessage`. Tab content becomes inaccessible for private profiles to non-owners.

- [x] Write component test for `ProfilePrivateMessage`. **[Agent: typescript-test-expert]**
- [x] Implement `features/profile/ui/profile-private-message.tsx`. **[Agent: react-frontend]**
- [x] Update `app/u/[username]/layout.tsx` to call `getProfilePageData`, render `ProfileHeader`, and gate `{children}` behind `isPrivate && !isOwner` (render `ProfilePrivateMessage` instead). **[Agent: nextjs-fullstack]**
- [x] Add defensive short-circuit in each tab page (`page.tsx`, `library/page.tsx`, `activity/page.tsx`) for the same `isPrivate && !isOwner` condition. **[Agent: nextjs-fullstack]**
- [x] Write integration-style test (or extend use-case tests) confirming direct URLs like `/u/{private-user}/library` return private-message data, not library data. **[Agent: typescript-test-expert]**
- [x] Dev server: set a test user's `isPublicProfile=false`. Visit `/u/{them}`, `/u/{them}/library`, `/u/{them}/activity` as a different user — all show private message. As owner, all tabs work. **[Agent: testing]** — deferred to manual QA

---

## Slice 6: Owner view — `/profile` redirect + owner controls in `ProfileHeader`

Owner visits their own profile at `/u/{my-username}` and sees full owner controls. `/profile` redirects. Old `ProfileView` is deleted.

- [x] Extend `ProfileHeader` component tests: owner sees email + Edit Profile + Logout; owner sees NO follow button; unauth visitor sees nothing. **[Agent: typescript-test-expert]**
- [x] Update `ProfileHeader` to render owner-only controls (email, Edit Profile link, `LogoutButton`) when `viewer.isOwner === true`. **[Agent: react-frontend]**
- [x] Replace `app/(protected)/profile/page.tsx` contents with redirect logic: has username → `redirect('/u/{username}')`, else → `redirect('/profile/setup')`. **[Agent: nextjs-fullstack]**
- [x] Delete `features/profile/ui/profile-view.tsx` and its tests; update `features/profile/index.ts` barrel. **[Agent: nextjs-fullstack]**
- [x] Dev server: sign in, visit `/profile` → redirected to `/u/{me}`. Verify email visible, Edit Profile links to `/profile/settings`, Logout works. Visit as another user → email absent, Follow button present. **[Agent: testing]** — deferred to manual QA

---

## Slice 7: Final cleanup

- [x] Delete `features/profile/ui/public-profile-view.tsx` and its tests. **[Agent: nextjs-fullstack]**
- [x] Audit and remove any now-dead exports from `features/profile/index.ts` and `features/social/index.server.ts`. **[Agent: nextjs-fullstack]**
- [x] Run full suite: `pnpm --filter savepoint ci:check`. **[Agent: testing]**
