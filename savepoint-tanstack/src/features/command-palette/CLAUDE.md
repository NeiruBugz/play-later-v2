# Feature: command-palette

App-wide ⌘K / Ctrl+K palette. Mounted once at the root (`__root.tsx`
`RootShell`) when a user is signed in; the sidebar and mobile topbar
search-trigger buttons fire `openCommandPalette()` which dispatches a
`savepoint:command-palette:open` event the component listens for.

## Structure

- `hooks/use-command-palette.ts` — open / close / toggle + global
  ⌘K binding + the custom-event channel. Exports `openCommandPalette()`
  so external widgets can open the palette without a context provider.
- `hooks/use-debounced-value.ts` — generic debounce hook. Currently
  unused by `command-palette.tsx` (the component uses an imperative
  timer for test determinism), but kept available for other features.
- `ui/command-palette/` — main palette. Composes shadcn `Command` /
  `CommandInput` / `CommandList` / `CommandGroup` primitives (with
  `shouldFilter={false}` since search is server-side). Owns the 300ms
  debounce; passes an `inputRef` down so the "Add game to library"
  quick action can refocus.
- `ui/game-result-item/` — single Games-group row. Cover + name +
  release year wrapped in a TanStack `<Link to="/games/$slug">` so back-
  button history works and the test contract can assert on the href.
- `ui/palette-navigation-group/` — five jump targets (Library, Journal,
  Profile, Settings, Dashboard). Substring-filtered by the live query;
  renders nothing when no item matches.
- `ui/palette-quick-actions-group/` — two actions: "Add game to library"
  (refocuses the input) and "New journal entry" (navigates to
  `/journal`).

## Key behaviours

- ⌘K (and Ctrl+K) toggles open from any page.
- Esc closes (Radix Dialog default).
- Typing fires `searchGamesFn` exactly once per debounced query.
- Search-result rows are `<Link>`s so the back button works.
- Navigation rows are also `<Link>`s; quick actions are imperative.

## Divergences from canonical

Three remaining feature gaps vs `savepoint-app/features/command-palette/`:

1. **No quick-add flow.** Result rows always navigate to the detail
   page; canonical's `useQuickAddFromPalette` calls `addToLibraryAction`
   with an undo toast. Wire when the `manage-library-entry` feature is
   ported.
2. **No recent-games empty state.** Canonical loads recent library
   games on open; tanstack lacks the entity query.
3. **No mobile-sheet variant.** Spec 021 Slice 18A owns the visual-
   parity sweep; the desktop dialog renders at every breakpoint today.

Minor: "New journal entry" routes to `/journal` (canonical goes to
`/journal/new`, which tanstack doesn't have).

Full reasoning in `../../DIVERGENCES.md` → "Slice 17 — Command palette".
