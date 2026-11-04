# Feature: library-prompts

Server functions for the two optional one-line prompts (spec 026 §2.8):
"Why do you want to play this?" (`WHY`) and "What stayed with you?" (`STAYED`).

## Structure

- `api/answer-prompt-fn` — `{ id, kind, text }` -> `{ noteId }`. Creates a note
  carrying the prompt through `createJournalEntry`, so the journal rules apply
  (empty text is a `ValidationError`).
- `api/dismiss-prompt-fn` — `{ id, kind }` -> `{}`. Writes
  `whyPromptDismissedAt` / `stayedPromptDismissedAt`.

## Invariants

- Whether a prompt shows is derived in `getGameDetails` (`prompts: { why,
stayed }`): `why` = Want, no `WHY` note, not dismissed; `stayed` = Done, no
  `STAYED` note and no dismissal at or after `statusChangedAt`. Neither shows
  while Playing. Nothing is reset on a new Done.

## UI

- `ui/game-prompts` — `GamePrompts` on the game page: one row per true flag
  (input, Save/Enter, × dismiss). `router.invalidate()` runs only after a save
  or dismiss succeeded; a failure keeps the text and shows the mapped copy.
- The add confirmation's "why" field lives in `features/add-game` and reaches
  `answerPromptFn` through `AddFollowUps.saveWhy`, wired in `widgets/add-flow`
  (features cannot import each other).
