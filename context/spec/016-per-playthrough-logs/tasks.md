# Tasks: Per-Playthrough Logs

- **Functional Spec:** [`functional-spec.md`](./functional-spec.md)
- **Technical Spec:** [`technical-considerations.md`](./technical-considerations.md)

Each slice below is a vertical, runnable increment. The application must remain in a working, type-checking, test-passing state after every slice. E2E verification (Playwright) is intentionally excluded — the project's E2E pipeline needs to be re-stood-up before new flows are added there. **Manual verification uses the `claude-in-chrome` MCP connector** (`mcp__claude-in-chrome__*`) against the local dev server on `http://localhost:6060`. Load tools via `ToolSearch` with `select:mcp__claude-in-chrome__<tool>` before calling them.

**Per-slice gate:** every slice ends with `pnpm --filter savepoint ci:check` (Prettier check + ESLint + TypeScript typecheck + unit/component tests). Do not mark a slice complete until this command passes.

---

## Slice 1: Schema foundation + empty Playthroughs section visible on game detail

User-visible value: a "Playthroughs" empty-state section appears on every game detail page (with a non-functional "Add playthrough" button), and the database has the full shape ready for subsequent slices.

- [x] Add `Playthrough` model to `savepoint-app/prisma/schema.prisma` per § 2.1 (cuid id, FKs to LibraryItem/User/Game/Platform with documented `onDelete`, indexes `[libraryItemId, endedAt]`, `[userId, endedAt]`, `[userId, gameId, endedAt]`). **[Agent: prisma-database]**
- [x] Add `playthroughId String?` (FK → `Playthrough.id`, `onDelete: SetNull`) and `@@index([playthroughId])` to `JournalEntry`. **[Agent: prisma-database]**
- [x] Add `platformId String?` (FK → `Platform.id`, `onDelete: SetNull`) to `LibraryItem`; leave legacy `platform String?` column in place. **[Agent: prisma-database]**
- [x] Add `ProfileSectionVisibility { PUBLIC, FOLLOWERS, PRIVATE }` enum and `playthroughsVisibility ProfileSectionVisibility @default(PUBLIC)` on `UserProfile`. *(Note: project has no `UserProfile` model — added to `User` instead.)* **[Agent: prisma-database]**
- [x] Generate migration with `pnpm --filter savepoint prisma migrate dev --name 016_per_playthrough_logs`; in the SQL, add a case-insensitive backfill `UPDATE "LibraryItem" SET "platformId" = p.id FROM "Platform" p WHERE LOWER("LibraryItem"."platform") = LOWER(p.name)`. **[Agent: prisma-database]**
- [x] Integration test: apply migration against representative fixture rows (matched, unmatched, case-mismatch) and assert backfill outcomes. **[Agent: typescript-test-expert]**
- [x] Create skeleton `savepoint-app/features/playthroughs/` with `index.ts`, `index.server.ts`, `types.ts`, `schemas.ts`, `ui/`, `server-actions/`, `use-cases/`, `hooks/`. **[Agent: react-frontend]**
- [x] Add `playthroughs` row to `savepoint-app/features/CLAUDE.md` allowlist table per § 2.8 (consumers: `manage-library-entry/ui/`, `game-detail/`, `library/ui/`, `journal/ui/`, `profile/ui/`, `app/u/[username]/`). **[Agent: nextjs-expert]**
- [x] Create empty `playthrough-timeline.tsx` rendering heading "Playthroughs" + empty state copy + non-functional "Add playthrough" button. Mount it inside the game detail layout after the journal section. **[Agent: react-frontend]**
- [x] Verify: run `pnpm --filter savepoint prisma migrate dev`, then start `pnpm --filter savepoint dev`. Use `claude-in-chrome` MCP to navigate to a game detail page on `http://localhost:6060` and confirm the empty Playthroughs section renders with the "Add playthrough" button. **[Agent: general-purpose + claude-in-chrome MCP]**
- [x] CI gate: `pnpm --filter savepoint ci:check` passes. **[Agent: general-purpose]**

