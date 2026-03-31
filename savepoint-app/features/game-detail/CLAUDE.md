# Feature: game-detail

Full game detail page: cover image, description, release date, library status, journal entries, and times-to-beat.

## Structure

- `use-cases/` -- `get-game-details` orchestrates multiple services
- `ui/` -- individual detail sections, skeleton, not-found state
- `types.ts` -- feature-specific types

## Notes

- Imports from `manage-library-entry` (add/status controls) and `journal` (entries section)
- Server-side data loading via use-case pattern
