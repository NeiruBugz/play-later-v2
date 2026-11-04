# Feature: done-follow-up

Server functions for the optional follow-up after a game is marked Done
(spec 026 §2.7).

## Structure

- `api/save-done-follow-up-fn` — `{ id, outcome?, rating?, stayed? }` ->
  `{ noteId? }`. One transaction in `saveDoneFollowUp` (library-item entity):
  omitted fields are untouched, `rating` replaces the game's rating, a
  non-empty `stayed` becomes a note with prompt `STAYED`. The game must be
  Done (`ValidationError` otherwise).
- `api/set-done-outcome-fn` — `{ id, outcome: FINISHED | LET_GO | null }` ->
  `{ doneOutcome }`. Edits the label from the game page; Done games only.

## Invariants

- Skip and close are not server calls: nothing is written.
- Follow-up Undo is `undoStatusFn` with the Done transition's undo payload.
  Save has not run when Undo is tapped, and the snapshot already carries
  `doneOutcome`, so the snapshot needs no rating.
- `doneOutcome` is private: owner reads only, never aggregated, never in
  friend-facing reads.

## UI

- `ui/done-follow-up` — the modal (dialog/sheet). Close, Skip, Escape and
  outside tap are the same Skip: no server call. Save sends only what the user
  changed and stays open with the entered values and the mapped error copy on
  failure. It does not know how it is opened: `widgets/done-flow` opens it from
  the `DoneHandler` seam in manage-library-entry and supplies the Undo.
