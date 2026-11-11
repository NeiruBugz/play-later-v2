# Technical Specification: Continue? identity round 2 — stand-out Home, game page and library

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Nail Badiullin (with Claude; specialist input from prisma-database, tanstack-fullstack, react-frontend)

Paths are relative to `savepoint-tanstack/` unless they start with `context/` or `.github/`. Raw inventory: [research-notes.md](./research-notes.md). Items marked **Assumption** were proposed, not confirmed; challenge them before `/awos:tasks`.

---

## 1. High-Level Technical Approach

Three new kinds of data, then a presentation rebuild of three screens.

1. **Game enrichment, stored on `Game`.** Time to credits, time to 100% and the cover hue are written onto the `Game` row the first time a game is shown or added, and once for every existing game by a backfill. Every surface then reads plain columns: Home, the game page header (signed out included) and every library card. It removes the live per-page times-to-beat query.
2. **One user preference,** `eveningMinutes`, read through the existing current-user payload and changed from a new Settings page.
3. **One derived value,** each Playing game's last-session date, computed in the dashboard worker.
4. **UI:** the game page is rebuilt from its existing pieces with a new header. Home gets a client-side question panel. Library cards lose the cover badge and gain a length line. A `CoverTint` primitive and a CSS utility paint the tint from two CSS variables.

**Verified fact that changes the data source.** IGDB's own docs (api-docs.igdb.com, Game Time To Beat) define `hastily` as "to its credits without spending notable time on extras", `normally` as "mixing in some extras", and `completely` as "100% completion", all in seconds. The app reads `normally` as "Main story" today. Per spec §2.1, evenings and the About "Main story" row now use `hastily`, and "100%" uses `completely`. `normally` is not shown or stored.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Sequencing and slices

Every slice ships green (`format:check`, `lint`, `typecheck`, `test:unit`, `test:integration` when server or DB paths change, `build`).

| # | Slice | Kind |
|---|---|---|
| 0a | Migration 1 (all additive columns, 2.2), enrichment entity (2.3), wired into game page / add-game / Steam import. `getLibrary` select extended. `formatEvenings` + evening constants. The times-to-beat section is fed from loader data with the corrected mapping, and the live query is deleted | data |
| 0b | Backfill script (2.3), run against Neon once 0a is deployed; output reports coverage | ops |
| 0c | Migration 2: drop the dead HLTB-era columns (2.2), after the pre-check query | data |
| 1 | Evening preference: current-user payload, server fn, `RadioGroup` primitive, Settings "Play" page (2.4) | behaviour |
| 2 | Library cards: no cover badge, length line (2.8) | visual |
| 3a | `CoverTint` primitive + `cover-tint` utility + contrast test (2.6); game header with facts, actions, "Done with it?", "⋯" menu, Back (2.7) | visual + behaviour |
| 3b | Game body: Your play, About, screenshots strip, related strip; deletions (2.7) | visual |
| 4 | Home: dashboard contract, question panel, shelf, Also playing, counts line (2.5) | visual + behaviour |
| 5 | Owner review, phone first (390 × 844, then 360 and 430), then desktop 1440 × 900, Light and Dark, via `scripts/design-review` | review |

Slices 1, 2 and 3a can run in parallel once 0a lands. Slice 4 depends on 3a for `CoverTint`.

### 2.2 Data model

**Migration 1: `add_game_enrichment_and_evening_length`** (additive only; not flagged by CI):

| Model | Column | Type | Default | Purpose |
|---|---|---|---|---|
| `Game` | `timeToCreditsSeconds` | `Int?` | null | IGDB `hastily`. Source of evenings and the About "Main story" row |
| `Game` | `timeToCompleteSeconds` | `Int?` | null | IGDB `completely`. About "100%" row |
| `Game` | `timesToBeatFetchedAt` | `DateTime?` | null | Null = never fetched. Set even when IGDB has no data, so no-data games aren't refetched on every view. Drives the 30-day refresh |
| `Game` | `coverHue` | `Int?` | null | OKLCH hue 0–359. CHECK 0–359 |
| `Game` | `coverChroma` | `Float?` | null | OKLCH chroma of the dominant colour. CHECK ≥ 0. The render caps it |
| `Game` | `coverTintComputedAt` | `DateTime?` | null | Null = not computed. Set with `coverHue` null = computed, no clear colour → neutral |
| `user` | `eveningMinutes` | `Int NOT NULL` | 105 | Evening length. Loose CHECK `BETWEEN 30 AND 360`; the exact choice list {60, 90, 105, 120, 150, 180} lives in Zod |

