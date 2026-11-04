# Feature: command-palette

App-wide ⌘K / Ctrl+K palette. Mounted once at the root (`__root.tsx`
`RootShell`) when a user is signed in; the sidebar and mobile topbar
search-trigger buttons fire `openCommandPalette()` which dispatches a
`savepoint:command-palette:open` event the component listens for.

## Structure

- `hooks/use-command-palette.ts` — open / close / toggle + global
  ⌘K binding + the custom-event channel.
- `hooks/use-debounced-game-search.ts` — 300 ms imperative debounce (for
  test determinism) around the library-aware `searchGamesFn`.
- `ui/command-palette/` — main palette (shadcn `Command`, `shouldFilter={false}`
  since search is server-side). Shows "See all results" (`/games/search?q=`)
  under the results once the text is long enough for the search page.
- `ui/game-result-item/` — Games-group row: cover + name + year in a
  `<Link to="/games/$slug">`. Games already in the library show "In library"
  with their status and queue marker. Games outside it render the
  `renderAddAction` slot.
- `ui/palette-navigation-group/` — five jump targets, substring-filtered.
- `ui/palette-quick-actions-group/` — one action: "New note", which opens the
  note composer through `openGlobalAction(navigate, "log-session")`.

## Add flow

The palette does not add games itself. `renderAddAction` is a slot the root
route fills with `AddGameAction` from `features/add-game` (a feature may not
import a sibling feature). Adding keeps the palette open; the confirmation
("Added {Game} to Want", Start playing, Put in Up Next, Undo) is the shared
add-game confirmation, rendered inline in the palette through the `wrapBody`
slot (a toast cannot take focus inside the modal), wired by `widgets/add-flow`. The palette's own quick-add and
remove-as-undo server fns no longer exist.

## Key behaviours

- ⌘K (and Ctrl+K) toggles open from any page; Esc closes.
- Typing fires `searchGamesFn` once per debounced query.
- Result and navigation rows are `<Link>`s so the back button works.
- No technical source names ("IGDB") in user-facing copy.

## Divergences from canonical

No recent-games empty state (canonical loads recent library games on open).
The mobile variant is a bottom `Sheet` below 768 px. See
`../../DIVERGENCES.md` → "Slice 17 — Command palette".
