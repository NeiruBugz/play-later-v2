# Slice-by-slice divergence log

> Extracted from `CLAUDE.md` on 2026-05-18 to keep the main agent context scan-able. Linked back from `CLAUDE.md` under "Divergence log".
>
> This is the historical record of intentional differences between this app and the canonical `savepoint-app/`, organized by spec-021 slice. Append-only by convention — earlier entries are not edited retroactively even when superseded by later slices; the supersede relationship is noted in-place.

## Logger (S7)

Pino chosen, copied **verbatim** from `savepoint-app/shared/lib/app/logger.ts` to [`src/shared/lib/logger.ts`](./src/shared/lib/logger.ts), with the only edit being `process.env.*` → typed `env` from `@env` (durable project rule). Versions pinned to match the canonical app exactly (`pino@10.1.0`, `pino-pretty@13.1.3`) so log shape, redaction paths, and error normalization stay byte-identical across the migration. Dev uses `pino-pretty` transport (colorized, single-line off); prod emits structured JSON. Ticks the spec's "default: copy verbatim" decision for S7.

## Known gaps / pending decisions

- [x] **Logger** ported (S7) — see Logger section above.
- **Real `db.ts`** (Prisma singleton) not yet wired — Slice 3 implements.
- **Auth** not yet wired — Slice 1 (Better Auth, no `nextCookies()` plugin).
- **Tailwind** scaffolded as v4 (CSS-first); `savepoint-app/` uses v3 (JS config). Tokens are translated, not copy-pasted verbatim.
- **No production deployment** until Slice 20 cutover. Verification is local-only until then.

## Known gaps (Vertical 1)

Scope: slices 0–6. Both apps now bind to `:6060` — verification is **swap-and-compare** (stop one app, start the other) against the same Postgres on `:6432`. Side-by-side parity is deferred to S20 cutover.

### Flow 1 — Cognito sign-in (`/login`)

