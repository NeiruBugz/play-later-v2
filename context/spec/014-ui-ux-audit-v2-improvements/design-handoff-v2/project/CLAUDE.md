# Feature: game-search

Browse/search games via IGDB with category filtering and list/grid view toggle. Client-side feature with hooks for search state.

## Structure

- `hooks/` -- search state, library status, view preference
- `ui/` -- search input, results grid, game cards, category badges, quick-add
- `lib/` -- category label helper
- `constants.ts`, `schemas.ts`, `types.ts`

## Notes

- Purely client-side; no server actions or use-cases
- Uses `manage-library-entry` quick-add popover for adding games inline
