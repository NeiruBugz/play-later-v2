# Migration B readiness (spec 026, slice 12)

Read-only audit run 2026-11-04 after slices 1–11 landed (before production verification). Paths relative to `savepoint-tanstack/`.

## Verdict

Not ready to drop yet; all remaining work is mechanical and typecheck-guarded once the schema changes.

- **Reads:** no production code reads a legacy field except `JOURNAL_ENTRY_OMIT` (`src/entities/journal-entry/model/types.ts:10-14`, omits `kind`, `mood`, `title`).
- **Writes (3, production):**
  - `src/entities/library-item/api/set-library-item-status.server.ts:102-103` — `Playthrough.kind` / `status` on play create.
  - `src/entities/journal-entry/api/create-journal-entry.server.ts:66-73` — `Playthrough.playtimeMinutes` increment (nothing reads it; time played = sum of notes' `playedMinutes`).
- **Full LibraryItem rows** reach the client via `get-library.server.ts:49` and `get-game-details.server.ts:104`; legacy columns vanish with the drop, no code change needed.
- **Keep:** `user.statusModelNoticePending`, `JournalEntry.title`, `Playthrough.startedAt` / `finishedAt` / `platform` / `ordinal`, `LibraryItem.rating`.
- `test/integration/mindful-core-migration.integration.test.ts` only applies migrations before migration A, so it stays as is.

## Edit list for migration B

1. **Schema:** drop LibraryItem `acquisitionType`, `startedAt`, `completedAt`, `hasBeenPlayed`, `statusIsManual`; JournalEntry `kind`, `tags`, `mood`, `playSession`, `visibility`, `publishedAt`; Playthrough `kind`, `status`, `playtimeMinutes`, `rating`, `completion`, `notes`; enums `AcquisitionType`, `JournalEntryKind`, `JournalMood`, `JournalVisibility`, `PlaythroughKind`, `PlaythroughStatus`.
2. **Migration:** `<ts>_mindful_core_contract` with `DROP COLUMN` + `DROP TYPE`. CI only warns on destructive SQL and does not match `DROP TYPE` — dry-run on a Neon branch of production first (`docs/cutover-rollback.md`).
3. **Production code:** the two writes above; `JOURNAL_ENTRY_OMIT` → `{ title: true }` (else `satisfies Prisma.JournalEntryOmit` fails); doc comments at `create-journal-entry.server.ts:22`, `update-journal-entry.server.ts:24`, `types.ts:23`.
4. **Factories:** `test/factories/builders.ts` (`buildLibraryItem` 52, 54-56, 58; `buildPlay` 85-86, 90-93; `buildNote` 104, 108-111, 119); `test/factories/db.ts:86-87`.
5. **Unit tests:** `delete-library-item.unit.test.ts:29-33`, `update-library-item.unit.test.ts:29-33`; `library-item-card.test.tsx:216` (startedAt override) and `:489-499` (acquisition chip test — delete).
6. **Integration tests:**
   - `acquisitionType: "DIGITAL"` in 14 files: get-library-status-counts, get-game-details, get-platform-options, add-game-to-library, get-activity-for-user, get-loggable-games, delete-library-item, get-library-items-by-igdb-ids, update-library-item, get-dashboard-page-data, get-activity-feed, get-unique-platforms, get-onboarding-signals, get-library-stats.
   - `startedAt` / `completedAt`: get-library (74-75, 85-86), delete-library-item (116-117).
   - JournalEntry `kind` in note helpers: get-journal-timeline, get-journal-entries-for-game, journal-entry-by-id, delete-journal-entry, get-game-details (317, 384, 453, 521, 796, 806); rewrite the "drops kind/title/mood" assertions in get-journal-timeline (221-240), log-time (213-228), update-journal-entry (61).
   - Playthrough `status` / `playtimeMinutes` args in get-game-details (691, 717, 741, 750, 782, 886, 910); rework the notes-vs-run-sum test (772-784); factories.integration (118-126); log-time "increments the open play" (91-104).
7. **Seed:** `ui-audit/seed-audit-users.sql` lines 47, 78-81, 104-110, 133, 162.
8. **Docs:** `docs/cutover-rollback.md`; stale patch-shape note `DIVERGENCES.md:206`; technical-considerations §2.1 sentence claiming Times to Beat reads `Playthrough.playtimeMinutes` (it reads the notes total).
9. **Gate:** typecheck → unit → integration → migrate a fresh DB and the migration-test DB.
