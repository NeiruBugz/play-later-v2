# Spec 015 note: Lambda pipeline retired. UI surfaces (sync button, import flow) remain intact,
# but background sync is permanently disabled — `isBackgroundSyncEnabled` is hardcoded `false`.

# Feature: steam-import

Steam library import pipeline: connect Steam account, fetch games, match with IGDB, and import to library.

## Structure

- `hooks/` -- Steam connection, game fetching, import/dismiss actions
- `server-actions/` -- disconnect, dismiss, import, trigger background sync
- `use-cases/` -- `import-game-to-library` orchestration
- `ui/` -- connect card, imported games list, import modal, error states
- `lib/` -- smart status calculation, formatters, utilities
- `config.ts` -- feature configuration

## Notes

- Largest feature by file count; many error-state UI variants
- Smart status algorithm auto-maps Steam playtime to library status