**Migration 2: `drop_unused_hltb_game_columns`** drops `Game.mainStory`, `mainExtra`, `completionist`, `hltbId` and the `Game_hltbId_key` unique index.
- Nothing has ever read or written them. They come from the 2024 HLTB-era base migration and have no defined unit.
- Run `SELECT count(*) FROM "Game" WHERE "mainStory" IS NOT NULL OR "mainExtra" IS NOT NULL OR "completionist" IS NOT NULL OR "hltbId" IS NOT NULL` on Neon first. The migration ships only when it returns 0.
- The CI destructive-operation step (`.github/workflows/pr-checks-tanstack.yml:197-224`) only warns. Say in the PR that the drop is intentional.
- **Assumption:** new unit-bearing columns plus the drop, rather than reusing `mainStory`/`completionist`. Their names carry the wrong meaning now that `normally` is known not to be the main story.

No index is added. The last-session lookup covers at most ~10 Playing games and uses the existing `JournalEntry` indexes (`prisma/schema.prisma:184-187`).

### 2.3 Game enrichment (times to beat + cover hue)

**Entity** `src/entities/game/api/ensure-game-enrichment.server.ts`:
- `ensureGameEnrichment(game)` does the missing work for one game. `ensureGamesEnrichment(games)` is the batched variant.
  - **Times:** run when `timesToBeatFetchedAt` is null or older than 30 days. Calls `getTimesToBeat` (`src/entities/game/api/get-times-to-beat.server.ts`), changed to fetch `hastily,completely` (`TIMES_TO_BEAT_FIELDS`, `src/shared/api/igdb/queries.ts:4`) and return `{ timeToCreditsSeconds, timeToCompleteSeconds }`. The batched variant uses `where game_id = (a,b,…)`, 10 ids per request.
  - **Hue:** run when `coverTintComputedAt` is null and `coverImage` is set.
    - Fetch the cover at IGDB size `t_thumb` (90 × 90) with an explicit `.jpg` extension, so the bytes are always JPEG.
    - Decode with `jpeg-js` (pure JS, exact pin `0.4.4`). It is imported only in this `.server.ts` file, so it stays out of the client bundle.
    - Pass the pixels to the pure `extractCoverTint(rgba)`.
  - One `prisma.game.update` per game writes whichever fields were computed.
  - **Failures:** log, leave that field's `…At` null so it retries on a later view, never throw. An IGDB "no data" response is not a failure.
- `extractCoverTint` lives in `src/shared/lib/cover-tint.ts`. It is pure, takes no image library, and is unit-tested with pixel fixtures. The recipe from the design session:
  - Convert each pixel to OKLCH. Skip pixels with L < 0.18, L > 0.95 or C < 0.04.
  - Weight the kept pixels by chroma into 15° hue buckets.
  - If kept pixels are under 8 % of the image, return `null` (black-and-white art, white cover with a small logo).
  - Otherwise return the chroma-weighted circular mean hue of the winning bucket and its neighbours, plus the median chroma of the winning bucket.

**Callers:**

| Where | When | Blocking? |
|---|---|---|
| `getGameDetails` (`src/entities/game/api/get-game-details.server.ts:85`, after the thin upsert) — every game page view, signed out included | only if a field is missing or stale | awaited, capped at 1.5 s. On timeout the page renders without length or tint and the next view retries. No fire-and-forget: Vercel freezes functions after the response |
| `src/features/add-game/api/add-game.worker.ts` | after upsert | awaited, soft-fail |
| `src/features/steam-import/api/import-game-to-library.worker.ts` | per imported batch | `ensureGamesEnrichment`, soft-fail |
| Backfill script | once | — |

