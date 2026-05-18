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
- ⚠️ No `/profile/setup` onboarding route in tanstack. Out of scope for V1.
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
- **No empty-state "Log a session" CTA.** Canonical's empty state includes a `<Link to="/journal/new">` button. The `/journal/new` route does not exist on `:6061` yet (Slice 16 scope). Rendering a button to a 404 is worse than rendering no button. Restore in S16 when the compose route is wired.
- **No cover image on entry cards.** `JOURNAL_ENTRY_GAME_SELECT` includes `coverImage`, but `JournalEntryCard` does not render it. Slice 15 contract focuses on text content + game-title link. Cover rendering can land alongside S16 without re-touching the entity-query shape.
- **No pagination / `take` limit on `getJournalTimeline`.** Canonical fetches with `limit: 20` and offers Load More. Slice 15 fetches the full timeline. Acceptable for current journal sizes (no real user has >50 entries); revisit when S16 introduces compose-driven growth or if `:6061` rolls out to higher-volume users.
- **No route-level `errorComponent` on `_authed/journal.tsx`.** Auth is already enforced upstream by `_authed.tsx`'s `beforeLoad`; `getJournalTimeline` returns `[]` rather than throwing for empty/missing-user/missing-game cases. The root `ErrorBoundary` is the last-resort fallback. Add a route-local error component if a future query path introduces a throw mode.
- **Date display uses `toLocaleDateString` (absolute), not `formatRelativeDate` (relative) as in canonical.** `date-fns` is not yet a dependency of `savepoint-tanstack`. Adding it for one component is not justified pre-S16. Revisit when another surface needs richer date formatting.

## Slice 16 — Journal entry CRUD (compose / edit / delete dialogs)

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

- **New widget: `widgets/journal-timeline-page/`.** Wraps the entity-list `JournalTimeline` widget, owns dialog state (`compose` / `detail` / `edit` / `delete`), and renders a header "Compose entry" CTA. The `/journal` route is now thin again: it loads data and renders `<JournalTimelinePage entries={...}/>`. Canonical ships a floating `JournalFAB`; tanstack uses a header-row "Compose entry" `<Button>` instead — better aligned with the existing app-shell header layout, and the slice text explicitly permits this swap. Revisit if a FAB primitive lands elsewhere.
- **New widget: `widgets/journal-entry-detail/`.** A dialog that surfaces the entry's content with Edit + Delete buttons. The widget itself does NOT import the edit / delete features — it emits `onEdit(entryId)` / `onDelete(entryId)` callbacks; the composing `JournalTimelinePage` widget routes the click to the appropriate feature dialog. Canonical has a per-viewport `JournalEntryDialog` (desktop / mobile variants) plus inline edit / delete affordances; tanstack collapses both viewports into one Radix Dialog with a Delete button (variant=destructive) and an Edit button in the footer, matching the slice-11 (LibraryModal) precedent for single responsive layouts.
- **`JournalEntryCard` accepts optional `onSelect: (entryId) => void`.** Entity stays display-only — the callback is a prop, no feature imports introduced. When provided, the card body becomes a `<button>` (with an `aria-label="Open journal entry from {date}"` accessible name); when omitted, the card renders as before. The game-title `<Link>` inside the card calls `stopPropagation` on click so the navigation isn't hijacked by the surrounding card-click handler.
- **`JournalTeaser` accepts optional `onAddEntryClick: () => void`.** Same display-only carve-out — the entity emits a click; the composing widget (`widgets/game-detail`) owns the compose-dialog state. The button renders as a small underlined `Add entry` text affordance both above the entries list and inside the empty state.
- **`widgets/game-detail` owns the compose dialog for the game-detail surface.** A local `useState` for `composeOpen` and a `<ComposeJournalEntryDialog defaultGameId={game.id}/>` are mounted only for signed-in viewers (`viewerUserId !== null`). The compose dialog is the same component the `/journal` route uses — one dialog, two trigger surfaces. Anonymous viewers never see the teaser or the dialog (entity-layer privacy invariant unchanged).
- **`widgets/journal-timeline` adds an optional `onEntrySelect` prop.** Threaded straight through to each `<JournalEntryCard onSelect=...>`. The widget itself does not change behavior when the prop is omitted — Slice-15 callers (none currently) keep working untouched.
- **No new "view journal entry" feature created.** The detail dialog is intentionally a widget, not a feature: it carries no server-fn invocation, only `onEdit` / `onDelete` callbacks. Promoting it to a feature would add a layer without changing behavior. Revisit only if the detail dialog grows mutation surfaces of its own.
- **Tests added (component-level, per slice DoD).** `journal-timeline-page.test.tsx` (5 tests covering: trigger renders, compose dialog opens, card click → detail dialog with Edit + Delete, Edit routes to edit dialog, Delete routes to delete dialog and fires `deleteJournalEntryFn` with the right id). `journal-entry-detail.test.tsx` (6 tests covering: content render, title render, Edit / Delete buttons render, `onEdit` / `onDelete` callback wiring). `journal-entry-card.test.tsx` (3 tests covering: optional `onSelect` semantics — present vs. absent). `journal-teaser.test.tsx` (4 tests covering: optional `onAddEntryClick` semantics — present vs. absent, empty + populated lists). `game-detail.test.tsx` extended with 2 scenarios (signed-in clicks Add entry → `createJournalEntryFn` called with `gameId: game.id`; anonymous viewers don't see the CTA). Total unit-test count: 295 → 499 (Slice-15/16 dialog GREEN steps contributed the bulk; CTA-wiring step adds the +20 tests across the five files above).
