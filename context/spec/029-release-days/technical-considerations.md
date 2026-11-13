# Technical Specification: Release days

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Status:** Completed
- **Author(s):** Nail Badiullin (with Claude; specialist input from prisma-database, tanstack-fullstack, react-frontend)

Paths are relative to `savepoint-tanstack/` unless they start with `context/` or `.github/`. Raw inventory with file:line citations: [research-notes.md](./research-notes.md). Choices marked **Confirmed** were settled with the owner on 2026-11-12.

---

## 1. High-Level Technical Approach

1. **Release precision and freshness live on the shared `Game` row.** Four new nullable columns hold the precision (day/month/quarter/year/TBA), when the date was last checked, and a shared "moved" marker. Vague dates are stored as the first day of their period, so no IGDB placeholder day can ever be read as a real day.
2. **One pure date module** (`entities/game/model/release-date.ts`) owns every rule in functional §2.0–2.7: labels, "upcoming", the Coming-soon window, the "Moved" line, month grouping. All comparisons use `YYYY-MM-DD` strings: the stored day read with UTC getters, "today" read from the device with local getters. No timezone shift is possible.
3. **Dates refresh after the page has opened (Confirmed).** Home and Library fire a background POST server fn after mount. It checks at most 100 due library games in batched IGDB requests and writes corrections, which show on the next opening (§2.6). There is no cron and pages don't wait for IGDB.
4. **New games get precision at creation** when the IGDB payload already carries `release_dates` (search, get-by-id, details). Steam-imported games are filled by the first refresh.
5. **UI:** a release line (and an optional "Moved from" line) on library cards, a Coming soon block on Home, a new `/upcoming` page, the game page's "Releases/Released" fact, and "Continue?" skipping unreleased Up Next games. A `useDeviceToday()` hook gives every surface the same device-local day without hydration errors.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Sequencing and slices

Every slice ships green (`format:check`, `lint`, `typecheck`, `test:unit`, `test:integration` when server/DB paths change, `build`).

| # | Slice | Functional § | Kind |
|---|---|---|---|
| 0 | Verify IGDB date formats live (2.4) and pin the id → precision mapping | — | spike |
| 1 | Migration (2.2); IGDB field lists + release mapper (2.4); creation path stores precision (2.5); `release-date.ts` model + `useDeviceToday` (2.7); `getLibrary` select; game page "Releases/Released" + header year (2.9) | 2.1, 2.3 | data + visual |
| 2 | Refresh: batch IGDB fetch, due-check query, `applyReleaseCheck`, `refreshReleaseDatesFn`, fired from Home and Library (2.6) | 2.6, 2.7 (data) | behaviour |
| 3 | Library cards: release line + "Moved from" line; remove unused `GameCard.releaseYear`; Library "Upcoming releases" link (2.8) | 2.2, 2.7 | visual |
| 4 | Home: Coming soon block + "Continue?" skip (2.8) | 2.4, 2.8 | visual + behaviour |
| 5 | `/upcoming` page (2.8) | 2.5 | visual |
| 6 | Owner review, phone first (390 × 844, then 360 and 430), then desktop 1440 × 900, Light and Dark | all | review |

Slice 4 (Coming soon) is the owner's first priority, but it needs slices 1–2 to have trustworthy data.

### 2.2 Data model

New enum and four nullable `Game` columns (`prisma/schema.prisma`, Game at :91-114). Migration name `YYYYMMDDHHMMSS_add_game_release_precision`. It is purely additive: no backfill `UPDATE`, no type change.

| Column | Type | Meaning |
|---|---|---|
| `releaseDatePrecision` | `ReleaseDatePrecision?` enum `DAY MONTH QUARTER YEAR TBA` | NULL = unknown: never checked, or the catalogue has no date |
| `releaseDateCheckedAt` | `DateTime?` | last successful catalogue check, shared across users |
| `releaseDateMovedFrom` | `DateTime?` (same type as `releaseDate`) | the previous **exact** date when a move was seen |
| `releaseDateMovedAt` | `DateTime?` | when SavePoint first saw that move; the 14-day window is evaluated at read time |