Entities never import each other. Feature workers call the entity, and `getGameDetails` calls it inside the same entity slice.

**Backfill**, in `scripts/backfill-game-enrichment.ts`. It runs with the same Node runner as `scripts/design-review`, reads `@env`, and uses relative imports if the `@/` alias doesn't resolve under bare Node.
- Selects games with `timesToBeatFetchedAt IS NULL OR coverTintComputedAt IS NULL`.
- Times: chunks of 10 ids, 300 ms between IGDB requests (under 4 req/s).
- Covers: fetched with concurrency 4.
- Idempotent and safe to rerun. It prints coverage: games with a credits time, games with a tint.
- Run against Neon after slice 0a deploys. It is a release step for slices 2 and 4.
- **Assumption:** backfill script plus write-through, rather than lazy-only. Lazy-only would leave Home and every library card without length or tint for games the person hasn't opened since release.

**Removed with slice 0a:**
- `src/features/game-detail/api/get-times-to-beat-for-game.ts`;
- `timesToBeatQueryOptions` in `src/features/game-detail/model/game-detail-queries.ts`;
- the route prefetch and the Suspense slot in `src/routes/games.$slug.tsx:31-42,114-119`.

`GameDetails` gains `timeToCreditsSeconds`, `timeToCompleteSeconds` and `coverTint: { hue, chroma } | null`, so the header has them on the first server render.

### 2.4 Evening length

- **`src/shared/lib/evenings.ts`:**
  - `EVENING_MINUTES_CHOICES` (60, 90, 105, 120, 150, 180) and `DEFAULT_EVENING_MINUTES = 105`.
  - `formatEvenings(timeToCreditsSeconds, eveningMinutes): string | null` returns `null` when the time is null, `"One evening"` or `"About N evenings"` otherwise.
  - Rounding uses integer arithmetic: `n = max(1, floor((2s + e) / 2e))` with `e = eveningMinutes × 60`. Halves round up exactly, with no float error at 4.375 h / 1.75 h.
- **Read path:**
  - `getCurrentUserFn` (`src/entities/session/api/get-current-user.ts:23-55`) selects `eveningMinutes` and returns it. Signed out returns 105 in the same shape.
  - Components call a `useEveningMinutes()` hook in `src/entities/session/model/`, which reads the root route context (`src/routes/__root.tsx:114-131`).
  - Server payloads always carry seconds. Evenings are formatted in the component, so changing the setting needs no data reload beyond the current user.
- **Write path:**
  - New feature `src/features/set-evening-length/`: `api/set-evening-length.ts` (the `createServerFn`) plus `.worker.ts`. Zod `z.union` of the six literals, validated twice. `requireUserId()`.
  - The entity is the existing `updateProfile` (`src/entities/profile/api/update-profile.server.ts:22-61`) with an optional `eveningMinutes`.
  - The client then calls `invalidateCurrentUser(queryClient)` (`src/entities/session/api/invalidate-current-user.ts`).
- **UI:**
  - New route `src/routes/_authed/settings/play.tsx`, a "Play" item in `src/widgets/settings-rail/ui/settings-rail/settings-rail.tsx:14-21` and `settings-list.tsx:104-114`, and an extended `activeSegment` in `src/routes/_authed/settings.tsx:23-29`.
  - The control is a new `src/shared/ui/radio-group.tsx` (Base UI Radio, pulled from the shadcn base-maia style): six pill radios in a 3-column grid, each at least 44 px tall, plus the example line built with `formatEvenings`.
  - `segment-control` isn't used because it has tab semantics.
  - **Assumption:** a new "Play" Settings page, rather than a section on Profile.

### 2.5 Home

**Server contract.** The worker is `src/features/dashboard/api/get-dashboard-page-data.worker.ts`.

