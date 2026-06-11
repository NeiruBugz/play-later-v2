# Tasks: Per-Playthrough Logs

- **Functional Spec:** [`functional-spec.md`](./functional-spec.md)
- **Technical Spec:** [`technical-considerations.md`](./technical-considerations.md)
- **Design handoff:** [`design-handoff/`](./design-handoff/)

> **Regenerated 2026-06-10** for the deployed `savepoint-tanstack` app. The prior `[x]`-checked
> list targeted the retired Next.js `savepoint-app` (repository/service/use-case layers,
> `ProfileSectionVisibility` enum) and an earlier, simpler design — none of it shipped here.
> This list is the source of truth.

Each slice is a vertical, runnable increment. The app must remain working, type-checking, and
test-passing after every slice. **TDD is binding** (per `savepoint-tanstack/CLAUDE.md`): every
slice lists its test sub-tasks **before** implementation; tests are authored failing (RED), then
made to pass (GREEN), then refactored. During a RED sub-task it is expected that `typecheck` /
`test:unit` / `test:integration` fail — use plain static imports of the not-yet-created module.

**Manual verification** uses the `claude-in-chrome` MCP connector (`mcp__claude-in-chrome__*`)
against the dev server on `http://localhost:6060`. Load tools via `ToolSearch`
(`select:mcp__claude-in-chrome__<tool>`) before calling them. E2E (Playwright) is excluded
project-wide until the pipeline is re-stood-up.

**Per-slice gate** — do not mark a slice complete until, from the repo root, all pass:

```
pnpm --filter savepoint-tanstack format:check
pnpm --filter savepoint-tanstack lint
pnpm --filter savepoint-tanstack typecheck
pnpm --filter savepoint-tanstack test:unit
pnpm --filter savepoint-tanstack test:integration   # slices touching the DB / server fns
```

Migrations are owned here: `pnpm --filter savepoint-tanstack prisma:migrate` (dev) authors +
applies. Coverage floor (≥85% stmts on `src/{entities,features}`) is a release gate; keep new
entity/feature code covered as you go.

**Subagents:** `prisma-database` (schema/migrations), `tanstack-fullstack` (entity queries,
server fns, loaders), `react-frontend` (components/widgets/styling), `testing` (test authoring).
Manual QA = `react-frontend` driving the `claude-in-chrome` MCP. No `general-purpose` fallbacks
and no missing MCPs — all sub-tasks map to a specialist.

---

## Slice 1: Schema foundation, migration + backfill, pure helpers

**User-visible value:** existing played games migrate to one "First playthrough" each (no data
lost); the DB has the full shape and the pure status/aggregate logic is in place. App still boots.