**State encoding**

| State | `releaseDate` | `releaseDatePrecision` | `releaseDateCheckedAt` |
|---|---|---|---|
| Exact day | the day (UTC midnight) | DAY | set |
| Month / quarter / year | first day of the period | MONTH / QUARTER / YEAR | set |
| TBA | NULL | TBA | set |
| No date | NULL | NULL | set |
| Legacy, never checked | as today (may be a placeholder) | NULL | NULL |

- **UI rule for legacy rows:** NULL precision shows no release line, and the row is excluded from Coming soon and `/upcoming`, which both require `DAY`. Existing year-only readers (search, add dialog, palette) are unchanged.
- **`releaseDate` stays `timestamp(3)`.** Changing it to `@db.Date` would trip the destructive-operation warning (`.github/workflows/pr-checks-tanstack.yml:197-223`) and buys nothing: Prisma returns UTC midnight either way, and every reader goes through the UTC-getter helpers.
- **Raw-SQL CHECK constraints** in the migration (Prisma ignores CHECKs, so there is no drift):
  - `(releaseDateMovedFrom IS NULL) = (releaseDateMovedAt IS NULL)`;
  - `releaseDatePrecision <> 'TBA' OR releaseDate IS NULL`;
  - `releaseDate IS NULL OR releaseDate = date_trunc('day', releaseDate)`.
- **Indexes:** none. Every query starts from one user's `LibraryItem` rows (`@@unique([userId, gameId])`, `@@index([userId, status])`) and joins `Game` by primary key over a few hundred rows.
- **Backfill script:** not needed. Refresh-on-open repairs legacy rows the first time their owner opens Home or Library. **Confirmed:** no one-off backfill.

### 2.3 Pure release-date model — `entities/game/model/release-date.ts`

New `model/` segment on `entities/game`, exported through the barrel. `CalendarDay` is a `"YYYY-MM-DD"` string.

| Function | Responsibility |
|---|---|
| `toStoredDay(date)` | stored `Date` → `CalendarDay` using UTC getters |
| `deviceToday(now)` | device `Date` → `CalendarDay` using local getters |
| `releasePeriodEnd({releaseDate, precision})` | last day of the period (the day itself for DAY) |
| `isUpcomingRelease(game, today)` | §2.0: DAY ≥ today; MONTH/QUARTER/YEAR until period end; TBA always; NULL precision → false |
| `formatReleaseLabel(game, {today, alwaysYear})` | §2.1 labels; `alwaysYear` for the game page (§2.3) |
| `formatComingSoonWhen(day, today)` | "Out today" / "Tomorrow" / "Fri 14 Mar" (+ year when in the next calendar year) |
| `selectComingSoon(candidates, today, {days: 30, limit: 3})` | window filter, nearest first, title A→Z tiebreak |
| `shouldShowMovedLine(game, today)` | movedFrom set and `movedAt` within the last 14 days |
| `groupByMonth(entries)` | `/upcoming` month sections |
| `describeReleaseFact(game, today)` | game page `{term: "Releases" / "Released" / "Release date", value}` |

- **Formatting:** `shared/lib/date.ts` gains `formatCalendarDay(day, {weekday?, year?})`, built from `Intl` parts with `timeZone: "UTC"` in a fixed day-month order ("14 Mar", "Fri 14 Mar"). `formatDayMonth` (:140-149) stays as is: it formats timestamps and its local getters are correct for those.
- **Cadence rule:** `isDueForCheck(game, now)` lives in `entities/game/model/release-check.ts`, next to `applyReleaseCheck`, so the server-side cadence stays apart from the UI date helpers. It is used server-side only, with a ±1-day slack around the UTC day: daily when a DAY date is ≤ 14 days ahead, weekly otherwise, never when the game is released.

### 2.4 IGDB layer — `shared/api/igdb/`

