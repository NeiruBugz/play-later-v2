# Widget: header

App-wide navigation header with responsive design. Renders site branding, nav links, theme toggle, and command palette trigger.

## Structure

- `ui/header.tsx` -- Main header with desktop navigation and search trigger
- `ui/mobile-nav.tsx` -- Bottom navigation bar for mobile viewports

## Notes

- Migrated from `shared/components/` to follow FSD conventions
- Imports command palette from `features/command-palette` (via context provider)
- Mounted at layout level in both `(protected)` and `games` route groups
