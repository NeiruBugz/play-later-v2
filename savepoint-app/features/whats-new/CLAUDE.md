# Feature: whats-new

App-wide "What's New" modal showing recent updates and changelog entries.

## Structure

- `hooks/` -- `use-whats-new` manages modal visibility and dismissal
- `ui/` -- modal component
- `config.ts` -- changelog entries and version configuration
- `types.ts` -- feature-specific types

## Notes

- Mounted at protected layout level
- Version-tracked: modal shows only for unseen updates