- **Spike (slice 0):** the IGDB docs don't list the `/v4/date_formats` ids. Run one `fields *;` query against `/date_formats`, plus one against `/games` for about three known games (one year-only, one quarter, one TBD), requesting `first_release_date, release_dates.date, release_dates.date_format, release_dates.y, release_dates.m, release_dates.status`. Pin the mapping as a constant with a unit test. **Confirmed:** agents can't read `.env` (a hook blocks it), so the implementer writes a small read-only script, `scripts/inspect-igdb-release-dates.ts`, that uses the app's IGDB client through `env.ts`, exposed as a package script `inspect:igdb-release-dates` (`tsx --env-file-if-exists=.env scripts/inspect-igdb-release-dates.ts`, the same shape as `backfill:enrichment` at `package.json:29`), and the owner runs it with `! pnpm --filter savepoint-tanstack inspect:igdb-release-dates`. Its output pins the mapping.
  - **Confirmed live on 2026-11-12:** `/date_formats` returns 0 `YYYYMMDD` (DAY), 1 `YYYYMM` (MONTH), 2 `YYYY` (YEAR), 3–6 `YYYYQ1`–`YYYYQ4` (QUARTER), 7 `TBD` (TBA).
  - IGDB fills the `date` of a non-DAY entry with a placeholder: the **first** day of the month for MONTH, the **last** day of the quarter or year for QUARTER and YEAR ("2026" arrives as 31 Dec 2026, "Q1 2027" as 31 Mar 2027). TBD entries have no `date`, `y` or `m`.
  - `first_release_date` follows the full-release and early-access entries. In the sample it skipped entries with status 1 and 2 and was absent when only such entries (or only TBD entries) existed. Every sampled `date` was UTC midnight.
- **Field lists:** add `release_dates.{date,date_format,y,m}` to search (`queries.ts:45-46`), get-by-id (`get-game-by-id.ts:28`) and details-by-slug (`get-game-details-by-slug.ts:17`). Extend `ReleaseDateSchema` (`schemas.ts:26-30`) to match. Leave the Steam match list (`match-steam-game.ts:39`) unchanged.
- **Mapper:** `release-date.ts` exports `mapIgdbReleaseDate(item) → {releaseDate: Date | null, precision: IgdbReleasePrecision | null} | "unknown"`. It is pure, and it uses its own string union that mirrors the Prisma enum, because `shared/` can't import entities.
  - **No `first_release_date`:** the result is TBA when `release_dates` is non-empty and every entry is TBD or has no `date`; otherwise `{null, null}` (for example a game whose only dated entry is a Beta).
  - **With `first_release_date`:** take the entries whose `date` equals it and pick the most precise one (DAY, then MONTH, QUARTER, YEAR), because placeholder days collide (a YEAR "2026" and a Q4 2026 entry both sit on 31 Dec 2026). No matching entry returns `"unknown"`.
  - **Period start, never the placeholder:** DAY keeps its day; MONTH is (`y`, `m`, 1); QUARTER starts at month `(format id − 3) × 3 + 1` of `y`; YEAR is (`y`, 1, 1). Every returned date is UTC midnight, so the calendar-day CHECK always holds.
  - An unknown or missing `date_format` returns `"unknown"` and logs a warning; the caller keeps the stored values.
- **Batch fetch:** `getGamesReleaseInfoByIgdbIds(ids)` sends `where id = (…); limit 100;`. Chunks of 100 run one after another with a 300 ms pause (the pattern in `backfill-game-enrichment.server.ts:5-6`). The LRU cache is kept: its 10-minute TTL is far below the 1-day cadence, and its in-flight dedupe absorbs a Home → Library double fire. A final failure throws `UpstreamError` (`get-game-by-id.ts:47-64` pattern).

### 2.5 Creation path — `entities/game/api/upsert-game.server.ts`

`findOrCreateGame` (:18-51) runs `mapIgdbReleaseDate` when the payload carries `release_dates`. It then writes `releaseDate`, `releaseDatePrecision` and `releaseDateCheckedAt = now`. Otherwise it keeps today's behaviour: precision and `checkedAt` stay NULL, and the first refresh fills them. Existing rows are still returned untouched; refreshing them is §2.6's job.

### 2.6 Refresh on open

