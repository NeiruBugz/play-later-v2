# Technical Specification: UI/UX Audit Improvements (High + Medium Priority)

- **Functional Specification:** [`functional-spec.md`](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Nail Badiullin

---

## 1. High-Level Technical Approach

This is a `savepoint-app`-only change. **No database schema changes.** All metadata in F#7 reads from existing `LibraryItem` columns.

The work splits cleanly across the existing four-layer DAL (Handler → Service → Repository) and Feature-Sliced Design layout in `savepoint-app/`:

- **Repository layer:** add one query — `countLibraryItemsByStatus({ userId, platformId?, search? })` — that returns a `Record<LibraryItemStatus, number>` honoring the same filters used by `findLibraryItemsForUser`. Implemented with a single `prisma.libraryItem.groupBy` over `status`.
- **Service layer (`LibraryService`):** add `getStatusCounts(...)` thin wrapper around the repository call. Returned value is a stable shape; existing `getLibraryItems` is unchanged.
- **Use-case layer:** new use-case for the dashboard Quick Log hero ordering — `getQuickLogPlayingGames(userId)` combines `LibraryItem.startedAt` and the latest `JournalEntry.createdAt` per game to compute a single "last activity" timestamp, then sorts descending.
- **Page / RSC:** the Library page Server Component fetches `getLibraryItems(...)` and `getStatusCounts(...)` in `Promise.all` and passes both into client components via props.
- **UI (Library):** `library-page-view.tsx` is restructured into a desktop sidebar + grid area:
  - New `<LibraryFilterSidebar>` (client) — desktop ≥ 1280px, collapsible to icon rail; collapse state persisted in `sessionStorage`.
  - New `<HeroSearch>` (client) — full-width 44px search above the grid with `⌘K`/`Ctrl K` hint and global keyboard listener that focuses the input.
  - New `<MobileFilterBar>` (client) — segmented control for status (labels only, no counts on chip), with a "Filters" trigger that opens an existing shadcn `<Sheet>` (bottom sheet on mobile).
  - `<LibraryGrid>` is wrapped in a client boundary using `useOptimistic` so a chip click toggles its pressed state immediately while the URL change drives the actual data re-fetch via RSC.
- **UI (Card):** `library-card.tsx` gets a top-left `<StatusBadge>` (reusing existing per-status color tokens) and the existing status-text slot becomes `<CardMetadata>`, branching on `status` per F#7.
- **UI (Dashboard hero):** the Quick Log hero card structure changes — single `Log Session` primary button, `Reflect` becomes a secondary text link beneath. Order comes from the new use-case.
- **UI (Onboarding):** new `<EmptyLibraryHero>` in `features/onboarding/ui/` rendered by both the Library page and the Dashboard library widget when the user's `LibraryItem` count is zero. Two CTAs: "Import from Steam" → existing Steam route; "Search for Games" → focuses the existing IGDB search input.
- **UI (Library Card Complete Redesign — F#2.10):** `library-grid.tsx` switches from fixed column counts to `auto-fill minmax(...)` and a viewport-driven grid-vs-list split. `library-card.tsx` gains a per-card primary CTA, a context menu (⋮), an interactive star row, and a structured metadata row (platform • contextual date). A new presentational variant `library-card-list-row.tsx` renders each item as a horizontal row at ≤640px. Existing swipe/mobile-action UI (`library-card-swipe.tsx`, `library-card-mobile-actions.tsx`) is removed — its actions are absorbed by the per-row CTA + context menu.
- **Quick Add (F#2.11):** extend the existing `quickAddToLibraryAction` (in `features/manage-library-entry/server-actions/quick-add-to-library-action.ts`) and its underlying `addGameToLibrary` use-case to (a) accept `igdbId` only as the public input contract — defaults are filled server-side, (b) auto-detect `platform` from the IGDB game record's platform list using the first IGDB platform whose name maps to a row in our `Platform` table, (c) write `acquisitionType = DIGITAL` on the new `LibraryItem`. Three UI surfaces consume it: `<QuickAddButton>` on each game-search-result card, a Quick Add path inside `features/command-palette/`, and a `<NavbarAddGameButton>` in `widgets/header/ui/header.tsx` that delegates to the command palette. A small `<UndoToast>` wrapper around the existing toast adds a 5-second Undo action that calls `deleteLibraryItemAction`. `⌘K` is handed to the command palette; library hero search shortcut changes from `⌘K` to `/` (per F#2.6 revision).
- **Editable Platform (F#2.12):** add `platform: z.string().nullable().optional()` to `UpdateLibraryEntrySchema`, pipe it through `updateLibraryEntryAction → LibraryService.updateLibraryItem`. `LibraryService.updateLibraryItem` already accepts `platform?: string`; the repository spreads `updateData` directly to Prisma, so the only blockers are at the schema and action layers. No DB migration required (`LibraryItem.platform` is already a nullable `String?` column).
- **State:** filter, platform, sort, and search live in URL search params (existing project pattern). Sidebar collapsed/expanded state is the only UI state stored client-side (`sessionStorage`).
- **Performance:** no perf optimization upfront. Single `groupBy` is acceptable; revisit only if measured slow.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Architecture Changes

No new architectural layers. Existing four-layer DAL and FSD slices are sufficient.

### 2.2 Data Model / Database Changes

**None.** All work uses existing `LibraryItem` columns: `status`, `rating`, `hasBeenPlayed`, `createdAt`, `updatedAt`, `startedAt`, `actualPlaytime`, `acquisitionType`, `platformId`.

If a Prisma index audit shows the planned `groupBy` is slow, add an index on `(userId, status, platformId)` in a follow-up migration. Not part of this spec.

### 2.3 Repository Layer Additions

| Function | Inputs | Returns | Notes |
|---|---|---|---|
| `countLibraryItemsByStatus` | `{ userId, platformId?, search? }` | `Record<LibraryItemStatus, number>` (all five statuses; missing keys filled with `0`) | `prisma.libraryItem.groupBy({ by: ["status"], where: { userId, platformId?, game: { title: { contains: search, mode: "insensitive" } } } })`. Lives in `library-repository.ts`. |

Existing repo signatures unchanged.

### 2.4 Service Layer Additions

| Service | Method | Returns | Notes |
|---|---|---|---|
| `LibraryService` | `getStatusCounts(input)` | `ServiceResult<Record<LibraryItemStatus, number>>` | Thin wrapper over `countLibraryItemsByStatus`. Same input shape as the relevant fields of `getLibraryItems`. |

`LibraryService.getLibraryItems` signature is unchanged.

### 2.5 Use-Case Layer Additions

| Use-case | Returns | Composition |
|---|---|---|
| `getQuickLogPlayingGames(userId)` | `Array<{ libraryItem, game, lastActivityAt }>` sorted desc by `lastActivityAt` | Calls `LibraryService.getLibraryItems({ userId, status: "PLAYING" })` and `JournalService.getLatestEntryDatePerGame(userId, gameIds)`; computes `lastActivityAt = max(libraryItem.startedAt, latestJournalEntry?.createdAt, libraryItem.updatedAt)`. |

If `JournalService.getLatestEntryDatePerGame` doesn't exist, add a corresponding repository function `findLatestJournalDateByGameId({ userId, gameIds })` returning `Map<gameId, Date>`. (Single grouped query; no per-game N+1.)

### 2.6 Server Components / Routes

- **`app/(authorized)/library/page.tsx`** (or current Library page entry):
  - Server Component reads `searchParams` (`status`, `platform`, `q`, `sort`, optional `pagination`).
  - `Promise.all([LibraryService.getLibraryItems(...), LibraryService.getStatusCounts(...)])`.
  - Also fetches a cheap "total library count" — if `0`, render `<EmptyLibraryHero />`. Else render `<LibraryPageView items counts ... />`.
- **Dashboard library widget** (existing component): same zero-check, render `<EmptyLibraryHero variant="dashboard" />` when applicable.
- **Quick Log hero (`features/dashboard/...`)**: switches its data source to `getQuickLogPlayingGames`.

### 2.7 Component Breakdown

All new components live in their feature slice (FSD) and respect the existing public-API exports.

| Path | Type | Purpose |
|---|---|---|
| `features/library/ui/library-filter-sidebar.tsx` | client | Desktop sidebar with status (with counts), platform, sort. Reads `searchParams`, dispatches via `useRouter().push` with new params. Collapse state in `sessionStorage`. |
| `features/library/ui/library-filter-sidebar-rail.tsx` | client | Icon-only collapsed rail (≥ 768px, < 1280px). |
| `features/library/ui/hero-search.tsx` | client | 44px input, focus ring, `⌘K`/`Ctrl K` hint chip, global keydown listener. Updates `q` searchParam on debounced change. |
| `features/library/ui/mobile-filter-bar.tsx` | client | Segmented control (≤ 640px) for status (labels only) + "Filters" `<Sheet>` trigger containing platform, sort, and status counts list. |
| `features/library/ui/library-status-badge.tsx` | server-or-client (presentational) | Pill badge overlay on cover; props: `status`, `hidden?`. Reuses existing per-status color tokens. |
| `features/library/ui/library-card-metadata.tsx` | server (presentational) | Branches on `status` per F#7 to render playtime / startedAt / platform / createdAt. |
| `features/library/ui/library-page-view.tsx` | client wrapper | Restructured layout: sidebar + grid area; wraps grid in a `useOptimistic` client boundary for chip-pressed UI. |
| `features/onboarding/ui/empty-library-hero.tsx` | server | The two-CTA onboarding hero. Variant prop for `library` vs `dashboard` styling. |

Modifications to existing components:

| Path | Change |
|---|---|
| `features/library/ui/library-card.tsx` | Add `<LibraryStatusBadge>` overlay; replace status-text slot with `<LibraryCardMetadata>`. Hide badge when single-status filter active (preserve current behavior). |
| `features/library/ui/library-filters.tsx` | Likely deleted (or significantly trimmed) once sidebar + hero search + mobile filter bar replace it. |
| `features/library/ui/library-empty-state.tsx` | Either replaced by `EmptyLibraryHero` or absorbed into it (single empty state per F#8). |
| `features/dashboard/...` quick log section | Render single primary CTA + secondary text link; consume new use-case. |

### 2.8 Logic / Algorithm

- **Status-aware card metadata (F#7):** pure function in `library-card-metadata.tsx`:
  - `PLAYING` or `PLAYED` and `actualPlaytime > 0` → playtime (formatted "32h" / "1h 23m").
  - `PLAYING` or `PLAYED` and `actualPlaytime` is null/zero → relative `startedAt`.
  - `WISHLIST` / `SHELF` / `UP_NEXT` and `platformId` set → platform name.
  - else → relative `createdAt`.
- **Optimistic chip pressed state:** `useOptimistic` wraps the active-status set. On click, optimistic add/remove fires immediately while `useTransition` schedules a `router.push` with new searchParams. Chip is disabled during `isPending`.
- **Sidebar collapse persistence:** read `sessionStorage` on mount in a `useEffect`; default to expanded if absent. Avoid hydration mismatch by rendering in default state on first paint and applying stored state after hydration.
- **`⌘K`/`Ctrl K` shortcut:** global `keydown` listener inside `<HeroSearch>` (cleanup on unmount); uses `navigator.platform`/`navigator.userAgent` for platform-appropriate label and shortcut detection.
- **Recency sort (use-case):** `lastActivityAt = max(startedAt ?? 0, latestJournal ?? 0, updatedAt)` per game; tie-break by `updatedAt`.

### 2.9 Library Card Complete Redesign (F#2.10)

This sub-section covers the technical execution of functional spec 2.10. It builds on the components introduced in 2.7 (`library-status-badge`, `library-card-metadata`) and adjusts them for the redesign.

#### 2.9.1 Grid Sizing (`library-grid.tsx`)

Replace the current `grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12` with viewport-driven track sizing:

```text
mobile (≤640px):     <list view, see 2.9.5> — grid not used
small (641–767px):   grid-cols-[repeat(auto-fill,minmax(150px,1fr))]
md (768–1023px):     grid-cols-[repeat(auto-fill,minmax(160px,200px))] gap-[14px]
lg+ (≥1024px):       grid-cols-[repeat(auto-fill,minmax(180px,220px))] gap-4
```

Tailwind arbitrary-value tracks are JIT-compatible. No new tokens. `library-grid-skeleton.tsx` is updated in lock-step so the skeleton matches the new track widths.

#### 2.9.2 Card Stack & Metadata Row (`library-card.tsx`, `library-card-metadata.tsx`)

- The card's content stack (under the cover) becomes: title (2-line clamp) → metadata row → rating row → primary CTA. No hover-only content.
- `library-card-metadata.tsx` is rewritten to render `<platform badge> • <contextual date>` instead of the single status-aware field from F#2.7. Branching by status:

| Status | Metadata row |
|---|---|
| `PLAYING` | platform • `Started <relative startedAt>` (fallback `Added <relative createdAt>` when `startedAt` is null) |
| `UP_NEXT` | platform • `Started <relative startedAt>` (fallback `Added <relative createdAt>`) |
| `PLAYED` | platform • `Finished <relative updatedAt>` |
| `SHELF` | platform • `Added <relative createdAt>` |
| `WISHLIST` | platform • `Added <relative createdAt>` |

When `platformId` is null, the platform badge and the bullet separator are omitted. Relative formatting reuses the existing date helper used elsewhere in `features/library` (audit at implementation time; do not introduce a new helper).

#### 2.9.3 Per-Card Primary CTA (`library-card-cta.tsx`, new)

| Status | Label | Action | Server action |
|---|---|---|---|
| `PLAYING` | Log Session | Open `<LogSessionDialog>` (existing journal flow surface) pre-filled with this game | existing `createJournalEntry` flow (no new action) |
| `UP_NEXT` | Start Playing | Set `status=PLAYING`, set `startedAt = now()` if null | reuse `updateLibraryStatusAction` |
| `SHELF` | Queue It | Set `status=UP_NEXT` | reuse `updateLibraryStatusAction` |
| `PLAYED` | Replay | Set `status=UP_NEXT`, `hasBeenPlayed=true`; leave `startedAt` untouched | reuse `updateLibraryStatusAction` |
| `WISHLIST` | Add to Shelf | Set `status=SHELF` | reuse `updateLibraryStatusAction` |

- All transitions go through `updateLibraryStatusAction` (existing). The CTA component derives the payload (`status`, optional `startedAt`, optional `hasBeenPlayed`) from a small pure mapper `getPrimaryCtaPayload(status, hasBeenPlayed)` colocated in `features/library/lib/`.
- CTA click uses `useTransition` for optimistic disabled state; on success, the page re-fetches via the existing route-segment cache invalidation triggered by `revalidatePath` inside the action.
- CTA event handler calls `event.stopPropagation()` so card navigation (cover/title click) is not triggered.
- "Log Session" wires into the existing journal entry creation surface (`features/journal/server-actions/create-journal-entry`). If a dedicated `<LogSessionDialog>` does not yet exist, this spec adds a thin one in `features/library/ui/log-session-dialog.tsx` that mounts the journal entry form pre-filled with `libraryItemId`.

#### 2.9.4 Context Menu (`library-card-menu.tsx`, new)

- Built on shadcn `DropdownMenu`; trigger is a 28×28 `MoreVertical` button (lucide) absolutely positioned in the cover top-right with a semi-transparent dark backdrop (`bg-black/60 backdrop-blur-sm`).
- Items, in order:
  1. **View Journal Entries** → links to existing journal-entries panel/route for this game.
  2. **Edit Library Details** → opens existing `<EntryForm>` / edit dialog.
  3. **Change Status →** submenu listing all five statuses; each item dispatches `updateLibraryStatusAction` with the chosen status (no implicit `startedAt`/`hasBeenPlayed` side-effects — that's the CTA's job, not the menu's).
  4. **Remove from Library** → existing remove flow.
- Trigger and items call `event.stopPropagation()` to avoid card navigation.
- Replaces the hover-revealed quick actions in `library-card-action-bar.tsx`. That component is deleted unless found to be reused outside the card.

#### 2.9.5 Mobile List View (`library-card-list-row.tsx`, new)

- New presentational component used at ≤640px instead of `library-card.tsx`. The grid container in `library-grid.tsx` switches between grid and list at the same breakpoint via Tailwind responsive utilities, not via JS.
- Row layout:
  - Cover thumbnail: 60×80px, `flex-shrink-0`, rounded, with status badge (per F#2.4) overlaid top-left.
  - Content column (`flex-1 min-w-0`): title (15px, 1-line clamp) → metadata row (12px) → rating row → full-width CTA button (≥44px tall).
  - Context menu (⋮) anchored to row's top-right with the same 44×44px tap target.
- Reuses `<LibraryStatusBadge>`, `<LibraryCardMetadata>`, the rating-stars row, and `<LibraryCardCta>` and `<LibraryCardMenu>` from above. No business logic duplication.
- The 641–767px range continues to use the grid card per 2.9.1.

#### 2.9.6 Interactive Star Rating on Cards

- The current `library-card.tsx` uses `RatingInput` from `@/shared/components/ui/rating-input` in `readOnly` mode. For 2.10.6, switch the card's `RatingInput` to non-`readOnly` and wire its `onChange` to a thin client wrapper that calls the existing `setLibraryRatingAction`.
- The wrapper component `library-card-rating.tsx` (new, client) handles:
  - Optimistic UI via `useOptimistic` over the local rating state.
  - On change, calls `setLibraryRatingAction({ libraryItemId, rating })` inside `useTransition`.
  - On error, restores prior value and shows the existing error toast.
  - Stops propagation so star clicks don't navigate.
- Spec 011's 1–10 scale is preserved; the 5-star UI maps `displayValue × 2 = column value` (consistent with existing `RatingInput` behavior — verify by reading its props).

#### 2.9.7 Component Inventory Delta

| Path | Type | Status |
|---|---|---|
| `features/library/ui/library-grid.tsx` | client | **modified** — new track sizing; viewport-driven grid/list switch |
| `features/library/ui/library-grid-skeleton.tsx` | server | **modified** — match new track widths and list-row layout |
| `features/library/ui/library-card.tsx` | client | **modified** — composes new CTA, menu, metadata row, interactive rating |
| `features/library/ui/library-card-metadata.tsx` | server | **modified** — platform + contextual-date format per 2.9.2 (replaces 2.7 single-field rule) |
| `features/library/ui/library-card-cta.tsx` | client | **new** |
| `features/library/ui/library-card-menu.tsx` | client | **new** |
| `features/library/ui/library-card-rating.tsx` | client | **new** |
| `features/library/ui/library-card-list-row.tsx` | client | **new** |
| `features/library/ui/log-session-dialog.tsx` | client | **new (thin wrapper)** if no equivalent exists |
| `features/library/lib/library-card-cta-payload.ts` | pure | **new** — `getPrimaryCtaPayload(status, hasBeenPlayed)` mapper |
| `features/library/ui/library-card-action-bar.tsx` | — | **deleted** (hover overlay replaced by always-visible CTA + ⋮ menu) |
| `features/library/ui/library-card-swipe.tsx` | — | **deleted** (mobile list view supersedes swipe affordance) |
| `features/library/ui/library-card-mobile-actions.tsx` | — | **deleted** (subsumed by list-row CTA + ⋮ menu) |

Before deleting any of the three components above, audit imports across the repo. If any are reused outside `features/library`, refactor in place instead.

### 2.10 Quick Add Flow (F#2.11)

#### 2.10.1 Server Action & Use-Case Changes

The existing `quickAddToLibraryAction` already accepts `{ igdbId, status }`. We refine its contract so the UI surfaces only need to pass `igdbId` and the server does the rest of the smart-defaults work:

| Change | Layer | Detail |
|---|---|---|
| `QuickAddToLibrarySchema` → `{ igdbId }` only | schema | Status is no longer required from the client; defaults to `UP_NEXT` server-side. Keep the existing input shape backward-compatible by treating `status` as optional, defaulting to `UP_NEXT` when absent. |
| `addGameToLibrary` use-case | use-case | Accept new optional fields: `acquisitionType?: AcquisitionType` (default `DIGITAL` when invoked from Quick Add), `autoDetectPlatform?: boolean` (default `false`). When `autoDetectPlatform === true`, derive `platform` from the IGDB game's platform array. |
| Platform auto-detect helper | use-case (pure-ish) | New helper `resolvePrimaryPlatform({ igdbPlatforms, knownPlatforms })`: iterates IGDB platforms in array order, returns the name/identifier of the first match found in our `Platform` table, else `null`. `knownPlatforms` is fetched once via `LibraryService` (or a new lightweight `PlatformService.list()` if not already present). The resolved string is stored as `LibraryItem.platform` (the existing free-form `String?` column). |
| Logging | action | Log `quick-add` events with `{ userId, igdbId, resolvedPlatform, autoDetect: true }` so we can later evaluate auto-detect quality. |
| Revalidation | action | Existing `revalidatePath("/library")` and `revalidatePath("/games/[slug]")` are kept; no new paths needed. |

#### 2.10.2 UI Surfaces

| Path | Type | Status | Purpose |
|---|---|---|---|
| `features/manage-library-entry/ui/quick-add-button.tsx` | client | **new** | 32×32 button (lucide `Plus` icon → `Check` icon on success). Manages local pending/added state with `useTransition`. Calls `quickAddToLibraryAction({ igdbId })`. Stops propagation. Triggers `<UndoToast>` on success. |
| `features/game-search/ui/game-search-result-card.tsx` (or equivalent) | client | **modified** | Mounts `<QuickAddButton igdbId={...} alreadyInLibrary={...}>` anchored top-right. The "already in library" flag is computed in the search results query (existing `getLibraryStatusForGames` covers it). |
| `features/command-palette/ui/desktop-command-palette.tsx` and `mobile-command-palette.tsx` | client | **modified** | Add a Quick Add code-path: when a result item is selected, call `quickAddToLibraryAction({ igdbId })` and close the palette. Existing navigation behaviour can be preserved as a secondary action (e.g., `Cmd+Enter` to open detail page) or replaced — implementation chooses the minimum. |
| `features/command-palette/ui/game-result-item.tsx` | client | **modified** | Render the right-aligned `Add to Up Next` hint chip per the design. |
| `features/command-palette/hooks/use-command-palette.ts` | client | **modified** | Re-bind the open shortcut to `⌘K` / `Ctrl K` if not already bound. Ensure the binding is global (not page-scoped). |
| `features/library/ui/hero-search.tsx` | client | **modified** | Drop the `⌘K` listener; bind `/` instead. Update the right-aligned hint chip from `⌘K` / `Ctrl K` to `/`. Update `hero-search.test.tsx` accordingly. |
| `widgets/header/ui/header.tsx` | client | **modified** | Add a desktop **Add Game** button (icon + label) and a mobile-only `+` icon button (`aria-label="Add Game"`). Both delegate to `useCommandPalette().open()`. If the existing header already shows a `⌘K` palette trigger, replace it with the new button rather than rendering two. |
| `shared/components/ui/undo-toast.tsx` (or feature-local equivalent) | client | **new (thin)** | Wraps the existing toast primitive (`sonner` or whatever `shared/components/ui/toast` uses) with a 5-second Undo action. Props: `{ message, onUndo, durationMs? }`. Calling `onUndo` triggers `deleteLibraryItemAction({ libraryItemId })`. |

#### 2.10.3 Toast + Undo

- Reuse the existing toast primitive — no new toast library. Verify which one ships in the project (`sonner` is most likely; confirm at implementation start).
- Each Quick Add result emits exactly one toast. Undo button references the `LibraryItem.id` returned by `quickAddToLibraryAction` (the action already returns `LibraryItemDomain`).
- Undo calls `deleteLibraryItemAction({ libraryItemId })`. On success, swap the toast content to `Removed` and dismiss within 1 s.
- After the toast lifetime expires, no further state is held client-side; the library pages are already revalidated by the action's `revalidatePath` calls.
- Concurrency: emit independent toasts for each add. Each toast's `onUndo` closes only its own `LibraryItem`.

#### 2.10.4 Shortcut & Header Wiring

- Centralize the `⌘K` / `Ctrl K` binding inside `use-command-palette.ts`. Remove any duplicate listeners (e.g., the one currently in `hero-search.tsx`).
- Library hero search keyboard handler: listen for `keydown` with `key === "/"` on `document`, do nothing if the active element is already an `<input>` / `<textarea>` / `<contenteditable>`, else focus the hero search input and prevent default.
- The header's Quick Add button calls the same `useCommandPalette().open()` so there is exactly one entry point.

### 2.11 Editable Platform (F#2.12)

| Layer | Change |
|---|---|
| `features/manage-library-entry/schemas.ts` | Extend `UpdateLibraryEntrySchema` with `platform: z.string().nullable().optional()`. Add `acquisitionType` if not already present (out-of-scope follow-up if needed). |
| `features/manage-library-entry/server-actions/update-library-entry-action.ts` | Forward `platform` into `LibraryService.updateLibraryItem({ libraryItem: { ..., platform } })`. Treat empty string as `null`. |
| `LibraryService.updateLibraryItem` | Already accepts `platform?: string`. No change needed (verify and add a test to lock the contract). |
| Repository `updateLibraryItem` | Already spreads `updateData`. No change. |
| Edit Library Details UI (`features/manage-library-entry/ui/edit-entry-form.tsx`, `entry-form.tsx`) | The platform field is rendered today as a combobox/select for create. Add the same control to the **edit** path; bind to `platform` in the form schema and pass through on submit. |
| Card metadata row (2.10.3) | Already reactive to `platformId` / `platform` from server-revalidated props; no extra wiring beyond making sure the edit action's `revalidatePath("/library")` runs. |

#### 2.11.1 Risk: legacy items with malformed `platform` strings

`LibraryItem.platform` is a free-form `String?`. Some existing rows may contain values that do not correspond to any current `Platform` row (e.g., from past Steam imports or older string formats). The edit form's combobox should:

- Accept the existing value as the selected option even if it is not in the current `Platform` list, marking it as `(legacy)` until the user changes it.
- On change, write only valid `Platform` identifiers — never an arbitrary user-entered string.

#### 2.11.2 No DB migration

The schema (`prisma/schema.prisma:110`) already declares `platform String?`. No migration is part of this spec.

---

## 3. Impact and Risk Analysis

### System Dependencies

- **Library feature slice** (`features/library/`) — most surface area changes here.
- **Onboarding feature slice** (`features/onboarding/`) — adds the empty-library hero.
- **Dashboard feature slice** (`features/dashboard/`) — Quick Log hero restructure.
- **`LibraryService` and `library-repository`** — new method/function; existing methods untouched.
- **`JournalService` / `journal-repository`** — may need a small additional method for "latest entry date per game" if not already present.
- **Routes** — Library page Server Component, dashboard page (no new routes).
- **No external integrations** affected (IGDB, Steam, Cognito, S3, Lambdas).

### Potential Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Layout regressions on intermediate desktop widths (768–1279px) given new sidebar + collapse | Tailwind responsive breakpoints aligned with existing `sm/md/lg/xl` tokens; add Storybook/Playwright snapshots at 768/1024/1280/1440. |
| Hydration mismatch from `sessionStorage`-driven sidebar collapse | Render default state on first paint, apply stored state after hydration in `useEffect`. Document the brief flicker as acceptable per spec ("session-only" persistence). |
| `groupBy` perf at scale | Single query on already-indexed `(userId, status)`. Defer perf work; add index if measured slow. |
| Optimistic chip state desync with URL | `useOptimistic` is reset by `useTransition` completion; chips disabled during pending state to prevent rapid toggle races. |
| Mobile segmented control overflowing on 360px viewport | Allow horizontal scroll *with visible affordance* (snap, fading edge) — explicitly distinct from current invisible scroll (acceptance criterion 2.2). |
| WCAG contrast on badge over arbitrary cover art | Always render badge with translucent dark backdrop + light text (or vice-versa for light theme); verified against existing covers in component test snapshots. |
| Onboarding hero shown to users who briefly hit zero items (e.g., deletes last game) | Cheap to render; no harm. Acceptable per spec — empty state should always lead to add-game CTAs. |
| Existing `library-filters.tsx` consumed by other surfaces | Audit imports before deletion; if reused, refactor in place rather than deleting. |
| `auto-fill minmax(180px,220px)` produces uneven gutters at certain viewport widths | Acceptable per design; verify visually at 1280/1440/1920. If unacceptable, swap to `minmax(180px,1fr)` and cap card width via `max-width` on the card. |
| Removing swipe gestures regresses mobile users who relied on them | List view's full-width CTA + ⋮ menu covers all swipe actions. Document the removal in PR description; no migration path needed. |
| Per-card CTA causes accidental status transitions on cover/title click bleed-through | All CTA, menu, and rating handlers call `event.stopPropagation()`; component tests assert that card navigation is not invoked when these controls are clicked. |
| Replay flow ambiguity: should `startedAt` reset on `PLAYED → UP_NEXT` via Replay? | Spec leaves `startedAt` untouched (records original first start). If product wants reset, add as a follow-up — change is localized to `getPrimaryCtaPayload`. |
| Interactive stars on cards conflict with optimistic rating in detail page (race) | Both call the same `setLibraryRatingAction` and rely on `revalidatePath` from the action. Last write wins. Acceptable. |
| `LogSessionDialog` does not yet exist | Inspect `features/journal` and `features/dashboard/ui/quick-log-hero-client.tsx` first; reuse whatever surface they use. Only add a new dialog if no surface exists. |
| Quick Add `⌘K` shortcut conflicts with browser tabs / OS bindings on some platforms | Match `e.key === "k" && (e.metaKey || e.ctrlKey)` and call `e.preventDefault()` only when no input is focused — the same pattern the existing palette likely already uses. Verify on Linux/Chrome where browser tab-search may steal `Ctrl K`. |
| Library hero `/` shortcut interferes with `vimium`-style browser extensions or `/` typed inside an input | Listener no-ops when `document.activeElement` is an editable element (input/textarea/contenteditable). Standard pattern. |
| Quick Add auto-detect picks the wrong platform | Spec accepts this; user can fix via 2.12 edit. Log auto-detect outcomes for later evaluation. Add a unit test asserting the deterministic ordering (first IGDB platform that matches our `Platform` table). |
| Duplicate-add race when user clicks `+` twice quickly | `<QuickAddButton>` disables itself during `useTransition`'s pending state. The use-case already checks for an existing `LibraryItem` for the user+game pair and short-circuits — verify `addGameToLibrary` behavior and add a test if not already covered. |
| Undo toast outlives the page (user navigates away) | Acceptable; toast is global. If the user navigates and the toast unmounts before timeout, no Undo button is shown — same as today. The item is still in the library; user can remove from the new page. |
| Legacy `LibraryItem.platform` strings that don't map to any current `Platform` row | The edit combobox accepts the legacy value as a sticky selected option marked `(legacy)`; user must explicitly change it to write a valid identifier. Document in PR. |
| `addGameToLibrary` use-case currently writes platform from a passed-in string only | Add an internal branch: when `autoDetectPlatform === true` and no explicit `platform` was given, run `resolvePrimaryPlatform`. Keep the explicit-string branch for the existing add-from-detail-page flow. |
| Header already shows a `⌘K` palette trigger | Only one Add Game / palette trigger should exist post-merge. Audit `widgets/header/ui/header.tsx`; replace existing trigger if found, do not render both. |

---

## 4. Testing Strategy

- **Component tests (Vitest + React Testing Library)** — required for:
  - `library-status-badge.tsx` — status text/color, hidden-when-filtered behavior.
  - `library-card-metadata.tsx` — all four branching cases plus null-playtime fallback.
  - `library-filter-sidebar.tsx` — chip click triggers searchParam update, counts render, dimmed-zero-count chips remain clickable.
  - `mobile-filter-bar.tsx` — segmented control selection, sheet open/close, counts visible only in sheet.
  - `hero-search.tsx` — `⌘K`/`Ctrl K` focuses input; debounced searchParam update.
  - `empty-library-hero.tsx` — both CTAs link/focus correctly; "Browse Popular" CTA absent.
  - `library-card.tsx` — new content stack renders in correct order; no hover dependence (test without firing pointer events).
  - `library-card-cta.tsx` — label per status matrix; payload mapper assertions (`Start Playing` sets `startedAt` only when null, `Replay` sets `hasBeenPlayed`, etc.); `event.stopPropagation` honored.
  - `library-card-menu.tsx` — items render, "Change Status" submenu dispatches plain status update without side-effects, propagation stopped.
  - `library-card-rating.tsx` — clicking a star calls `setLibraryRatingAction` with `displayValue × 2`; clicking the current value clears to null; keyboard arrows + Enter behave per spec; failure path restores prior value.
  - `library-card-list-row.tsx` — row layout, status badge overlays thumbnail, full-width CTA reaches ≥44px, ⋮ menu touch target ≥44×44.
  - `library-grid.tsx` — viewport breakpoint switches between grid and list-row rendering.
- **Pure unit tests** — required for:
  - `getPrimaryCtaPayload(status, hasBeenPlayed)` — exhaustive matrix coverage.
  - `resolvePrimaryPlatform({ igdbPlatforms, knownPlatforms })` — first-match ordering, null when no IGDB platform is in the local table, empty `igdbPlatforms` returns null.
- **Quick Add (F#2.11) component & integration tests:**
  - `quick-add-button.test.tsx` — Plus → Check transition, disabled while pending, propagation stopped, toast emitted with Undo, `alreadyInLibrary` renders the disabled-success state without dispatching the action.
  - `command-palette.test.tsx` — Quick Add code-path: enter key on a result dispatches the action and closes the palette; Esc closes without adding; `Add to Up Next` hint chip rendered on each row.
  - `header.test.tsx` — desktop renders **Add Game** with label; mobile (≤640px) renders icon-only with `aria-label`; click delegates to `useCommandPalette().open()`; no duplicate trigger remains.
  - `hero-search.test.tsx` — update existing tests: `/` hint chip rendered (not `⌘K`); `/` focuses the input; `⌘K` no longer focuses the input. New test covering the no-op-when-input-focused behavior.
  - `undo-toast.test.tsx` — Undo button appears for `durationMs`, click invokes `onUndo`, expiration removes the toast without invoking `onUndo`.
  - `quick-add-to-library-action.integration.test.ts` — extend existing test: input `{ igdbId }` (no status) defaults to `UP_NEXT`, `acquisitionType = DIGITAL`, `platform` resolved per `resolvePrimaryPlatform` (use a fixture IGDB game with multiple platforms and a partial local `Platform` table), duplicate-add returns the existing item without erroring.
- **Editable Platform (F#2.12) tests:**
  - `update-library-entry-action.test.ts` — adding `{ platform: "PS5" }` updates the row; `{ platform: null }` clears it; `{ platform: "" }` is treated as `null`; unauthorized user is rejected as today.
  - `edit-entry-form.test.tsx` — platform combobox renders with the existing value pre-selected; legacy unrecognized value is selectable as `(legacy)` until changed; submit posts the new value.
- **Integration tests (Postgres via Docker)** — required for:
  - `countLibraryItemsByStatus` repository — fixture coverage for empty user, single status, mixed statuses, with platform filter, with search filter.
- **Unit tests** — required for:
  - `getQuickLogPlayingGames` use-case — sort order with various combinations of `startedAt`, latest journal date, `updatedAt`; ties broken by `updatedAt`.
- **Existing tests** — re-run `library-page-view.test.tsx`, `library-rating-control.test.tsx`, etc. Update where component contracts changed.
- **Out of scope:** Playwright E2E for the onboarding flow (per scoping decision; can be added later).
- **CI gates:** all standard project gates — `pnpm --filter savepoint ci:check` (lint, format, typecheck, component tests, backend tests, utilities tests, migration validation).