```ts
type ContinueGame = LibraryItemWithGame & {
  lastSessionAt: Date | null;   // MAX(JournalEntry.createdAt) where playedMinutes > 0
  becamePlayingAt: Date | null; // LibraryItem.statusChangedAt
};
type DashboardPageData = {
  playing: ContinueGame[];         // already in question order (spec 2.3)
  upNextQueue: LibraryItemWithGame[];
  upNextTotal: number;
  counts: DashboardStatusCounts;
};
```

- `LibraryItemWithGame.game` (`src/entities/library-item/model/types.ts:24-33`, the `getLibrary` select, and `test/factories/builders.ts:11-16`) gains `timeToCreditsSeconds`, `coverHue` and `coverChroma`.
- **Last session:** new entity query `getLatestSessionDates(userId, gameIds)` in `src/entities/journal-entry/api/`. It is one `groupBy` on `gameId` with `_max.createdAt`, where `userId`, `playedMinutes > 0` and `gameId in …`.
  - It keys on `gameId`, not `libraryItemId`, because `JournalEntry.libraryItemId` is nullable (`schema.prisma:172`) while `LibraryItem` is unique on `(userId, gameId)` (`:134`).
- **Order:** the pure `orderContinueGames` in `src/features/dashboard/model/` sorts by `lastSessionAt ?? becamePlayingAt` desc, then `becamePlayingAt` desc, then title. The worker uses it, and it is unit-tested without Prisma.

**Client** (`src/widgets/dashboard-page/`):
- **`model/use-continue-question.ts`** builds the list `[...playing, upNextQueue[0]]`, keyed by library item id. Its state is local (`skippedIds`, `focusId`), so nothing survives leaving Home. It returns `{ kind: "continue" | "start" | "replay" | "rest", item }`.
  - **Current item:** `focusId`, if that item is still Playing or still first in Up Next. Otherwise the first item not skipped. When none is left, the rest state.
  - **Not tonight:** adds the item to `skippedIds`. **Ask me again:** clears it.
  - **Log time:** sets `focusId` and then opens the Log sheet. After a save, `router.invalidate()` reloads the data, the item stays current and reads "Last session today". Closing the sheet without saving changes nothing.
  - **Start playing / Play again:** set `focusId` and run the existing `useSetStatus`. **Undo** needs no callback: the game is back in Up Next, the `focusId` check still passes for the first Up Next game, and the same "Start …?" returns.
  - **Also playing:** `playing` minus its first element, taken from loader order and never from the skip state. It changes only when the data reloads.
- **`ui/continue-panel/`** has three variants and is wrapped in `CoverTint` (2.6); the rest state is `tint="off"`.
  - Content is keyed by item id, with a CSS `fade-in`. The global reduced-motion override (`src/styles.css:221-230`) already makes the change immediate.
  - The "how long ago" wording is `formatTimeAgo(date, now)` in `src/shared/lib/date.ts`, next to `formatHours`. It uses calendar days in the viewer's time zone, so the panel renders it after hydration (a two-pass render). This avoids a server-UTC/client mismatch around midnight.
- **`ui/also-playing/`** replaces `dashboard-playing-section`. **`ui/dashboard-counts-line/`** replaces `dashboard-status-strip`: zero parts are left out and a single game reads "1 game".
- **`dashboard-page.tsx`** (`:24-63`):
  - The `PageHeader` "Home" shows on desktop only, with an **outline** "Add game". Phone has no title and no Add game.
  - Order: panel, shelf, Also playing, counts.
  - The empty state (`EmptyState` "Nothing playing right now") shows when there are no Playing games and an empty Up Next.
- **`src/widgets/up-next-shelf/ui/up-next-shelf/up-next-shelf.tsx`:**
  - The StatusChip overlay (`:47-51`) is removed.
  - Captions: the first cover shows `formatEvenings` or else its title, the other covers their title, and a Done item shows "Replay" in any position.
  - "Play next" (`:53-61`) is removed.

### 2.6 Cover tint rendering

- **`src/shared/ui/cover-tint/cover-tint.tsx`:**
  - Props are `tint: { hue, chroma } | null` plus a `variant: "panel" | "header"`.
  - It sets only CSS custom properties (`--tint-h`, `--tint-c`) and `data-tint="on|off"`. The lint rule (`eslint.config.*:111`) bans only literal colour properties, so this passes.
