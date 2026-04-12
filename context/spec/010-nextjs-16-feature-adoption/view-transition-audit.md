>[toc]
# View Transition Audit

Audit of shared visual elements across route boundaries for Next.js 16 `experimental.viewTransition: true`.
The native View Transitions API morphs elements with matching `view-transition-name` CSS property during route changes.


## Transition Candidates

### Library Grid -> Game Detail Page
---

| Element | Source Component | Destination Component | Decision | Rationale |
|---|---|---|---|---|
| Cover image | `features/library/ui/library-card.tsx` (shared `GameCoverImage`) | `features/game-detail/ui/game-cover-image.tsx` | IMPLEMENT | Highest-impact transition; cover is the visual anchor users follow when navigating into a game |
| Game title | `features/library/ui/library-card.tsx` (`<p>` element) | `app/games/[slug]/page.tsx` (`<h1>`) | EXCLUDE | Font size, weight, and layout differ too much; morph would look jarring rather than smooth |
| Status badge | `features/library/ui/library-card.tsx` (`Badge`) | `features/game-detail/ui/library-status-display.tsx` | EXCLUDE | Badge on source is a small overlay; destination is a full status control -- layout mismatch |

### Search Grid -> Game Detail Page
---

| Element | Source Component | Destination Component | Decision | Rationale |
|---|---|---|---|---|
| Cover image | `features/game-search/ui/game-grid-card.tsx` (shared `GameCoverImage`) | `features/game-detail/ui/game-cover-image.tsx` | IMPLEMENT | Same rationale as library grid; cover is the visual thread between search results and detail |
| Game title | `features/game-search/ui/game-grid-card.tsx` (`<h3>`) | `app/games/[slug]/page.tsx` (`<h1>`) | EXCLUDE | Title is inside a gradient overlay in source; destination is plain heading -- morph would flash |
| Status badge | `features/game-search/ui/game-grid-card.tsx` (`Badge`) | `features/game-detail/ui/library-status-display.tsx` | EXCLUDE | Same layout mismatch issue as library grid |
| Release year | `features/game-search/ui/game-grid-card.tsx` (`<p>`) | `features/game-detail/ui/game-release-date.tsx` | EXCLUDE | Source shows year only; destination shows full date with different formatting and position |

### Journal Entries -> Game Detail Page
---

| Element | Source Component | Destination Component | Decision | Rationale |
|---|---|---|---|---|
| Cover image | N/A | `features/game-detail/ui/game-cover-image.tsx` | EXCLUDE | Journal entries on the game detail page do not display cover images; no source element to morph from |
| Game title | `features/game-detail/ui/journal-entries-section.tsx` (section heading) | `app/games/[slug]/page.tsx` (`<h1>`) | EXCLUDE | Journal section heading says "Your Journal", not the game title; these are on the same page anyway |

### Steam Import -> Game Detail Page
---

| Element | Source Component | Destination Component | Decision | Rationale |
|---|---|---|---|---|
| Cover image | `features/steam-import/ui/igdb-manual-search.tsx` | `features/game-detail/ui/game-cover-image.tsx` | EXCLUDE | Steam import uses small search result thumbnails; the flow is import-focused, not browse-focused -- transition would be disorienting |
| Page header | `app/(protected)/steam/games/page.tsx` (`<h1>`) | `app/games/[slug]/page.tsx` (`<h1>`) | EXCLUDE | Different text content ("Import from Steam" vs game title); not a shared element |


## Summary

| Decision | Count | Elements |
|---|---|---|
| IMPLEMENT | 2 | Cover image (library grid -> detail), Cover image (search grid -> detail) |
| EXCLUDE | 8 | Titles, badges, dates, journal entries, steam import elements |

### Implementation Plan

All IMPLEMENT candidates share the same `GameCoverImage` component. The `viewTransitionName` uses the pattern `game-cover-{igdbId}` applied to the cover image wrapper in three locations:

1. `features/game-search/ui/game-grid-card.tsx` -- source for search-to-detail transition
2. `features/library/ui/library-card.tsx` -- source for library-to-detail transition
3. `features/game-detail/ui/game-cover-image.tsx` -- destination for both transitions

The IGDB ID is used as the identifier because it is the shared numeric ID across both the IGDB search API response and the local database `Game.igdbId` column. The library card's game relation needs `igdbId` added to its Prisma select to make this work.
