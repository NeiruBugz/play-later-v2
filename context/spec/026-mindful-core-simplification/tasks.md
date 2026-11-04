# Tasks: Mindful Core Simplification (spec 026)

Source: [functional-spec.md](./functional-spec.md), [technical-considerations.md](./technical-considerations.md), [ui-audit/ui-audit.md](./ui-audit/ui-audit.md). Paths relative to `savepoint-tanstack/`.

Verify-task conventions:
- Start the dev server (`pnpm --filter savepoint-tanstack dev`, port 6060) in the background and record its PID.
- Use the audit seed accounts (`audit_full`, `audit_friend`, `audit_empty`; see the Setup section of `ui-audit/ui-audit.md`). Re-seed when a slice needs a clean state.
- Drive the UI with the Playwright MCP plus the `verify-ui` skill, at 390 px and 1440 px.
- If IGDB is unreachable, seed `Game` rows directly in the local DB.
- At the end of each Verify task, stop the server **by its recorded PID** and delete every screenshot, trace and generated script the task produced.

- [x] **Slice 1: Broken paths fixed** (spec §2.19, audit U1–U6)

  > First-run, note pages, followers and profile links work. Removing a game asks once. Done before the model swap so the later Verify tasks can reach these screens.
  - [x] Router fixes:
    - U1: the profile `beforeLoad` no longer runs for profile setup (move setup to a sibling route or guard on the matched child).
    - U2: `<Outlet/>` or flattening for the journal child routes.
    - U3: `<Outlet/>` or flattening for followers/following.
    - Add a router integration test that renders the real route tree with memory history for `/journal/<id>`, `/journal/new`, `/journal/<id>/edit`, `/u/<name>/followers` and `/profile/setup` (user without a username), with no redirect loop. **[Agent: tanstack-fullstack]**
  - [x] T2 (think-aloud blocker): logging time with no text works for any library game, including a game made Playing by status alone (no run).
    - `createJournalEntry` validation: content or `playedMinutes`, no run required. It increments the open play if there is one; otherwise it stores `playedMinutes` only.
    - The Log sheet and compose dialog enable Save with time only.
    - No raw validation text in the error toast.
    - Integration + component tests. **[Agent: tanstack-fullstack]**
  - [x] U4: public profile reads stop returning run notes and ratings for non-owners (`get-profile-playthroughs.server.ts`), with a test. U5: profile tiles link by `Game.slug`. **[Agent: tanstack-fullstack]**
  - [x] U6: a single `RemoveFromLibraryDialog` ("Remove {Game} from your library? Its play history and rating will be deleted. Your notes stay in your Journal." with Remove / Cancel, no typed title), used by the card menu, the game page and the details form. Remove the typed-title gate. Add component tests. **[Agent: react-frontend]**
  - [x] Verify:
    - `audit_empty` signs in → profile setup opens once and completes.
    - Open a note, "New note" and "Edit": each screen renders.
    - Followers and following lists render.
    - Signed out, `audit_full`'s profile shows no note text or ratings, and its game tiles open game pages.
    - Remove from library shows the confirmation, and Cancel changes nothing.
    - Set a game to Playing by status alone, then log 2 h with no text: it saves with no error (T2).
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [x] **Slice 2: Three statuses everywhere, and a status only changes when the user changes it**

  > The app runs on Want / Playing / Done (spec §2.1, §2.2, §2.12 data conversion, §2.13 labels, §2.18 label case). The existing controls are reused, with relabelled 3-option pickers.
  - [x] Add `libraryItemFactory`, `playFactory` and `noteFactory` test helpers under `test/`. **[Agent: testing]**
  - [x] Schema plus migration A `<ts>_mindful_core_model`:
    - The new enum `LibraryItemStatus { WANT, PLAYING, DONE }`, the enums `DoneOutcome` and `JournalPrompt`, and the new columns.
    - `@@unique([userId, upNextPosition])`, the `CHECK` 1..5, and `@@unique([userId, gameId])`.
    - The backfill exactly as in technical-considerations §2.2, including the step 6 time-played backfill (time-only notes for run minutes not covered by notes).
    - Legacy columns stay in the schema.
    - Run `prisma:generate`. **[Agent: prisma-database]**
  - [x] Migration test `test/integration/mindful-core-migration.integration.test.ts`:
    - Apply every prior migration, seed legacy rows with raw SQL, then execute the **real** migration A file read from disk.
    - Cover all seed cases from technical-considerations §4.
    - Assert all the invariants, including that time played per game is unchanged. **[Agent: prisma-database]**
  - [x] Add a pre-deploy section to `docs/cutover-rollback.md`:
    - Create a Neon branch of production.
    - Run the duplicate `(userId, gameId)` pre-check.
    - Dry-run migration A on the branch.
    - Rollback = restore the branch. **[Agent: prisma-database]**
  - [x] Rewrite `entities/library-item/model/status.ts` as the client-safe single source of truth:
    - 3 statuses, the Zod schema, label/icon/badge (title case), `NEXT_STEP`, `getQueueMarker`, `getDoneLabel`, `UP_NEXT_MAX`. **[Agent: tanstack-fullstack]**
  - [x] Status core in entities:
    - Add `setLibraryItemStatus`. It runs in one transaction with a row lock: it writes `status` and `statusChangedAt`, opens or closes plays, and leaves the queue when the game becomes Playing.
    - Delete the derived status, the run sync and the manual override.
    - Update `getLibrary`, the counts, the stats, `getLibraryItemsByIgdbIds` and `calculate-smart-status` (PLAYING within 7 days, otherwise WANT).
    - The Steam import goes through `setLibraryItemStatus`.
    - Integration tests. **[Agent: tanstack-fullstack]**
  - [x] Server functions and loaders:
    - `setStatusFn` in `features/manage-library-entry`.
    - Remove the status/date path from `updateLibraryItemFn`, and the status select from the details form (T3). Delete the manual-override fns.
    - Update the library page data, the Home counts, the game-detail single status, the profile counts and the activity status. **[Agent: tanstack-fullstack]**
  - [x] UI relabel to 3 statuses using the existing controls:
    - One 3-option picker on the game page. The card menu offers 3 options.
    - Filter All/Want/Playing/Done.
    - Home strip: 3 statuses. Status CSS vars go 5 → 3.
    - Delete the "Tried" chip.
    - Steam picker with a readable badge.
    - Activity copy: "wants to play / is playing / is done with".
    - Profile: Want/Playing/Done counts.
    - Badges in title case, with `whitespace-nowrap` and room reserved before the menu, so they are never cut off at 390 px (N22). **[Agent: react-frontend]**
  - [x] Update every existing test that references the 5 statuses, the manual override or the derived status, using the factories. The full suite must pass. **[Agent: testing]**
  - [x] Verify:
    - Run `typecheck`, `lint`, `test:unit`, `test:integration` and `build`.
    - Re-seed the audit accounts and apply migration A.
    - The library shows only Want/Playing/Done.
    - Set Playing on a card: the game page header and the phone bar both read Playing.
    - At 390 px, the badges are not truncated.
    - The profile shows 3 counts.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [x] **Slice 3: One-tap next step, direct picker, undo, desktop parity**

  > Spec §2.3, §2.14, plus the undo part of §2.13 (audit N1, N2).
  - [x] Add `restoreLibraryItem`:
    - Deletes the created play and reopens the closed one.
    - Restores the snapshot, including `statusChangedAt`.
    - Restores the queue place only if there is room, returning `queueRestored`.
  - [x] Add `undoStatusFn`.
  - [x] Integration tests. **[Agent: tanstack-fullstack]**
  - [x] Add `StatusPicker`, `StatusControl` and `NextStepButton` in `entities/library-item/ui/`. **[Agent: react-frontend]**
  - [x] Add `useSetStatus`:
    - Optimistic update with rollback.
    - The error message comes from the code → message map only, never raw Zod/Prisma text (§2.14).
    - 5 s undo toast, plus the full-queue undo message.
    - Mutations scoped per game; `router.invalidate()` on settle. **[Agent: react-frontend]**
  - [x] Wiring:
    - Put `StatusControl` and `NextStepButton` on the grid tile, the list row, the game-page header and the phone bottom bar.
    - The phone bottom bar sits above the bottom nav at every scroll position (N1).
    - Desktop gets the grid/list toggle and the rich list card with the next-step button (N2).
    - Delete `library-item-card-cta`.
    - Component tests. **[Agent: react-frontend]**
  - [x] Verify:
    - "Start playing" → Playing plus an Undo toast. Undo → back to Want, and History has no new play.
    - At 390 px, `elementFromPoint` at the bar's centre returns the bar at top, middle and bottom scroll positions, and tapping its pill opens the picker.
    - At 1440 px, the grid/list toggle works and list rows show the next-step buttons.
    - Offline: the status reverts with "Couldn't save. Try again."
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [x] **Slice 4: Up Next queue**

  > Spec §2.4.
  - [x] Queue operations in entities:
    - `addToUpNext` (`UP_NEXT_FULL`, `ValidationError` for Playing, idempotent), `removeFromUpNext` and `moveInUpNext`.
    - Each runs under a per-user advisory lock with sequential compaction.
    - Tests include two concurrent adds at 4 → exactly one `UP_NEXT_FULL`. **[Agent: tanstack-fullstack]**
  - [x] Add a `features/up-next` slice with its server fns.
    - The library UP_NEXT view is ordered by position.
    - Home top 3 by position.
    - Search, palette and add-dialog lookups return `upNextPosition`. **[Agent: tanstack-fullstack]**
  - [x] UI:
    - `UpNextQueueList`: numbered 1..N, Move up/down hidden at the ends, labelled, position announced.
    - Card menu and game page: Put in / Remove from Up Next, hidden for Playing.
    - `QueueMarker` on cards, search, palette and the add dialog.
    - Home top-3 rail with "See all" and the empty copy. **[Agent: react-frontend]**
  - [x] Desktop drag: add `@dnd-kit/core` and `@dnd-kit/sortable` at exact pinned versions, lazy-loaded, desktop only, calling `moveInUpNextFn`. **[Agent: react-frontend]**
  - [x] Verify:
    - Queue 5: numbered 1–5. A 6th shows the full message.
    - Move and drag reorders persist after reload.
    - Start #1: it leaves the queue and the rest renumber.
    - Want → Done in the queue: it reads "Replay" and keeps its place.
    - Home shows the top 3 and the empty state.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [x] **Slice 5: Owned or not**

  > Spec §2.5 (audit N8).
  - [x] Add `setOwnership` and `setOwnershipFn`, plus `notOwnedOnly` in `getLibrary`. Friends' reads never expose ownership. Remove the acquisition filter from the library query and params. Tests. **[Agent: tanstack-fullstack]**
  - [x] UI: the ownership toggle, the `NotOwnedTag`, and the "Not owned only" toggle (Want filter only). Delete the Acquisition filter UI (`filter-library/lib/acquisition.ts`, desktop and mobile). **[Agent: react-frontend]**
  - [x] Verify:
    - The not-owned tag survives Playing → Want.
    - The toggle lists only not-owned Want games.
    - No Acquisition filter at 390 or 1440 px.
    - A friend's view shows no ownership.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [x] **Slice 6: Instant add, the same everywhere**

  > Spec §2.6, plus the §2.18 add/icon/palette items (audit N3, N11, N18, N21). The "why" field comes in Slice 8.
  - [x] Server:
    - `addGameToLibrary` returns `{ item, created }` (P2002 → the existing item).
    - Guarded `undoAddGame`.
    - `addGameFn` and `undoAddGameFn`.
    - Delete the palette quick-add, the search quick-add and the remove-as-undo fns.
    - Integration test: undo never deletes a pre-existing item. **[Agent: tanstack-fullstack]**
  - [x] UI, add flow:
    - `useAddGame` and `AddConfirmation` ("Added {Game} to Want", Start playing (T1), Put in Up Next, Undo only when `created`, 8 s) for the search page, the add dialog, the palette and the game page "Add to library".
    - Live search. The dialog and palette stay open; added results show "In library".
    - Already-in-library results show the status and marker in every search (N11).
    - "See all results" → `/games/search?q=` (N3).
    - The failure toast.
    - Remove "IGDB" from user-facing copy (N23). **[Agent: react-frontend]**
  - [x] UI, entry points:
    - "Add game" on Home, the library header and the desktop sidebar.
    - Add uses an icon distinct from Log (N18).
    - The phone library FAB never overlaps card menus.
    - Palette: delete the "Add game to library" quick action (N21). **[Agent: react-frontend]**
  - [x] Verify:
    - Each of the four entry points shows "Added X to Want". Start playing (the palette included), Put in Up Next and Undo work.
    - A game already in the library shows its status in the palette and the dialog, with no Undo offered.
    - "See all results" opens the search page with the query.
    - Log and Add icons differ.
    - At 390 px, every card's "⋯" can be tapped at any scroll position.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [x] **Slice 7: One Log form, plain notes, one time-played total**

  > Spec §2.9, §2.15, §2.16, plus the "Mark as Playing" offer from §2.2 (audit N4, N5, N6, N7, N10, N12, N13, N21).
  - [x] Server:
    - `createJournalEntry` requires content or minutes, needs no run, and increments the open play.
    - `logTimeFn` returns `{ noteId, offerMarkPlaying }`.
    - `updateJournalEntry` accepts content and `playedMinutes` (content or time).
    - Journal reads sort and date by `createdAt` (N13), drop kind/title/mood, and take a game filter `gameId | "none"` (T4). `playedMinutes` requires a game.
    - `getLoggableGames` returns library items only, Playing first then by title (N6, N7).
    - Game detail: time played = the notes total, sessions = notes with time; Times to Beat / Your Pace read the same total (N10).
    - Tests. **[Agent: tanstack-fullstack]**
  - [x] UI, the Log form (N5):
    - One Log form (the global action host `log-session`) opened from the nav, the sidebar, the game page "Log time" (owners only, N7), the Journal "New note" and the palette "New note" (N21).
    - `/journal/new` renders the same content.
    - Delete the minutes compose dialog and the text-only form.
    - Picker: search field, scroll container capped to the viewport, chosen game's title and cover in the header (N6).
    - Confirmation "Logged {time} for {Game}", with "Mark as Playing" when the game isn't Playing.
    - Remove the run picker. **[Agent: react-frontend]**
  - [x] UI, notes and time:
    - One `GameNotesList` on the game page; each note links to its note view (N4).
    - Delete `journal-teaser` and the nested per-run note lists.
    - The note card and note view show time; a time-only note reads "{time} played" (N12).
    - The edit form changes text and time.
    - Journal filter: All / each game with notes / "No game" (T4). A note without time can be saved without a game.
    - One `formatHours` ("1.5 h") everywhere (N10).
    - No Quick note/Reflection labels. **[Agent: react-frontend]**
  - [x] Verify:
    - Every Log entry point opens the same form. Search filters the library games, and the form fits a 900 px-tall desktop viewport.
    - Log 1.5 h with no text on a Want game: it saves, stays Want, and offers "Mark as Playing".
    - A not-in-library game page and a signed-out view show no "Log time".
    - The game page shows each note once, and notes open.
    - 90 min reads "1.5 h" on the game page, the note and the Journal.
    - Editing an old note keeps its date and place.
    - The Journal filter "No game" lists only notes without a game.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [x] **Slice 8: Done follow-up and optional prompts**

  > Spec §2.7, §2.8.
  - [x] Server:
    - `setDoneOutcome`, `setRating` and `dismissPrompt`.
    - `saveDoneFollowUpFn`, `answerPromptFn` and `dismissPromptFn`.
    - Game detail `prompts { why, stayed }` flags. `doneOutcome` for the owner only.
    - Tests. **[Agent: tanstack-fullstack]**
  - [x] UI:
    - `DoneFollowUp` (dialog/sheet; Finished/Let go; pre-filled rating; "What stayed with you?"; Save/Skip/Undo; close = Skip; stays open on error).
    - The editable "Done · Finished/Let go" label.
    - `GamePrompts` (Enter/Save, × dismiss, hidden while Playing).
    - The "why" field in `AddConfirmation`; its timer pauses while it is focused or being typed in.
    - Prompt answers are headed by their question. **[Agent: react-frontend]**
  - [x] Verify:
    - Skip → Done with nothing recorded.
    - Let go plus a note → "Done · Let go" and a note headed "What stayed with you?". A friend sees "Done" only.
    - A dismissed prompt doesn't return.
    - Typing a "why" answer keeps the add toast open.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [x] **Slice 9: Play History and one rating**

  > Spec §2.10, §2.11 (audit N19).
  - [x] Server:
    - `getEndedPlays` and the game-detail `history`.
    - Remove "Best rating", the per-run rating reads, the profile playthroughs query and the public playthrough CRUD.
    - Delete `features/manage-playthrough`.
    - The details form loses its date fields.
    - Test: Done → Play again → Done = 2 plays. **[Agent: tanstack-fullstack]**
  - [x] UI:
    - `PlayHistory`.
    - Delete the playthrough panel, timeline, drawer, jump-spine entry, card "Add playthrough" and `profile-playthroughs-section`.
    - A single 5-star half-step rating on the game page.
    - Min-rating / unrated filters on desktop, from the shared filter definition (N19).
    - No date fields in the details form. **[Agent: react-frontend]**
  - [x] Verify:
    - 2 plays appear in History with correct dates. A never-played game has no History.
    - A rating of 7 shows 3.5 stars.
    - The min-rating filter works at 1440 px.
    - No playthrough UI remains.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [x] **Slice 10: Home, library and Journal without duplicates or pressure**

  > Spec §2.17 and the rest of §2.18 (audit N9, N14, N15, N16, N17, N20, N23).
  - [x] Server:
    - Home data returns `{ playing[], upNextTop3[], counts }`. Delete `recentlyPlayed` and the stats-card data (N9, N14).
    - The Journal stats return no period counts (N20). **[Agent: tanstack-fullstack]**
  - [x] UI:
    - Home renders each game once, with Up Next visible without scrolling at 390 × 844 when one game is Playing (N15).
    - A single counts strip; delete the stats card and the distribution bar (N14).
    - One empty state: "Pick from Up Next" → the Up Next view, or "Add a game" → the add search (N16).
    - Remove the desktop library sidebar status list; the chips stay (N14).
    - Delete the lifecycle strip from cards; the rating shows only when set (N17).
    - Remove the "This month" Journal counts (N20).
    - Copy sweep against "Words used in the app" across all surfaces (N23). **[Agent: react-frontend]**
  - [x] Verify:
    - Home at 390 × 844 with one Playing game: the game appears once and Up Next is above the fold.
    - Home has no "Recently played", no stats card and no distribution bar.
    - Both empty-state branches lead to working screens.
    - The desktop library has one status filter.
    - Cards show no age strip and no "unrated".
    - The Journal has no period counts.
    - A `rg` sweep finds none of the vocabulary "Never" variants in UI strings.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [x] **Slice 11: One-time "new statuses" notice**

  > Spec §2.12 explanation.
  - [x] Server: the root loader exposes `statusModelNoticePending`, and add an idempotent `acknowledgeNoticeFn`. **[Agent: tanstack-fullstack]**
  - [x] UI: a server-driven one-time dialog with "Got it", separate from the localStorage announcements. **[Agent: react-frontend]**
  - [x] Verify:
    - An existing user sees it once, across two browser contexts.
    - A new sign-up never sees it.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [ ] **Slice 12: Contract migration**

  > Drops the legacy fields once slices 1–11 are verified in production (technical-considerations §2.2, migration B).
  - [x] Confirm no code reads the legacy fields (audit 2026-11-04: see [migration-b-readiness.md](./migration-b-readiness.md) — 3 production writes and test/seed edits remain, to be done with migration B):
    - `statusIsManual`, `hasBeenPlayed`, `startedAt`, `completedAt`, `acquisitionType`.
    - Journal `kind`, `mood`, `tags`, `playSession`, `visibility`, `publishedAt`.
    - Playthrough `kind`, `status`, `rating`, `completion`, `notes`, `playtimeMinutes`.
  - [ ] Remove them and their enums from the schema.
  - [ ] Author migration B. Keep `statusModelNoticePending`.
  - [ ] Update the rollback doc. **[Agent: prisma-database]**
  - [ ] Verify:
    - Run the full gate.
    - Apply migration B to a fresh DB and to the migration-test DB.
    - The library, game page and Journal load without errors.
    - Stop the server by PID and delete the artifacts. **[Agent: testing]**

- [ ] **Slice 13: Feature Testing & Regression**

  > Verifies the whole feature end-to-end against functional-spec.md, run after all implementation slices are complete.
  - [x] Read functional-spec.md acceptance criteria in full. Generate acceptance-level tests that verify the entire feature as a whole — not individual slices. Cover applicable layers (unit for pure logic, integration for service interactions, e2e for user flows) based on the project's testing stack. Write tests with RED validation (must fail before implementation is confirmed done). Annotate each test with `@spec: 026-mindful-core-simplification` and `@regression` if suitable for long-term regression. **[Agent: testing]**
  - [x] Run all generated tests. All must pass. Fix any failures before proceeding. **[Agent: testing]**
  - [ ] Re-run the UI audit probe (`ui-audit/measure.js`) on re-seeded audit accounts at 390 and 1440 px.
    - Add an "after 026" column to the audit's Metrics table.
    - Mark each N/U finding as resolved or still open in `ui-audit/ui-audit.md`.
    - Keep the screenshots out of the repo. **[Agent: testing]**
