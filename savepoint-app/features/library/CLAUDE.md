# Feature: library

Library page with filterable grid of the user's game collection. Supports status filtering, platform filtering, and swipe actions on mobile.

## Structure

- `hooks/` -- library data, filters, platform list, status updates
- `server-actions/` -- status update mutation
- `ui/` -- library grid, card with action bar, filters, empty state, skeleton

## Notes

- Imports from `manage-library-entry` for edit/delete modals
- Exports `LibraryCard` for dashboard use
- Mobile card supports swipe-to-reveal actions
