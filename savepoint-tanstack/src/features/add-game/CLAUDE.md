# Feature: add-game

One add flow for the search page, the add dialog, the palette and the game page.

- `model/use-add-game.tsx`: one tap adds as Want via `addGameFn`, then opens `AddConfirmation` (custom sonner toast, or inline inside a modal; 8 s manual timer). Undo is offered only when `created` is true.
- "Start playing" and "Put in Up Next" are injected through `AddFollowUpsProvider` (context), because they need `manage-library-entry` and `up-next`, which a feature may not import. `widgets/add-flow` wires them; `routes/__root.tsx` mounts it.
- `AddGameAction` is the add control. Features that cannot import this one (command-palette, search-games) receive it through a `renderAddAction` slot filled by the route.
- The optional "why" field (spec 026 slice 8) belongs inside `AddConfirmation`; its timer must pause while the field is focused.

## Add confirmation "why" field

- Optional "Why do you want to play this?" field; the 8 s timer is paused while
  the field is focused or has text, then restarts. It saves through
  `AddFollowUps.saveWhy` (wired in `widgets/add-flow`; add-game cannot import
  library-prompts).
- Inside a modal Radix dialog (add dialog, command palette) the confirmation is
  rendered inline, not as a toast: the dialog's FocusScope listens on
  `document` and pulls focus back from any element outside it, so a toast input
  can never be typed into. `InlineAddConfirmationHost` (mounted by
  `AddGameContent` and, via the palette's `wrapBody` slot, by the root route)
  supplies the inline placement; without a host the hook falls back to the toast.