---

## Slice 2: Add a playthrough from game detail and see it on the timeline

User-visible value: clicking "Add playthrough" opens a dialog; saving with a platform creates a row that appears in the timeline.

- [x] Implement `data-access-layer/repository/playthrough/playthrough-repository.ts` with `createPlaythrough`, `findPlaythroughById`, `findPlaythroughsByLibraryItemId`. Mirror `library-repository.ts` Result conventions. **[Agent: prisma-database]**
- [x] Implement `data-access-layer/services/playthrough/playthrough-service.ts` with `createPlaythrough(userId, input)`, `listForGame(userId, libraryItemId)`, `getPlatformsForGame(gameId)`. Validate platform belongs to the game's `GamePlatform` set; reject if missing. Return `ServiceResult<T>`. **[Agent: nextjs-expert]**
- [x] Define Zod schemas in `features/playthroughs/schemas.ts`: `createPlaythroughSchema` (platform required, `endedAt >= startedAt`, note ≤280, rating ∈ {2..20} half-step encoding). **[Agent: nextjs-fullstack]**
- [x] Implement `features/playthroughs/server-actions/create-playthrough-action.ts` using `authorizedActionClient`; on success `revalidatePath` for `/games/[slug]` and `/library`. **[Agent: nextjs-fullstack]**
- [x] Implement `playthrough-form-dialog.tsx` reusing `PlatformCombobox`, `DateField`, `RatingInput`. Wire 280-char counter; disable submit while invalid. **[Agent: react-frontend]**
- [x] Implement `playthrough-row.tsx` (status indicator, dates, platform name, optional rating, optional note). **[Agent: react-frontend]**
- [x] Update `features/game-detail/use-cases/get-game-details.ts` to include `PlaythroughService.listForGame` in the parallel fanout; expose `playthroughs` on `GameDetailsResult`. **[Agent: nextjs-expert]**
- [x] Wire `playthrough-timeline.tsx` to render `playthrough-row` list with newest-first ordering (open pinned, then `endedAt` desc); wire "Add playthrough" button to open `playthrough-form-dialog`. **[Agent: react-frontend]**
- [x] Unit tests: `PlaythroughService.createPlaythrough` happy paths, ownership/cross-user rejection, platform-not-on-game rejection, schema validation. **[Agent: typescript-test-expert]**
- [x] Component test: `playthrough-form-dialog` — required platform, char counter at 280, date validation, submit disabled state. **[Agent: typescript-test-expert]**
- [x] Verify via `claude-in-chrome` MCP: navigate to a game detail page, click "Add playthrough", fill platform + start date, submit; assert the row appears in the timeline. Reload the page; assert row persists. **[Agent: general-purpose + claude-in-chrome MCP]**
- [x] CI gate: `pnpm --filter savepoint ci:check` passes. **[Agent: general-purpose]**

---

## Slice 3: Edit and delete playthroughs

User-visible value: each timeline row exposes edit and delete actions; deleting prompts confirmation and detaches journal entries.

- [x] Add `updatePlaythrough(id, patch)` and `deletePlaythrough(id)` to repository. **[Agent: prisma-database]**
- [x] Add `update(userId, id, patch)` and `delete(userId, id)` to `PlaythroughService` (ownership-checked). **[Agent: nextjs-expert]**
- [x] Implement `updatePlaythroughAction` and `deletePlaythroughAction` with `revalidatePath` for `/games/[slug]`, `/library`, and `/u/[username]`. **[Agent: nextjs-fullstack]**
- [x] Extend `playthrough-form-dialog.tsx` to support edit mode (pre-fill from row). **[Agent: react-frontend]**
- [x] Implement `delete-playthrough-confirmation.tsx` with the exact copy from AC 2.7. **[Agent: react-frontend]**
- [x] Wire row actions menu (edit / delete) on `playthrough-row.tsx`. **[Agent: react-frontend]**
- [x] Integration test: deleting a playthrough nulls `JournalEntry.playthroughId` (cascade `SET NULL`); the journal entry is still visible on the game. **[Agent: typescript-test-expert]**
- [x] Verify via `claude-in-chrome` MCP: open the row's actions menu, edit platform + rating, save; assert row updates. Trigger delete; assert confirmation copy matches AC 2.7 and the row disappears on confirm. **[Agent: general-purpose + claude-in-chrome MCP]**
- [x] CI gate: `pnpm --filter savepoint ci:check` passes. **[Agent: general-purpose]**