| Piece | Path | Contract |
|---|---|---|
| Due query | `entities/game/api/get-games-due-release-check.server.ts` | `(userId, utcToday) → DueGame[]`. Prisma prefilter: the user's library games where `releaseDate` is NULL or `≥ Jan 1 UTC` of this year, or precision is TBA. Then `isDueForCheck` in TS. Ordered `checkedAt` nulls first, `take` 100. |
| Write rule | `entities/game/model/release-check.ts` (pure) | `(stored, fresh, now) → Prisma update data` (rules below). |
| Write query | `entities/game/api/apply-release-checks.server.ts` | applies updates per game with `updateMany where {id, releaseDate: stored, releaseDatePrecision: stored}` (compare-and-set), so concurrent visits record a move once. |
| Worker | `features/release-dates/api/refresh-release-dates.worker.ts` | `(userId) → {checked, updated}`: due query → batch fetch → map → write. Catches `UpstreamError`, logs a warning, stamps nothing on failure. |
| Server fn | `features/release-dates/api/refresh-release-dates.ts` | `refreshReleaseDatesFn`, POST, no input; `requireUserId()` → worker. |
| Client trigger | `features/release-dates/model/use-refresh-release-dates.ts` | fired once in a mount effect by the Home and Library route components. Errors are swallowed, and there is no router invalidation: corrections show on the next opening (§2.6). |

**`applyReleaseCheck` rules (§2.6–2.7):**
- **Always:** set `releaseDateCheckedAt = now`.
- **Mapper returned `"unknown"` or `{null, null}`:** only stamp `checkedAt`, never blank stored values. This covers a case where IGDB loses data.
- **Otherwise:** write the fresh `releaseDate` and precision.
- **Moved marker:** set `movedFrom = stored date` and `movedAt = now` only when all of these hold:
  - the stored precision was DAY;
  - the stored day was not already past;
  - the fresh date or precision differs, including DAY → vaguer or TBA;
  - the fresh value is still upcoming.
  
  A fresh date in the past means the game came out early: it counts as released and gets no marker. A repeat move overwrites both fields, so the line shows the most recent old date and the 14 days restart.
- **Released games:** skipped by `isDueForCheck`. NULL precision with a past date counts as released after its one legacy check.

**Quota:** at most 100 ids and at most 1 IGDB request per visit (2 for Home then Library within 10 minutes, deduped by the cache). This is far below 4 requests per second. **Confirmed:** a 100-game cap per visit; a larger first-time backlog is repaired over a few visits.

### 2.7 Device "today" — `shared/lib/hooks/use-device-today.ts`

`useDeviceToday(): CalendarDay` uses `useSyncExternalStore` (the same approach as `useHydrated`, `continue-panel.tsx:22-30`). The server snapshot is the UTC day and the client snapshot is the device-local day. React renders the server value while hydrating, then re-renders if the two differ. This avoids hydration errors and blank first paints, and causes no layout shift because the lines exist either way. It also re-evaluates on `visibilitychange`, so a tab left open past midnight updates. **Confirmed:** within a few hours of local midnight, a first paint can show the UTC day for a moment before correcting; this is accepted over a blank first paint.

### 2.8 Read paths and UI