- **`styles.css`** gains a `cover-tint` utility. It derives `--tint-wash`, `--tint-deep` and `--tint-ink` with fixed lightness per mode and the chroma capped at render:

| | wash | deep | ink |
|---|---|---|---|
| Light | `oklch(0.915 min(var(--tint-c), cap) var(--tint-h))` | L 0.87 | L 0.44 |
| Dark (`.dark`) | L 0.255 | L 0.31 | L 0.80 |

- With `data-tint="off"`, the surface falls back to `--card` / `--foreground`.
- **Header fade:** a gradient from `--tint-wash` to `--background` over the bottom third of the header.
- **Ink use:** `text-(--tint-ink)` is used only on "Continue", "Start", "Play" and the key-fact values. The primary button keeps `--primary`.
- **Contrast guarantee:** the lightness is fixed, so contrast depends only on hue and chroma.
  - `src/shared/ui/contrast.test.ts`, which already parses `styles.css` tokens, gains a sweep over hue 0–359 at the chroma cap in both modes.
  - It asserts foreground, ink and the primary button against the wash at ≥ 4.5:1.
  - It also asserts that title contrast differs by ≤ 0.5 between any two hues.
  - The cap value is chosen to make that sweep pass. Start from the mock's clamp.

### 2.7 Game page

**Removed:**
- `game-detail-jump-spine`, `game-detail-detail-rail`, `game-detail-action-bar` and `add-to-track-invite` (all under `src/widgets/game-detail/ui/`);
- `themes-tags-panel` and `related-panel`;
- `src/entities/game/ui/critic-score-ring` (no other users);
- `src/features/game-detail/ui/times-to-beat-section` and `times-to-beat-skeleton`;
- `src/features/browse-related-games/ui/related-games-tabs`;
- the hero backdrop, the bento grid and the `[1fr_320px]` rail grid inside `game-detail.tsx`.

**Header** (`src/widgets/game-detail/ui/game-header/`, wrapped in `CoverTint variant="header"`):
- **Top row.**
  - **Back:** a `<Link to="/library">` on the server and on first render. On click, it calls `router.history.back()` when `useCanGoBack()` is true (exported by `@tanstack/react-router` 1.170.42, false on SSR and on a cold load).
  - **"⋯":** a new `game-more-menu`, extracted from `game-library-controls` (`:103-134`). It holds Edit details…, I own it / I don't own it yet, Remove from library, and `UpNextMenuActions`. It shows only when the game is in the library, in both layouts.
- **Identity:** `GameCover size="lg"`; `[year, developer, genres[0]]` joined with " · " in normal case (the developer comes from involved companies flagged developer; today the line uses the publisher); the title in `font-display`.
- **`game-key-facts`:**
  - Length is `formatEvenings`.
  - Critics is `Math.round(aggregated_rating)`.
  - On is a new `formatPlatformFact(names, 3)` using `abbreviatePlatformName` (`src/entities/game/ui/platform-badges/platform-badges.utility.ts:89`, now exported from the `entities/game` public API), followed by "+N".
  - A missing fact is not rendered.
- **`game-header-actions`:** one branch per state in spec 2.6. Not in library means `AddGameAction` only. Signed out means the "Sign in to add this game" link.
  - **Assumption:** for a Done game, the existing `DoneOutcomeLabel` dropdown (Finished / Let go / Clear) stays next to the status control, so the reason can still be changed. The spec doesn't remove it.
- **`done-with-it`:** inline Finished / Let it go / Not yet with local state. Choosing a reason calls the status change with the reason (below), and the Done dialog opens pre-set.
- **Layout:** reuses the existing `items-end md:grid-cols-[200px_1fr]` hero grid (`game-detail.tsx:288`), so the right column is bottom-aligned with the cover. `pt-36 md:pt-44` (the backdrop room) goes.

