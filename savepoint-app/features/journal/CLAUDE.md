# Feature: journal

Gaming journal for logging play sessions, progress notes, and ratings. Full CRUD with inline game selector.

## Structure

- `hooks/` -- journal entry dialog state
- `server-actions/` -- create, update, delete entries; fetch helpers
- `ui/` -- forms, timeline, cards, detail view, FAB, quick-entry sheet

## Notes

- Exported for cross-feature use by `game-detail` and `dashboard`
- Desktop and mobile dialog variants for entry creation
