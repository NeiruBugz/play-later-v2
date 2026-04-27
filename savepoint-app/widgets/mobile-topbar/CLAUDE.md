# Widget: mobile-topbar

Sticky top app-bar for `<md` viewports on authenticated routes. Renders the SavePoint brand mark (linked to `/dashboard`), a search icon button that opens the command palette, and the theme toggle.

## Structure

- `ui/mobile-topbar.tsx` — `MobileTopbar` client component

## Import Rules

- Imports `command-palette` from `features/` (authorized in `features/CLAUDE.md`) to open the palette via `useCommandPaletteContext().open()`
- Imports `ThemeToggle` from `shared/components/`
- Must NOT import from `app/`, other `widgets/`, or `data-access-layer/`

## Layout Integration

Mounted inside `CommandPaletteProvider` in `app/(protected)/layout.tsx` and `app/games/layout.tsx`. The component carries its own `md:hidden` so the layout does not need to wrap it.