**"Done with it?" plumbing:**
- `setStatusFn` and its worker take an optional `doneOutcome`, allowed only with `to: "DONE"`. `setLibraryItemStatusInTx` (`src/entities/library-item/api/set-library-item-status.server.ts`) writes it in the same transaction. The undo snapshot already carries `doneOutcome`.
- `changeStatusWithUndo` and `useSetStatus` pass it through.
- `DoneRequest` (`src/features/manage-library-entry/model/done-handler-context.tsx`) gains `initialOutcome`, and `DoneFollowUp` (`src/features/done-follow-up/ui/done-follow-up/done-follow-up.tsx:27`) seeds its state from it.
- Skip and close already save nothing (`save-done-follow-up-fn` sends only changed fields), so the stored reason stays.

**Body:**
- `game-detail.tsx` renders `grid md:grid-cols-2` with `Your play | About`, the cards stretched with `h-full`. About takes `md:col-span-2` when there's no Your play. Then the screenshots strip, then the related strip.
- **`your-play-card/`** (new):
  - Header: the title and a "New note" button (`openGlobalAction("log-session", slug)`).
  - The sessions line, "No sessions yet" when there are none, plus `game-rating`.
  - `GamePrompts`, moved from `game-library-controls`.
  - `game-notes-list`, capped at 2 with "All notes (n)" expanding in place.
  - `play-history`.
- **`about-panel`** (reworked):
  - a 4-line clamp with "More";
  - a Developer / Released (full date) / Main story / 100% list using `formatHours`, with rows left out when the value is unknown;
  - themes and genres as one tag group.
- **`screenshots-panel`:** the `md:grid-cols-5` grid (`:42`) becomes one `overflow-x-auto snap-x gap-3` row, with `min-w-0` on the page column. `ImageLightbox` is unchanged.
- **Related strip:** in `features/browse-related-games`, `collections[0]` only, titled "More in {name}", same-size `GameCover`s with the no-cover placeholder. "All {n}" expands in place, as `related-games-list.tsx:25-35` does today.

### 2.8 Library cards

- `src/widgets/library-item-card/ui/library-item-card/library-item-card.tsx` stops passing the StatusChip through `badges` (`:71-82`).
- `src/widgets/game-card` gains `lengthLabel?: string | null`. It always renders a fixed-height line after the title, blank when null, so neighbouring cards in the grid stay aligned. The value is `formatEvenings(item.game.timeToCreditsSeconds, eveningMinutes)`.
- No tint. Library cards don't use `CoverTint`.

---

## 3. Impact and Risk Analysis

**System dependencies.**
- IGDB `/game_time_to_beats` and the IGDB image CDN, which is now also fetched server-side.
- The `Game` table as a durable cache.
- The root current-user query.
- `useSetStatus` / `changeStatusWithUndo`, shared with the library and the Log sheet.
- The Done flow, shared with every Mark done.
- Spec 026 and 027 tests that encode the rules this spec replaces.

| Risk | Mitigation |
|---|---|
| `hastily` is missing for more games than `normally`, so fewer games show a length | Accepted by spec §2.1 (no figure, no length). The backfill prints coverage so the owner sees the real share |
| First view of an un-enriched game gets slower (IGDB call + 90 px image) | Only when a field is missing. Capped at 1.5 s; after that it renders without and retries. After the backfill, only new games pay it |
| Serverless freezes background work after the response | Nothing is fire-and-forget. All enrichment is awaited within the cap |
| `jpeg-js` leaks into the client bundle | Imported only from the `.server.ts` entity file. The pure hue code in `shared/lib` takes plain bytes. The CI `build` step catches import-protection breaks |
| Tint text unreadable for some hues | Fixed lightness per mode, a chroma cap, and the 0–359 sweep in `contrast.test.ts` in both modes |
| Hydration mismatch on "today / yesterday" near midnight | Time phrases render after hydration in the viewer's time zone |
| Float error in evening rounding (2.5 → 2) | Integer arithmetic in `formatEvenings`, with unit cases from spec §2.1 and §2.12 |
| Steam import of a large library multiplies IGDB calls | Batched `ensureGamesEnrichment` with the same throttle, soft-fail. The import result doesn't depend on it |
| Half-done "Done with it?" (Done without its reason) | The reason is written in the same transaction as the status |
| Dropping the HLTB columns loses data | Pre-check count on Neon must be 0; separate migration (0c) after 0a has shipped |
| Concurrent first views of one game | Writes are idempotent (same values); the last write wins harmlessly |
| Old tests asserting replaced rules (Up Next first, "Play next", chips on covers, rail, ring) | Rewritten to the new rules in the same slice, never just deleted. Listed in §4 |

