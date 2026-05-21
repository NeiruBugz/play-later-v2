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
  Also renders an "Add to Up Next" quick action.
- `api/quick-add-to-library-fn.ts` — adds a searched IGDB game to the
  library at `UP_NEXT` (composes `addGameToLibrary`).
- `api/remove-library-item-fn.ts` — undo side of quick-add (composes
  `deleteLibraryItem`).
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

Remaining feature gaps vs `savepoint-app/features/command-palette/`:

1. ~~No quick-add flow.~~ **Closed (Slice 22).** Each game result row
   renders an "Add to Up Next" action (canonical `showAddHint` +
   `useQuickAddFromPalette`). It calls the feature's own
   `quickAddToLibraryFn` (status `UP_NEXT`) and emits an undo toast that
   calls `removeLibraryItemFn`. Both server fns live in
   `api/` so the palette never imports another feature's server fn.
2. **No recent-games empty state.** Canonical loads recent library
   games on open; tanstack lacks the entity query.
3. ~~No mobile-sheet variant.~~ **Closed (Slice 22).** At `<768px`
   `command-palette.tsx` renders the same `Command` body inside a bottom
   `Sheet` (`data-testid="command-palette-mobile-sheet"`); the centered
   `Dialog` is md+ only. Gated by `useMediaQuery("(min-width: 768px)")`.

Minor: "New journal entry" routes to `/journal` (canonical goes to
`/journal/new`, which tanstack doesn't have).

Full reasoning in `../../DIVERGENCES.md` → "Slice 17 — Command palette".