| Surface | Data | UI |
|---|---|---|
| Library cards (§2.2, §2.7) | `getLibrary` select (`get-library.server.ts:56`) adds `releaseDatePrecision`, `releaseDateMovedFrom` and `releaseDateMovedAt`; `LibraryItemWithGame` (`entities/library-item/model/types.ts:31`) is updated | new `entities/game/ui/release-lines/` (display-only) renders "Out 14 Mar" / "Date TBA" and, when applicable, "Moved from 14 Mar" (muted `text-xs`, nothing when nothing applies). Placed after the length line in `LibraryGridTile` (`widgets/library-page/ui/library-page/library-page.tsx:112-117`) and `LibraryItemCard` (~:92-97). Alignment holds without reserved space: cover, title and length sit above, and the controls are pinned by `mt-auto` (:140). The unused `GameCard.releaseYear` and its `showMeta` branch (`widgets/game-card/ui/game-card/game-card.tsx:28,75-77`) are deleted. |
| Library link (§2.5) | — | a quiet `<Link to="/upcoming">Upcoming releases</Link>` in the Library `PageHeader` actions (`library-page.tsx:323-335`), first, with the same classes as "Import from Steam". |
| Home Coming soon (§2.4) | new `getComingSoonCandidates(userId, utcToday)` in `entities/library-item/api/`, added to the `Promise.all` in `get-dashboard-page-data.worker.ts:31-66`: DAY precision, window `[utcToday−1, utcToday+31]`, date then title, `take` 10 | `widgets/dashboard-page/ui/coming-soon/` renders between `AlsoPlaying` / `EmptyState` and `DashboardCountsLine` (`dashboard-page.tsx:44-66`). It calls `selectComingSoon(candidates, useDeviceToday())` and renders `null` when empty. Untinted. Entries are `Link`s to `/games/$slug` (min-h-11, small cover, truncated title, "when" text), followed by "See all upcoming" → `/upcoming`. |
| "Continue?" (§2.8) | Up Next items already come from `getLibrary` and gain the release fields | `useContinueQuestion` (`widgets/dashboard-page/model/use-continue-question.ts:24-69`) takes `today`. `queueHead = upNextQueue.find(i => !isUpcomingRelease(i.game, today)) ?? null`. A queue that is all upcoming falls through to the existing `rest` kind. `ContinuePanel` passes `useDeviceToday()`. |
| `/upcoming` (§2.5) | route `routes/_authed/upcoming.tsx` with a loader through `getUpcomingReleasesFn` (GET, `features/upcoming-releases/api/` + worker; the loader-safe pattern from the CONTEXT.md bundler caveat) → entity query `getUpcomingReleases(userId, utcToday)`: DAY precision, `releaseDate ≥ utcToday−1`, date then title | `widgets/upcoming-releases-page/ui/upcoming-releases-page/`: `PageHeader` "Upcoming releases"; one `<section aria-labelledby>` per month with an `<h2>` ("March 2027") and a `<ul>`. Each row is a full-width `Link` (min-h-14): "Fri 14" or "Out today", cover, title, `StatusChip`, `NotOwnedTag`, and the moved line from `ReleaseLines`. Single column, `max-w-2xl`. The empty state uses the exact §2.5 copy. The `_authed` guard sends signed-out visitors to sign-in. |

### 2.9 Game page (§2.3)

- **About panel:** the "Released" fact (`widgets/game-detail/ui/about-panel/about-panel.tsx:27-31`) is replaced by `describeReleaseFact(game, useDeviceToday())`:
  - upcoming → `Releases` + label with the year;
  - TBA → `Release date` + `TBA`;
  - released → `Released` + label with the year;
  - no date → no fact.
  
  `formatAbsoluteDate` is dropped here. The page loader passes the precision through. It works the same signed out.
