# Feature: command-palette

App-wide command palette — the single search/quick-add surface across all breakpoints. Reachable via the global ⌘K / Ctrl+K shortcut, the desktop rail search button, the mobile top-bar search button, and any "Add Game" CTA on the dashboard.

## Result groups

The palette renders three labeled groups (desktop and mobile share the same model):

- **Games** — IGDB search results (or recent library games when the input is empty). Selecting a search result triggers quick-add via `useQuickAddFromPalette` (see spec 012 §2.11) and emits an undo toast. Selecting a recent game navigates to its detail page.
- **Navigation** — jump to Library, Journal, Timeline, Profile, Settings, or Dashboard. Filtered by simple substring match on label.
- **Quick actions** — at minimum: "Add game to library" (focuses the input so the user can type a title) and "New journal entry" (navigates to `/journal/new`).

## ⌘K binding

The provider's `useCommandPalette` hook owns the single global ⌘K / Ctrl+K listener. No other surface in the app rebinds ⌘K. The library hero search is bound to `/`; the sidebar shortcut is `⌘B`.

## Structure

- `hooks/use-command-palette.ts` — open / close / toggle + global ⌘K binding
- `hooks/use-quick-add-from-palette.ts` — quick-add mutation + undo toast
- `server-actions/get-recent-games.ts` — recent library games for the empty state
- `ui/command-palette.tsx` — selects desktop vs mobile variant by viewport
- `ui/desktop-command-palette.tsx`, `ui/mobile-command-palette.tsx` — variants
- `ui/palette-navigation-group.tsx`, `ui/palette-quick-actions-group.tsx` — shared groups
- `ui/game-result-item.tsx` — Games row
- `ui/command-palette-provider.tsx` — provides open / close to the rest of the app
