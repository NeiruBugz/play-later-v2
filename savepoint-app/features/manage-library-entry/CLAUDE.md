# Feature: manage-library-entry

Shared UI library for all library CRUD operations: add, edit, delete, quick-add, and status changes. Used across multiple features.

## Structure

- `hooks/` -- modal state, platform fetching
- `server-actions/` -- add, update, delete, quick-add, status change
- `use-cases/` -- `add-game-to-library`, `get-platforms-for-library-modal`
- `ui/` -- modal, forms, status controls, platform combobox, entry list

## Notes

- Most-consumed cross-feature dependency (used by `game-detail`, `library`, `game-search`)
- Complex form with desktop/mobile responsive layouts
