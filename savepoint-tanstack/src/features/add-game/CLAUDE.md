# Feature: add-game

One add flow for the search page, the add dialog, the palette and the game page.

- `model/use-add-game.tsx`: one tap adds as Want via `addGameFn`, then opens `AddConfirmation` (custom sonner toast, 8 s manual timer). Undo is offered only when `created` is true.
- "Start playing" and "Put in Up Next" are injected through `AddFollowUpsProvider` (context), because they need `manage-library-entry` and `up-next`, which a feature may not import. `widgets/add-flow` wires them; `routes/__root.tsx` mounts it.
- `AddGameAction` is the add control. Features that cannot import this one (command-palette, search-games) receive it through a `renderAddAction` slot filled by the route.
- The optional "why" field (spec 026 slice 8) belongs inside `AddConfirmation`; its timer must pause while the field is focused.