---

## Slice 4: Auto-create open playthrough on status → "Playing"

User-visible value: changing a game's library status to "Playing" silently creates an open playthrough visible on the timeline.

- [x] Implement `findOpenPlaythroughsByUserAndGame(userId, gameId)` in repository. **[Agent: prisma-database]**
- [x] Add `listOpenForGame(userId, gameId)` to `PlaythroughService`. **[Agent: nextjs-expert]**
- [x] Implement `features/manage-library-entry/use-cases/transition-status-to-playing.ts` per § 2.4 — calls `LibraryService.updateLibraryItem` then `PlaythroughService.createPlaythrough` (today, no end date, platform inherited from most recent playthrough on this game; if none, leave platform null). Idempotent: if an open playthrough already exists for `(userId, gameId)`, skip create. **[Agent: nextjs-expert]**
- [x] Audit and route `update-library-status-action`, `update-library-entry-action`, and `add-to-library-action` through the new use-case whenever the resolved status is `PLAYING`. **[Agent: nextjs-fullstack]**
- [x] Unit test: idempotency (no second open playthrough), platform inheritance from most recent prior playthrough, missing-prior-platform leaves null. **[Agent: typescript-test-expert]**
- [x] Verify via `claude-in-chrome` MCP: from `/library`, open a card menu, set status to Playing; navigate to detail and assert one open playthrough row appears. Set Playing again on the same game; assert still only one open row. **[Agent: general-purpose + claude-in-chrome MCP]**
- [x] CI gate: `pnpm --filter savepoint ci:check` passes. **[Agent: general-purpose]**

---

## Slice 5: Wrap-up dialog on status → "Played"

User-visible value: changing status from Playing to Played opens a "Wrap up this playthrough" dialog supporting single or multi-open closure.

- [ ] Add `wrapUpPlaythroughs(userId, closures)` to `PlaythroughService` — single transaction, rejects already-closed rows. **[Agent: nextjs-expert]**
- [ ] Implement `features/manage-library-entry/use-cases/transition-status-to-played.ts` — `LibraryService.updateLibraryItem` to PLAYED + `PlaythroughService.wrapUpPlaythroughs`. If no open playthrough exists, supports the AC 2.3 historical-create branch by delegating to `add-historical-playthrough` (dependency forward-declared; see Slice 6). **[Agent: nextjs-expert]**
- [ ] Implement `wrapUpPlaythroughAction` and `listOpenForGameAction` server actions. **[Agent: nextjs-fullstack]**
- [ ] Implement `wrap-up-playthrough-dialog.tsx` — single open: end date (default today, editable), platform pre-filled from open playthrough, optional rating, optional note. Multi-open: list with per-row close fields and "Close all" option. **[Agent: react-frontend]**
- [ ] In `features/manage-library-entry/ui/library-card-menu.tsx`, intercept `next === "PLAYED"` per existing pattern (`library-card-menu.tsx:66`) and open the wrap-up dialog before invoking the status action. **[Agent: react-frontend]**
- [ ] Unit test: `transition-status-to-played` single-close, multi-close, and partial-failure rollback. **[Agent: typescript-test-expert]**
- [ ] Component test: `wrap-up-playthrough-dialog` — single open vs multiple-open layout; cancel leaves status unchanged. **[Agent: typescript-test-expert]**
- [ ] Verify via `claude-in-chrome` MCP: with one open playthrough, set status to Played; assert dialog appears, confirm; assert playthrough closed and status flipped. Seed two open playthroughs (PC + Switch) and re-run; assert dialog lists both with per-row fields. Run cancel path; assert row unchanged. **[Agent: general-purpose + claude-in-chrome MCP]**
- [ ] CI gate: `pnpm --filter savepoint ci:check` passes. **[Agent: general-purpose]**

