# Feature: command-palette

App-wide command palette (Cmd+K) for quick game search and navigation. Provides both desktop and mobile variants.

## Structure

- `server-actions/` -- `get-recent-games` for quick results
- `ui/` -- provider, desktop/mobile variants, game result items

## Notes

- Mounted at layout level via `CommandPaletteProvider`
- Migrated from `shared/` to follow FSD conventions
- Uses `shared/hooks/use-command-palette` for open/close state
