# Feature: manage-library-entry

Shared UI library for all library CRUD operations: add, edit, delete, quick-add, and status changes. Used across multiple features.

## Structure

- `hooks/` -- `useLibraryModal`, `useGetPlatforms`
- `server-actions/` -- add, update, delete, quick-add, status change
- `use-cases/` -- `add-game-to-library`, `get-platforms-for-library-modal`
- `ui/` -- modal, forms, status controls, platform combobox, entry list, quick-add popover/button

## Public API (`index.ts`) groups

- Modal + layouts: `LibraryModal`, `DesktopLayout`, `MobileLayout`
- Forms: `EntryForm`, `AddEntryForm`, `EditEntryForm`
- Entry list/row: `EntryList`, `EntryRow`, `EntryTabs`, `LibraryItemCard`, `LibraryEntryMetadata`
- Form fields: `DateField`, `DateFieldsCollapsible`, `StatusSelect`, `StatusChipGroup`, `PlatformCombobox`
- Delete UI: `DeleteConfirmationDialog`, `InlineDeleteConfirm`
- Quick add: `QuickAddPopover`, `QuickAddButton`
- Constants: `STATUS_OPTIONS`
- Hooks: `useLibraryModal`, `useGetPlatforms`
- Schemas: `AddToLibrarySchema`, `UpdateLibraryStatusSchema`, `UpdateLibraryEntrySchema`, `UpdateLibraryStatusByIgdbSchema`, `GetLibraryStatusForGamesSchema`, `QuickAddToLibrarySchema`

## Notes

- Most-consumed cross-feature dependency (used by `game-detail`, `library`, `game-search`)
- Complex form with desktop/mobile responsive layouts