---

## Slice 6: Add a historical playthrough with retroactive status prompt

User-visible value: a user can add a fully closed past playthrough; if the library status isn't already Played, a follow-up prompt offers to mark it Played.

- [ ] Implement `features/playthroughs/use-cases/add-historical-playthrough.ts` — `PlaythroughService.createPlaythrough` + optional `LibraryService.updateLibraryItem` to PLAYED. **[Agent: nextjs-expert]**
- [ ] Extend `createPlaythroughAction` input with `markGameAsPlayed?: boolean`; route through the new use-case when both dates are set and the flag is true. **[Agent: nextjs-fullstack]**
- [ ] Extend `playthrough-form-dialog.tsx` to allow both dates in the past with `endedAt >= startedAt` validation. After successful save of a closed historical playthrough on a game whose status isn't `PLAYED`, show a follow-up confirm: "Mark this game as Played?" Yes invokes the use-case path; No saves without status change. **[Agent: react-frontend]**
- [ ] Unit test: Yes/No branches of `add-historical-playthrough`. **[Agent: typescript-test-expert]**
- [ ] Verify via `claude-in-chrome` MCP: on a Want-to-Play game, add a historical playthrough (both dates last year), choose "Yes" on the follow-up prompt; assert the game's status badge flips to Played. Repeat with "No"; assert status unchanged and playthrough still saved. **[Agent: general-purpose + claude-in-chrome MCP]**
- [ ] CI gate: `pnpm --filter savepoint ci:check` passes. **[Agent: general-purpose]**

---

## Slice 7: Library card "Add playthrough" entry point

User-visible value: a quick action on each library card opens the playthrough form dialog without navigating to detail.

- [ ] Add "Add playthrough" item to `features/manage-library-entry/ui/library-card-menu.tsx` opening `playthrough-form-dialog`. **[Agent: react-frontend]**
- [ ] Ensure post-save `revalidatePath("/library")` causes the card's playthrough count to update without full page reload. **[Agent: nextjs-fullstack]**
- [ ] Verify via `claude-in-chrome` MCP: from `/library`, open a card menu, add a playthrough; assert dialog closes and the card's playthrough count increments without a full page reload. **[Agent: general-purpose + claude-in-chrome MCP]**
- [ ] CI gate: `pnpm --filter savepoint ci:check` passes. **[Agent: general-purpose]**

---

## Slice 8: Journal entries can attach to a playthrough

User-visible value: journal composer shows an optional "Playthrough" picker; attached entries display a small badge linking back to the run.

- [ ] Add `playthroughId String?` field to journal Zod schema; extend `create-journal-entry.ts` and `update-journal-entry.ts` server actions to accept and persist it. **[Agent: nextjs-fullstack]**
- [ ] Extend `journal-repository.ts` reads/writes to include the new column. **[Agent: prisma-database]**
- [ ] Implement `hooks/use-playthroughs-for-game.ts` (TanStack Query) returning playthroughs newest-first for a game. **[Agent: react-frontend]**
- [ ] Add "Playthrough (optional)" `Select` to `features/journal/ui/journal-entry-form.tsx`, mirroring the existing library-item picker; default "None". **[Agent: react-frontend]**
- [ ] In the journal entry row component, render a "from playthrough #N — Platform, Mon YYYY" badge when `playthroughId` is set (computed in render from the loaded playthrough list). **[Agent: react-frontend]**
- [ ] Component test: form submit includes `playthroughId`; legacy entries without a playthrough render unchanged. **[Agent: typescript-test-expert]**
- [ ] Integration test: deleting the attached playthrough leaves the journal entry visible on the game with `playthroughId = null`. **[Agent: typescript-test-expert]**
- [ ] Verify via `claude-in-chrome` MCP: compose a journal entry with a playthrough selected; assert badge renders on the entry. Edit a legacy entry to attach a playthrough; assert badge appears. Delete the playthrough; assert entry remains, badge is gone. **[Agent: general-purpose + claude-in-chrome MCP]**
- [ ] CI gate: `pnpm --filter savepoint ci:check` passes. **[Agent: general-purpose]**

