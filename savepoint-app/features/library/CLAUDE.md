# Feature: library

Library page with filterable grid of the user's game collection. Supports status filtering, platform filtering, rating filters, and swipe actions on mobile.

## Status taxonomy (shelf metaphor)

The library uses a physical-shelf metaphor. Status enum (`LibraryItemStatus`): `WISHLIST`, `SHELF`, `UP_NEXT`, `PLAYING`, `PLAYED`. Transition verbs live in `@/shared/lib/library-status.ts` under `getStatusActions` (e.g. "Queue it", "Set it down", "Put on the shelf"). Labels, icons, and badge colors are sourced from `LIBRARY_STATUS_CONFIG`.

`PLAYED` badges render violet (hue ~295) so they are categorically distinct from `PLAYING` teal at thumbnail size.

## Filter bar

Two-row structure (shared between desktop and mobile):
1. Status chips + optional Steam import icon
2. Search + sort + "More" disclosure button + clear-all

Behind the "More" disclosure: platform combobox, minimum-rating stars, unrated-only toggle. Steam import lives in the status-chip row when `isSteamConnected`.

## Cards

`LibraryCard` accepts an `activeStatusFilter` prop. When the card's status equals the active filter, the badge is suppressed to avoid redundant labeling.

The rating row is a fixed-height slot so rated and unrated cards line up vertically in the grid.

## Structure

- `hooks/` -- library data, filters, platform list, status updates
- `server-actions/` -- status update mutation
- `ui/` -- library grid, card with action bar, filters, empty state, skeleton

## Notes

- Imports from `manage-library-entry` for edit/delete modals
- Exports `LibraryCard` for dashboard use
- Grid density: 3 cols (sm 5, md 6, lg 8, xl 10, 2xl 12)