- **Legacy fallback:** the game page already fetches live IGDB details on every view, and slice 1 extends that payload with `release_dates`. When the stored precision is NULL (a row no refresh has reached, for example a game in nobody's library), the page shows `mapIgdbReleaseDate(details)` instead. Without this, those pages would lose their release line. Nothing is written back, so the game page still starts no check (§2.6).
- **Header year:** the identity-line year (`widgets/game-detail/ui/game-header/game-header.tsx:61-65`) reads the stored `releaseDate` (UTC year) when the precision is DAY, MONTH, QUARTER or YEAR. It falls back to IGDB `first_release_date` only when nothing is stored, so the header and the Releases fact can't disagree.
- **No refresh trigger:** the game page doesn't start a check (§2.6).

---

## 3. Impact and Risk Analysis

**System dependencies**
- IGDB `/games` with nested `release_dates`, through the existing token, fetch and cache stack.
- Shared `Game` rows: one refresh corrects every user who has that game.
- The dashboard worker, `getLibrary`, the Continue? hook, the library card components and the game page's About panel and header.
- Spec 028's Home invariants: one tinted surface, a fixed order, and the first Up Next cover visible at 390 × 844. Coming soon sits below "Also playing", so it can't push the shelf.

**Risks and mitigations**

| Risk | Mitigation |
|---|---|
| The `date_format` id mapping is wrong (undocumented) | Slice 0 spike + pinned constant + unit test; an unknown id returns `"unknown"`, never DAY |
| A vague date shown as a day | Period-start normalisation from `y`/`m`; every day-level query and label requires `DAY` |
| IGDB request storm or 429 | 100-id cap, one sequential request per visit, cache dedupe, `checkedAt` only advances on success, the existing single 429 retry |
| Failure loop when IGDB is down | Nothing is stamped on failure, so the next visit retries, bounded by the cap. Add a short negative stamp only if logs show hammering |
| Concurrent refresh of one game | Compare-and-set update, so the move is recorded once |
| Midnight off-by-one on first paint | `useDeviceToday` corrects right after hydration, with no layout change |
| `first_release_date` is an early-access or regional date | Accepted: functional scope uses the first release anywhere |
| Legacy rows stay without a date line until checked | Repaired on their owner's first Home or Library open |
| Background POST on every Home/Library open | Cheap when nothing is due: one indexed per-user query, no IGDB call |

---

## 4. Testing Strategy

TDD per slice (tests first), following `.claude/rules/tanstack/testing.md` and the component test conventions in `savepoint-tanstack/CLAUDE.md`.

- **Unit, pure, with a fixed `today` string:**
  - `release-date.ts`:
    - every §2.1 label, same year and next year;
    - the New York case (`2027-03-14T00:00Z` reads "14 Mar");
    - `isUpcomingRelease` at the 31 Mar, 30 Jun and 31 Dec period ends, plus TBA, NULL and yesterday;
    - `formatComingSoonWhen` for today, tomorrow, and 28 Dec → 2 Jan with the year;
    - the Coming soon window (day 30 in, day 31 out), the cap of 3 and the same-day title order;
    - `shouldShowMovedLine` on day 14 vs day 15;
    - `groupByMonth`;
    - `isDueForCheck` daily vs weekly, and released games skipped.
  - `mapIgdbReleaseDate`: each format, period-start normalisation, no matching entry, TBA, unknown format.
  - `applyReleaseCheck`: DAY→DAY, DAY→vague, DAY→TBA, vague→DAY (no marker), legacy NULL (no marker), new date in the past, a repeat move, and IGDB losing data.
  - `getGamesReleaseInfoByIgdbIds`: chunking and a 429 fall-through.
- **Integration, real PG, workers imported directly per foot-gun #8:**
  - the migration's CHECKs reject a half-set moved pair and a TBA row with a date;
  - `getComingSoonCandidates` and `getUpcomingReleases`: window edges, DAY-only, ordering, per-user isolation;
  - `getLibrary` returns the new fields;
  - the due query covers the NULL-checked, stale daily, stale weekly and released cases, and the cap of 100;
  - `refresh-release-dates.worker` with IGDB mocked:
    - a correction is written and visible to a second user who has the same game;
    - a failure stamps nothing;
    - a compare-and-set race yields one marker.
- **Component** (elements/actions vocabulary, given/when/then, assertion-only `it`s, fixed `today` injected):
  - `ReleaseLines`;
  - the library tile and card in both views;
  - `ComingSoon`:
    - hidden when empty;
    - "Out today" first;
    - cap of 3;
    - the "See all upcoming" href;
    - an entry links to its game;
  - `UpcomingReleasesPage`:
    - month headings;
    - "Out today";
    - the Not owned tag;
    - the moved line;
    - the empty copy;
  - the About panel (Releases / Released / Release date TBA / none);
  - `ContinuePanel` (skips an upcoming head; "Nothing tonight is fine too." when all are upcoming).
- **Layout checks** (`verify-ui`): the 390 × 844 first Up Next cover with Coming soon present, a single tinted surface, grid-row alignment with the extra lines, and no sideways scroll on `/upcoming`.
- **Gate:** `format:check`, `lint` (FSD boundaries: `shared/api/igdb` must not import entities), `typecheck`, `test:unit`, `test:integration`, and `build` (catches `.server.ts` leaking into the client from the new hook or server fn).