---

## Slice 9: Public profile playthrough timeline + visibility setting

User-visible value: visitors to `/u/[username]` see a Playthroughs feed when the owner opts in; the owner can change visibility from profile settings.

- [ ] Implement `findRecentPlaythroughsByUserId(userId, { limit })` in repository, joining `Game` for cover/title. **[Agent: prisma-database]**
- [ ] Implement `listForUserPublic(userId, viewerId, { limit })` in `PlaythroughService` enforcing `playthroughsVisibility` and follow-relation check. **[Agent: nextjs-expert]**
- [ ] Implement `public-playthrough-feed.tsx` (cover + title link, dates, platform, rating, note). **[Agent: react-frontend]**
- [ ] Update `features/profile/use-cases/get-profile-page-data.ts` (or equivalent) to fetch the public feed when allowed and pass through to the page. **[Agent: nextjs-expert]**
- [ ] Render `<PublicPlaythroughFeed>` in `app/u/[username]/(tabs)/...`; hide the section entirely when there is nothing to show. **[Agent: nextjs-expert]**
- [ ] Add a visibility toggle row (Public / Followers / Private) to the profile settings UI bound to `playthroughsVisibility`; default `PUBLIC`. **[Agent: react-frontend]**
- [ ] Server action to update `playthroughsVisibility`, `revalidatePath("/u/${username}")`. **[Agent: nextjs-fullstack]**
- [ ] Integration test: 3×4 matrix — visibility (`PUBLIC` / `FOLLOWERS` / `PRIVATE`) × viewer (owner / follower / stranger / unauthenticated). Assert empty result for non-owners on `PRIVATE` and for non-followers on `FOLLOWERS`. **[Agent: typescript-test-expert]**
- [ ] Verify via `claude-in-chrome` MCP (using two browser tabs / accounts): as the owner, set visibility to Followers; in another tab as a stranger, assert the feed is hidden; as a follower, assert it shows. Set Private; assert only the owner sees it. Confirm new-user default of Public renders. **[Agent: general-purpose + claude-in-chrome MCP]**
- [ ] CI gate: `pnpm --filter savepoint ci:check` passes. **[Agent: general-purpose]**

---

## Coverage gate

- [ ] Confirm Vitest coverage ≥80% overall, with `PlaythroughService`, the three use-cases, and the wrap-up flow at ~90% on critical paths (auto-create idempotency, multi-close transactional rollback, deletion cascade). **[Agent: typescript-test-expert]**
- [ ] Final CI sweep: `pnpm --filter savepoint ci:check`. **[Agent: general-purpose]**

---

## Recommendations / gaps

| Task / Slice | Issue | Recommendation |
|---|---|---|
| All "Verify" steps | Project Playwright E2E pipeline is currently stood down (per spec § 4). | Re-stand-up E2E (separate workstream) before adding spec-driven Playwright coverage. In the meantime, manual verification uses the `claude-in-chrome` MCP connector against `http://localhost:6060`. |
| Verify steps | No dedicated `manual-qa` agent exists. | `general-purpose` agent drives `claude-in-chrome` MCP tools (`tabs_context_mcp`, `navigate`, `find`, `browser_click`, `form_input`, `read_page`) — load tools via `ToolSearch select:mcp__claude-in-chrome__<name>` before each verify step. |