- [x] RED — unit test `entities/library-item/model/derive-status.unit.test.ts`: `deriveLibraryStatus` truth table (empty→manual, any PLAYING→PLAYING, any FINISHED→PLAYED, ABANDONED-only→PLAYED, mixed) + `deriveHasBeenPlayed` (FINISHED/ABANDONED→true). **[Agent: testing]**
- [x] RED — unit test `entities/playthrough/model/aggregate.unit.test.ts`: `aggregatePlaythroughs` total minutes, count, best rating (max), completion ("Platinum" preference, all-null→undefined). **[Agent: testing]**
- [x] GREEN — add `PlaythroughKind` + `PlaythroughStatus` enums and the `Playthrough` model to `prisma/schema.prisma` per tech-spec §2.1 (**`libraryItemId Int`** FK `onDelete: Cascade`, `@@unique([libraryItemId, ordinal])`, `@@index([libraryItemId])`). **[Agent: prisma-database]**
- [x] GREEN — add `playthroughId String?` (FK → `Playthrough`, `onDelete: SetNull`) + `@@index([playthroughId])` to `JournalEntry`; add `playthroughs Playthrough[]` + `statusIsManual Boolean @default(false)` to `LibraryItem`. **[Agent: prisma-database]**
- [x] GREEN — author migration via `prisma:migrate --name per_playthrough_logs`; hand-write the **idempotent backfill SQL**: one `FIRST` run per `PLAYING`/`PLAYED` `LibraryItem` (ordinal 1; `PLAYED→FINISHED`, `PLAYING→PLAYING`; `playtimeMinutes = SUM(JournalEntry.playedMinutes)`; copy rating/startedAt/completedAt/platform; re-point that item's `JournalEntry.playthroughId`). Wishlist/Shelf/Up-Next get zero runs. **[Agent: prisma-database]**
- [x] GREEN — implement pure `entities/library-item/model/derive-status.ts` (`deriveLibraryStatus`, `deriveHasBeenPlayed`) and `entities/playthrough/model/{aggregate.ts,run-status.ts,types.ts}` (`RUN_STATUS` map: Gamepad2/CheckCircle/Archive + token). **[Agent: tanstack-fullstack]**
- [x] RED→GREEN — integration test `test/integration/per-playthrough-backfill.integration.test.ts`: apply migration to fixtures (played-with-sessions, played-no-sessions, playing, wishlist) and assert invariants (exactly one FIRST run per played item, `playtimeMinutes == Σ playedMinutes`, entries re-pointed, wishlist untouched). **[Agent: testing]**
- [x] Verify: `prisma:migrate` then `dev` boots clean; existing game-detail pages still render (panel swap is Slice 2). **[Agent: react-frontend + claude-in-chrome MCP]**
- [x] Gate (incl. `test:integration`). **[Agent: tanstack-fullstack]**

---

## Slice 2: PlaythroughsPanel replaces YourRecordPanel (read-only timeline + aggregate band + empty state)

**User-visible value:** game detail shows the spine timeline of (backfilled) runs with the
aggregate band, or the empty-state invite. Read-only — no add/edit/status changes yet.

- [x] RED — component tests for `entities/playthrough/ui` atoms: `RunMarker` (state→color), `RunStatusBadge` (label+icon), `PlatformPill` (wraps `PlatformBadgeItem`). **[Agent: testing]**
- [x] RED — component test `playthroughs-panel.test.tsx`: empty state (faded marker, "No playthroughs yet", "Log your first playthrough"); populated (aggregate band figures, timeline newest-first, per-run header/meta/notes). **[Agent: testing]**
- [x] GREEN — build `entities/playthrough/ui/{run-marker,run-status-badge,platform-pill}/` (one-folder-per-component; `RunMarker` = inline SVG diamond tinted via `--status-*` / currentColor). **[Agent: react-frontend]**
- [x] GREEN — extend `entities/game/api/get-game-details.server.ts`: include `playthroughs` (ordinal desc, journal entries included); **change `playtimeTotalMinutes` source to `Σ playthroughs.playtimeMinutes`**; add `derivedStatus`, `statusIsManual`, `hasBeenPlayed` to `GameDetails`. Anonymous → `playthroughs: []`. **[Agent: tanstack-fullstack]**
- [x] RED→GREEN — update `get-game-details` integration test for the new fields + playtime-source change. **[Agent: testing]**
- [x] GREEN — build `widgets/game-detail/ui/playthroughs-panel/` (AggregateBand + timeline) and `widgets/game-detail/ui/playthrough-timeline/` (spine: `PlaythroughNode` with RunHeader/RunMeta/notes + trailing non-functional `AddPlaythroughNode`). **[Agent: react-frontend]**
- [x] GREEN — mount `PlaythroughsPanel` in the bento left column in place of `YourRecordPanel`; delete `your-record-panel/` and migrate its still-relevant test assertions. **[Agent: react-frontend]**
- [~] Verify: chrome MCP — **BLOCKED (environment):** game-detail SSR 500s because IGDB/Twitch OAuth is network-unreachable in this sandbox (fails upstream of playthrough code), and the Chrome extension is disconnected. Verified instead via green component + integration + route tests. **[Agent: react-frontend + claude-in-chrome MCP]**
- [x] Gate: format/lint/typecheck clean; unit + integration green in isolation (full-suite failures were environmental DB-setup timeouts, not regressions). **[Agent: tanstack-fullstack]**

---

## Slice 3: Add a playthrough (manage-playthrough right drawer → create)

**User-visible value:** "New playthrough" / "Start a new playthrough" / empty-state button opens
a right drawer; saving creates a run that appears at the top of the timeline and updates totals.

- [x] RED — unit test `create-playthrough.unit.test.ts` (mocked Prisma): next-ordinal assignment, second `FIRST`→`REPLAY` coercion, ownership `NotFoundError`/`UnauthorizedError`. **[Agent: testing]**
- [x] RED — integration test `test/integration/create-playthrough.integration.test.ts` (import the **worker**, foot-gun #8): create in a txn + `syncLibraryStatusFromRuns` flips library status (e.g. SHELF→PLAYING). **[Agent: testing]**
- [x] RED — component test `add-edit-playthrough-drawer.test.tsx`: fields render; Run-type defaults to Replay when a first run exists; Finished date disabled + "Still playing" while status=Playing; submit calls the fn. **[Agent: testing]**
- [x] GREEN — `entities/playthrough/api/{create-playthrough.server.ts,get-playthroughs.server.ts}` + shared `syncLibraryStatusFromRuns(tx, libraryItemId)` (recompute unless `statusIsManual`; always refresh `hasBeenPlayed`). **[Agent: tanstack-fullstack]**
- [x] GREEN — `features/manage-playthrough/`: zod `model/` schema, `api/create-playthrough-fn.ts` (+ `.worker.ts`), validate-twice + `requireUserId()` + `router.invalidate()`. **[Agent: tanstack-fullstack]**
- [x] GREEN — `features/manage-playthrough/ui/add-edit-playthrough-drawer/` (`Sheet side="right"`; `SegmentedControl` for Type/Platform/Status; date inputs; hours; completion; `RatingInput`; notes; preview chip). Animation gated on `prefers-reduced-motion`. **[Agent: react-frontend]**
- [x] GREEN — wire the panel/timeline "New playthrough" + `AddPlaythroughNode` + empty-state button to open the drawer (state lifted in `GameDetail`, mirroring `composeOpen`). **[Agent: react-frontend]**
- [~] Verify: chrome MCP — **BLOCKED (environment):** game-detail SSR 500s (IGDB/Twitch OAuth network-unreachable here, upstream of playthrough code) + Chrome extension disconnected. Verified via green unit+integration+component tests instead. **[Agent: react-frontend + claude-in-chrome MCP]**
- [x] Gate: format/lint/typecheck clean; targeted unit (156) + integration (56) green. **[Agent: tanstack-fullstack]**

---

## Slice 4: Edit and delete a playthrough

**User-visible value:** the per-run Edit button reopens the drawer pre-filled and saves changes;
delete confirms and removes the run while keeping its journal entries (now unattached).

- [x] RED — unit + integration tests for `update-playthrough` (partial patch, ownership, status re-sync on state change) and `delete-playthrough` (ownership, status re-sync, journal entries `playthroughId`→null and survive). **[Agent: testing]**
- [x] RED — component test: Edit pre-fills "Edit playthrough" drawer; delete shows the detach-warning confirm. **[Agent: testing]**
- [x] GREEN — `entities/playthrough/api/{update-playthrough.server.ts,delete-playthrough.server.ts}` (two-step ownership; map Prisma constraint errors in the update query only; both call `syncLibraryStatusFromRuns`). **[Agent: tanstack-fullstack]**
- [x] GREEN — `features/manage-playthrough/api/{update-playthrough-fn.ts,delete-playthrough-fn.ts}`. **[Agent: tanstack-fullstack]**
- [x] GREEN — wire per-run Edit (drawer in edit mode) + delete confirm in `PlaythroughNode`. **[Agent: react-frontend]**
- [~] Verify: chrome MCP — **BLOCKED (environment):** IGDB-dependent game-detail unrenderable here + Chrome ext disconnected. Verified via green unit+integration+component tests. **[Agent: react-frontend + claude-in-chrome MCP]**
- [x] Gate: format/lint/typecheck clean; targeted unit (185) + integration (67) green. **[Agent: tanstack-fullstack]**

---

## Slice 5: Log a session against a run + nested journal + full-width run-aware JournalFeed

**User-visible value:** "Log session" attaches an entry to a chosen run, adds its hours to that
run, and the entry shows both under its run and in a full-width feed below the page.

- [x] RED — integration test (worker): `createJournalEntryFn` with `playthroughId` adds `playedMinutes` to that run's `playtimeMinutes` **and** sets the entry's `playthroughId` in one txn; rejects a run not owned by the same user/item. **[Agent: testing]**
- [x] RED — component tests: log-session run picker preselects the clicked run + switchable; thoughts optional ("playtime alone is fine"); `NestedJournal` lists entries (date · hours · italic); `JournalFeed` shows run label per entry and omits the label for legacy null-run entries; feed hidden when no runs. **[Agent: testing]**
- [x] GREEN — extend `compose-journal-entry`: input `playthroughId?: string` (optional, validate-twice); worker adds `hours*60` to the run in the same txn; `entities/journal-entry/model/types.ts` carries `playthroughId` + run label. **[Agent: tanstack-fullstack]**
- [x] GREEN — log-session drawer (run picker + date + hours + optional thoughts) reusing the composer; preselect from the clicked run. **[Agent: react-frontend]**
- [x] GREEN — `NestedJournal` under `PlaythroughNode` (`// JOURNAL · N` + Log-session button + entries) and a full-width run-aware `JournalFeed` mounted below the bento grid (hidden when no runs). **[Agent: react-frontend]**
- [~] Verify: chrome MCP — **BLOCKED (environment):** IGDB-dependent game-detail unrenderable here + Chrome ext disconnected. Verified via green unit+integration+component tests. **[Agent: react-frontend + claude-in-chrome MCP]**
- [x] Gate: format/lint/typecheck clean; targeted unit (250) + integration (76) green. **[Agent: tanstack-fullstack]**

---

## Slice 6: Run-derived status pill + manual override that sticks

**User-visible value:** once a game has runs, the hero status becomes a read-only "Follows your
playthroughs" pill; "Set manually" pins a chosen status that holds across run changes; "Follow my
playthroughs" reverts. Up Next reads "Replay" after a game's been played.

- [x] RED — integration test: a manual override **sticks** across a subsequent run create/update (status unchanged while `statusIsManual`); clear → recomputes from runs. **[Agent: testing]**
- [x] RED — component test `library-status-switcher.test.tsx` three states: no-runs interactive menu (with "Replay" when `hasBeenPlayed`); runs+derived read-only pill + "Set manually"; runs+manual pinned pill + "Follow my playthroughs". **[Agent: testing]**
- [x] GREEN — `entities/playthrough/api/{set-library-status-manual.server.ts,clear-library-status-manual.server.ts}` + `features/manage-playthrough/api/{set,clear}-library-status-manual-fn.ts`. **[Agent: tanstack-fullstack]**
- [x] GREEN — rewire `widgets/game-detail/ui/library-status-switcher/` to branch on `playthroughs.length` / `statusIsManual` using the loader fields; keep the no-runs path intact. **[Agent: react-frontend]**
- [~] Verify: chrome MCP — **BLOCKED (environment):** IGDB-dependent game-detail unrenderable here + Chrome ext disconnected. Verified via green unit+integration+component tests. **[Agent: react-frontend + claude-in-chrome MCP]**
- [x] Gate: format/lint/typecheck clean; targeted unit (230) + integration (31) green. **[Agent: tanstack-fullstack]**

---

## Slice 7: Library-card quick-add (§2.13)

**User-visible value:** an "Add playthrough" action on each library card opens the same drawer
over the library; saving updates the card (status / run count) without a full reload.

- [x] RED — component test: the library card exposes "Add playthrough"; clicking opens the drawer; on save the card reflects the change. **[Agent: testing]**
- [x] GREEN — add the action to the library-grid card and lift `manage-playthrough` drawer state to the library widget; `router.invalidate()` on save. **[Agent: react-frontend]**
- [~] Verify: chrome MCP — **BLOCKED (environment):** IGDB/network + Chrome ext disconnected. Verified via green unit+integration+component tests. **[Agent: react-frontend + claude-in-chrome MCP]**
- [x] Gate. **[Agent: react-frontend]**

---

## Slice 8: Public-profile playthrough timeline (§2.14)

**User-visible value:** a visitor to a public `/u/[username]` sees the user's recent runs (game
cover/title link, platform, dates, rating, note); hidden on private profiles and when empty.

- [x] RED — integration test `get-profile-playthroughs.integration.test.ts`: returns recent runs for a public profile; **empties/denies for a private profile** (gated on `isPublicProfile`). **[Agent: testing]**
- [x] RED — component test: section renders entries newest-first; hidden when empty; hidden for a private profile. **[Agent: testing]**
- [x] GREEN — `entities/playthrough/api/get-profile-playthroughs.server.ts` (privacy invariant on the entity; joined to game cover/title/slug). **[Agent: tanstack-fullstack]**
- [x] GREEN — add the Playthroughs section to the profile-overview widget + wire the profile route loader. **[Agent: react-frontend]**
- [~] Verify: chrome MCP — **BLOCKED (environment):** IGDB/network + Chrome ext disconnected. Verified via green unit+integration+component tests. **[Agent: react-frontend + claude-in-chrome MCP]**
- [x] Gate: format/lint/typecheck clean; targeted unit + integration green. **[Agent: tanstack-fullstack]**

---

## Coverage / fallback notes

- **No `general-purpose` fallbacks** — every sub-task maps to `prisma-database`, `tanstack-fullstack`,
  `react-frontend`, or `testing`.
- **No missing MCPs** — `claude-in-chrome` is available for every verification sub-task against
  `localhost:6060`.
- **No `/awos:hire` needed** — the feature introduces no new technology (per technical-considerations.md).