---

## 4. Testing Strategy

**Unit (jsdom / node, mocked Prisma):**
- `shared/lib/evenings`: 14.5 h → "About 8 evenings"; 1.5 h → "One evening"; 51 h → 29; 4.375 h → 3; null → null; 3 h setting with 14.5 h → 5 and 2 h → "One evening".
- `shared/lib/date` `formatTimeAgo`: every row of the spec 2.3 table, including the 14- and 30-day edges.
- `shared/lib/cover-tint`: a red fixture gives a red hue; greyscale gives null; white with a small logo gives null; hue wrap-around near 0/359.
- `features/dashboard/model/orderContinueGames`: session order, fallback to the date it became Playing, both tie-breaks.
- `shared/ui/contrast.test.ts`: the tint sweep (2.6).
- Components (RTL, behaviour-level, given/when/then):
  - `use-continue-question` + `continue-panel`: the order; Not tonight through to the rest state and Ask me again; Log keeps the same game after the data reloads; Start then Undo; Replay wording; no stray separator without a platform.
  - `also-playing`, `dashboard-counts-line`, and `up-next-shelf` (captions, no chips, Replay first).
  - `game-header`: the five states; facts with "+N"; missing critics; the Back fallback.
  - `done-with-it` (three paths, reason pre-set), `game-more-menu`, `your-play-card` (2 notes + "All notes (5)", no "0 h", prompt per status), `about-panel`, the screenshots and related strips.
  - The library card length line and alignment; the evening `radio-group` and the Play settings page.

**Integration (real Postgres, worker imports, IGDB mocked at `src/shared/api/igdb/fetch.ts`):**
- `ensure-game-enrichment`: writes times and hue; sets `fetchedAt` when IGDB has no data; leaves it null on failure; refreshes after 30 days.
- `get-game-details` returns length and tint for a signed-out viewer.
- `get-dashboard-page-data`: question order from journal entries, keyed by game.
- `set-status-fn` with `doneOutcome` (atomic; rejected unless `to` is DONE; undo restores the previous reason).
- `set-evening-length` (valid and invalid values; `getCurrentUserFn` returns the value, and 105 when signed out).
- `get-library` select includes the new fields.
- Extend `test/factories` (`buildGame`, `createGame`, `buildLibraryItemWithGame`) with the new columns.

**Delete with their components:** the tests of `add-to-track-invite`, `game-detail-jump-spine`, `game-detail-action-bar`, `themes-tags-panel`, `related-panel`, `related-games-tabs`, `critic-score-ring`, `times-to-beat-section`, `times-to-beat-skeleton`, and the `get-times-to-beat-for-game` integration test.
**Rewrite:** `game-detail.test`, `routes/-games.$slug.test`, `-social-meta.test` (times-to-beat mocks), `dashboard-page.test`, `up-next-shelf.test`, `library-item-card.test`, `game-card.test`, `about-panel.test`, `game-library-controls.test`, `get-times-to-beat.integration`, `get-dashboard-page-data.integration`.

**Visual and phone checks:**
- `scripts/design-review` captures Home, the game page (Playing, Want, Done, not in library, signed out) and the Library.
- Phone 390 × 844, 360 and 430, then desktop 1440 × 900, in Light and Dark.
- Automated checks: no page-level sideways scroll, tap targets ≥ 44 × 44, the first Up Next cover fully visible at 390 × 844, and the bottom-bar Log in the bottom third.
- Covers for the review include one red, one green, one black-and-white and one with no cover art.