- ✅ Authed users redirected away from `/login` (`beforeLoad` guard).
- ✅ OAuth via `authClient.signIn.social({ provider: "cognito" })`.
- ✅ Branded layout ported via [`widgets/auth-page/ui/auth-page-view`](./src/widgets/auth-page/ui/auth-page-view/auth-page-view.tsx) — centered `max-w-md` card, `text-display` "SavePoint" headline, tagline, divider w/ "or", `sr-only` `<h1>` for a11y. Slot-based composition (route owns feature wiring). Cognito button promoted to `variant="outline"` + full-width.
- ⚠️ `callbackURL` divergence: tanstack → `/profile`; canonical → `/dashboard` (route doesn't exist here yet).
- ⚠️ Button label cosmetic: canonical renders Google-logo SVG + "Sign in with Google"; tanstack renders plain "Sign in with Cognito" (no logo). Visual treatment matches; copy / icon do not.
- ⚠️ No `onError` handler on the Cognito sign-in button — silent SSO failure. Low severity.

### Flow 2 — Own profile read (`/profile`)

- ❌ **Intentional architectural pivot** (NOT a regression): canonical `/profile` is redirect-only (`/u/${username}` if set, `/profile/setup` otherwise); tanstack `/profile` renders the own-profile view inline via `<ProfileOverview/>`. Reviewers must not treat as parity break.
- ✅ `/profile/setup` first-run onboarding route **BUILT in Slice 23 (blocker remediation #2)** — was previously deferred ("out of scope for V1"). The page mirrors canonical `app/(protected)/profile/setup/page.tsx`: loader reads setup status via `getProfileSetupStatusFn` (loader-safe `createServerFn` wrapping the new `getProfileSetupStatus` entity query, which mirrors `ProfileService.checkSetupStatus` — `needsSetup = !username || isNewUser`, short-circuited by `profileSetupCompletedAt`; `suggestedUsername` = slugified display name). `!needsSetup` redirects to `/dashboard`. The setup form (`widgets/profile-setup-page/`) pre-fills the suggested username, reuses `edit-profile`'s `UsernameInput` + persists via `updateProfileFn` (no parallel write path), includes `upload-avatar`'s `AvatarUpload`, and navigates to `/dashboard` on success.
  - **`/profile` redirect repointed**: the no-username branch in `_authed/profile.tsx` now redirects to `/profile/setup` (was `/settings/profile`) for canonical parity. Its colocated test (`-_authed-profile.test.tsx`) was updated.
  - **Deferred parity item**: the canonical "Skip for now" affordance is NOT ported. Canonical's skip sets `profileSetupCompletedAt`, a write tanstack's `updateProfile` does not yet expose; adding it would expand scope. Username-only setup is the critical path. Skip-at-setup remains a follow-up.
- ✅ Auth guard via `_authed.tsx` → `requireUserIdOrRedirectFn`.
- ✅ `getProfilePageDataFn` parallel-loads `getLibraryStats` + `getProfileById`.
- ⚠️ Page `<title>` still shows starter placeholder; canonical sets `"Profile"`.

### Flow 3 — Settings edit (`/settings/profile`)

- ✅ Display name, username (with debounced availability check), visibility toggle all present.
- ✅ `toast.success` on save; inline `role="alert"` on rejection.
- ✅ Username uniqueness enforced at DB; `ConflictError` surfaced to toast (single-source per simplification plan).
- ⚠️ Layout differs: canonical embeds avatar in the form card; tanstack splits `<AvatarUpload/>` as a top-level section. Intentional.
- ⚠️ "Preview public profile →" link absent on tanstack settings.
- ✅ "Back to profile" link present.

### Flow 4 — Avatar upload via LocalStack (`/settings/profile`, `/profile`)

- ✅ Three-step flow: presigned URL → browser PUT → `setAvatarUrlFn`.
- ✅ `requestChecksumCalculation: "WHEN_REQUIRED"` wired (foot-gun #5).
- ✅ `router.invalidate()` after persist; image refreshes everywhere.
- ✅ MIME allow-list: jpeg/png/gif/webp.
- ✅ Two surfaces: settings section + own-profile `<ProfileHeader/>` overlay (slot pattern, gated by `isOwnProfile`).
- ⚠️ No client-side size pre-check (canonical also lacks one — parity).

### Flow 5 — Public profile (`/u/$username`)

- ❌ **Intentional V1 scope gap** (NOT a regression): canonical `/u/[username]` is a tabbed layout (Overview / Library / Activity), with social counts, follow button, private-profile message, and `generateMetadata`. Tanstack renders flat `<ProfileOverview/>` only. Tabs / social / SEO arrive in later verticals.
- ✅ Privacy gate at the entity layer (`getPublicProfile` → `NotFoundError` for private profiles).
- ⚠️ Unknown username surfaces the generic root error boundary; canonical hits a styled 404 page.
- ⚠️ No `<title>` / OG metadata.

### Flow 6 — Sign-out (sidebar user menu)

- ✅ `authClient.signOut()` triggered from sidebar; `router.invalidate()` re-runs root loader, sidebar disappears, lands on landing page.
- ⚠️ Sidebar uses bespoke `<ul role="menu">` popover; canonical uses shadcn `DropdownMenu` with extra "Profile settings" / "Account" entries (latter routes not yet ported).
- ⚠️ Standalone `LogoutButton` feature component is unused by the sidebar (kept for tests / potential reuse).
- ⚠️ No `onError` handler on `signOut()` — silent failure. Parity with canonical.

### Summary

| Flow                 | Status                                                | Blocking S7? |
| -------------------- | ----------------------------------------------------- | ------------ |
| 1 — Cognito sign-in  | ✅ layout ported (post-S7T1); ⚠️ copy/icon gaps only  | No           |
| 2 — Own profile read | ❌ intentional pivot, documented                      | No           |
| 3 — Settings edit    | ⚠️ minor layout / missing preview link                | No           |
| 4 — Avatar upload    | ✅ functional parity                                  | No           |
| 5 — Public profile   | ❌ V1 scope boundary, documented                      | No           |
| 6 — Sign-out         | ⚠️ menu items missing (account routes not yet ported) | No           |

No findings block Slice 7. Items marked ❌ are intentional architectural / scope pivots, not regressions.

## Intentional divergences (Slice 20 — social CTA wiring + feedback)

> Lines 405–408 of `context/spec/021-migrate-to-tanstack-start/tasks.md`. Builds on the Slice 20 entity/server-fn floor (`isFollowing`, `countFollowers`, `countFollowing`, `getActivityFeedForViewer`, `getActivityForUser`, `listFollowers/listFollowingFn`).

- **`<UserList variant="followers|following"/>` collapsed from the canonical three-file split.** Canonical ships `features/social/ui/{followers-list,following-list,user-list-item}.tsx` as three distinct components. The tanstack port collapses them into a single `widgets/user-list/ui/user-list/` widget with a `variant` discriminator. **Why:** the canonical split was duplicative — both lists rendered identical row markup and only diverged in the section heading + empty-state copy, which a discriminator handles cleanly. Per locked decision in spec 021 slice 20. The widget lives under `widgets/` (not `features/social/ui/`) because it has no mutations — it's pure display composition over the `PublicUserRef` entity shape.

- **Activity tab is Radix client-tab state, not a file-based sub-route.** Canonical mounts `app/u/[username]/(tabs)/activity` as a route group. The tanstack port keeps the existing `<Tabs/>` Radix client state inside `ProfileOverview` (Overview / Library / Activity) and threads the activity content in via a new `activitySlot?: ReactNode` prop on the widget. **Why:** the canonical route-group behaves like client tabs from the user's POV (same URL while switching), and the tanstack `ProfileOverview` already owned the tabs primitive (no new route file needed). Followers / following each keep their own file-based sub-route (`u.$username.followers.tsx`, `u.$username.following.tsx`) because they are full pages with their own loaders.

- **Anonymous viewers: Activity tab HIDDEN, not disabled.** Locked decision per spec — the tab trigger and content are conditionally rendered off when `viewerId === null`. Simpler than a disabled-with-tooltip affordance. Anonymous viewers still see Overview + Library tabs.

- **`getActivityForUserFn` introduced as an anonymous-allowed sibling to `getActivityFeedFn`.** The entity-layer query `getActivityForUser` already existed (Slice 20 entity floor) but had no server-fn wrapper because the canonical app composes the per-user feed inside a server component. The tanstack route loader needs a client-importable surface to feed `ProfileActivityTab.loadMore` callbacks, so the wrapper ships now. Anonymous-allowed (no `requireUserId`) — the route layer gates access via `getPublicProfile`'s privacy invariant.

- **`ProfileOverview` extended with three new slot/data props instead of a feature import.** New props: `followerCount`, `followingCount`, `headerActions?: ReactNode`, `activitySlot?: ReactNode`, `hideActivityTab?: boolean`. The route owns the Follow/Unfollow decision and injects the resulting feature button through `headerActions`. **Why:** keeps the widget free of cross-feature imports — `ProfileOverview` already imports `features/upload-avatar` for the own-profile case, and growing that list to also include `follow-user` / `unfollow-user` would couple the widget to every social CTA. The slot pattern mirrors Slice 6's `avatarOverlay` precedent on `ProfileHeader`.

- **Feedback toasts (line 408) live inside `FollowUserButton` / `UnfollowUserButton`.** The component that fires the mutation owns the full cycle (call → success-toast → `router.invalidate()` OR error-toast). Mirrors the slice-10 `AddGameModal` and slice-11 `LibraryModal` precedents. Locked toast strings: `"Following @${username}"` / `"Unfollowed @${username}"` on success; `toast.error(err.message)` on rejection (fallback `"Could not update follow status"` for non-`Error` throws). Self-follow has no rejection toast because the button is hidden via the own-profile branch — no click path exists. No toast on activity-tab read failures (it's a read, not a mutation — surface inline `<EmptyState/>` instead; not yet wired, deferred to a polish pass).

## Intentional divergences (LibraryItemCard widget move + GameCard composition — post-Slice 14A)

`LibraryItemCard` was relocated from `entities/library-item/ui/library-item-card/` to `widgets/library-item-card/` and rewritten to compose on top of `widgets/game-card`. The entity-layer placement (slice 13 decision) predated the existence of any compound card widget; once `GameCard` landed, keeping `LibraryItemCard` in the entity layer would have made the FSD rule (`entities` may not import `widgets`) block the consolidation we wanted.

- **Layer move.** `entities/library-item/ui/library-item-card/` deleted. New home: `widgets/library-item-card/`. Two entity-barrel re-exports removed from `entities/library-item/ui/index.ts`. Single consumer (`widgets/library-page/`) updated to import from `@/widgets/library-item-card`.
- **Composition shape.** A `<div className="relative">` wraps a `<GameCard asLink density="standard" badges={<LibraryStatusBadge/>}>` and (optionally) an absolutely-positioned `<div className="absolute top-2 right-2 z-10">{menu}</div>` as **siblings**. Status badge is absolute top-left inside the cover via GameCard's `badges` slot (closes 14A F1). The action menu is NOT routed through GameCard's `overlay` slot — see next point.
- **Click semantics change.** Card-body click navigates to `/games/$slug` via the wrapping `<Link>` (was: opened the `LibraryModal`). The modal-edit flow is now exclusively reached through `LibraryCardMenu`'s "Edit Library Details" item. `onClick` prop removed from `LibraryItemCardProps`. "See details" footer link removed (the entire card is the affordance).
- **Menu rendered as a sibling of the link, NOT through `GameCard.overlay`.** An earlier attempt put the menu in the `overlay` slot (inside GameCard, therefore inside its `<Link>`) and wrapped it in a `preventDefault` + `stopPropagation` swallow div. That treated the symptom — the menu was still a descendant of an `<a>`, which is HTML5-invalid (interactive-inside-interactive) and reachable via Radix Slot patterns / focus-restoration / native default-action re-firing. The current sibling layout puts the menu's DOM physically outside the `<a>` subtree, so the click bubble path cannot cross the link. Portaled `DropdownMenuContent` items remain outside the link too (Radix portals to `document.body`). The "View Journal Entries" item is an intentional `<Link>` navigation. Test pins the structural invariant: `expect(link.contains(menuButton)).toBe(false)`.
- **Test contract change.** Library-page tests no longer pin "click card opens modal" — that behavior is gone. Cards are asserted as `role="link"` with name `View {title}` and `href="/games/$slug"`. Modal-open integration is owned by `LibraryCardMenu`'s own test.
- **Cover alt text.** Now `"Cover for {title}"` (inherited from `GameCard`); was bare `title`. Aligns library card with the alt-text convention used in related-games and game-card.

## Intentional divergences (GameCard port — post-Slice 14A)

`widgets/game-card/` is a CVA-driven compound widget ported from canonical's `savepoint-app/widgets/game-card/`. Public surface: `GameCard`, `GameCardSkeleton`, `gameCardVariants`, `GameCardData`, `GameCardProps`, `GameCardSkeletonProps`. Currently consumed by `features/browse-related-games/ui/related-games-infinite-list/`; additional consumers (search results, dashboard, journal cards) land with their respective slices.

- **CVA variant axes declared but not all populated.** The `gameCardVariants` config carries the full `layout` (`vertical` / `vertical-compact` / `horizontal`), `density` (`minimal` / `standard` / `detailed`), and `size` (`sm` / `md` / `lg`) axes from canonical so type signatures stay forward-compatible. **Compound entries are populated only for currently-consumed combinations** (`vertical/minimal` gap, `vertical/{standard,detailed}` gap). Canonical's `horizontal` padding ramp (`p-md` / `p-lg` / `p-xl`) and the `aspectRatio × size` cover sizing matrix are deferred — additive when a horizontal or sized consumer (steam-import card, library card horizontal variant) lands.
- **Single data shape, not canonical's discriminated union.** Canonical exposes `BaseGameData | SearchGameData | LibraryGameData` with a runtime `isSearchGame` discriminator. Tanstack collapses to one `GameCardData` (`{ slug, title, coverImageId?, releaseYear?, platforms? }`) — the `density="detailed"` consumer renders meta when fields are present, otherwise it's omitted. Re-introduce the discriminator only when a second consumer has incompatible field semantics.
- **Sub-components inlined, not split.** Canonical splits into eight files (`game-card-cover.tsx`, `game-card-header.tsx`, `game-card-content.tsx`, `game-card-meta.tsx`, `game-card-footer.tsx`, `game-card-skeleton.tsx`, `genre-badges.tsx`, plus the orchestrator). Tanstack inlines cover / header / content / meta / footer into `game-card.tsx`; only `GameCardSkeleton` is a sibling folder (different lifecycle, no cover data). Lift to per-component folders if a sub-component gains an independent consumer.
- **`asLink` uses TanStack `Link to="/games/$slug" params={{ slug }}`.** No `next/link`. Anonymous viewers click through fine — the route is public.
- **Cover alt text matches `related-games-infinite-list` precedent: `"Cover for {title}"`.** Both `<img alt>` and `role="img" aria-label` (no-cover placeholder) use the same string. Diverges from `entities/library-item/ui/library-item-card/library-item-card.tsx` which uses bare `alt={title}` — fold under one convention in a follow-up.
- **Skeleton uses hand-rolled `animate-pulse`.** Tracks gap-matrix row 27 (shadcn `Skeleton` not ported); port the primitive when a third caller appears.
- **Genre badges intentionally NOT ported.** Canonical's `GenreBadges` requires genre data on the card's input; no current tanstack consumer carries genres on its game shape. Re-evaluate when collections / search payloads expose genres.

Token sweep: all referenced Tailwind utilities (`gap-md/lg/xl`, `p-md`, `px-xs`, `py-2xs`, `body-md/sm`, `text-secondary-foreground`, `bg-secondary`, `bg-muted`, `aspect-[3/4]`, `duration-normal`) resolve cleanly per `context/spec/021-migrate-to-tanstack-start/audits/14A-tokens.md` ("zero tokens needed translation").

## Intentional divergences (Slice 14 — phase-2 streaming)

> **Supersedes** the eager-prefetch wiring in [Slice 14 (initial)](#intentional-divergences-slice-14) for collections + related games. The worker contract (`getRelatedGames`), the `RelatedGamesInfiniteList` component, and the search-param schema on the route are all unchanged. Only the page-data composition and the route render shape moved.

The cache-hit asymmetry of the original Slice 14 — `collections` was transient on `GameDetails` and only populated on cache-miss, so cache-hit pages rendered no related games — was the trigger. The fix promotes both IGDB-derived live datasets (collections → related games, plus times-to-beat) out of the loader-blocking phase 1 into a streamed phase 2.

- **Phase 1 stays DB-only.** `getGameDetails` returns `{ game, libraryEntry, journalTeaser, relatedGames: [] }`. The `collections` field is gone — `entities/game/api/get-game-details.server.ts` no longer carries IGDB-derived live data, and `GAME_FIELDS` in `get-game-by-slug.ts` no longer requests `collections.*`. `SearchResponseItemSchema` dropped the `collections` array; `CollectionRefSchema` is still exported for the new entity query that consumes it.
- **Phase 2 is streamed via bare promises.** `features/game-detail/api/get-game-detail-page-data.ts` returns `{ data, viewerUserId, deferredRelatedGames, deferredTimesToBeat }`. The two `Deferred*` fields are bare `Promise<...>` values — TanStack Start's loader-result serializer handles deferred promises natively when they reach `<Await>` (which internally calls `defer()` on the pending promise). No explicit `defer()` wrapping needed at the loader site. Choice rationale: `defer()` is exported from `@tanstack/react-router` v1.169 but is not required at the producer side — `<Await>` runs `reactUse(promise)` first and falls back to `defer()` itself, so the loader returning bare promises is the simpler, idiomatic shape and matches what the framework `Await` consumes verbatim.
- **Multi-collection: ALL collections, stacked.** The phase-2 related-games promise resolves to `RelatedCollectionSection[]` — one entry per IGDB collection associated with the game. The route renders them as a single `<h2>Related games</h2>` followed by stacked `<h3>{collectionName}</h3>` + `<RelatedGamesInfiniteList/>` blocks. **No Tabs primitive.** Radix Tabs port is deferred to Slice 18A; stacked sections are the dumbest-thing-that-works substitute and parities the visual hierarchy without the new primitive.
- **Per-collection failure semantics: `Promise.allSettled` + filter.** If some collections succeed and others fail, the survivors are rendered and the failures are logged. If EVERY collection fails (or the collections fetch itself throws), the related-games section's `<Await>` rejects and the per-section error boundary surfaces an inline `role="alert"` ("Couldn't load related games") underneath the preserved `<h2>` — the section header stays in flow per decision 4. Empty collection list → the section is omitted entirely (the page still renders without an empty heading).
- **Times-to-beat: minimal UI, raw seconds at the entity layer.** `entities/game/api/get-times-to-beat.server.ts` returns `{ mainStory: number | null; completionist: number | null }` in seconds (or `null` when IGDB has no record). `features/game-detail/ui/times-to-beat-section/` is a minimal `<section>` + `<h2>Times to beat</h2>` + 2-row `<dl>` (Main story / Completionist) with hours rounded to one decimal. No bar charts, no completion strip, no community-average widget — full visual port belongs to Slice 18A.
- **Cache-miss accepts one duplicate IGDB call.** Symmetry across cache states beats saving one IGDB roundtrip on a one-time cache-miss. The body fetch in `get-game-by-slug.ts` no longer carries `collections`; the deferred phase always re-fetches via `getGameCollectionsByIgdbId({ igdbId })`. Same applies to times-to-beat.
- **Slot-based widget composition.** `widgets/game-detail/ui/game-detail/` no longer takes `relatedGamesSection` directly. It exposes two optional `ReactNode` slots — `relatedGamesSlot` and `timesToBeatSlot` — that the route fills with `<Suspense fallback>` + `<Await promise>` wrapped in a small per-section error boundary. Keeps the widget pure and unit-testable; the Suspense plumbing lives entirely in the route file.
- **Per-section `<ErrorBoundary>` is a tiny inline class.** React still does not ship a built-in error boundary; the route file contains a minimal 12-line `SectionErrorBoundary` class component. Lifted to a shared module only if a third caller appears.
- **Worker contract for `getRelatedGames` unchanged.** `RelatedGamesInfiniteList` props unchanged. Existing tests for both stay green.

## Intentional divergences (Slice 14)

> **Superseded** in part by [Slice 14 — phase-2 streaming](#intentional-divergences-slice-14--phase-2-streaming) above. The Path-A "transient `collections` on `GameDetails`" trade-off below was abandoned because cache-hit pages rendered no related games. The worker / component / search-param contract documented below is still current.

`features/browse-related-games/` ships the infinite-scroll related-games surface for `/games/$slug`. Slice is GREEN when (a) the worker `getRelatedGames` returns paginated, ALLOWED_GAME_CATEGORIES-filtered IGDB collection games, (b) the `RelatedGamesInfiniteList` component appends pages on sentinel intersection while keeping the URL `?page=N` in sync, (c) the route loader prefetches page 1 of the first collection so SSR delivers a non-empty list.

- **Worker / server-fn split applied (foot-gun #8).** Worker at `features/browse-related-games/api/get-related-games.worker.ts` (plain async, test-importable, throws `AppError` directly). Server-fn wrapper at `features/browse-related-games/api/get-related-games.ts` (NO `.server` suffix per foot-gun #1) — `createServerFn({ method: "GET" })` with Zod `inputValidator`, delegates to the worker.
- **No DB upsert in the worker (read-through only).** Browsing a collection is read-only; upsert happens in the add-game flow when the user clicks a specific game. The integration test pins the Game-table row count at 0 after the call.
- **Component is Variant B (hybrid client-append), not Variant A (pure router-driven).** Pure loader-driven pagination cannot accumulate pages without a parent accumulator that doesn't exist in the route layer; Variant B keeps appended games in local component state and calls `getRelatedGamesFn` directly for pages 2+ (no TanStack Query introduced — honors the spec constraint). The URL is kept in sync via `router.navigate({ search: { page }, replace: true })` so deep-linking reflects the furthest page scrolled to.
- **Search-param schema declared on the route.** `src/routes/games.$slug.tsx` declares `validateSearch: searchSchema.parse` accepting `{ page?: number ≥ 1 }`. The route component does not currently read `page` to seed render — the SSR `firstPage` is always page 1 — but the schema is the durable surface for future deep-linking semantics (e.g., scroll-restore on back-nav). The infinite-list updates `page` via `router.navigate({ search, replace: true })` after each successful fetch.
- **Path A chosen for game-detail wiring.** `entities/game/api/get-game-details.server.ts` extended with `collections: GameCollectionRef[]` (transient, NOT persisted on the Game model). On cache-MISS, collections are derived from the IGDB payload (`collections.id, collections.name` added to `GAME_FIELDS` in `get-game-by-slug.ts`). On cache-HIT (slug already in `Game` table), collections come back as `[]` because the column doesn't exist on the model — **acceptable trade-off**: avoids a Prisma migration and keeps cache-hit zero-network. The page-data server fn (`features/game-detail/api/get-game-detail-page-data.ts`) prefetches page 1 of the first collection and surfaces it as `relatedGamesSection: { collectionId, collectionName, pageSize, firstPage }` on the loader payload. Cache-hit pages render without a related-games section.
- **Best-effort prefetch (no failure escalation).** If the related-games prefetch throws (`NotFoundError` for an empty collection, `UpstreamError` for IGDB transport), the page-data fn logs and returns `relatedGamesSection: null` — the page renders without the section rather than 5xx-ing the entire game detail. Verified manually; not yet covered by an integration test.
- **Widget composition.** `widgets/game-detail/ui/game-detail/` accepts an optional `relatedGamesSection` prop and renders `<RelatedGamesInfiniteList/>` inside an `<h2>Related games</h2>` section when present. Anonymous viewers see related games (no auth requirement — collections are public).
- **`<img>` everywhere, no `next/image`.** Cover URLs built via the existing `buildCoverImageUrl` helper from `entities/library-item/ui/library-item-card/library-item-card.utility`. Plain placeholder `<div role="img" aria-label="Cover for {title}">` when `coverImageId` is null — satisfies the test's `getByRole("img", { name: "Cover for ..." })` query for both rendered and missing-cover states.
- **Pre-existing failure fixed in scope (project rule).** `library-item-card.test.tsx` had 9 failing tests after the slice-13 `<Link to="/games/$slug">` addition (rendered without a `RouterProvider`). Added a `vi.mock("@tanstack/react-router")` matching the `landing-hero.test.tsx` precedent (resolves `to + params` → plain `<a>`). Also added a typecheck-required `search={{ page: 1 }}` on the `<Link>` itself because the route now declares `validateSearch`.

## Intentional divergences (Slice 13)

`entities/game/api/get-game-details.server.ts` orchestrates the game-detail page read. The contract returns `{ game, relatedGames, libraryEntry, journalTeaser }`; the slice is GREEN when slug → cached `Game` resolves, viewer-scoped `LibraryItem` and recent `JournalEntry[]` (max 3, desc `createdAt`) load correctly, and a missing slug throws `NotFoundError`.

- **`relatedGames` returns `[]`.** The canonical app derives related games via genre / franchise; tanstack defers that until the supporting columns and indexes land. The integration test only asserts `Array.isArray`, so `[]` is contract-conformant. To be revisited when Slice 13 ships SEO/related sections.
- **Cache-first slug lookup.** The orchestrator queries `prisma.game.findUnique({ where: { slug } })` BEFORE calling IGDB. The cache-hit test (line 404 of `get-game-details.integration.test.ts`) pins this: a strict `vi.fn()` is stubbed in after the first call, and the second call must not invoke fetch. Querying IGDB first and then upserting would still pass the assertion via the `igdbId` cache hit inside `upsertGameFromIgdbPayload`, but the slug-first branch keeps a guaranteed zero-network path on warm caches and avoids depending on IGDB returning the same `igdbId` for a slug across calls.
- **`upsertGameFromIgdbPayload` sibling added.** The existing `upsertGameFromIgdb(igdbId)` re-fetches IGDB by id even when the caller already has the payload — that would double the IGDB calls per slug-resolution. Added a sibling `upsertGameFromIgdbPayload(payload)` with the same insert logic; `upsertGameFromIgdb` now delegates to it on cache miss. Existing callers (`features/add-game/api/add-game-to-library-fn.ts`) keep their signature.
- **Journal teaser limit hard-coded to 3.** The teaser is a UI affordance, not a paginated list — magic number lives at the entity layer (`JOURNAL_TEASER_LIMIT`). Full journal listing belongs to a future feature server fn.
- **Privacy invariant on `libraryEntry` and `journalTeaser`.** Both Prisma queries scope by `userId` directly. No "public profile" branch yet — anonymous viewers always get `null` / `[]` for these fields. Cross-user isolation is verified by the integration test's `cross-user isolation` block.

### Slice 13 / Task 4 — game-detail UI primitives + widget composition

The canonical `savepoint-app/features/game-detail/ui/` ships ~12 components for the detail page. Tanstack collapses to **3 entity primitives + 1 entity teaser + 1 widget composer**:

- **`entities/game/ui/game-cover/`** — replaces `game-cover-image.tsx`. Plain `<img>` with `<div role="img">` placeholder fallback; no `next/image`.
- **`entities/game/ui/game-metadata/`** — collapses `game-detail-hero.tsx` + `game-description.tsx` + `game-release-date.tsx` into one block: `<h1>` title, `<time>` release date, `<p>` summary. Date uses bare `<time>` (no `<p>` wrapper) so the test's `queryByRole("paragraph")` reliably distinguishes summary presence.
- **`entities/library-item/ui/library-status-strip/`** — collapses the canonical `library-status-dropdown-pill.tsx` + `library-status-segmented.tsx` dual-surface into a single read-only strip (status pill + optional rating + optional platform). Mutation surfaces are reached via the `manage-library-entry` modal in CTA wiring (Task 6), not via inline pill/segmented controls. Reuses `getStatusLabel` from `entities/library-item/model` for label parity with `library-item-card`.
- **`entities/journal-entry/ui/journal-teaser/`** — read-only teaser; compose / edit lives in Slice 16 (`journal-entries-section.tsx`'s dialog logic deferred). Empty state `<p>No journal entries yet.</p>`; otherwise an `<ul aria-label="Recent journal entries">` of date + title + line-clamped snippet. No `next/link`.
- **`widgets/game-detail/ui/game-detail/`** — composes the four primitives. Cover (left/top, max-w-xs) + metadata (right/below) in `flex md:flex-row`; status strip rendered when `libraryEntry !== null`; journal teaser section rendered when `viewerUserId !== null` (anonymous viewers see no teaser, matching the entity-layer privacy invariant). `relatedGames` threaded through but unused — Slice 14.

**Dropped from this task:** `playtime-section.tsx`, `actual-playtime.tsx`, `times-to-beat-section.tsx`, `library-rating-control.tsx` (interactive), `add-to-library-button.tsx`, `game-not-found.tsx`. Playtime / times-to-beat fields are on the `Game` model but not surfaced yet — additive when needed. CTAs (add-to-library, edit-entry) are Task 6. `game-not-found` is the route-level error component, also Task 6.

**Cover-size pre-existing fix.** `entities/library-item/ui/library-item-card/library-item-card.utility.ts` `buildCoverImageUrl` default was `t_cover_big_2x` but the co-located test pinned `t_cover_big`. Per the project rule "fix any pre-existing issue in scope," default reverted to `t_cover_big`. The widget passes `t_cover_big_2x` explicitly for the larger detail-page cover.

### Slice 13 / Task 5 — `/games/$slug` route wiring

- **Public route, not under `_authed/`.** The route lives at `src/routes/games.$slug.tsx` and is accessible to anonymous viewers. `userId` is read from the server-side session ONLY (via `getServerUserId(request)` inside the loader's server fn) — never from URL/search params.
- **Loader-only feature server fn introduced.** `features/game-detail/api/get-game-detail-page-data.ts` exports `getGameDetailPageDataFn` (`createServerFn`, no `.server` suffix). Its only consumer is the route loader, which by the strict feature-server-fn rule should be a loader-direct read — but foot-gun #2 (CLAUDE.md) makes that unsafe (the route extractor doesn't strip `.server.ts` imports from client preload, hanging the app on hover-preload). The wrapper is the documented escape hatch. It returns `{ data, viewerUserId }` so the widget gets `viewerUserId` without a second round-trip on the client.
- **Route `errorComponent` branches on `AppError.code === "NOT_FOUND"`.** `NotFoundError` (thrown by `getGameDetails` when IGDB returns no match for the slug) renders a friendly "Game not found" surface with a `<Link to="/">Go home</Link>`; any other error renders a generic "Something went wrong" surface with the same home link. The route does NOT delegate to the root `ErrorBoundary` — the canonical app's `game-not-found.tsx` shipped a route-scoped 404 surface, and the same shape is preserved here. Internal links use `@tanstack/react-router`'s `Link`, never `next/link`.
- **Route test placed at `src/routes/-games.$slug.test.tsx`.** The leading `-` keeps the test file out of TanStack Router's file-route generation (mirrors the existing `-_authed.test.tsx`, `-index.test.tsx` precedent). The test mocks `@tanstack/react-router`'s `createFileRoute` to return a passthrough `{ options }` shape so the test can drive `Route.options.component` / `Route.options.errorComponent` / `Route.options.loader` directly without a router runtime. Coverage: signed-in path forwards `viewerUserId`; anonymous path forwards `null`; `NotFoundError` thrown into `errorComponent` renders the 404 surface; non-`NotFoundError` renders the generic surface; loader calls `getGameDetailPageDataFn({ data: { slug } })`. +8 unit tests (287 → 295).

**Test path fix.** `library-status-strip.test.tsx` shipped from RED with a 4-segment `../../../../shared/lib/prisma/client.ts` import; correct depth from `src/entities/library-item/ui/library-status-strip/` is 5. Repaired without touching test logic.

## Intentional divergences (Slice 11)

`features/manage-library-entry/ui/library-modal/` collapses the canonical `savepoint-app/features/manage-library-entry/ui/` structure aggressively. The slice is GREEN when status / rating / platform / date editing works through `updateLibraryItemFn` and deletion through `deleteLibraryItemFn`; UX surfaces beyond that are deliberately omitted.

- **`desktop-layout.tsx` / `mobile-layout.tsx` collapsed.** Single responsive form inside `<DialogContent>`; no viewport switch.
- **`edit-entry-form.tsx` inlined.** Form lives directly in `library-modal.tsx`; no separate form component.
- **`status-select.tsx` / `status-chip-group.tsx` collapsed into a single native `<select aria-label="Status">`.** Native `<select>` matches slice 9's `library-filters.tsx` precedent and is reachable by `getByRole("combobox", { name: "Status" })` without porting Radix `Select`. No new shadcn primitive added.
- **`platform-combobox.tsx` replaced with native `<select aria-label="Platform">`.** Same rationale as Status. Accepts a fixed list of platforms plus the entry's current platform if it isn't in the canonical list (preserves out-of-list values).
- **`date-field.tsx` / `date-fields-collapsible.tsx` collapsed and flattened.** Two flat `<input type="text" pattern="\d{4}-\d{2}-\d{2}">` fields ("Started", "Completed"). `type="text"` rather than `type="date"` because jsdom does not assign `role="textbox"` to date inputs, and the test locks `role="textbox"`. No collapsible reveal — both dates always visible.
- **`library-entry-metadata.tsx` (cover thumbnail + title display) omitted.** Game title surfaces only as `<DialogTitle>{entry.game.title}</DialogTitle>`. Cover thumbnail not rendered.
- **Toasts + `router.invalidate()` wired in tasks.md line 232 (feedback sub-task).** On update success: `toast.success("Library entry updated")` → `router.invalidate()` → `onOpenChange(false)`. On delete success: `toast.success("Removed from library")` → `router.invalidate()` → `onOpenChange(false)`. On either rejection: `toast.error(message)` AND inline `role="alert"` (additive — toast is the transient channel, inline alert is the persistent a11y channel for screen-reader users who miss the toast). Mirrors the `AddGameModal` (Slice 10) and `AvatarUpload` (Slice 6) precedents — the component that fires the mutation owns its full cycle (call → toast → invalidate → close). Lifecycle calls happen inside the `try` block, so a rejection path leaves the modal open and skips invalidation.
- **Delete confirmation is a SINGLE inline surface, not the canonical two-surface split.** Canonical `savepoint-app/` ships both `delete-confirmation-dialog.tsx` (shadcn `AlertDialog`-based) and `inline-delete-confirm.tsx` (compact inline confirm); tanstack collapses to one. A controlled boolean swaps the "Remove from library" trigger for an inline `Confirm` / `Cancel` pair within the same `DialogContent`. No new shadcn primitive added; no second surface ported. The two-surface split adds no value when the modal itself is already a focus trap and the action lives entirely within it.
- **Save closes on success.** As of the line 232 feedback wiring, `onOpenChange(false)` is called after `updateLibraryItemFn` resolves AND after `deleteLibraryItemFn` resolves. The parent stays a pure controller — modal owns its own close-on-success.
- **Patch shape on save.** All five fields (status, platform, rating, startedAt, completedAt) are sent on every submit, with empty-string platform → `null`, empty-string rating → `null`, empty-string date → `null`. Relies on the entity layer's `undefined`-filter for no-ops; we never send `undefined` here.

## Known gaps (Slice 14A — UI parity)

Scope: 14A's "GREEN (other in-scope hand-rolled surfaces)" subtask. Worklist driven by [`context/spec/021-migrate-to-tanstack-start/audits/14A-ui-gap-matrix.md`](../context/spec/021-migrate-to-tanstack-start/audits/14A-ui-gap-matrix.md). Each row below is a gap-matrix entry whose action was "waive" (or whose port was partial), with the rationale captured for the cutover review. Ported rows are not listed — they're closed in commit history.

### SidebarSearchTrigger (gap-matrix row 2)

**Status:** Deferred to 18A (S17 command palette).
**Canonical behavior:** A `SidebarMenuButton` opens the global command palette via `useCommandPaletteContext().open()`; ⌘K binding lives there.
**Tanstack behavior:** Plain `<button>` with a `⌘K` kbd affordance — no palette feature wired.
**Rationale:** The command palette is owned by S17. Wiring this trigger before the palette ships is premature; the audit explicitly defers this row.

### SidebarNavLinks / shadcn `Sidebar` primitive (gap-matrix row 3)

**Status:** Waived (slice 14A).
**Canonical behavior:** Full shadcn `Sidebar` provider + `SidebarMenuButton` with collapsible-icon mode and tooltip-on-collapse.
**Tanstack behavior:** Hand-rolled `<aside>` + TanStack `<Link activeProps>`.
**Rationale:** shadcn `Sidebar` is a >500-line primitive with cookie-backed collapse state, provider context, and a Radix sub-tree, with no other consumer in the tanstack tree. Persistent full-width sidebar is correct for the current layout. Revisit if a collapsed-icon mode becomes a requirement.

### AddGameTrigger quick-add Popover (gap-matrix row 13)

**Status:** Waived (slice 14A).
**Canonical behavior:** Two add-game surfaces — full `Dialog`-based form AND a `Popover`-based "quick add" anchored on library-card hover.
**Tanstack behavior:** Single `Dialog` path via `AddGameTrigger`.
**Rationale:** The Popover quick-add is a progressive-enhancement convenience, not a primary flow. Library cards do not yet host a hover quick-add anchor in tanstack. Revisit if hover-state CTAs are added.

### AddGameModal — shadcn `Form` (gap-matrix row 14)

**Status:** Waived (slice 14A).
**Canonical behavior:** shadcn `Form` (FormItem + FormControl + FormMessage) wraps the search input.
**Tanstack behavior:** Plain `<form>` + `<label>` + `Input`.
**Rationale:** The add-game search form is single-field; shadcn `Form` adds no observable value. Porting `Form` would block on Radix-form's react-hook-form integration without a corresponding UX gain.

### LibraryModal Platform combobox-with-search (gap-matrix row 16)

**Status:** Partially ported — Select adopted; Popover+Command search-to-filter waived.
**Canonical behavior:** `PlatformCombobox` uses `Popover` + `Command` for search-to-filter over a long platform list.
**Tanstack behavior:** Radix `Select` with the same fixed 6-platform list.
**Rationale:** Tanstack ships only 6 hard-coded platforms. Search-to-filter adds no value at that cardinality; the keyboard-nav and visual-parity benefits of Radix `Select` close the major UX gap from the previous native `<select>`. Revisit when the platform list is fetched dynamically (canonical's full list ~100+).

### LibraryModal desktop/mobile split (gap-matrix row 18)

**Status:** Waived (slice 11; reaffirmed in 14A).
**Canonical behavior:** Separate `DesktopLayout` / `MobileLayout` form components.
**Tanstack behavior:** Single responsive `Dialog` form.
**Rationale:** Documented in the slice-11 divergence above — collapsing simplifies code without user-visible harm.

### LibraryModal entry metadata thumbnail (gap-matrix row 19)

**Status:** Waived (slice 11; reaffirmed in 14A).
**Canonical behavior:** Cover thumbnail + title rendered in the modal header via `LibraryEntryMetadata`.
**Tanstack behavior:** `DialogTitle` text only.
**Rationale:** Game title in `DialogTitle` satisfies the accessible name requirement. Cover adds visual richness but not functional parity. Revisit if design review deems the cover load-bearing for context.

### GameDetailHero ⋯ DropdownMenu button (sub-row of gap-matrix row 21)

**Status:** Waived (slice 14A).
**Canonical behavior:** Inline `DropdownMenu` with a single "Edit library entry" item next to the status cluster.
**Tanstack behavior:** No ⋯ button.
**Rationale:** The only canonical menu item duplicates `ManageFromGameDetailButton`, which is already rendered prominently in the hero for users with library entries. Adding the ⋯ button would create two near-identical affordances. Revisit if additional per-entry actions land that don't fit on the manage modal.

### GameDetailHero banner + studio/genre eyebrow (sub-row of gap-matrix row 21)

**Status:** Deferred to 18A.
**Canonical behavior:** Cover-blurred banner with a two-layer gradient overlay; eyebrow renders year · studio · top-2 genres.
**Tanstack behavior:** No banner; eyebrow renders release year only.
**Rationale:** Banner needs a screenshot/artwork URL on the `Game` model — schema bleed outside 14A scope. Studio + genre rendering needs `getGameDetails` to select `companies` and `genres` relations. Both are entity-query extensions that warrant a dedicated 18A row.

### RelatedGamesSection — Tabs + ScrollArea (gap-matrix row 25)

**Status:** Deferred to 18A (per slice 14 phase-2 streaming divergence).
**Canonical behavior:** `Tabs` switches between collections; `ScrollArea` for the inner list.
**Tanstack behavior:** Stacked `<h3>` sections per collection; native `overflow-y-auto`.
**Rationale:** Radix `Tabs` is not yet ported; stacked sections are the documented interim shape.

### RelatedGameCard — full GameCard widget port (sub-row of gap-matrix row 26)

**Status:** Ported (minimal CVA variants). See _Intentional divergences (GameCard port)_ below.
**Canonical behavior:** Compound `Card` with header/footer/meta + genre `Badge`s.
**Tanstack behavior:** `<GameCard density="minimal">` from `widgets/game-card`. Genre chips still waived (no genre data on `RelatedGame`).
**Rationale:** `widgets/game-card/` now exposes a CVA-driven compound widget. `RelatedGamesInfiniteList` consumes it via the `minimal` density (cover + clamped title, no meta, no footer slot). Genre data extension stays out of scope until the collections payload carries it.

### RelatedGamesSkeleton — shadcn `Skeleton` (gap-matrix row 27)

**Status:** Waived (slice 14A).
**Canonical behavior:** Uses shadcn `Skeleton` primitive.
**Tanstack behavior:** Hand-rolled `animate-pulse` divs.
**Rationale:** shadcn `Skeleton` is a thin wrapper around `bg-muted animate-pulse`. Functionally equivalent. Port if a third caller lands; standalone, the primitive overhead isn't justified.

### TimesToBeatSection (gap-matrix row 24)

**Status:** Waived (slice 14A; matches the slice-14 phase-2 divergence above).
**Canonical behavior:** Bar charts, completion strip, community-average widget.
**Tanstack behavior:** Minimal `<dl>` with main story / completionist hours.
**Rationale:** Spec calls out full visual port as 18A. Minimal `<dl>` is the documented interim.

### ProfilePage tabs + social actions (gap-matrix row 30)

**Status:** Waived (intentional architectural pivot).
**Canonical behavior:** Tabbed profile (Overview / Library / Activity) + DropdownMenu follow menu, follower counts.
**Tanstack behavior:** Flat `<ProfileOverview/>`.
**Rationale:** Tabs and social are S18 (settings/social) territory. The avatar + stats + edit-profile CTA portions are already ported.

### JournalTeaser — interactive "Add entry" CTA (gap-matrix row 29)

**Status:** Deferred to 18A (S15/S16 journal feature).
**Canonical behavior:** Inline "Add entry" CTA opens a journal compose dialog.
**Tanstack behavior:** Read-only entries list only.
**Rationale:** Journal compose/edit is owned by S15/S16. The read-only teaser is correct for 14A — typography is aligned (text-sm + text-xs hierarchy mirrors canonical).

### LibraryStatusBadge placement on LibraryItemCard (14A diff sweep finding F1)

**Status:** Closed (post-GameCard port). Badge now overlays the cover top-left via `GameCard.badges` slot, canonical-aligned.
**Canonical behavior:** Badge overlays the cover image with glass/blur styling.
**Tanstack behavior:** Badge renders absolute-positioned top-left of the cover via `<LibraryItemCard>`'s composition on `<GameCard badges={<LibraryStatusBadge .../>}>`. Closed when `LibraryItemCard` moved from `entities/library-item/ui/` to `widgets/library-item-card/` so it could legally import `GameCard` (widgets > entities in FSD). See _Intentional divergences (LibraryItemCard widget move + GameCard composition)_ below.

### Sidebar avatar fallback (14A diff sweep finding F2)

**Status:** Visual divergence (cosmetic).
**Canonical behavior:** `<User>` lucide icon centered in a themed circle.
**Tanstack behavior:** Static `/default-avatar.png` image asset.
**Rationale:** Functionally equivalent — both render a placeholder when no avatar URL exists. Lucide-icon path is one line of code; can be aligned in any subsequent slice without scope justification.

### LibraryItemCard hover/focus theme bloom (14A diff sweep finding F3)

**Status:** Waived (consistent with global no-theme-variant stance).
**Canonical behavior:** Layered `y2k:` / `jewel:` themed bloom + scale on hover/focus.
**Tanstack behavior:** Plain `transition-shadow`.
**Rationale:** Tanstack's tokens audit (`audits/14A-tokens.md`) established that `y2k:` / `jewel:` Tailwind variants are not translated — they're canonical-only theme decoration. Adopting them would require porting the variant config, which is explicitly out of scope. This finding is documented for completeness, not as a gap to close.

### LibraryCardRating display strip on LibraryItemCard (gap-matrix row 10 — F4)

**Status:** Deferred to 18A.
**Canonical behavior:** `LibraryItemCard` body renders a read-only star strip (powered by canonical's rating component) showing `item.rating` inline below the title.
**Tanstack behavior:** Card has no rating control — neither interactive nor read-only. Rating editing works via `LibraryModal` (gap-matrix row 17, confirmed). The inline card display is missing.
**Rationale:** Caught post-verification (finding F4 in `audits/14A-verification.md`). `RatingInput` primitive is already ported in 14A; the surface implementation is one prop wiring (`<RatingInput readOnly value={item.rating} size="sm" />`) plus a card-body slot. Deferred rather than implemented in 14A to keep the verification verdict clean and the slice scope honest. 18A delta audit must NOT treat row 10 as no-op.

## Slice 15 — Journal timeline read

Intentional divergences from `savepoint-app/features/journal/ui/journal-timeline.tsx`, all scoped to defer to Slice 16 (Journal entry CRUD) or later:

- **Flat chronological list instead of grouped-by-game layout.** Canonical groups entries under per-game headers (with cover, entry count, link to `/games/$slug`). Slice 15 renders a flat `<article>` list ordered `updatedAt desc`. Rationale: grouping is structurally coupled to the compose flow (Slice 16); shipping it standalone risks duplicate work. Revisit when S16 lands.
- **No empty-state "Log a session" CTA.** Canonical's empty state includes a `<Link to="/journal/new">` button. The `/journal/new` route does not exist on `:6061` yet (Slice 16 scope). Rendering a button to a 404 is worse than rendering no button. Restore in S16 when the compose route is wired. **(Slice 23 update: `/journal/new` now exists — see "Slice 23" section below. The empty-state CTA itself is still not wired; the header-row "Compose entry" link now navigates there instead.)**
- **No cover image on entry cards.** `JOURNAL_ENTRY_GAME_SELECT` includes `coverImage`, but `JournalEntryCard` does not render it. Slice 15 contract focuses on text content + game-title link. Cover rendering can land alongside S16 without re-touching the entity-query shape.
- **No pagination / `take` limit on `getJournalTimeline`.** Canonical fetches with `limit: 20` and offers Load More. Slice 15 fetches the full timeline. Acceptable for current journal sizes (no real user has >50 entries); revisit when S16 introduces compose-driven growth or if `:6061` rolls out to higher-volume users.
- **No route-level `errorComponent` on `_authed/journal.tsx`.** Auth is already enforced upstream by `_authed.tsx`'s `beforeLoad`; `getJournalTimeline` returns `[]` rather than throwing for empty/missing-user/missing-game cases. The root `ErrorBoundary` is the last-resort fallback. Add a route-local error component if a future query path introduces a throw mode.
- **Date display uses `toLocaleDateString` (absolute), not `formatRelativeDate` (relative) as in canonical.** `date-fns` is not yet a dependency of `savepoint-tanstack`. Adding it for one component is not justified pre-S16. Revisit when another surface needs richer date formatting.

## Slice 16 — Journal entry CRUD (compose / edit / delete dialogs)

> **PARTIALLY SUPERSEDED by Slice 23 (blocker remediation #1).** The dialog-only pivot recorded here — building compose / detail / edit / delete as **dialogs** instead of canonical's full page routes — was reversed for the dedicated `/journal` surface. The three canonical page routes (`/journal/new`, `/journal/$id`, `/journal/$id/edit`) were RESTORED for true URL + UX parity (functional-spec §2.7). The dialog components themselves are unchanged and still power the quick-compose surfaces (game-detail, library-item-card, dashboard). See the "Slice 23" section below.

Intentional divergences from `savepoint-app/features/journal/ui/`:

- **Single responsive dialog per intent, no desktop/mobile split.** Canonical splits each dialog into `*-desktop` + `*-mobile` variants gated by a viewport hook. Tanstack ships one `Dialog` (Radix) per intent (`ComposeJournalEntryDialog`, `EditJournalEntryDialog`, `DeleteJournalEntryDialog`). The slice description explicitly permits this collapse; Radix Dialog is already responsive via Tailwind. Revisit only if a real-device gap emerges.
- **No game picker, no kind selector in compose.** Canonical's `JournalEntryForm` carries a game `<Combobox>` and a `kind` segmented control. Tanstack compose accepts a `defaultGameId?: string` prop and hard-codes `kind: "QUICK"`. Scope reduction per slice text ("compose with defaults + simple content textarea is enough"); the in-form pickers move with the CTA wiring sub-task or later.
- **No shared `JournalEntryForm` extracted.** Canonical extracts compose+edit into one shared form component. Tanstack inlines the textarea+submit in each dialog. Two near-duplicate forms are cheaper to read than a parameterized shared form at this size; extract only when a third surface needs the same shape.
- **Plain `<textarea aria-label="Content">`, no `Textarea` primitive yet.** `shared/ui/` has no `Textarea` component; introducing one for a single consumer was deferred. The styling lives inline via `textareaClasses` per dialog. If a second consumer appears, lift to `shared/ui/textarea.tsx`.
- **No toast feedback on success/error yet.** Error sets local `setError` and renders an inline `role="alert"`; success simply invalidates + closes. The CTA-wiring sub-task is scoped to add Sonner toasts. Compose component does NOT call `toast.success/error` — mirrors the RED test which asserts only on `onOpenChange` and `router.invalidate()`.
- **Dialogs call their own feature `*.Fn` directly (`createJournalEntryFn({ data })`) without `useServerFn`.** Mirrors the `LibraryModal` precedent. The RED tests mock the fn module and assert on call args, which matches the direct-call shape.
- **RED test fix: `useRouter` mock factory wrapped in `vi.fn(...)`.** The RED tests as authored had `useRouter: () => ({ invalidate: vi.fn() })` but later called `vi.mocked(useRouter).mockReturnValue(...)` — which throws because the value isn't a mock. Wrapping in `vi.fn(() => ({ invalidate: vi.fn() }))` is the minimum change to make `vi.mocked` overridable without altering any assertion. The contract (`router.invalidate()` is called on success) is preserved.
- **RED test fix: `mockResolvedValue(undefined as never)` on compose/edit.** Both server fns return `Promise<JournalTimelineEntry>`; the RED tests resolved with `undefined`, which TS rejects. The `as never` cast keeps the test's intent (success path) while satisfying the type signature — the dialog never reads the return value.

### Slice 16 — CTA wiring (post-dialog GREEN)

CTAs that open the compose / detail / edit / delete dialogs were wired into the composing widget layer to preserve the entity-layer display-only rule (`JournalEntryCard`, `JournalTeaser` are entities — they cannot import features per FSD).

- **New widget: `widgets/journal-timeline-page/`.** Wraps the entity-list `JournalTimeline` widget, owns dialog state (`compose` / `detail` / `edit` / `delete`), and renders a header "Compose entry" CTA. The `/journal` route is now thin again: it loads data and renders `<JournalTimelinePage entries={...}/>`. Canonical ships a floating `JournalFAB`; tanstack uses a header-row "Compose entry" `<Button>` instead — better aligned with the existing app-shell header layout, and the slice text explicitly permits this swap. Revisit if a FAB primitive lands elsewhere. **(Slice 23 update: this widget no longer owns any dialog state. The "Compose entry" CTA is now a `<Link to="/journal/new">` and card click navigates to `/journal/$id`. The `widgets/journal-entry-detail` detail dialog is no longer used by this surface. See "Slice 23".)**
- **New widget: `widgets/journal-entry-detail/`.** A dialog that surfaces the entry's content with Edit + Delete buttons. The widget itself does NOT import the edit / delete features — it emits `onEdit(entryId)` / `onDelete(entryId)` callbacks; the composing `JournalTimelinePage` widget routes the click to the appropriate feature dialog. Canonical has a per-viewport `JournalEntryDialog` (desktop / mobile variants) plus inline edit / delete affordances; tanstack collapses both viewports into one Radix Dialog with a Delete button (variant=destructive) and an Edit button in the footer, matching the slice-11 (LibraryModal) precedent for single responsive layouts.
- **`JournalEntryCard` accepts optional `onSelect: (entryId) => void`.** Entity stays display-only — the callback is a prop, no feature imports introduced. When provided, the card body becomes a `<button>` (with an `aria-label="Open journal entry from {date}"` accessible name); when omitted, the card renders as before. The game-title `<Link>` inside the card calls `stopPropagation` on click so the navigation isn't hijacked by the surrounding card-click handler.
- **`JournalTeaser` accepts optional `onAddEntryClick: () => void`.** Same display-only carve-out — the entity emits a click; the composing widget (`widgets/game-detail`) owns the compose-dialog state. The button renders as a small underlined `Add entry` text affordance both above the entries list and inside the empty state.
- **`widgets/game-detail` owns the compose dialog for the game-detail surface.** A local `useState` for `composeOpen` and a `<ComposeJournalEntryDialog defaultGameId={game.id}/>` are mounted only for signed-in viewers (`viewerUserId !== null`). The compose dialog is the same component the `/journal` route uses — one dialog, two trigger surfaces. Anonymous viewers never see the teaser or the dialog (entity-layer privacy invariant unchanged).
- **`widgets/journal-timeline` adds an optional `onEntrySelect` prop.** Threaded straight through to each `<JournalEntryCard onSelect=...>`. The widget itself does not change behavior when the prop is omitted — Slice-15 callers (none currently) keep working untouched.
- **No new "view journal entry" feature created.** The detail dialog is intentionally a widget, not a feature: it carries no server-fn invocation, only `onEdit` / `onDelete` callbacks. Promoting it to a feature would add a layer without changing behavior. Revisit only if the detail dialog grows mutation surfaces of its own.
- **Tests added (component-level, per slice DoD).** `journal-timeline-page.test.tsx` (5 tests covering: trigger renders, compose dialog opens, card click → detail dialog with Edit + Delete, Edit routes to edit dialog, Delete routes to delete dialog and fires `deleteJournalEntryFn` with the right id). `journal-entry-detail.test.tsx` (6 tests covering: content render, title render, Edit / Delete buttons render, `onEdit` / `onDelete` callback wiring). `journal-entry-card.test.tsx` (3 tests covering: optional `onSelect` semantics — present vs. absent). `journal-teaser.test.tsx` (4 tests covering: optional `onAddEntryClick` semantics — present vs. absent, empty + populated lists). `game-detail.test.tsx` extended with 2 scenarios (signed-in clicks Add entry → `createJournalEntryFn` called with `gameId: game.id`; anonymous viewers don't see the CTA). Total unit-test count: 295 → 499 (Slice-15/16 dialog GREEN steps contributed the bulk; CTA-wiring step adds the +20 tests across the five files above). **(Slice 23 update: `journal-timeline-page.test.tsx` rewritten — it now asserts the Compose link `href` and the card-click `navigate` call instead of dialog open/close. The dialog-routing assertions moved to the new page-route / page-form tests.)**

## Slice 23 — Journal page routes RESTORED (blocker remediation #1)

The Slice 23 URL-parity audit found three canonical journal URLs 404ing on `:6061` because Slice 16 deliberately shipped them as dialogs:

- `/journal/new` — full-page compose form
- `/journal/$id` — single entry detail page
- `/journal/$id/edit` — full-page edit form

The product owner reversed the dialog-only pivot in favor of **true page routes** for URL + UX parity (functional-spec §2.7: every previously valid URL keeps working). This section records what changed; the Slice 16 entries above are amended in-place to point here.

### What was built

- **Entity query `getJournalEntryById(userId, entryId)`** at `entities/journal-entry/api/get-journal-entry-by-id.server.ts`. Returns the `JournalTimelineEntry` shape (same `JOURNAL_ENTRY_GAME_SELECT` projection the detail/edit UI consumes — no new specialized subset query). **Privacy invariant (errors.md):** throws `NotFoundError` for BOTH "entry missing" AND "entry owned by another user" — the read path must not leak existence. This intentionally differs from the sibling update/delete entity queries, which throw `UnauthorizedError` on cross-user mutation (a mutation can safely reveal "you don't own this"; a read enumeration must not). Integration test `test/integration/journal-entry-by-id.integration.test.ts` pins all three branches (found-own / cross-user → NotFound / missing → NotFound).
- **Loader-safe server fn `getJournalEntryPageDataFn`** at `features/journal-timeline/api/get-journal-entry-page-data.ts` (foot-gun #2: route loaders must not import `.server.ts` modules directly — Vite's import-protection hangs hover-preload). Validate-twice, resolves `userId` via `requireUserId()` inside the handler, delegates to the entity query. Mirrors the existing `getJournalTimelinePageDataFn` shape; lives in the same `journal-timeline` feature (cohesion: both are the journal read surface for routes).
- **Three routes under `_authed/`** (flat-dotted child convention): `journal.new.tsx`, `journal.$id.tsx`, `journal.$id.edit.tsx`. Auth via the `_authed` group guard (parity with canonical's `(protected)`). Detail + edit routes branch their `errorComponent` on `AppError.code === "NOT_FOUND"` (per `routes.md`) for a styled 404 surface with a "Back to journal" link. `routeTree.gen.ts` regenerated.
- **Page form/display components reuse the existing server fns and Zod schemas** — no parallel CRUD path:
  - `features/compose-journal-entry/ui/compose-journal-entry-form/` — page variant of the compose dialog. Calls `createJournalEntryFn`; on success navigates to `/journal/$id` (canonical `NewJournalEntryPage` parity). `?gameId=` search param pre-selects the association.
  - `features/edit-journal-entry/ui/edit-journal-entry-form/` — page variant of the edit dialog. Calls `updateJournalEntryFn`; on success navigates to `/journal/$id`.
  - `features/delete-journal-entry/ui/delete-journal-entry-button/` — inline-confirm delete button. Calls `deleteJournalEntryFn`; on success navigates to `/journal`.
  - `widgets/journal-entry-page/` — composes the entry display + Edit `<Link>` + the delete feature button (mutation lives in the feature, not the widget). Mirrors canonical's `JournalEntryDetail` page layout against the tanstack simplified journal model.

### UX changes (what differs from the Slice 16 dialog behavior)

- The `/journal` timeline now **navigates to pages**: "Compose entry" is a `<Link to="/journal/new">`; clicking a card navigates to `/journal/$id`. `widgets/journal-timeline-page` no longer holds any dialog state, and no longer imports the compose / detail / edit / delete dialog widgets.
- The **game-detail quick-compose surface stays a dialog** (`widgets/game-detail` still mounts `ComposeJournalEntryDialog` for signed-in viewers). Same for `widgets/library-item-card` and `widgets/dashboard-quick-log-hero`. These are separate quick-add surfaces, not the dedicated journal flow — canonical keeps them as dialogs/popovers too. The dialog components were therefore NOT deleted (verified consumers via grep before touching them).

### Intentional carry-overs from the Slice 16 simplification

- **No game picker / kind selector on the new-entry page.** Canonical's `NewJournalEntryPage` renders an `InlineGameSelector`; the tanstack journal model dropped the picker in Slice 16 (`kind` hard-coded `QUICK`, association via `defaultGameId`). The page keeps that simplification — the `?gameId=` query param is the only association surface. Not a regression introduced here; it predates this slice.
- **Detail page renders the tanstack journal shape, not canonical's.** Canonical's detail page surfaces `mood`, `playedMinutes`, and a derived title; those fields are not in the tanstack journal model (Slice 16 simplification). The page renders content + kind + game + date, matching the rest of the tanstack journal surfaces.

### Tests added

- Integration: `journal-entry-by-id.integration.test.ts` (3 — ownership invariant).
- Component: `compose-journal-entry-form.test.tsx` (5), `edit-journal-entry-form.test.tsx` (3), `delete-journal-entry-button.test.tsx` (3), `journal-entry-page.test.tsx` (4), and three route tests `-journal.new.test.tsx` (3), `-journal.$id.test.tsx` (5), `-journal.$id.edit.test.tsx` (3). `journal-timeline-page.test.tsx` rewritten to assert navigation (2).

## Slice 18A — Visual-parity Phase 1 (Profile)

Phase 1 of the visual-parity push lifted `/profile` to the canonical
redirect model and restyled the `widgets/profile-overview` widget. Source:
`context/audits/2026-05-18/visual-parity.md` (Profile section) and
phase-handoff guidance. Future phases (2 = game-detail, 3 = library,
4 = mobile) build on this.

- **`/profile` is now a server-side redirect to `/u/$username`.** Mirrors
  canonical (`savepoint-app/app/(protected)/profile/page.tsx` redirects via
  the same model). Implemented in `beforeLoad` of `_authed/profile.tsx`:
  calls `getProfilePageDataFn()` to resolve the signed-in user's username,
  then `throw redirect({ to: "/u/$username", params, search })`. Search
  params are preserved so `/profile?edit=true` survives the bounce. If the
  signed-in user has no username yet (newly-onboarded account), the
  redirect goes to `/profile/setup` so they can finish setup (repointed from
  `/settings/profile` in Slice 23 / blocker remediation #2 — see the
  `/profile/setup` entry under Flow 2 above). The
  previous own-profile UI on `_authed/profile.tsx` (avatar upload +
  ProfileOverview render) was removed — that surface now lives at
  `/u/$username` for the owner with `isOwnProfile=true`.
- **`/u/$username` (public profile route) gained owner-aware affordances.**
  Loader fetches `getPublicProfilePageDataFn` AND `getCurrentUserFn` in
  parallel; the resulting `viewerId` is compared to `profile.id` to derive
  `isOwnProfile`, which is forwarded to `ProfileOverview`. The route is
  intentionally NOT under `_authed/` — `/u/$username` must remain reachable
  to anonymous viewers (privacy enforcement lives inside `getPublicProfile`
  per the privacy-invariant rule).
- **`widgets/profile-overview` restyled for canonical parity.** New
  internal sub-tree under `widgets/profile-overview/lib/`:
  - `derive-banner-gradient.ts` — port of canonical's
    `savepoint-app/features/profile/lib/derive-banner-gradient.ts`.
    Co-located with the widget because it is the only consumer; lift to
    `entities/user/lib/` if a second consumer appears. Co-located unit test
    covers determinism, distinctness, and shape.
  - `format-relative-time.ts` — minimal `Intl.RelativeTimeFormat` wrapper
    used by the new "Recently Played" overlay. Avoids pulling `date-fns`
    for a single consumer (consistent with Slice 15's intentional
    no-date-fns stance). Falls back to absolute short-date past 60 days.
    Visual changes:
  - Gradient hero banner (120px tall, `deriveBannerGradient(username)`)
    with avatar (140px) overlapping the bottom-left.
  - Identity block: large serif display name, `@username`, stubbed
    `0 Followers · 1 Following` row (real counts deferred — see follow-up).
  - Top-right `Edit Profile` button (capital P, Link to `/settings/profile`),
    visible only when `isOwnProfile=true`.
  - Radix Tabs (`Overview` / `Library` / `Activity`). Overview is the
    default. `Library` and `Activity` ship empty-state placeholders
    (`profile-library-empty` / `profile-activity-empty` testids) with
    inline `TODO(slice-18):` markers — Slice 18 data wiring will replace
    them.
  - Stat cards: 4 cards with lucide icons (`BookOpen` / `Gamepad2` /
    `Trophy` / `Notebook`) above the number. Replaces the icon-less
    `entities/profile/ui/profile-stats-bar` rendering used in
    `OverviewTab`. The entity component is untouched in case other surfaces
    rely on it; if no other surfaces emerge, fold it into the widget in a
    follow-up.
  - Recently Played: smaller covers with title + relative-time overlaid on
    a gradient mask at the bottom, replacing the existing `LibraryGrid`
    layout for this section. Cards `<Link>` to `/games/$slug` per item.
- **Stubbed follower / following counts (`0` / `0`).** Real social
  counts depend on Slice 18 (social entity / queries). Tagged inline with
  `TODO(slice-18-social):` so they're discoverable when Slice 18 lands. Do
  not treat the stub as a Phase 2 finding.
- **Tests added.** `profile-overview.test.tsx` extended from 3 to 9 tests
  (Edit Profile visibility owner-vs-viewer, hero gradient style, tab
  state transitions covering Overview / Library / Activity, stat-card
  count). New route tests: `routes/-_authed-profile.test.tsx` (3 tests —
  username redirect, search-param preservation, no-username branch) and
  `routes/-u.$username.test.tsx` (5 tests — anonymous viewer, owner viewer,
  NotFoundError → notFound surface, component owner branch, component
  anonymous branch). Plus 4 helper-fn tests under
  `widgets/profile-overview/lib/`. Net: +18 unit tests in this phase.
- **Out of scope (handed off downstream).**
  - Status pill switcher / inline rating widget on game-detail — Phase 2.
  - Mobile responsive shell — Phase 4.
  - Replacing the stubbed social counts — Slice 18 (real follower data
    layer).
  - Replacing the empty-state Library / Activity tabs with real lists —
    Slice 18 (sub-route data layers).

## Slice 18A — Visual-parity Phase 2 (Game Detail)

Implements the `/games/$slug` parity findings from
`context/audits/2026-05-18/visual-parity.md` § "Game Detail". Phase scope:
breadcrumb + hero + inline status switcher + tab realignment + Overview body
restyle. Mobile shell stays Phase 4; library deltas stay Phase 3.

### Status-taxonomy mapping (recorded for posterity)

Both apps share the same Prisma enum `LibraryItemStatus` with exactly five
values, and both apps already render the same labels. No remapping needed
for Phase 2.

| Prisma enum value | Pill label (both apps) |
| ----------------- | ---------------------- |
| `UP_NEXT`         | Up Next                |
| `PLAYING`         | Playing                |
| `SHELF`           | Shelf                  |
| `PLAYED`          | Played                 |
| `WISHLIST`        | Wishlist               |

The label resolver was already in place at
`entities/library-item/model/status.ts` (`STATUS_ENTRIES`,
`LIBRARY_STATUS_LABELS`, `getStatusLabel`). The Phase 2 brief flagged an
expected enum mismatch (`BACKLOG / IN_PROGRESS / COMPLETED / ABANDONED /
FULL_COMPLETION`) that does not exist in either schema today — likely a
reference to a long-deprecated taxonomy. No new file created.

### Full replacement of the `Manage in library` button

The old `ManageFromGameDetailButton` rendering is **gone** from the
game-detail hero; the new `widgets/game-detail/ui/library-status-switcher/`
fully replaces it (per Phase 2 user-confirmed decision). The
`ManageFromGameDetailButton` feature component itself is preserved in
`features/manage-library-entry/` because it has its own colocated test and
public-API export, and could conceivably be reused elsewhere; we removed
only its consumer in the game-detail widget. Tracking deletion as a
follow-up if no other consumer materializes by Slice 18B.

### Widget composes two features (intentional)

`LibraryStatusSwitcher` lives under `widgets/game-detail/ui/` (not under
any feature) because it composes server fns from BOTH
`features/add-game/api/add-game-to-library-fn` and
`features/manage-library-entry/api/{update,delete}-library-item-fn`. FSD
forbids feature-to-feature imports; widgets are the rightful layer for
multi-feature composition. This is a structural choice, not a divergence
from canonical (canonical Next.js doesn't have the same FSD layer at
`widgets/`, so the canonical equivalent lives in
`features/game-detail/ui/library-status-segmented`).

### Tab strip — Tabs primitive

Switched from a plain `<nav>` + `<ul>` "tabs" markup to the ported
`@/shared/ui/tabs` (Radix `@radix-ui/react-tabs`). The previous markup was
visual-only (anchor links to `#hash` anchors — no `role="tab"`, no keyboard
roving tabindex). Tabs are now real ARIA tabs with content-swapping. Three
tabs visible: `Overview` (always), `Journal {count}` (signed-in viewers),
`Playtime` (when times-to-beat slot is supplied). "Related games" content
folds into Overview (canonical pattern); "Times to beat" content moves
under Playtime.

### Data gaps — closed by Slice 17B (canonical dual-track shape)

**Closed:** `description` (summary), `genres`, `platforms`, `developer`,
`aggregated_rating`, and `screenshots` are now ALL available to the
widget — not by persisting them, but by mirroring canonical's dual-track
pattern (`savepoint-app/features/game-detail/use-cases/get-game-details.ts`):

1. **Live IGDB payload to widget.** The orchestrator
   `entities/game/api/get-game-details.server.ts` returns
   `{ game, igdbDetails, libraryEntry, journalTeaser, relatedGames }`.
   `igdbDetails: GameDetailsResponseItem` carries the rich live payload
   (summary, genres, platforms, screenshots, themes, involved_companies,
   aggregated_rating, franchise). The widget reads display data from
   `igdbDetails` on every render.
2. **Thin Game row for cross-feature anchoring.** The Prisma `Game` row
   stays as it was (title/slug/cover/releaseDate). `upsertThinGameFromIgdbDetailsPayload`
   only writes those four fields. Description, genres, platforms,
   screenshots, etc. are NEVER persisted from the detail page.
3. **Caching at the route loader.** Canonical uses Next 16's `"use cache"`
   on the use-case wrapper; the tanstack equivalent is the TanStack Start
   route loader cache + the `cache()` wrapper at the route level. The
   entity does NOT cache — every `getGameDetails` call hits IGDB.

**Surfaces now live (no longer placeholders):**

- Eyebrow row renders `<year> · <developer> · <genre1, genre2>` —
  uppercased, dot-separated, mirroring canonical.
- `// GENRES` and `// PLATFORMS` rows render `" · "`-joined name lists
  (em-dash fallback when IGDB returns no data).
- Summary `<p>` renders when `igdbDetails.summary` is set.

**Still gapped (visual-only):**

- Hero background image. `igdbDetails.screenshots[0]?.image_id` is now
  available; the widget just doesn't render it as a `<img>` yet. Drop-in
  whenever the design surfaces the banner.
- Aggregated rating badge. `igdbDetails.aggregated_rating` available.

Neither needs DAL work — both are widget renders blocked only on design.

### Removed duplicated platform tag

The previous tanstack hero rendered both a `PLAYING` status badge AND a
`Nintendo Switch 2` platform tag (via `LibraryStatusStrip`). Canonical
surfaces platform deeper inside the LibraryModal, not in the hero. The
`LibraryStatusStrip` rendering in the hero is dropped; platform context
lives in the "Edit details…" modal (overflow menu).

### Tests

- `game-detail.test.tsx` rewritten: 7 → 19 tests covering breadcrumb
  structure (Library / Games / title), inline status switcher visibility
  by viewer state, all 5 pills, default-active pill matching entry status,
  overflow menu trigger visibility, terminal-style labels in Overview,
  IGDB summary paragraph, tab visibility for journal & playtime.
- New `library-status-switcher.test.tsx`: 11 tests covering pill rendering,
  active state, add-flow (no entry → `addGameToLibraryFn` with chosen
  status), update-flow (existing entry → `updateLibraryItemFn`), optimistic
  pill flip, delete via overflow menu (`deleteLibraryItemFn`).

### Out of scope (handed off downstream)

- Hero screenshot background, developer/genres/platforms data — requires
  DAL extension (Slice 18B candidate).
- Mobile responsive shell — Phase 4.
- Optional decorative right-aligned title watermark — skipped, low value.

## Slice 18A — Visual-parity Phase 3 (Library)

Phase 3 of the visual-parity push restyled `/library` to canonical at
desktop 1440×900. Mobile sweep stays Phase 4. Audit reference:
`context/audits/2026-05-18/visual-parity.md` § Library.

### Card body (`widgets/library-item-card/`)

- Restored the canonical meta footer beneath the cover: platform badge
  (when set), status-driven contextual date string, read-only 5-star
  rating widget, contextual primary CTA. Pulled status→CTA mapping and
  the `getContextualDate` helper into a local `library-item-card.utility.ts`
  — same shapes as canonical (`savepoint-app/features/library/lib/library-card-cta-payload.ts`
  and `library-card-metadata.tsx`) but kept widget-local; no shared/lib
  bleed.
- CTA siblings the cover `<Link>` (not a descendant). Same structural
  invariant as `LibraryCardMenu` — bubble path to the navigation link is
  physically impossible regardless of Radix event composition.
- `PLAYING` CTA opens `ComposeJournalEntryDialog` (already-ported feature)
  with `defaultGameId` pre-selected; other statuses dispatch
  `updateLibraryItemFn` and call `router.invalidate()` on success.

### Entity-layer status badge (`entities/library-item/ui/library-status-badge/`)

- Switched from the shared `Badge` primitive's status-colored uppercase
  tag to canonical's glassy black rounded pill with a colored leading dot
  (token-driven via `--status-<variant>`). The Badge variant table still
  carries the legacy status variants — left in place; no other consumer
  uses them today but no need to delete in this slice.

### Status filter palette (`features/filter-library/`)

- Collapsed the per-status active/inactive `STATUS_FILTER_STYLES` palette
  to a single two-tone shape: idle = `text-muted-foreground` transparent,
  active = `bg-primary text-primary-foreground`. Matches canonical's
  quieter rail. Per-status records kept (5 entries pointing to the same
  shared shape) so a future spec can re-introduce per-status decoration
  without rewriting consumers.

### Page chrome (`widgets/library-page/`)

- Dropped the inline `3 games` count chip from the header. `total` prop
  is kept on `LibraryPageProps` (unused locally — declared `void` to
  preserve the type contract); the count surface migrates to the rail.
- Added a client-side filter-by-title `<Input>` above the grid, with a
  `/` keyboard hint that focuses the input from anywhere outside another
  text field. Filtering is purely client-side over the loader-supplied
  `items` array — no server roundtrip.
- Compute per-status counts client-side from `items` (a `getStatusCounts`
  server fn was not ported; canonical's rail does compute server-side).
  Counts are passed through to `LibraryFilters.counts` and `LibraryFilters`
  renders the right-aligned count for every row including All.
- Replaced the top-right `Add game` button with a bottom-right floating
  action button — implemented as `variant="fab"` on `AddGameTrigger`
  (Pencil icon, `rounded-full` `size-14`, `aria-label="Add game"`).
  Single feature carries both variants; library is the only consumer.

### App-shell footer (`widgets/app-sidebar/`)

- Avatar slot in the user-menu trigger now uses `<Avatar>` +
  `<AvatarFallback>` from `shared/ui/avatar` (Radix primitive). First
  character of the safe display name renders as the initial-avatar; the
  stock `/default-avatar.png` reference is gone. Image still renders via
  `<AvatarImage>` when `user.image` is set.

### Tests

- `library-item-card.test.tsx`: +8 tests (meta-footer, contextual date,
  rating widget role, CTA labels for all 5 statuses, status-pill shape).
- `library-page.test.tsx`: +5 tests (filter input present, count chip
  absent, FAB classes, per-status count rendering, client-side title
  filter behavior).
- `library-status-badge.test.tsx`: revised the status-themed CSS-var
  assertion to target the new leading-dot element rather than the
  wrapper background.
- `app-sidebar.test.tsx`: +1 test for the initial-avatar fallback.
- `add-game-trigger.test.tsx`: +1 `given variant="fab"` block (circular
  shape + still opens the dialog).
- Pre-existing parse error in `routes/_authed/dashboard.tsx` (literal
  double-quotes inside JSX text) fixed in-scope per feedback policy.

### Out of scope (handed off downstream)

- Mobile responsive shell — Phase 4.
- Server-computed status counts — counts are derived from the loaded
  page; if pagination lands the totals will drift and a `getStatusCounts`
  entity query becomes mandatory.
- Hide / align the bottom-left `Auto` chip — present only in dev
  surfaces, deferred.

## Slice 18A — Visual parity, Phase 4 (mobile responsive sweep, 375x812)

Phase 0+1+2+3 closed desktop parity (1440x900). Phase 4 lands the mobile
chrome and per-widget responsive rules so all four authed routes render
correctly at 375x812.

### New widgets

- `widgets/app-mobile-topbar/` — sticky top bar (`md:hidden`): logo +
  search icon + theme toggle. The search button is wired to the same
  command-palette stub as the desktop sidebar.
- `widgets/app-bottom-nav/` — sticky bottom tab nav (`md:hidden`): three
  destinations (Library / Journal / Profile) with lucide icons and
  `activeProps`-driven highlight.

### Modified widgets / features

- `widgets/app-shell` — gained `mobileTopbar` + `mobileBottomNav` slot
  props (composed by `__root.tsx`). Main column gets `pb-16 md:pb-0` so
  the fixed bottom nav doesn't occlude page content.
- `widgets/app-sidebar` — `hidden md:flex` + `sticky top-0` (was always
  visible at all breakpoints).
- `widgets/library-page` — filter input is `w-full md:max-w-xl`.
- `widgets/library-item-card` — root is `flex-row` at mobile,
  `md:flex-col` at desktop; cover is `w-20` at mobile, native width at
  desktop; meta wrapper uses `md:contents` so meta children remain
  direct flex-children of the root at desktop without DOM restructuring.
- `widgets/game-detail` — hero grid is `grid-cols-1` at mobile,
  `md:[grid-template-columns:minmax(140px,200px)_1fr]` at desktop.
  Cover constrained to `w-32` at mobile. Title gains `break-words` for
  long-title safety at 375px.
- `widgets/profile-overview` — banner is `h-20 sm:h-[120px]` (was fixed
  120px). Avatar is `h-20 w-20 sm:h-[140px] sm:w-[140px]` (was always
  ≥112px). Sub-tabs list gains `overflow-x-auto` for narrow viewports.
- `features/add-game/add-game-trigger` — FAB position is
  `bottom-20 right-4 md:bottom-6 md:right-6` so it clears the new
  mobile bottom nav.

### Tests added

- `app-mobile-topbar.test.tsx` (new) — 4 tests: brand link, search
  trigger, theme toggle, `md:hidden` invariant.
- `app-bottom-nav.test.tsx` (new) — 6 tests: link count, each href,
  `md:hidden`, active-page highlight.
- `library-item-card.test.tsx` +1 test: `flex-row` at mobile +
  `md:flex-col` at desktop.

### Carried forward (unresolved)

- `MobileFilterBar` visibility breakpoint is still `xl:hidden`, not
  `md:hidden`. Intentional — keeps the mobile filter sheet available
  on tablets too. The sidebar fully takes over at `xl+`. If a follow-up
  decides to surface the filter sidebar at `md+` we tighten this.

## Slice 17 — Command palette

The tanstack `features/command-palette` ports the canonical palette
(`savepoint-app/features/command-palette/`). A follow-on parity pass
(post-Slice 17, ahead of Slice 18A) closed the navigation/quick-actions/
game-result-item gaps and migrated the palette onto the shadcn `cmdk`
primitives. The remaining gaps are feature dependencies, not surface
gaps in the ported component:

1. **No quick-add flow.** Canonical's `useQuickAddFromPalette` calls
   `addToLibraryAction` with an optimistic undo toast. The tanstack
   port doesn't yet have an `add-to-library` server fn or the toast
   integration, so Games-group rows always navigate to `/games/$slug`
   via `<Link>`. Wire when `manage-library-entry` is ported.

2. **No recent-games empty state.** Canonical loads recent library
   games on open via `getRecentGamesAction`. Tanstack lacks the
   equivalent entity query (no `distinctByGame` on `library-item`). The
   empty palette shows "Start typing to search for games...". Wire when
   the entity adds a recent-by-last-touched query.

3. **No mobile-sheet variant.** Canonical's `command-palette.tsx`
   selects between `DesktopCommandPalette` and `MobileCommandPalette`
   by viewport. Tanstack renders the desktop `Dialog` shape at every
   breakpoint. The Spec 021 Slice 18A visual-parity sweep owns the
   mobile bottom-sheet variant.

### Parity pass — what landed

- **`shared/ui/command.tsx`** — full shadcn `cmdk` wrapper set
  (`Command`, `CommandInput`, `CommandList`, `CommandGroup`,
  `CommandItem`, `CommandEmpty`, `CommandSeparator`, `CommandDialog`,
  `CommandShortcut`). `cmdk` pinned at `1.1.1` to match canonical.
- **`ui/game-result-item/`** — cover (`buildCoverImageUrl(id,
"t_cover_small")`) + name + release year, wrapped in
  `<Link to="/games/$slug">`. Canonical's `showAddHint`/`+ Add to Up
Next` badge is omitted until quick-add lands.
- **`ui/palette-navigation-group/`** — 5 jump targets. Settings points
  at `/settings/profile` because tanstack has no `/settings` index
  route registered today; swap when the settings shell lands.
- **`ui/palette-quick-actions-group/`** — "Add game to library" (calls
  `onFocusSearch` to refocus the palette input) + "New journal entry"
  (navigates to `/journal`; canonical goes to `/journal/new` which
  tanstack doesn't have — minor divergence).
- **`ui/command-palette/`** — refactored to compose the primitives
  with `shouldFilter={false}` (server-side filtering preserved). The
  combobox accessible name comes from `<Command label="Search games">`
  via cmdk's `aria-labelledby` wiring (cmdk always emits
  `aria-labelledby` on its input, so a plain `aria-label` on the input
  would be overridden).

### Wiring

- Mounted once in `__root.tsx` `RootShell` (only when `user` is
  resolved), so the palette is available across both authed and any
  future public chrome.
- `useCommandPalette` hook owns the open state, the global ⌘K / Ctrl+K
  listener (matching canonical's `metaKey || ctrlKey` + `preventDefault`
  - toggle), and a custom-event channel
    (`savepoint:command-palette:open`) that the desktop sidebar and
    mobile topbar search-trigger buttons fire via `openCommandPalette()`.
    Event-channel chosen over context provider so widgets don't depend on
    a feature's runtime — keeps the FSD direction clean.
- Debounce is imperative (timer in `useRef`, fetch fires directly
  inside the timer callback) rather than `useDebouncedValue` →
  effect-driven. Reason: the test contract asserts `searchGamesFn`
  called synchronously after `vi.advanceTimersByTime(300)`. Going
  through React state would require the assertion to `await` a render
  cycle; the imperative shape keeps the test deterministic without
  affecting production behaviour.
- The unit test setup at `test/setup/unit.ts` now calls
  `vi.useFakeTimers()` in `beforeEach` (with `vi.useRealTimers()` in
  `afterEach`) so the `fakeTimers` config in `vitest.config.ts` is
  actually active. `shouldAdvanceTime: true` keeps unrelated tests
  behaving like real-time. Previously the config was inert because no
  test entry-point called `useFakeTimers()`.

### Tests added

- `command-palette.test.tsx` (Slice 17 RED file) — 8 tests passing:
  initial-closed state, ⌘K opens, Ctrl+K opens, debounce window
  blocks during keystrokes, exactly-one call after 300ms, call shape,
  result row href contains slug, full `/games/$slug` path. The test
  contract survived the parity-pass refactor unchanged — no test edit
  required. Accessible-name discovery in the refactored composition
  works via `<Command label="Search games">`.

### Tests added (parity pass)

- `game-result-item.test.tsx` — anchor href, cover URL/size, release
  year render, no-cover branch.
- `palette-navigation-group.test.tsx` — all five items, substring
  filter, no-match returns `null`.
- `palette-quick-actions-group.test.tsx` — both items render,
  focus-search and new-journal-entry callbacks fire, substring filter,
  no-match returns `null`.

## Slice 18 — Shared UI primitive backfill (audit 2026-05-19)

### Deliberate skips

Four canonical primitives were audited and intentionally NOT ported in
Slice 18:

- `sidebar` — tanstack uses a hand-rolled `widgets/app-sidebar/` that
  replaces the canonical sidebar composition wholesale. The canonical
  primitive's surface (collapsible rail, mobile sheet, inset variants)
  isn't a dependency of any tanstack consumer.
- `segmented-control` — tanstack composes radix `Tabs` plus a
  hand-rolled `LibraryStatusSwitcher`. No tanstack consumer asks for
  the canonical primitive's API.
- `textarea` — tanstack journal dialogs use the native `<textarea>`
  element with utility classes. It renders correctly and no consumer
  has demanded a styled primitive; deferred until a styling consumer
  appears.
- `progress-ring` — the only canonical consumer is `loading-screen.tsx`,
  which itself has not been ported. Deferring both as a pair so the
  primitive lands together with its consumer.

### Micro-divergences in the 7 ported primitives

- **All 7 primitives** — `"use client"` directive omitted. The directive
  is Next-specific; TanStack Start has no RSC boundary. Sibling
  primitives (`button.tsx`, `popover.tsx`, …) already follow this
  convention.

- **`alert`** — exposes an `error` variant alongside the canonical
  `destructive` variant to satisfy test/spec naming. Both names map
  to the same CVA classes. The `error` variant carries an extra
  non-styling marker class `alert-error` so `className` substring
  assertions resolve without forcing a Tailwind theme token rename.

- **`empty-state`** — `action.href` renamed to `action.to` to match
  TanStack Router's typed `Link` API. Additive props `action.search`
  (typed search params) and `action.size` (button size) added to
  cover the dashboard-game-section CTA. Visible API otherwise matches
  canonical (title/description/icon/spacing/maxWidth).

- **`scroll-area`** — four intentional shape differences from canonical
  / Radix v1.2.10:
  1. `<ScrollBar>` is not auto-rendered inside `<ScrollArea>`; callers
     compose it explicitly. Auto-render produced "multiple elements
     with role scrollbar" failures in jsdom and aligns with newer
     shadcn composition.
  2. Default `type="always"` on the Root. Radix default `"hover"`
     depends on `ResizeObserver`, which jsdom does not implement,
     making the primitive effectively untestable otherwise.
  3. `role="scrollbar"` + `aria-orientation` added explicitly on
     `ScrollBar`. Radix v1.2.10 ships plain divs with no a11y role
     / aria attributes; explicit attributes are required for
     `getByRole("scrollbar")` and screen-reader access.
  4. Override applied via prop spread before `{...props}` so caller
     props still win.

- **`separator`** — explicit `aria-orientation={orientation}` set when
  `decorative={false}` for both orientations. Radix omits the
  attribute on `"horizontal"` (ARIA default for `role="separator"`)
  but the parity tests assert presence both ways. The tested
  behaviour is "see the orientation explicitly," not the Radix
  default.

- **`undo-toast`** — `setTimeout` fires at exactly `durationMs`, so the
  Undo button is still mounted at `durationMs - 1` ms and `expired`
  flips at `durationMs`. Matches the canonical boundary behaviour at
  4999 ms. The module exports a **dual surface**: `UndoToastBody` (the
  styled body component, used directly when a caller wants full control
  of mount/unmount and timer semantics) and `showUndoToast` (the
  imperative helper that wraps Sonner's native `action:` option — its
  Undo button is Sonner's default-styled action, not the styled
  `UndoToastBody`). Parity with canonical, which has the same split.
  Callers wanting the styled body must use `UndoToastBody`.

- **`empty-state.icon`** — typed as `LucideIcon | ReactNode`, but the
  render branches only on the LucideIcon shape (`typeof icon ===
"function"`); a raw `ReactNode` (e.g. an `<img>`) is currently
  rendered as `null` inside an `aria-hidden` wrapper. Parity with
  canonical, which has the identical narrowing. Documented here so a
  future consumer who passes a raw element knows to either wrap it in
  a LucideIcon-shaped functional component or extend the primitive's
  render branch.

## Slice 19 — Hand-rolled theme provider

Spec 021 defaulted the theme provider to `next-themes@0.4.6` (matching the
canonical Next.js app). For the TanStack Start shell we **went hand-roll
instead** — a ~80 LOC, zero-dep `SavepointThemeProvider` lives at
[`src/app/providers/theme-provider/`](./src/app/providers/theme-provider/).

**Rationale.** `RootDocument` in [`src/routes/__root.tsx`](./src/routes/__root.tsx)
already runs an inline pre-hydration script (`THEME_INIT_SCRIPT`) inside
`<head>` to prevent FOUC. `next-themes` injects its **own** FOUC-prevention
script via `dangerouslySetInnerHTML` from inside the React tree (under
`<body>`), which runs **after** hydration and races with the `RootDocument`
script — they fight over `<html>.className` and `data-theme`. In Next.js the
equivalent surface is `<Script strategy="beforeInteractive">`, which Next
places in `<head>`; TanStack Start has no such primitive, so the
inline-in-`<head>` pattern is the only way to land the class before paint.

**What the hand-roll does.**

- Holds `theme: "light" | "dark" | "cartridge" | "aurora" | "system"` plus a
  resolved variant (`"system"` → `"light"`/`"dark"` via `matchMedia`).
- Persists to `localStorage` under the **same key `next-themes` uses by
  default — `"theme"`** — so user preferences interop across `savepoint-app/`
  and `savepoint-tanstack/` during the parallel-run window before S20 cutover.
- On `setTheme`, imperatively updates `document.documentElement` (swaps
  class, sets `data-theme`, sets `colorScheme`) mirroring the inline
  pre-hydration script in `__root.tsx` exactly.
- While the user is on `"system"`, listens to
  `matchMedia("(prefers-color-scheme: dark)").addEventListener("change", …)`
  so the OS preference flows through without a reload.
- Mounted in `RootShell` (NOT in `RootDocument` — only the inline `<script>`
  belongs there per the architect note).
- `<html suppressHydrationWarning>` already in `RootDocument` covers the
  pre-hydration-script-vs-React-tree class mismatch.

**Theme value === CSS class name.** Picker exposes 5 user-selectable themes
(`light` / `dark` / `cartridge` / `aurora` / `system`), each mapping to the
same-named CSS class (`light` applies no class; `system` resolves to
`light`/`dark`). This matches canonical: `savepoint-app/shared/providers/providers.tsx`
passes `themes={["light","dark","cartridge","aurora","system"]}` to
`next-themes` with **no `value` prop**, so `setTheme("cartridge")` applies
the literal `.cartridge` class — defined at `savepoint-app/shared/globals.css:444`.
Mapping is enforced in
[`theme-provider.utility.ts`](./src/app/providers/theme-provider/theme-provider.utility.ts)
(`THEME_CLASS_MAP`) and the extended inline `THEME_INIT_SCRIPT`.

`globals.css` / `src/styles.css` also define `.y2k` and `.jewel` blocks;
these are **orphan variants** — present in CSS, not reachable from any
user-facing surface. Treat as dead until a code path adds them back. The
prior Slice 19 entry incorrectly claimed `cartridge ↔ .y2k` was a
"load-bearing indirection"; that was a stale spec line — corrected here.
The `@custom-variant` declarations in [`src/styles.css`](./src/styles.css)
still key on `.y2k`/`.jewel`, so no CSS changes were needed.

**Pre-hydration script extended.** `THEME_INIT_SCRIPT` previously handled
only `light` / `dark` / `auto`; it now handles all five spec themes
(`light`, `dark`, `cartridge`, `aurora`, `system`) and uses the same
`classMap` shape as the React-side provider so a divergence in mapping is a
single-place edit.

**Arrow-key navigation (improvement over canonical).** Canonical's picker is
a hand-rolled `<div role="menu">` with `<button role="menuitem">` children
and no roving-tabindex — arrow keys do not move focus between options.
Tanstack swaps to Radix `<DropdownMenu>`, which provides arrow-key nav,
Enter/Space activation, Escape close, and click-outside dismissal natively.
Deliberate improvement, not a parity bug.

**No new dependencies.** Zero-dep — `next-themes` was never installed in
`savepoint-tanstack`. The canonical app's `package.json` still depends on it.
`@radix-ui/react-dropdown-menu` was already in the tanstack shadcn/ui set.

## Slice 20 — what's-new modal

Three deliberate simplifications versus
`savepoint-app/features/whats-new/`:

**Single-version dismiss model.** Canonical stores a JSON list of
seen announcement IDs under `savepoint:seen-announcements` and dismisses
one entry at a time. Tanstack instead stores a single string
`CURRENT_VERSION` under `whatsNewLastSeenVersion`. The modal opens iff
the stored value differs from the constant in `config.ts`. Bumping
`CURRENT_VERSION` re-shows the modal to every user once — coarser than
per-announcement granularity, but adequate for the release cadence and
keeps the dismiss contract (one button → one write → close) trivially
testable. Storage key value is locked at `"whatsNewLastSeenVersion"`.

**No multi-step pagination.** Canonical paginates announcements with
Next / Dismiss-all buttons. Tanstack renders the full active list in a
single dialog with one "Got it" dismiss button. The first announcement
keeps the canonical hero treatment (icon + title + description + CTA);
additional announcements render as compact list rows below.

**No 1-second open delay.** Canonical's `useWhatsNew` installs a
`setTimeout(..., 1000)` before flipping `isOpen` to true. Tanstack flips
synchronously inside `useEffect` on mount. This keeps the component
test (`whats-new-modal.test.tsx`) free of timer choreography and matches
the test contract authored in the RED step (`drainTimers()` becomes a
no-op but stays present for forward compatibility if a delay is added
later).

**Mount point.** `RootShell` in
[`__root.tsx`](./src/routes/__root.tsx) renders `<WhatsNewModal />`
next to `<CommandPalette />`, both gated on `user` truthiness so the
modal never appears for anonymous visitors.

**No new dependencies.** All primitives (`Dialog`, `Button`, `Badge`)
shipped in Slice 18.

## Slice 20 — onboarding-first-time

First-time `/library` onboarding port. Three deliberate simplifications
versus `savepoint-app/features/onboarding/`:

**Collapsed `onboarding-step.tsx` inline.** Canonical splits a per-step
row into its own component for a single callsite
(`getting-started-checklist.tsx`). Tanstack's
[`features/onboarding-first-time/ui/onboarding-checklist/onboarding-checklist.tsx`](./src/features/onboarding-first-time/ui/onboarding-checklist/onboarding-checklist.tsx)
renders the 4 rows inline. No abstraction value at one consumer; lifting
it back out is a 10-line edit if a second callsite appears.

**Client-only progress signal, no DAL `OnboardingService`.** Canonical
computes step completion server-side via
`data-access-layer/services/onboarding/onboarding-service.ts` and ships
an `OnboardingProgress` view-model. Tanstack derives step state directly
from 4 prop primitives (`libraryItemCount`, `journalEntryCount`,
`userImage`, `userSteamId`) plus two localStorage flags
(`onboardingSteamDismissed`, `onboardingComplete`). Rationale: the spec
021 DAL is the C2 two-layer pattern (no service classes), and the
onboarding "service" was a thin orchestrator that only counted rows.
Folding the counts into the existing library loader is cheaper than
porting the service shell.

**`/library`-only surface, dropped the dashboard CTAs.** Canonical's
`empty-library-hero` carries Steam-import and game-search CTAs and a
`variant="library" | "dashboard"` axis for use on both pages. Tanstack's
[`empty-library-hero`](./src/features/onboarding-first-time/ui/empty-library-hero/empty-library-hero.tsx)
ships the library variant only and drops the CTA buttons — the
library-page widget already renders an `AddGameTrigger` FAB at the
bottom-right which covers the "add a game" affordance. Steam-import +
game-search CTAs return when those routes land in a later slice.

**Loader extended, no new server fn.** Per the strict feature-server-fn
rule, the existing `getLibraryPageDataFn` was extended to also fetch the
3 onboarding signals via a new entity query at
[`entities/profile/api/get-onboarding-signals.server.ts`](./src/entities/profile/api/get-onboarding-signals.server.ts).
Result shape changed from `GetLibraryResult` to
`GetLibraryResult & { onboarding: OnboardingSignals }`. One DB roundtrip
(`Promise.all([getLibrary, getOnboardingSignals])`) covers both reads.

**Hero falls back to generic `EmptyState` for filtered-empty.** The
hero only mounts when `items.length === 0` (the whole library is empty,
not just the current filter). Filtered empty still shows the Slice 18
`EmptyState` so users see "No games match this filter" rather than the
onboarding pitch.

**SSR-safe localStorage reads.** Both `onboardingSteamDismissed` and
`onboardingComplete` are guarded behind `typeof window === "undefined"`;
the initial server render derives step state from props only, and the
first client effect re-reads localStorage to flip step 4 + the all-done
short-circuit.

**No `dismissOnboarding` server action.** Canonical persists a global
dismiss flag server-side via `dismissOnboarding`. Tanstack's checklist
hides itself via the client-side `onboardingComplete` flag (set
automatically when all 4 steps are done). A "I'll do it later" Steam
dismiss button — and any explicit dismiss UI — is out of scope for this
sub-task; the RED contract does not test it. Known-gap: add when
Steam-import lands in a later slice.

## Slice 21 Phase B — Steam connect/disconnect

**OpenID flow only — no manual Steam-ID input.** Canonical's
`SteamConnectCard` offers two parallel paths: the OpenID "Sign in with
Steam" button AND a manual `<Input>` for entering a Steam ID / profile
URL (via `react-hook-form` + `connectSteamSchema`). Tanstack ships the
OpenID path only — the manual form, vanity-URL resolution, and the
`Dialog`-based disconnect confirmation are deferred to a later phase if
ever ported (the OpenID flow covers ≥95 % of canonical usage).

**No success toast after Steam-connect.** Canonical fires
`toast.success("Steam account connected successfully!")` on the
post-redirect landing via a `?steam=connected` query-param round-trip
consumed by a `useEffect` in `SteamConnectCard`. Tanstack drops the
toast entirely — the visual flip of the card from "Connect Steam" →
"Steam connected" after the loader re-reads `user.steamId64` IS the
perceptible feedback. Rationale: cross-navigation toast plumbing adds
query-param state + a clearing effect for minimal UX gain.

**Static privacy hint via Slice 18 `Alert` primitive.** Connected-state
card mounts an `Alert` with copy "If you don't see games shortly, check
your Steam profile privacy settings." Canonical wires the live
privacy-pending state to the player-summary fetch (`isSteamPrivacyError`
branch); the live round-trip ships with Phase C/D when the import
worker exists.

**No disconnect confirmation dialog.** Canonical opens a `<Dialog>`
explaining that imported games persist; tanstack's "Disconnect" button
fires `disconnectSteamFn` immediately + toasts on resolve. Rationale:
the operation is reversible (re-connect reinstates the Steam ID) and
the imported-games table is not yet ported in tanstack, so the warning
copy has no referent.

**`disconnectSteamFn` takes an empty-object payload (`{ data: {} }`).**
The fn has no semantic input — the authed session is the only signal.
The empty `inputValidator` (`z.object({}).passthrough()`) exists purely
to satisfy the typed call envelope locked by the component test.

**`/steam/callback` is a public route.** Lives at
`src/routes/steam.callback.tsx` (NOT under `_authed/`) because Steam
redirects unauthenticated browsers here too if the session was lost
mid-flow. `connectSteamFn`'s `requireUserId()` throws
`UnauthorizedError`, surfaced inline via the route's `errorComponent`
branching on `AppError.code`.

**`getSteamConnectionFn` reuses `getOnboardingSignals`.** Rather than
add a `steamId64`-only entity query (which would violate the
"no specialized subset queries" rule), the new loader-only server fn
wraps the existing onboarding-signals aggregate and projects the field.
Wrapped in a `createServerFn` (not a direct `.server.ts` loader import)
to dodge foot-gun #2.

## Slice 21 Phase C — Library import worker + entity

**No IGDB matching during import.** The slice spec mentions "matches via
IGDB by name+platform (best-effort)" inside the import worker, but
canonical (`savepoint-app/data-access-layer/handlers/steam-import/
fetch-steam-games.handler.ts`) does NOT call IGDB at import time — every
new row is written with `igdbMatchStatus: PENDING` and matching is
deferred to downstream flows (the import-to-library use-case). Tanstack
mirrors canonical: `importSteamLibraryWorker` performs Steam-fetch +
upsert only, leaving rows in `PENDING`. Rationale: the import surface
becomes batch-safe (no N IGDB rate-limit calls per import); Phase D's
imported-games page is the natural place to surface a manual / on-demand
match action.

**Dismissal = `igdbMatchStatus: IGNORED`, NOT a `dismissed` boolean.**
The schema (`prisma/schema.prisma:185`) does not declare a `dismissed`
column on `ImportedGame`; canonical's `ImportedGameService.
dismissImportedGame` (and our entity-level `dismissImportedGame`) sets
`igdbMatchStatus: "IGNORED"` instead. The separate `IgnoredImportedGames`
table (id, name, userId — `schema.prisma:178`) is a name-based blocklist
("never re-surface a row matching this name"), not a per-row dismissal
join. Phase C leaves `IgnoredImportedGames` untouched; Phase D may
revisit it if the UI surfaces the blocklist.

**`findImportedGamesForUser` excludes `IGNORED` by default.** Default
read filters out dismissed rows + soft-deleted rows
(`deletedAt: { equals: null }`). Pass `{ includeIgnored: true }` for a
"show dismissed" toggle. Matches canonical's
`findImportedGamesByUserId({ matchStatus: ["PENDING", "UNMATCHED"] })`
shape.

**Idempotency via `findFirst` + branch, not `upsert`.** The schema has
no unique constraint on `(userId, storefront, storefrontGameId)` — only
indexes. `upsertImportedGamesBatch` therefore prefetches existing rows
(one `findMany` per batch), splits the payload into creates vs. updates,
and runs the writes inside a single `$transaction`. Slower than a true
upsert but correct given the schema. Existing rows preserve their
`igdbMatchStatus` on update (a user who dismissed a game does NOT see it
resurface after re-import).

**`calculateSmartStatus` is a derive-on-demand utility.** Ported
verbatim from `savepoint-app/features/steam-import/lib/
calculate-smart-status.ts` to
`src/features/steam-import/lib/calculate-smart-status.ts`. The schema
has no `suggestedStatus` column, so the value is computed lazily by
Phase D's UI when surfacing a row, not stored on `ImportedGame`. Pure
function — argument shape is `{ playtime, lastPlayedAt }`, returns
`LibraryItemStatus`.

**Worker-split across all three feature server fns.**
`import-steam-library`, `fetch-steam-games`, and `dismiss-imported-game`
each ship as a `<name>.worker.ts` (server-runtime-free, integration-
testable) + `<name>.ts` (`createServerFn` wrapper). Foot-gun #8.
Integration tests drive the worker directly.

**Steam errors bubble through the worker unchanged.**
`SteamProfilePrivateError`, `SteamApiUnavailableError`,
`SteamRateLimitError`, `SteamProfileNotFoundError` propagate from
`fetchOwnedGames` straight to the route boundary — the worker does not
catch or remap them. Routes branch on `instanceof` in the
`errorComponent` for user-facing copy (Phase D).

## Slice 21 Phase D — Imported-games page UI

**`<ImportPathSelector/>` skipped.** Canonical exposes two surfaces for
linking a Steam profile: an OpenID button and a manual SteamID input.
Phase B locked the OpenID flow as the only path (vanity-URL resolution
deferred). The corresponding `<ImportPathSelector/>` therefore has no
referent in tanstack and is not ported. If a manual SteamID entry is
ever needed, ship `ImportPathSelector` alongside the new surface.

**`<IgdbManualSearch/>` is a stub.** ~~Phase C did not ship an
entity-layer `linkImportedGameToIgdb.server.ts` write, so the manual-
search dialog renders the input + accepts a query, but the "Select"
button fires `console.warn` and closes without persisting. Known gap —
tracked for a follow-up slice.~~
**Closed in the IGDB-linking follow-up (this commit).** Replaced the
stub with a real debounced picker (`searchGamesFn`) and added an
`ImportGameModal` that combines status pick + manual-search fallback.
The "Select" button now fires `importGameToLibraryFn` with `manualIgdbId`
set. The combined action mirrors canonical's
`features/steam-import/use-cases/import-game-to-library.ts` — auto-match
via Steam App ID through IGDB's `external_games` join (new
`shared/api/igdb/match-steam-game.ts`), fall through to manual search
on no-match (`NeedsManualMatchError`, a `ValidationError` subclass
discriminated by `err.name` so it survives RPC serialization).

**Error-component branches on `err.name`, not `instanceof`.** TanStack
Start serializes thrown errors across the server-fn RPC boundary; the
client-side reconstructed value loses prototype chain identity, so
`error instanceof SteamProfilePrivateError` returns `false` in the
`errorComponent`. The 4 Steam error subclasses (Phase A) set a
distinctive `name` string in their constructor, so the route branches
on `err.name` — which survives serialization. Documented at
`routes/_authed/steam/games.tsx`.

**Bulk-add retired in the IGDB-linking follow-up.** Phase D shipped a
bulk select-all + "Add selected to library" CTA that fired
`addGameToLibraryFn(Number(storefrontGameId))` per MATCHED row — but
`storefrontGameId` is the Steam App ID, not the IGDB id (those are
different number-spaces), so the call was making a wrong IGDB lookup.
The IGDB-linking follow-up resolves the right igdbId through the new
`importGameToLibraryFn` (auto-match via `external_games` join, manual
override via `manualIgdbId`). With per-row import going through the
modal, the bulk surface had no correct behaviour to retain on
non-MATCHED rows, so the select-all checkbox + "Add selected to
library" button were removed. Re-adding a batched server fn is the
correct next step (one transaction per N rows), tracked for a
follow-up.

**Dismissal has no confirmation prompt.** Per locked decision 11 — the
operation is reversible via `?include=ignored` + Restore, so a modal
confirmation is unnecessary friction. Canonical also lacks one.

**`/steam/games` discoverability via SteamConnectCard.** Locked
decision 10b: instead of adding a new sidebar entry, the connected
variant of `SteamConnectCard` (`features/steam-connect`) now renders a
"View imported games" link below the Disconnect button. Lighter touch
than a sidebar entry; canonical exposes both — sidebar entry is a
documented divergence skipped here.

**`fetchSteamGamesFn` extended with optional input.** Phase C shipped
the wrapper input-less; Phase D adds an optional
`{ includeIgnored?: boolean }` Zod schema so the route loader can
thread the `?include=ignored` search param through. Backward-compatible
— callers passing no `data` still resolve to `includeIgnored: false`.

**6 error-state cards co-located under `features/steam-import/ui/
error-cards/`.** Named with the `-card` suffix
(`steam-privacy-error-card`, etc.) to mark them as full surfaces, not
inline `<Alert>` instances. The 5th surface is `generic-error-banner`;
the 6th, `import-status-feedback`, is a set of sonner toast helpers
(not a rendered card — canonical names it "ImportStatusToast" for
parity).

## Slice 21 Phase D — Filter / sort / search follow-up

**URL search params, not local `useState`.** Canonical's
`<ImportedGamesContainer/>` uses component-local React state for the
filter / sort / search bar. The tanstack port stores all of it in the
URL via `validateSearch` + `loaderDeps` (mirrors Slice 14A's library
filters). Deep links and browser back/forward stay coherent for free;
the route is the single source of truth.

**In-Prisma filtering (not in-memory).** Phase D-follow-up extends
`findImportedGamesForUser` with the same `playtimeStatus` /
`playtimeRange` / `platform` / `lastPlayed` / `search` / `sortBy`
clauses canonical pushes into Prisma `where` + `orderBy`. The route
loader threads URL search params into `fetchSteamGamesFn` which threads
them into the worker which threads them into the entity query — one
filter implementation, server-side, indexed on `(userId, playtime)`
(see schema). No in-memory pagination either; typical Steam libraries
are <1000 rows and the full filtered list streams back.

**`sortBy=last_played_*` puts NULL `lastPlayedAt` last.** Canonical
relies on Postgres default `NULLS LAST` for `DESC`; the entity query
sets `nulls: "last"` explicitly so `ASC` sorts also put never-played
rows at the bottom, not the top.

**Shipped vs. skipped (canonical parity).** All canonical filters
ship: Sort (7 axes), Playtime Status, Playtime Range, Platform, Last
Played, Search, "Show dismissed" toggle (canonical's "Show already
imported" maps to the existing tanstack `?include=ignored` semantics —
same toggle, different URL shape). Active-filter chip removal ships
too; the chip removes the corresponding URL param via `useNavigate`.
Nothing was skipped — the `ImportedGame` schema already carries
`playtime`, `playtimeWindows`, `playtimeMac`, `playtimeLinux`, and
`lastPlayedAt`, so every canonical filter has a referent.

**No-matches empty state.** When filters are active and the server
returns zero rows, the widget renders an `<EmptyState title="No
matches">` with the filter bar still visible above it (so the user can
refine without re-navigating). The onboarding empty states
("Connect Steam" / "No games imported yet") only render when zero rows
AND no active filters — locked decision 8 in the slice scope.

## Slice 22 — Visual parity (S15–S21 surfaces)

GREEN scope of Slice 22 is the "port" / "drift-fix" rows of the gap matrix
at `context/audits/2026-05-20/visual-parity-delta.md`. That matrix is a
**stale 2026-05-20 snapshot** — by the time Slice 22's GREEN subtask ran,
Slices 15–21 plus Slice 22's own earlier primitive-port subtasks (495–499)
had already discharged the entire "port" / "drift-fix" worklist
incrementally. This section records (a) the per-row validation against the
**current** `src/` tree, so a cutover auditor can confirm the GREEN scope is
closed without re-deriving it, and (b) the matrix's "waive" rows with their
rationale. Per the convention note in `CLAUDE.md` ("Append new slice
divergences [to `DIVERGENCES.md`], not [to CLAUDE.md]"), this lives here, not
under CLAUDE.md "Known gaps". **No code changed in this subtask** — every
port/drift-fix row was already implemented; re-porting would have been churn.

### Discharged "port" / "drift-fix" rows (file:line evidence)

Every row the matrix proposed an action for was found already implemented:

- **`Textarea` primitive** (matrix §3, §2 compose/edit rows) — ported at
  `src/shared/ui/textarea.tsx` (with `textarea.test.tsx`). Both journal
  dialogs consume it: `features/compose-journal-entry/ui/compose-journal-entry-dialog/compose-journal-entry-dialog.tsx:15,79`
  and `features/edit-journal-entry/ui/edit-journal-entry-dialog/edit-journal-entry-dialog.tsx:15,81`.
  Hand-rolled `<textarea>` + `textareaClasses` const is gone. (Slice 22
  subtask 495.)
- **`SegmentedControl` primitive** (matrix §3) — ported at
  `src/shared/ui/segmented-control.tsx` (built on the already-installed
  `@radix-ui/react-tabs`, no new dep; `segmented-control.test.tsx` present).
- **`library-status-switcher` → `SegmentedControl`** (matrix §2 game-detail
  row, Section-1 "inline status switcher") — `widgets/game-detail/ui/library-status-switcher/library-status-switcher.tsx:19,130`
  renders `<SegmentedControl<LibraryItemStatus>>`, not hand-rolled
  `<button role="radio">` pills. Keyboard arrow-nav + focus management come
  from Radix Tabs for free.
- **`profile-overview` tab nav → `SegmentedControl`** (matrix §2 profile
  row, Section-1 "sub-tabs") — `widgets/profile-overview/ui/profile-overview/profile-overview.tsx:13,289`
  uses `<SegmentedControl<ProfileTabValue>>` for the Overview/Library/Activity
  nav, replacing the stale-matrix-era Radix `Tabs` strip. The active panel is
  conditionally rendered under a `role="tabpanel"` wrapper.
- **`onboarding-first-time` `Collapsible`** (matrix §2 onboarding row) —
  `features/onboarding-first-time/ui/onboarding-checklist/onboarding-checklist.tsx:5-9,129-152`
  wraps the checklist in `Collapsible`/`CollapsibleTrigger`/`CollapsibleContent`
  (primitive ported Slice 18). Header (progress summary) stays visible; step
  list folds.
- **`journal-entry-card` `CardDescription` meta sub-line** (matrix §2
  journal-timeline row, Section-1 typographic hierarchy) —
  `entities/journal-entry/ui/journal-entry-card/journal-entry-card.tsx:4,36`
  renders the kind-label + date inside `<CardDescription>`, matching
  canonical's title + description hierarchy.
- **command-palette mobile `Sheet` variant** (matrix §2 command-palette row,
  Section-5 mobile gap) —
  `features/command-palette/ui/command-palette/command-palette.tsx:17-22,46,144-160`
  renders the same `Command` body inside a bottom `Sheet` at `<768px`
  (`useMediaQuery("(min-width: 768px)")`) and a centered `Dialog` at md+. The
  `Sheet` primitive was ported Slice 18. (Note: the feature's own
  `CLAUDE.md` "Divergences" still lists "No mobile-sheet variant" as gap 3 —
  that prose is now stale relative to the code; flagged for a docs follow-up,
  not a code gap.)
- **status-filter two-tone palette** (matrix §1 status-filter-palette row) —
  `features/filter-library/lib/status-config.ts:40-53` collapses to a single
  two-tone shape (idle = `text-muted-foreground` transparent; active =
  `bg-primary text-primary-foreground`), matching canonical's quiet single-
  accent rail. (Slice 18A Phase 3.)
- **settings navigation rail** (matrix §2 settings/account + settings/profile
  rows, Section-5 settings-nav gap) — `widgets/settings-rail/ui/settings-rail/settings-rail.tsx`
  renders a `<nav aria-label="Settings">` with Profile + Account links
  (vertical at md+, horizontal-scroll stacked at <md). Wired by the layout
  route `routes/_authed/settings.tsx:9,43` wrapping `settings/profile.tsx` +
  `settings/account.tsx` via `<Outlet/>`; the "Back to profile" link is
  retained alongside the rail.
- **`/games/search` route + `search-games` UI** (matrix §2 search route +
  search-games rows, the only "entirely missing route" the matrix flagged) —
  route exists at `routes/_authed/games.search.tsx` (URL `/games/search`,
  matching canonical `savepoint-app/app/games/search/page.tsx`) composing
  `features/search-games/ui/search-games-input/` (debounced `Input`) +
  `features/search-games/ui/search-games-results/` (IGDB results grid →
  `<Link to="/games/$slug">`).
- **app-shell display-name footer, library card meta-footer, status-badge
  pill, game-detail hero/eyebrow/breadcrumb-Games-segment/chips, profile
  hero/followers/stat-icons/recently-played, mobile bottom-nav + topbar +
  filter-bar** (matrix §1 rows + Section-5) — all discharged across Slices
  18A Phases 1–4 and 21; verified present in the current tree (e.g.
  `widgets/profile-overview/.../profile-overview.tsx:66-151` hero +
  social-counts; `game-detail.tsx:97-118` breadcrumb with the Games segment;
  `game-detail.tsx:63-94` hero screenshot backdrop). "Structurally
  equivalent, no primitive gap" — cross-referenced to the existing Slice 18A
  Phase 1/2/3/4 entries above; no duplication of that prose here.

### Waived rows (rationale)

These matrix rows were "waive" (or resolve to a no-op against current code):

- **`delete-journal-entry` dialog** — `Dialog` + `Button` only; structurally
  equivalent to canonical, no primitive gap.
  (`features/delete-journal-entry/ui/delete-journal-entry-dialog/`.)
- **`journal-entry-detail` widget** — `Dialog` + `Button`; no primitive gap.
  (`widgets/journal-entry-detail/ui/journal-entry-detail/`.)
- **`manage-account` SignOutCard** — `Card/*` + `Button`; structurally
  equivalent. (`features/manage-account/ui/sign-out-card/`.)
- **`steam-connect` SteamConnectCard** — `Card/*` + `Button`; structurally
  equivalent. (`features/steam-connect/ui/steam-connect-card/`.)
- **`imported-games-page` + filter bar** — `Alert`/`Button`/`EmptyState`/
  `Input`/`Select`/`Checkbox` all ported; bulk-select retired (documented
  Slice 21 Phase D). No primitive gap.
  (`widgets/imported-games-page/ui/{imported-games-page,imported-games-filter-bar}/`.)
- **`steam-import` imported-game-card / import-game-modal / igdb-manual-search**
  — `Card`/`Badge`/`DropdownMenu`/`Dialog`/`Select`/`Input` all ported; no
  primitive gap. (`features/steam-import/ui/{imported-game-card,import-game-modal,igdb-manual-search}/`.)
- **`follow-user` / `unfollow-user` buttons** — `Button` only; no primitive
  gap. (`features/{follow-user,unfollow-user}/ui/`.)
- **`profile-activity-tab`** — `Button` + `EmptyState`; activity rows are
  plain `div`/`p`, which matches canonical (it also avoids `Card` per row).
  No primitive gap. (`widgets/profile-activity-tab/ui/profile-activity-tab/`.)
- **`whats-new` modal multi-step pagination** — canonical paginates
  Next/Dismiss-all; tanstack shows one announcement with a single "Got it".
  Cross-reference: "Slice 20 — what's-new modal" entry above. Waived.
  (`features/whats-new/ui/whats-new-modal/`.)
- **`toggle-theme` `DropdownMenu` upgrade** — tanstack uses shadcn
  `DropdownMenu` where canonical hand-rolls a `<div role="menu">` popover.
  Intentional **upgrade**, not a regression: superior focus management and
  keyboard semantics. (`features/toggle-theme/ui/theme-toggle/theme-toggle.tsx`.)
- **`user-list` widget** — collapsed from canonical's three-file
  `followers-list` / `following-list` / `user-list-item` split into a single
  `variant`-discriminated widget (documented "Slice 20 — social CTA wiring"
  entry above). Avatars render via a plain `<img src={image ?? "/default-avatar.png"}>`
  rather than the shadcn `Avatar` primitive the matrix assumed — functionally
  equivalent and consistent with `ProfileOverview`'s own avatar approach; no
  primitive gap that blocks parity. (`widgets/user-list/ui/user-list/user-list.tsx:47,56`.)
- **`RadioGroup` (matrix §3)** — not used by any in-scope surface in either
  app. The matrix flagged it "likely" but found no code evidence. Not ported
  speculatively. Waived.
- **Game-detail tabs — 4 vs canonical 3** (matrix §1 "Game Detail — tabs",
  Open Question 3) — the current widget renders **Overview** (always) +
  **Journal {count}** (signed-in) + **Related** (when `relatedGamesSlot`
  supplied) + **Times to beat** (when `timesToBeatSlot` supplied), i.e. up to
  four tabs. This intentionally diverges from canonical's three-tab model
  (Overview / Journal {count} / Playtime, with Related folded into Overview).
  **This also supersedes the prose in the "Slice 18A — Visual-parity Phase 2"
  entry above** (lines ~509–518), which described a 3-tab realignment with
  Related folded into Overview and Times-to-beat renamed Playtime — that note
  predates the current shape. The 4-tab layout is the locked, tested design:
  `widgets/game-detail/ui/game-detail/game-detail.tsx:160-218` and the test
  contract `game-detail.test.tsx:209-211` ("renders the Related tab and the
  Times to beat tab"). Keeping Related and Times-to-beat as their own tabs
  is a product-intent decision (Open Question 3 is a product question, not a
  code gap), so it is **waived** here rather than re-collapsed; collapsing
  would discard already-shipped, tested surfaces. Revisit only if a product
  decision explicitly mandates canonical's exact 3-tab taxonomy.

### Out of scope (separate tasks)

- Dedicated mobile-parity collapse work for the library-item card horizontal-
  row variant at `<md` — **deferred to task 501 (GREEN mobile parity)**. (The
  card already has a `flex-row`/`md:flex-col` responsive rule from Slice 18A
  Phase 4; any further mobile-card polish belongs to 501.)
- Final pixel-level visual diff sweep — **deferred to task 502.**

### Mobile parity (task 501)

Task 501 ("GREEN mobile parity") is the dedicated follow-up the "Out of
scope" note above deferred from task 500. Its remit: exhaustively validate
the `<768px` responsive collapse across **all** in-scope S15–S21 surfaces
(not just library), confirm the three named deliverables against canonical's
375×812 behaviour, and fix only genuine breakage. Like task 500, this turned
out to be **validation-dominant** — Slice 18A Phase 4 ("mobile responsive
sweep, 375×812") front-loaded the work, so every surface already collapses
correctly. **No code changed.** Pixel-perfect comparison stays deferred to
tasks 502/503 (visual diff sweep + pixel verification); this task is
code-read + colocated component tests, not browser screenshots.

#### Three named deliverables — confirmed against canonical 375×812

- **Sidebar → bottom tab nav at `<768px`.** `widgets/app-bottom-nav/.../app-bottom-nav.tsx`
  is `fixed inset-x-0 bottom-0 z-40 ... md:hidden` with Library/Journal/Profile
  tabs; `widgets/app-sidebar` is `hidden md:flex`; `widgets/app-mobile-topbar`
  (`md:hidden`) carries logo + search-link + theme toggle. All three slotted in
  `widgets/app-shell/.../app-shell.tsx` (`main` gets `pb-16 md:pb-0` to clear
  the fixed bottom bar). Matches canonical `savepoint-app/widgets/mobile-nav`
  (`fixed inset-x-0 bottom-0 ... md:hidden`, same 3 destinations) +
  `widgets/mobile-topbar`. Cosmetic-only gaps vs canonical (y2k glow,
  `safe-area-inset-bottom` padding, active-pill scale animation) are owned by
  502/503, not a collapse break.
- **Library `Filters` drawer + sheet.** `features/filter-library/ui/mobile-filter-bar/mobile-filter-bar.tsx`
  is `xl:hidden`, renders a `SlidersHorizontal` "Filters" `Button` →
  `Sheet side="bottom"` collapsing Status / Platform / Sort + min-rating +
  unrated-only, with an active-filter count badge. The desktop sidebar
  (`features/filter-library/ui/library-filters/library-filters.tsx`) is the
  mirror `hidden ... xl:flex`. Near-identical to canonical `MobileFilterBar`
  (same `Sheet side="bottom"`, same sections, same trigger + count-badge
  affordance). Documented divergence: tanstack omits the canonical inline
  Steam-import shortcut button (separate widget surface here).
- **Library card horizontal-row variant.** `widgets/library-item-card/.../library-item-card.tsx:22`
  root is `flex flex-row gap-3 md:flex-col md:gap-0`; cover wrapper is
  `w-20 shrink-0 md:w-auto` (small cover left + metadata right on mobile,
  stacked column on desktop). Pinned by the colocated test
  ("uses flex-row at mobile and flex-col at md+", asserting `\bflex-row\b`
  and `\bmd:flex-col\b`). Matches canonical audit §5 item 3 intent.

#### Per-surface mobile verdict (code-read at 375px)

All surfaces verified for: (a) no horizontal overflow at 375px, (b) any
desktop multi-column layout collapses to a single column / stacks, (c)
interactive chrome reachable on mobile.

- **`/library`** — `ok`. Filter sidebar is `hidden xl:flex` (zero-width at
  mobile, so the items column owns full width via `min-w-0 flex-1`); mobile
  filter `Sheet` replaces it; card grid `grid-cols-[repeat(auto-fill,minmax(150px,1fr))]`
  reflows; FAB add-game is fixed bottom-right; `LibraryModal` is a responsive
  `Dialog` (`w-full max-w-lg`).
- **`/journal`** — `ok`. Header `flex items-center justify-between` (title +
  Compose button); `JournalTimeline` is a `space-y-lg` vertical stack of
  `JournalEntryCard`s; compose/edit/delete dialogs use the responsive
  `DialogContent` (`w-full max-w-lg`, square corners < `sm`); edit/compose
  `Textarea` is fluid-width.
- **`/games/search`** — `ok`. `container mx-auto px-4`; results grid is
  `grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7` (3 cols at
  mobile); debounced `Input` is full-width; loading/error/empty states are
  centered blocks.
- **`/settings/profile` + `/settings/account`** — `ok`. Layout
  `routes/_authed/settings.tsx` is `grid gap-6 md:grid-cols-[200px_1fr]` —
  single column at mobile, two-column at md+. `SettingsRail` is
  `flex flex-row gap-1 overflow-x-auto md:flex-col` (horizontal-scroll nav
  stacked above content on mobile, vertical rail at md+). Back-link + heading
  stack above. Forms are full-width.
- **`/steam/games` (imported games)** — `ok`. `ImportedGamesPage` list is
  `space-y-2` (vertical rows of `ImportedGameCard`); `ImportedGamesFilterBar`
  filter grid is `grid-cols-2 md:grid-cols-4` (2 cols at mobile), chips
  `flex-wrap`, pagination `flex items-center justify-between`. Sync button,
  alert, import modal all reachable.
- **`/u/$username` profile + Activity tab** — `ok`. `ProfileOverview` hero is
  `flex-col sm:flex-row`; banner `h-20 sm:h-[120px]`; avatar `h-20 w-20
sm:h-[140px]`; stats `grid-cols-2 sm:grid-cols-4`; recently-played
  `grid-cols-3 sm:grid-cols-4 ... lg:grid-cols-7`; tab nav is a `scrollable`
  `SegmentedControl`. `ProfileActivityTab` is a `space-y-md` + `<ul divide-y>`
  vertical row list with a "Load more" button.
- **Command palette** — `ok`. `features/command-palette/.../command-palette.tsx:46`
  branches on `useMediaQuery("(min-width: 768px)")`: at `<768px` it renders
  the same `Command` body inside a `Sheet side="bottom"`
  (`data-testid="command-palette-mobile-sheet"`); at md+ a centered `Dialog`.
  Matches canonical `MobileCommandPalette` intent. (Stale prose: the feature's
  own `CLAUDE.md` "Divergences" still lists "No mobile-sheet variant" as gap 3
  — that contradicts the shipped code; flagged for a docs follow-up, not a
  code gap. Already noted in the discharged-rows list above.)
- **Journal compose / edit / delete dialogs** — `ok`. All three use the
  shared responsive `DialogContent` (`fixed top-[50%] left-[50%] ... w-full
max-w-lg ... sm:rounded-lg`) — capped at viewport width, edge-to-edge with
  square corners below `sm`. No fixed-px width that would overflow 375px.
- **`/games/$slug` (game detail, S13–S14 but adjacent)** — `ok` (spot-checked).
  Hero `grid-cols-1 md:[grid-template-columns:minmax(140px,200px)_1fr]`;
  cover `w-32 md:w-full`; `TabsList overflow-x-auto`; Overview meta grids
  `grid-cols-1 md:grid-cols-[...]`; genre/platform chip rows `flex-wrap`.

No genuine mobile breakage found on any in-scope surface — no horizontal
overflow, no un-collapsed desktop grid, no unreachable control. Expected
outcome per the task framing; no fixes made.

### Gate results

`typecheck`, `lint`, `format:check` all exit 0; `test:unit` 794 passed
(100 files). No code changed in this subtask — the gates confirm the
discharged-incrementally claim against the current tree. (Re-run at task 501:
same green result, still no code changed.)

### Visual diff sweep (task 502)

The static **code-level** visual-parity sweep across every in-scope S15–S21
surface: copy strings, spacing utilities, type-ramp classes, semantic color
tokens, and hover/focus/transition classes compared against the canonical
`savepoint-app/` counterpart (per Section 2 of
`context/audits/2026-05-20/visual-parity-delta.md`). The live pixel-level
walkthrough is owned by task 503; this is the diff form. Validated against
**current** code, not the stale 2026-05-20 matrix.

**Headline finding:** parity is high. Every surface uses `@/shared/ui`
semantic tokens — **zero stray hex/rgb/arbitrary-color values** found in any
in-scope surface. Interactive-state classes (`hover:`, `focus-visible:ring`,
`transition-colors`, `animate-spin`, `data-[state=open]:`) are present and
token-equivalent. The only unintended drift was a **type-ramp** one: four
route-shell page headings used `text-2xl font-semibold` (24px, default sans)
where canonical uses the `text-h1` / `text-h2` display-font tokens
(36px / 30px). Fixed (see "Fixes made").

#### Per-surface verdict table

| surface                                                                | verdict                                | evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/journal` route + `journal-timeline-page`                             | intentional divergence                 | h1 `text-h1` (matches canonical `heading-xl`); canonical also renders a tagline `<p body-md text-muted-foreground>` + groups entries **by game** with cover thumbnails + "Load More". Tanstack is a flat dialog-CRUD timeline with a "Compose entry" header button, no tagline, no game-grouping, mood/tags/playtime not surfaced (`TODO(021-S16)`). Architectural model differs — documented Slice 16. Tagline absence noted as a possible future polish, not drift.                                                                 |
| `journal-timeline` widget                                              | match                                  | `space-y-lg` vertical stack; `EmptyState` copy "Nothing logged yet" + same description string as canonical.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `journal-entry-card` (entity card)                                     | match                                  | `Card`/`CardContent`/`CardDescription`, kind-label + date in `CardDescription` (canonical title+description hierarchy), `text-primary/70 tracking-widest uppercase` eyebrow, `line-clamp-4`, `transition-colors`, `focus-visible:ring-2`.                                                                                                                                                                                                                                                                                             |
| `journal-teaser` (entity teaser)                                       | match                                  | `border-l-2 pl-3` rows, `font-mono text-xs` date, `line-clamp-2`, "Add entry" CTA link with `focus-visible:ring`.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `compose-/edit-journal-entry` dialogs                                  | intentional divergence                 | `Dialog/*` + `Textarea` primitive + `text-destructive`/`text-sm` tokens + Button variants — clean. Single-field flat dialog vs canonical's rich multi-field form (mood/tags/playtime). Documented Slice 16.                                                                                                                                                                                                                                                                                                                           |
| `delete-journal-entry` dialog                                          | match                                  | `Dialog/*` + destructive `Button`; "Delete this entry?" / "This cannot be undone." copy.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `/games/search` route + `search-games` UI                              | match (scoped)                         | h1 `heading-lg`, tagline `text-muted-foreground text-sm` "Find games to add to your SavePoint library", input `body-md h-12` + placeholder/aria-label **byte-identical** to canonical `GameSearchInput`. Results grid `grid-cols-3 sm:4 md:5 lg:7`, semantic-token loading/error/empty states. Scoped down (no library-status / view-toggle / pagination / category badges) — documented out-of-scope. Container `px-4 py-6` is the consistent tanstack route-shell pattern vs canonical `px-2xl py-2xl` (intentional, app-wide).     |
| `/settings` shell + child pages                                        | unintended drift (FIXED) + intentional | **Fixed:** layout `<h1 Settings>` and `<h2 Account>` were `text-2xl font-semibold` → now `text-h1` / `text-h2` matching canonical. **Intentional:** settings-rail has 2 items (Profile/Account) not canonical's 3 (no "Connected systems" — Steam folded into the account page); rail uses icons + `bg-muted` active vs canonical's left-border `bg-accent` (documented restyle, task 500). Profile settings page omits a page-level `<h2 Profile>` and splits avatar into a top-level "Profile picture" section (documented Flow 3). |
| `manage-account` SignOutCard                                           | match                                  | `Card/*`; copy "Sign out" sentence-case (tanstack convention) vs canonical "Sign Out" — consistent within tanstack, not drift.                                                                                                                                                                                                                                                                                                                                                                                                        |
| `steam-connect` SteamConnectCard                                       | match                                  | `Card/*` + `Alert variant="info"` + Button variants; `space-y-4`. Connect/connected/disconnect states all token-clean.                                                                                                                                                                                                                                                                                                                                                                                                                |
| `/steam/games` route + `imported-games-page`                           | unintended drift (FIXED) + intentional | **Fixed:** `<h2 Imported games>` (main + error component) `text-2xl font-semibold` → `text-h2`. **Intentional:** "Imported games" list framing vs canonical "Import from Steam" selector (bulk-select retired, filter/sort/pagination added — documented Slice 21 Phase D). `Alert`/`EmptyState`/`Button`/pagination all token-clean.                                                                                                                                                                                                 |
| `imported-game-card`                                                   | match                                  | `Card`/`CardContent`/`Badge`/`Button` variants; `text-muted-foreground text-sm`; per-status variants.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `import-game-modal` / `igdb-manual-search`                             | match                                  | `Dialog`/`Select`/`Input`/`Card` ported (cross-ref Slice 21 + waived-rows list above).                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `command-palette`                                                      | match                                  | `Command/*` + `Dialog/*` (md+) + `Sheet side="bottom"` (`<768px`, `useMediaQuery`); `max-h-[400px]` list; centered empty/loading/error states `text-muted-foreground text-sm`. Mobile-sheet variant present (stale CLAUDE.md gap-3 prose corrected this task).                                                                                                                                                                                                                                                                        |
| `follow-user` / `unfollow-user` buttons                                | match                                  | `Button`; toast copy `Following @${username}` / `Unfollowed @${username}` per locked Slice 20 strings.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `whats-new` modal                                                      | intentional divergence                 | `Dialog/*` + `Badge variant="secondary"` + Button; `CATEGORY_LABELS` match canonical. Single "Got it" dismiss vs canonical multi-step Next/Dismiss-all (documented Slice 20).                                                                                                                                                                                                                                                                                                                                                         |
| `onboarding-first-time` checklist                                      | match                                  | `Collapsible/*` (matrix row closed), `bg-primary text-primary-foreground` done-marker, `body-sm`, `hover:bg-muted/40 focus-visible:ring-2`, `data-[state=open]:rotate-180` chevron.                                                                                                                                                                                                                                                                                                                                                   |
| `toggle-theme` ThemeToggle                                             | intentional upgrade                    | `DropdownMenu/*` (roving-tabindex, Escape, click-outside) vs canonical hand-rolled `<div role="menu">`. `bg-accent text-accent-foreground` active item. Documented superior.                                                                                                                                                                                                                                                                                                                                                          |
| `user-list` widget                                                     | intentional divergence                 | single `variant`-discriminated widget collapsing canonical's 3-file split; `divide-y divide-border/50`, `hover:bg-muted/50 transition-colors`, plain `<img>` avatar fallback. Documented Slice 20.                                                                                                                                                                                                                                                                                                                                    |
| `profile-activity-tab`                                                 | match                                  | plain `div`/`p` rows (matches canonical, no per-row Card), `divide-y`, `Button variant="outline"` "Load more", `EmptyState`.                                                                                                                                                                                                                                                                                                                                                                                                          |
| `profile-overview` widget (+ `/u/$username` Overview/Library/Activity) | match                                  | gradient banner, avatar-overlap hero, social-count links, 4 stat-cards w/ icons (`bg-card text-card-foreground`), recently-played grid w/ gradient mask, `SegmentedControl` tab nav. Display-name h1 `font-serif text-3xl sm:text-4xl`. All token-clean; pixel-exact heading-class comparison deferred to 503.                                                                                                                                                                                                                        |

#### Fixes made (trivial unintended type-ramp drift)

All four are CSS-class-only swaps from `text-2xl font-semibold` (24px sans) to
the design-system display-font heading tokens canonical uses; no test asserts
these classes (heading queries are by-name/by-role), so no test changes were
needed. The tokens are byte-identical between the two apps' stylesheets
(`.text-h1` → display font, `--font-size-heading-xl` 2.25rem; `.text-h2` →
display font, `--font-size-heading-lg` 1.875rem).

- `routes/_authed/settings.tsx` — `<h1 Settings>`: `text-2xl font-semibold` →
  `text-h1` (canonical `app/(protected)/settings/layout.tsx` uses `text-h1`).
- `routes/_authed/settings/account.tsx` — `<h2 Account>`:
  `text-2xl font-semibold` → `text-h2` (canonical
  `settings/account/page.tsx` uses `text-h2`).
- `routes/_authed/steam/games.tsx` — `<h2 Imported games>` (both the main
  component and the `errorComponent`): `text-2xl font-semibold` → `text-h2`
  (canonical steam page uses `heading-xl`; `text-h2` is the right h2
  equivalent for this list-framing).

Also corrected stale prose (no code): `features/command-palette/CLAUDE.md`
"Divergences" gap 3 ("No mobile-sheet variant") struck through and marked
closed — the shipped code has had the `Sheet`-based mobile variant since the
Slice 22 primitive-port subtasks. (The Slice 22 discharged-rows list above had
already flagged this prose as stale.)

#### Residual divergences handed to the 503 pixel gate

None are unintended; the 503 gate should pixel-confirm these documented
intentional differences rather than treat them as breaks:

- **Journal page model** — flat dialog-CRUD timeline vs canonical's
  group-by-game timeline with cover thumbnails, per-group entry counts,
  mood/tags/playtime chips, and `/journal/new` page. Tagline absent. (Slice 16.)
- **Settings rail** — 2 items + icon style + `bg-muted` active (vs canonical
  3 items + left-border `bg-accent`). Profile settings page lacks a top-level
  `<h2 Profile>` heading (avatar split into its own section). (Flow 3 / task 500.)
- **`/steam/games`** — "Imported games" list framing (filter/sort/pagination,
  no bulk-select) vs canonical "Import from Steam" selector. (Slice 21 Phase D.)
- **Search results** — no library-status / view-toggle / pagination /
  category badges / quick-add. (Documented out-of-scope.)
- **Game-detail tabs** — 4 tabs vs canonical 3 (Open Question 3, product
  decision). (Waived-rows list above.)
- **whats-new** single-dismiss; **theme-toggle** DropdownMenu upgrade;
  **user-list** one-file collapse — all intentional, documented.
- **Pixel-level** heading-class / spacing exactness (e.g. profile h1
  `font-serif text-3xl` vs canonical's exact classes, container `px-4 py-6`
  vs `px-2xl py-2xl`) — token-equivalent at the code level; final pixel
  comparison is 503's remit.

#### Live spot-check

**Skipped.** Per the task framing, the live pixel-level walkthrough (running
both apps, screenshot matrix) is owned by task 503 and the two apps share
`:6060` by design. The deliverable here is the code-level static diff above;
starting the dev server for an eyeball spot-check risked rabbit-holing on
browser tooling for no parity signal the code read didn't already give.

#### Gate results (task 502)

`typecheck` exit 0; `lint` exit 0; `format:check` exit 0; `test:unit` 794
passed (100 files). Four CSS-class-only heading fixes + two docs corrections;
all colocated tests stayed green without modification (heading assertions are
by-name/by-role, not by-class).

### Post-verification parity fixes (task 503 findings)

Bugs found during the Slice 22 live verification walkthrough. The first four
were fixed in this task (#1/#2/#6/#8); the rest (#3/#4/#5/#7/#9/#10/#11/#12)
landed via sibling agents and are recorded here so the parity ledger is
complete.

- **#1 — Font fallback chains were doubled.** `src/styles.css` base font vars
  (`--font-default-sans`, `--font-paper-display`, etc., lines 5–13) already
  carried generic fallbacks (`sans-serif`/`serif`), and the theme composites
  (`--font-runtime-sans`, `--font-display`, …) appended _more_ generics —
  computed `font-family` came out malformed/doubled (e.g.
  `"Source Serif 4", Georgia, "Times New Roman", serif, Georgia, serif`).
  Stripped the base vars to the bare family name (`--font-default-sans:
"Geist"` etc.) so each composite appends generics exactly once, matching
  canonical's shape. Canonical stays bare because `next/font` sets each var to
  `"<Family>", "<Family> Fallback"` (metric-matched face, no generic);
  tanstack loads fonts via a `<link>` in `__root.tsx`, so the `"…Fallback"`
  faces don't exist — the only remaining difference, an accepted divergence.
  Also fixed a real dashboard font divergence: `dashboard-stats-card.tsx:19`
  applied `font-mono` to the `// LIBRARY` label in **all** themes, but
  canonical (`features/dashboard/ui/dashboard-stats-cards.tsx:39`) only renders
  it mono via the `.y2k`-scoped `y2k-mono` class — the default Paper theme uses
  the body sans font. Dropped the unconditional `font-mono`. No other dashboard
  heading/body font divergence found (both inherit Geist body; section headings
  use no display-font override on either app).
  Files: `src/styles.css`,
  `src/widgets/dashboard-page/ui/dashboard-stats-card/dashboard-stats-card.tsx`.
- **#2 — Dashboard uppercasing removed (section heading only).**
  `dashboard-game-section.tsx:35` applied a plain `uppercase` to the section
  `<h2>`; canonical
  (`features/dashboard/ui/dashboard-game-section.tsx:39`) only uppercases via
  the `.y2k`-scoped `y2k:uppercase` variant — the base class is
  `text-sm font-semibold tracking-tight`. Removed the base `uppercase`, kept
  `tracking-tight`. The stats-card `// LIBRARY` label's `tracking-wider
uppercase` was **left unchanged**: canonical's counterpart
  (`dashboard-stats-cards.tsx:39`) carries the same base `tracking-wider
uppercase`, so it already matches (the task's hunch that this label also
  over-uppercased did not survive the canonical comparison).
  File: `src/widgets/dashboard-page/ui/dashboard-game-section/dashboard-game-section.tsx`.
- **#6 — Sidebar Library icon aligned to canonical + palette.**
  `app-sidebar.tsx` nav used `Library` (lucide) for the Library item; canonical
  sidebar (`savepoint-app/widgets/sidebar/ui/sidebar.tsx:26`) and the tanstack
  command palette both use `BookMarked`. Swapped Library → `BookMarked`. Journal
  (`BookOpen`), Profile (`User`), Settings (`Settings`) already matched
  canonical. Canonical's sidebar has **no** Dashboard nav entry and **no**
  "Search games" nav link (search is a dedicated trigger button), so none was
  added/removed beyond the icon. No test asserts icons (nav is queried by
  label/href), so no test change.
  File: `src/widgets/app-sidebar/ui/app-sidebar/app-sidebar.tsx`.
- **#8 — Responsiveness audit; one genuine divergence, no half-fix applied.**
  Checked `/dashboard`, `/library`, `/journal`, `/games/search`, `/settings/*`,
  `/steam/games`, `/u/$username`, and game-detail at 375 / 768 / 960 / 1024 /
  1280 against canonical. All surfaces use mobile-first collapsing grids
  (`grid-cols-1/2/3 … sm:/md:/lg:`), no fixed-width horizontal overflow, no
  arbitrary-color leakage. Two notable comparisons:
  - **Library filter rail (md→xl band) — GENUINE divergence, flagged not
    fixed.** Tanstack has two filter surfaces: full rail (`LibraryFilters`,
    `hidden … xl:flex`, ≥1280) and `MobileFilterBar` (`xl:hidden`, <1280).
    Canonical has **three**: full rail (`xl:flex`), a collapsed icon
    `LibraryFilterSidebarRail` (`hidden … md:flex xl:hidden`, 768–1279), and the
    mobile bar gated `md:hidden` (<768). So at ~960px canonical shows a
    collapsed icon rail beside the grid while tanstack shows the full-width
    mobile filter button bar — the "awkward gap between md and xl" the
    verification flagged. The correct fix is porting `LibraryFilterSidebarRail`
    (a feature-sized component add), not a polish edit. Changing tanstack's
    `MobileFilterBar` gating to `md:hidden` would regress the 768–1279 band to
    **no** filter UI, so no half-fix was applied. Needs a product/scope decision.
  - **Game-detail hero — NOT a divergence.** Tanstack
    (`game-detail.tsx:122–124`) is _more_ responsive than canonical: single
    column + `w-32` cover on mobile, `md:[grid-template-columns:200px_1fr]` +
    `w-[200px]` on md+. Canonical
    (`game-detail-hero.tsx:219–229`) uses a fixed `gridTemplateColumns:
"200px 1fr"` and `paddingTop: 140px` at **all** widths. The shared
    `pt-[140px]` is uniform on both apps. Left unchanged — editing it would
    diverge _from_ canonical.

  Net: #8 reduces to one documented genuine break (library md→xl rail) plus
  "verified, matches canonical" elsewhere. **Resolution (2026-05-21): deferred
  as a KNOWN GAP.** During task-503 verification the user could not recall the
  specific responsive break they had flagged, so the feature-sized
  `LibraryFilterSidebarRail` port (collapsed icon filter rail for the 768–1279
  band) was not undertaken speculatively. Tanstack currently jumps from the full
  filter rail (`xl:flex`) straight to the mobile button bar (`xl:hidden`) with no
  intermediate icon rail; canonical shows the icon rail at 768–1279. Revisit and
  port `LibraryFilterSidebarRail` if this mid-width gap is confirmed as a real
  user-facing problem.

#### Already-landed sibling fixes (recorded for completeness)

- **#3** — library-card CTA switched to the `primary` Button variant.
- **#4** — per-user platform filter via new
  `entities/library-item/api/get-unique-platforms.server.ts`.
- **#5** — command-palette "Add to Up Next" quick action; palette-owned
  `api/quick-add-to-library-fn.ts` + `api/remove-library-item-fn.ts` (so the
  palette never imports another feature's server fn).
- **#7** — profile Library tab renders `LibraryGrid` via a `librarySlot`.
- **#9** — steam-connect card aligned (Steam glyph + disconnect dialog).
- **#10** — game-detail platform chips → new `entities/game/ui/platform-badges/`
  (abbreviated icons + `+N` overflow); added `react-icons@5.5.0`
  (exact-pinned, matches canonical).
- **#11** — game-detail tab spacing (`gap-1` + `px-3.5 pt-3 pb-3`).
- **#12** — game-detail hero layout (`200px` grid, `pt-[140px]`, full-bleed
  `px-6 md:px-12`).

## Slice 23 — URL parity audit, blocker remediation #5 (`/games/search` made public)

The URL-parity audit found a guard mismatch that blocked cutover. Canonical
`savepoint-app/app/games/search/page.tsx` is a **public** page: it calls
`getServerUserId()` _optionally_ (no redirect for anon) and passes the resulting
`userId` (`string | null`) to `<GameSearchInput>`. Anonymous users can search;
signed-in users additionally get the add-to-library affordance.

Tanstack had the route under `_authed/games.search.tsx`, so the `_authed.tsx`
`beforeLoad` guard (`requireUserIdOrRedirectFn`) redirected anonymous visitors
to `/login` — a functional regression vs. canonical (anonymous search was
broken), contradicting the spec's "invisible cutover" goal.

**Resolution.** Moved the route out of the guarded group:
`src/routes/_authed/games.search.tsx` → `src/routes/games.search.tsx` (flat
public sibling of `games.$slug.tsx`). `createFileRoute("/_authed/games/search")`
→ `createFileRoute("/games/search")`. The `validateSearch` `{ q?: string }`
schema is unchanged; the URL stays `/games/search`. Route tree regenerated.

**No `userId` prop needed (intentional divergence from canonical's
prop-passing).** Unlike canonical, the tanstack search UI is fully presentational
and auth-agnostic: `SearchGamesInput` takes only `initialQuery` + `debounceMs`,
and `SearchGamesResults` calls `searchGamesFn` — an anonymous-allowed
`createServerFn` with no auth gate. There is no add-to-library affordance in the
tanstack search surface yet (scoped out at Slice 22), so the route resolves no
viewer identity. When that affordance lands, mirror `games.$slug.tsx`'s optional
`viewerUserId` loader pattern at that time — do not add a `userId` prop the UI
does not consume now.

Inbound links (`app-sidebar`, `app-mobile-topbar`) reference the path string
`to="/games/search"`, which is unchanged, so they were unaffected.

Regression guard: `src/routes/-games.search.test.tsx` asserts the route has no
`beforeLoad` guard (`Route.options.beforeLoad` is `undefined`) and renders the
search surface for an anonymous visitor.

## Slice 23 — FSD audit + boundaries remediation

The FSD audit found `eslint-plugin-boundaries` was not resolving the `@/` path
alias (no `import/resolver` in its settings block), so `lint` reported green
while enforcing nothing on aliased imports (≈ every real import). Fixing the
resolver surfaced 34 raw violations; triaged to 6 genuine breaks + ~5 allowed
widget compositions + ~23 config false-positives (barrels + root-shell wiring).

**Boundaries config tightened to enforce the documented policy.** Added
`eslint-import-resolver-typescript` (exact-pinned) and redesigned
`eslint.config.mjs` with per-slice capture groups: `features`/`entities` forbid
cross-slice imports but allow same-slice (barrel re-exports, intra-slice) via
`${from.slice}` matching; `widgets→widgets` allowed (composition per
`widgets.md`); `routes→app` allowed (the `__root.tsx` shell seam); same-layer
barrels allowed. The linter now flags ONLY genuine cross-slice/cross-layer
breaks. Regression guard (`test/eslint/fsd-boundaries.test.ts`) extended to pin
alias resolution + per-slice policy. (Known follow-up: the config uses the
plugin's v5 legacy selector/`${...}` template syntax — harmless under v6.0.2 but
prints per-run deprecation diagnostics; migrate to object-selectors + `{{...}}`.)

**6 genuine violations relocated (not waived):**

- `features/browse-related-games` no longer imports `@/widgets/game-card` — the
  card is injected via a `renderGame: (game) => ReactNode` slot prop from the
  composing route `games.$slug.tsx` (slot-prop is the FSD-preferred inversion).
- `features/toggle-theme` no longer imports `@/app/...` — `Theme`,
  `ResolvedTheme`, `ThemeContextValue`, `ThemeContext`, `useTheme` moved to
  `@/shared/lib/theme`; `SavepointThemeProvider` stays in `app/` and imports the
  context from shared, so lower layers consume the hook downward.
- `command-palette` + `steam-import` no longer import a sibling feature's
  `searchGamesFn` — the IGDB search was relocated to
  `entities/game/api/search-games.ts`; all consumers import it downward from the
  game entity.
- `entities/profile/ui/overview-tab` (which imported the `library-item` entity)
  was deleted; its cross-entity composition lives at the widget layer.

**Widget-to-widget carve-outs (allowed by policy, documented per `widgets.md`):**

- `widgets/dashboard-page/` → `widgets/library-item-card/` — the dashboard
  game-section composes library cards (composition, not coincidence).
- `widgets/journal-timeline-page/` → `widgets/journal-timeline/` — the page
  widget wraps the timeline widget and owns the compose/detail navigation.
  These pre-date Slice 23 but were invisible while the linter was alias-blind;
  now surfaced and accepted as composition. The boundaries config allows
  `widgets→widgets` wholesale, so this list is the human/code-review discipline.
