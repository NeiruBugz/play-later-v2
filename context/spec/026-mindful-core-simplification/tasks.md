# Tasks: Mindful Core Simplification (spec 026)

Source: [functional-spec.md](./functional-spec.md), [technical-considerations.md](./technical-considerations.md). Paths relative to `savepoint-tanstack/`.

Verify-task conventions:
- Start the dev server (`pnpm --filter savepoint-tanstack dev`, port 6060) in the background and record its PID.
- Drive the UI with the Playwright MCP plus the `verify-ui` skill.
- Sign in with the credentials provider (`AUTH_ENABLE_CREDENTIALS=true`).
- If IGDB is unreachable, seed `Game` rows directly in the local DB.
- At the end of the task, stop the server **by its recorded PID** and delete every screenshot, trace and generated script the task produced.

- [ ] **Slice 1: Three statuses everywhere, and a status only changes when the user changes it**

  > After this slice the app runs on Want / Playing / Done (spec §2.1, §2.2, §2.12 data conversion, §2.13 labels). Existing controls are reused, with relabelled 3-option pickers.
  - [ ] Add `libraryItemFactory` and `playFactory` test helpers under `test/` (status, `upNextPosition`, `isOwned`, `doneOutcome`, open/ended plays). **[Agent: testing]**
  - [ ] Schema plus migration A `<ts>_mindful_core_model`:
    - The new enum `LibraryItemStatus { WANT, PLAYING, DONE }`, the enums `DoneOutcome` and `JournalPrompt`, and the new columns.
    - `@@unique([userId, upNextPosition])`, the `CHECK` 1..5, and `@@unique([userId, gameId])`.
    - The 10-step backfill exactly as in technical-considerations §2.2 (queue first, then the remap inside the old enum, then the enum swap).
    - Legacy columns stay in the schema.
    - Run `prisma:generate`. **[Agent: prisma-database]**
  - [ ] Migration test `test/integration/mindful-core-migration.integration.test.ts`:
    - Apply every prior migration, seed legacy rows with raw SQL, then execute the **real** migration A file read from disk.
    - Cover all seed cases from technical-considerations §4.
    - Assert the invariants: row counts unchanged; ≤5 queued per user with unique positions; open plays = PLAYING items; the `(userId, status)` index exists; the notice flag is set. **[Agent: prisma-database]**
  - [ ] Add a pre-deploy section to `docs/cutover-rollback.md`:
    - Create a Neon branch of production.
    - Run the duplicate `(userId, gameId)` pre-check query.
    - Dry-run migration A on the branch.
    - Rollback = restore the branch; a Vercel revert alone is not enough.
    - Nothing in this task touches infra. **[Agent: prisma-database]**
  - [ ] Rewrite `entities/library-item/model/status.ts` as the client-safe single source of truth:
    - 3 statuses, the Zod schema, label/icon/badge, `NEXT_STEP`, `getQueueMarker`, `getDoneLabel`, `UP_NEXT_MAX`. **[Agent: tanstack-fullstack]**
  - [ ] Status core in entities:
    - Add `setLibraryItemStatus`. It runs in one transaction with a row lock: it writes `status` and `statusChangedAt`, opens a play on →PLAYING (leaving the queue and compacting it), closes the open play when leaving PLAYING, and returns the undo payload.
    - Delete `derive-playthrough-status.ts`, `sync-library-status`, `set/clear-library-status-manual`, and the playthrough create/update/delete status sync.
    - Update `getLibrary` (3 statuses, drop `startedOnly`/TOUCHED), the counts, `getLibraryStats`, `getLibraryItemsByIgdbIds` (status + `upNextPosition`), and `calculate-smart-status` (PLAYING if played within 7 days, otherwise WANT).
    - The Steam import goes through `setLibraryItemStatus`.
    - Integration tests for play open/close and status stickiness. **[Agent: tanstack-fullstack]**
  - [ ] Server functions and loaders:
    - `setStatusFn` in `features/manage-library-entry` (worker split, validate-twice).
    - Remove the status/started/completed path from `updateLibraryItemFn`. Delete `setLibraryStatusManualFn` and `clearLibraryStatusManualFn`.
    - Update the library page data (status enum ALL/WANT/PLAYING/DONE), the dashboard counts, the game-detail single status (no derived status), the profile counts, and the activity status passthrough. **[Agent: tanstack-fullstack]**
  - [ ] UI relabel to 3 statuses using the existing controls:
    - Game-detail switcher becomes one 3-option picker (the three-state manual logic is removed). The card menu "Change Status" offers 3 options.
    - Filter lens and status list: All/Want/Playing/Done.
    - Dashboard strip and stats bar: 3 statuses.
    - Status CSS vars go 5 → 3. The "Tried" chip is deleted.
    - Steam import picker with readable card badge.
    - Activity copy: "wants to play / is playing / is done with".
    - Profile: Want/Playing/Done counts, with no played/completed counts. **[Agent: react-frontend]**
  - [ ] Update every existing unit, component and integration test that references the old 5 statuses, the manual override or the derived status, using the new factories. The full suite must pass. **[Agent: testing]**
  - [ ] Verify (gate, then browser):
    - Run `typecheck`, `lint`, `test:unit`, `test:integration`, `build`.
    - Start the app and seed a user with a Wishlist, a Shelf, an Up Next and a Played game in legacy shape before migrating (or via the migration test DB).
    - Confirm that the library shows only Want/Playing/Done with filter All/Want/Playing/Done.
    - Set Playing on a card and confirm the game page header and the phone-width bottom bar both read Playing.
    - Confirm the profile shows the 3 counts.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [ ] **Slice 2: One-tap next step, direct status picker, undo**

  > Spec §2.3, plus the undo part of §2.13.
  - [ ] Add `restoreLibraryItem`:
    - Deletes the created play and reopens the closed play.
    - Restores the snapshot, including `statusChangedAt`.
    - Re-inserts into the queue only if there is room, returning `queueRestored`.
    - Zod-validates the snapshot and clamps the position.
  - [ ] Add `undoStatusFn`.
  - [ ] Integration tests: undo of Start playing adds no play, plus the full-queue undo. **[Agent: tanstack-fullstack]**
  - [ ] Add `StatusPicker` (popover ≥768px / sheet below), `StatusControl` (opens the picker directly, aria-label with the current value) and `NextStepButton` (Start playing / Mark done / Play again) in `entities/library-item/ui/`. **[Agent: react-frontend]**
  - [ ] Add `useSetStatus` in `features/manage-library-entry/model`:
    - Optimistic patch with rollback, and the "Couldn't save. Try again." toast (spec §2.14).
    - 5 s undo toast ("{Game} is now Playing") via `showUndoToast`.
    - The "Up Next is full, so {Game} wasn't put back in the queue." message.
    - Mutations scoped per game; `router.invalidate()` on settle. **[Agent: react-frontend]**
  - [ ] Wire `StatusControl` and `NextStepButton` into the grid tile, the list row, the game-page header and the phone bottom bar (replacing the scroll-to-hero). Delete `library-item-card-cta` and its utility. Component tests for the next-step targets and undo. **[Agent: react-frontend]**
  - [ ] Verify:
    - Tap "Start playing" on a grid tile: Playing shows immediately with an Undo toast. Tap Undo: the game is back to Want, and History has no new play.
    - At phone width, the bottom-bar pill opens the picker directly.
    - Simulate offline: the status reverts and the error toast appears.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [ ] **Slice 3: Up Next queue**

  > Spec §2.4, plus the search/palette markers from §2.6.
  - [ ] Add the queue operations in entities: `addToUpNext` (`ConflictError` `UP_NEXT_FULL`, `ValidationError` for PLAYING, idempotent), `removeFromUpNext` (compact) and `moveInUpNext` (swap or insert-shift, returns the ordered list).
    - Each runs in a transaction with `pg_advisory_xact_lock(hashtext(userId))` and sequential compaction.
    - Integration tests, including two concurrent adds at 4 → exactly one `UP_NEXT_FULL`. **[Agent: tanstack-fullstack]**
  - [ ] Add a new `features/up-next` slice with `addToUpNextFn`, `removeFromUpNextFn` and `moveInUpNextFn`.
    - The library page data gets an UP_NEXT filter ordered by position, returning `position`.
    - The dashboard data gets the top 3 by position.
    - Search and palette data return `upNextPosition`. **[Agent: tanstack-fullstack]**
  - [ ] UI:
    - `UpNextQueueList`: numbered 1..N, Move up/down hidden at the ends, labelled buttons, position announced. Shown when the library's Up Next filter is selected.
    - Card menu and game page: "Put in Up Next" / "Remove from Up Next", hidden for Playing.
    - `QueueMarker` ("Up Next #n" / "Replay") on cards, search results and palette rows.
    - Dashboard top-3 rail with "See all" → `/library?status=UP_NEXT`, and the empty-state copy.
    - The full-queue message is keyed by error code. **[Agent: react-frontend]**
  - [ ] Desktop drag reorder: add `@dnd-kit/core` and `@dnd-kit/sortable` at exact pinned versions, lazy-loaded, desktop only (≥768px), calling `moveInUpNextFn`. Move buttons stay at every size. **[Agent: react-frontend]**
  - [ ] Verify:
    - Queue 5 games: numbers 1–5 appear. Adding a 6th shows the full message.
    - Move #3 up, reload: the order persists. Drag on desktop, reload: it persists.
    - Start #1: it leaves the queue and the others renumber.
    - Set a queued Want to Done: it shows "Replay" and keeps its place.
    - The dashboard shows the top 3 and the empty state.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [ ] **Slice 4: Owned or not**

  > Spec §2.5.
  - [ ] Add `setOwnership` and `setOwnershipFn`. `getLibrary` gets `notOwnedOnly`. Friends' reads never expose ownership. Tests included. **[Agent: tanstack-fullstack]**
  - [ ] UI:
    - An ownership toggle ("I own it / I don't own it yet") in the card menu and on the game page.
    - A `NotOwnedTag` on Want games.
    - A "Not owned only" toggle that appears only with the Want filter. **[Agent: react-frontend]**
  - [ ] Verify:
    - Mark a Want game as not owned: the tag appears.
    - Change it to Playing and back to Want: the tag is still there.
    - Want filter + toggle: only not-owned games are listed.
    - A friend's profile view shows no ownership.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [ ] **Slice 5: Instant add, the same everywhere**

  > Spec §2.6, without the "why" field, which lands in Slice 7.
  - [ ] Server changes:
    - `addGameToLibrary` returns `{ item, created }`: it creates as WANT/owned and maps P2002 to the existing item.
    - `undoAddGame` is guarded: created < 60 s, no plays, no notes other than WHY; it deletes the WHY note in the same transaction; otherwise `ConflictError`.
    - Add `addGameFn` and `undoAddGameFn` in `features/add-game`.
    - Delete the palette `quick-add-to-library-fn`, the search quick-add fn, and the palette `remove-library-item-fn` used as undo.
    - Integration tests: undo never deletes a pre-existing item. **[Agent: tanstack-fullstack]**
  - [ ] UI:
    - `useAddGame` and `AddConfirmation`: a custom sonner toast "Added {Game} to Want" with "Put in Up Next" and Undo (only when `created`), dismissed by a manual 8 s timer.
    - Used by the search page, the add dialog, the palette, and the game page "Add to library".
    - Live debounced search with no Enter.
    - The dialog and palette stay open after adding, and the result shows "In library".
    - Already-owned results show status + marker and open the game page.
    - "Add game" buttons on the dashboard and library open `?action=add-game`.
    - The failure toast "Couldn't add {Game}. Try again." **[Agent: react-frontend]**
  - [ ] Verify:
    - Add from each of the four entry points: each shows "Added X to Want".
    - "Put in Up Next" queues the game. Undo removes it.
    - Use the palette on a game already in the library: Undo is not offered and the game stays.
    - The confirmation disappears after 8 s.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [ ] **Slice 6: Plain notes and the Log sheet**

  > Spec §2.9, plus the "Mark as Playing" offer from §2.2.
  - [ ] Server changes:
    - `createJournalEntry` requires content or minutes and no run. It increments the open play's minutes if one exists.
    - `logTimeFn` returns `{ noteId, offerMarkPlaying }`.
    - `updateJournalEntry` takes content only. Reads return `prompt` and drop kind/title/mood.
    - Integration tests include a time-only log for a game with no play. **[Agent: tanstack-fullstack]**
  - [ ] UI:
    - A note composer (text + hours in 0.5 h steps; Save enabled with either one) in the Log sheet, the game page "New note" and the Journal.
    - Remove the run picker and the Quick note/Reflection labels.
    - The log confirmation "Logged {time} for {Game}" offers "Mark as Playing" when the game isn't Playing. **[Agent: react-frontend]**
  - [ ] Verify:
    - Log 1.5 h with no text on a Want game: it saves, the game stays Want, and "Mark as Playing" is offered. Tap it: the game becomes Playing and leaves Up Next.
    - No kind labels appear anywhere.
    - Save is disabled when the note is empty.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [ ] **Slice 7: Done follow-up and optional prompts**

  > Spec §2.7, §2.8.
  - [ ] Server changes:
    - Add `setDoneOutcome`, `setRating` and `dismissPrompt`.
    - Add `saveDoneFollowUpFn` in `features/done-follow-up`, and `answerPromptFn` / `dismissPromptFn` in `features/library-prompts`.
    - Game detail returns the `prompts { why, stayed }` flags. `why`: WANT, no WHY note, not dismissed. `stayed`: DONE, no STAYED note since `statusChangedAt`, no dismissal at or after it.
    - `doneOutcome` is visible to the owner only, and never aggregated.
    - Tests included. **[Agent: tanstack-fullstack]**
  - [ ] UI:
    - `DoneFollowUp` (dialog on desktop, sheet on phone), opened by "Mark done" or by picking Done. It has Finished/Let go (none selected), a pre-filled rating and "What stayed with you?". Save / Skip / Undo; closing counts as Skip; it stays open on error.
    - "Done · Finished/Let go" label, editable on the game page.
    - `GamePrompts` on the game page: Enter or Save answers, × dismisses, hidden while Playing.
    - The "Why do you want to play this?" field + Save in the add confirmation, which pauses its timer while focused or typing.
    - Answers render as notes headed by their question. **[Agent: react-frontend]**
  - [ ] Verify:
    - Mark done: the follow-up appears. Skip: the game is Done with nothing recorded. Mark done again, choose Let go plus a note, Save: the page shows "Done · Let go" and a note headed "What stayed with you?".
    - A friend's view shows "Done" only.
    - Dismiss the Want prompt: it doesn't return.
    - In the add confirmation, type a "why" answer: the toast stays until saved.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [ ] **Slice 8: Play History and one rating**

  > Spec §2.10, §2.11.
  - [ ] Server changes:
    - Add `getEndedPlays` (newest first), plus `history` in the game-detail data (omitted when empty).
    - Remove "Best rating" and per-run rating reads, the profile playthroughs query, and the public playthrough create/update/delete.
    - Delete `features/manage-playthrough`.
    - The game-details edit form loses its started/completed fields.
    - Tests: after Done → Play again → Done, History has 2 plays. **[Agent: tanstack-fullstack]**
  - [ ] UI:
    - `PlayHistory`: collapsed, read-only, start–end dates.
    - Delete the Playthroughs panel, the timeline, the add/edit drawer, the jump-spine entry, the card "Add playthrough" action and `profile-playthroughs-section`.
    - A single rating (5 stars, half steps) on the game page; the "Minimum rating" filter uses it.
    - No date fields in the details form. **[Agent: react-frontend]**
  - [ ] Verify:
    - A game played twice shows 2 plays in History with correct dates.
    - A never-played game shows no History.
    - A rating of 7 shows 3.5 stars on the card, and the min-rating filter includes or excludes the game accordingly.
    - No playthrough UI remains.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [ ] **Slice 9: One-time "new statuses" notice**

  > Spec §2.12 explanation.
  - [ ] Server: the root loader exposes `statusModelNoticePending`, and add an idempotent `acknowledgeNoticeFn` in `features/whats-new`. **[Agent: tanstack-fullstack]**
  - [ ] UI: a server-driven one-time dialog explaining Want/Playing/Done/Up Next with "Got it". It is separate from the localStorage announcements. **[Agent: react-frontend]**
  - [ ] Verify:
    - An existing user sees the notice. Tap "Got it", then open a second browser context with the same account: no notice.
    - A newly signed-up user never sees it.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [ ] **Slice 10: Contract migration**

  > Drops the legacy fields once slices 1–9 are verified in production (technical-considerations §2.2, migration B).
  - [ ] Confirm no code reads the legacy fields:
    - `statusIsManual`, `hasBeenPlayed`, `startedAt`, `completedAt`.
    - Journal `kind`, `mood`, `tags`, `playSession`, `visibility`, `publishedAt`.
    - Playthrough `kind`, `status`, `rating`, `completion`, `notes`.
  - [ ] Remove them and their enums from the schema.
  - [ ] Author migration B `<ts>_mindful_core_contract`. Keep `statusModelNoticePending`.
  - [ ] Update the rollback doc. **[Agent: prisma-database]**
  - [ ] Verify:
    - Run `typecheck`, `lint`, `test:unit`, `test:integration` and `build`.
    - Apply migration B to a fresh DB and to the slice-1 migration-test DB.
    - The app starts, and the library, game page and journal load without errors.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [ ] **Slice 11: Feature Testing & Regression**

  > Verifies the whole feature end-to-end against functional-spec.md, run after all implementation slices are complete.
  - [ ] Read functional-spec.md acceptance criteria in full. Generate acceptance-level tests that verify the entire feature as a whole — not individual slices. Cover applicable layers (unit for pure logic, integration for service interactions, e2e for user flows) based on the project's testing stack. Write tests with RED validation (must fail before implementation is confirmed done). Annotate each test with `@spec: 026-mindful-core-simplification` and `@regression` if suitable for long-term regression. **[Agent: testing]**
  - [ ] Run all generated tests. All must pass. Fix any failures before proceeding. **[Agent: testing]**
