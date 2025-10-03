# SavePoint Database Migration - Task List

**Status**: Ready for Implementation
**Estimated Time**: 12-16 hours
**Strategy**: Vertical slicing - each main task keeps the application in a working state

---

## Phase 1: Foundation - Database Schema Migration

- [x] **Slice 1: Update Prisma schema and generate migration**

  - [x] Update `prisma/schema.prisma`: Rename `BacklogItem` model to `LibraryItem` (keep `@@map("BacklogItem")` temporarily)
  - [x] Update `prisma/schema.prisma`: Rename `BacklogItemStatus` enum to `LibraryItemStatus`
  - [x] Update `prisma/schema.prisma`: Update all enum values (TO_PLAY → CURIOUS_ABOUT, PLAYING → CURRENTLY_EXPLORING, PLAYED → TOOK_A_BREAK, COMPLETED → EXPERIENCED)
  - [x] Update `prisma/schema.prisma`: Add `REVISITING` enum value
  - [x] Update `prisma/schema.prisma`: Update User and Game model relations to use `LibraryItem[]`
  - [x] Generate Prisma migration: `bun prisma migrate dev --name savepoint_vision_migration`
  - [x] Regenerate Prisma client: `bun prisma generate`
  - [x] Verify migration on local database using `bun prisma studio`

- [x] **Slice 2: Create JournalEntry database foundation**
  - [x] Update `prisma/schema.prisma`: Create `JournalEntry` model with all fields (id, title, content, mood, playSession, visibility, relations, timestamps)
  - [x] Update `prisma/schema.prisma`: Create `JournalMood` enum (EXCITED, RELAXED, FRUSTRATED, ACCOMPLISHED, CURIOUS, NOSTALGIC)
  - [x] Update `prisma/schema.prisma`: Create `JournalVisibility` enum (PRIVATE, FRIENDS_ONLY, PUBLIC)
  - [x] Update `prisma/schema.prisma`: Add `JournalEntry[]` relations to User and Game models
  - [x] Generate migration: `bun prisma migrate dev --name add_journal_entry`
  - [x] Regenerate Prisma client: `bun prisma generate`
  - [x] Verify JournalEntry table exists using `bun prisma studio`

## Phase 2: Repository Layer - Data Access Abstraction

- [x] **Slice 3: Refactor backlog repository to library repository**

  - [x] Rename directory: `shared/lib/repository/backlog/` → `shared/lib/repository/library/`
  - [x] Rename file: `library/backlog-repository.ts` → `library/library-repository.ts`
  - [x] Update `library/types.ts`: Replace all `BacklogItem` → `LibraryItem`, `BacklogItemStatus` → `LibraryItemStatus`
  - [x] Update `library-repository.ts`: Rename all methods (`createBacklogItem` → `createLibraryItem`, etc.)
  - [x] Update `library-repository.ts`: Update all Prisma queries to use `prisma.libraryItem`
  - [x] Update `shared/lib/repository/index.ts`: Export library repository instead of backlog repository
  - [x] Run typecheck: `bun typecheck` (expect errors in features, will fix later)

- [x] **Slice 4: Create journal repository**
  - [x] Create directory: `shared/lib/repository/journal/`
  - [x] Create `journal/types.ts`: Define `CreateJournalEntryInput`, `UpdateJournalEntryInput`, `GetJournalEntriesInput` types
  - [x] Create `journal/journal-repository.ts`: Implement `createJournalEntry` method
  - [x] Create `journal/journal-repository.ts`: Implement `getJournalEntriesForUser` method with game/libraryItem includes
  - [x] Create `journal/journal-repository.ts`: Implement `getJournalEntriesByGame` method
  - [x] Create `journal/journal-repository.ts`: Implement `updateJournalEntry` and `deleteJournalEntry` methods
  - [x] Create `journal/index.ts`: Export journal repository and types
  - [x] Update `shared/lib/repository/index.ts`: Export journal repository
  - [x] Write unit tests for journal repository methods

## Phase 3: Shared Foundation - Enum Mappers and Base Components

- [x] **Slice 5: Update enum mappers and constants**
  - [x] Update `shared/lib/enum-mappers.ts`: Delete `BacklogStatusMapper`
  - [x] Update `shared/lib/enum-mappers.ts`: Create `LibraryStatusMapper` with new display labels (Curious About, Currently Exploring, Took a Break, Experienced, Wishlist, Revisiting)
  - [x] Update `shared/lib/enum-mappers.ts`: Export `LibraryStatusMapper`
  - [x] Search codebase for `BacklogStatusMapper` usage and update to `LibraryStatusMapper` (run `grep -r "BacklogStatusMapper"`)
  - [x] Run typecheck: `bun typecheck`

## Phase 4: Feature-by-Feature Vertical Slices

- [x] **Slice 6: Refactor "Add Game" feature to use LibraryItem**

  - [x] Update `features/add-game/types/index.ts`: Replace `BacklogItem` → `LibraryItem`, `BacklogItemStatus` → `LibraryItemStatus`
  - [x] Update `features/add-game/lib/validation.ts`: Update schema to use `LibraryItemStatus` enum
  - [x] Update `features/add-game/lib/constants.ts`: Update `initialFormValues` to use `CURIOUS_ABOUT` as default
  - [x] Update `features/add-game/server-actions/add-game.ts`: Update repository import and method calls to use library repository
  - [x] Update `features/add-game/server-actions/create-game-action.ts`: Update types to use `LibraryItemStatus`
  - [x] Update `features/add-game/components/add-game-form.tsx`: Update form to use new enum values and labels
  - [x] Update `features/add-game/components/add-to-collection-modal.tsx`: Update modal to use new status options
  - [x] Run tests: `bun run test features/add-game` and fix any failures
  - [x] Manual test: Add a game to library and verify it shows "Curious About" status

- [x] **Slice 7: Refactor "Manage Backlog Item" feature to "Manage Library Item"**

  - [x] Rename directory: `features/manage-backlog-item/` → `features/manage-library-item/`
  - [x] Update `features/manage-library-item/index.ts`: Update all exports to use "library" naming
  - [x] Update `features/manage-library-item/types/index.ts`: Replace `BacklogItem` → `LibraryItem`
  - [x] Update `features/manage-library-item/lib/validation.ts`: Update schemas to use `LibraryItemStatus`
  - [x] Update all server actions in `features/manage-library-item/server-actions/`: Update repository calls and types
  - [x] Update all components in `features/manage-library-item/components/`: Update prop types and imports
  - [x] Rename component files: `*-backlog-item-*` → `*-library-item-*`
  - [x] Run tests: `bun run test features/manage-library-item` and fix failures
  - [x] Manual test: Edit a library item's status and verify all new statuses are available

- [x] **Slice 8: Refactor "View Collection" feature**

  - [x] Update `features/view-collection/types/index.ts`: Replace `BacklogItem` → `LibraryItem`
  - [x] Update `features/view-collection/lib/filters.ts`: Update filter logic to use new enum values
  - [x] Update `features/view-collection/server-actions/get-collection.ts`: Update repository calls
  - [x] Update `features/view-collection/components/collection-view.tsx`: Update types and status rendering
  - [x] Update `features/view-collection/components/collection-filters.tsx`: Update filter options to show new status labels
  - [x] Update `features/view-collection/components/status-filter-dropdown.tsx`: Use `LibraryStatusMapper` for dropdown options
  - [x] Run tests: `bun run test features/view-collection`
  - [x] Manual test: View collection, apply status filters, verify all new statuses appear and filter correctly

- [x] **Slice 9: Refactor Dashboard feature**

  - [x] Update `features/dashboard/types/index.ts`: Replace `BacklogItem` → `LibraryItem`
  - [x] Update `features/dashboard/server-actions/get-dashboard-stats.ts`: Update repository calls and type references
  - [x] Update `features/dashboard/components/library-stats-widget.tsx`: Update prop types and status counting logic
  - [x] Update `features/dashboard/components/recent-activity.tsx`: Update to show correct status labels
  - [x] Update `features/dashboard/components/currently-exploring-widget.tsx`: Update filter to use `CURRENTLY_EXPLORING` enum
  - [x] Run tests: `bun run test features/dashboard`
  - [x] Manual test: View dashboard and verify stats show correct counts for new statuses

- [x] **Slice 10: Refactor "View Game Details" feature**

  - [x] Update `features/view-game-details/types/index.ts`: Replace `BacklogItem` → `LibraryItem`
  - [x] Update `features/view-game-details/server-actions/get-game-details.ts`: Update repository calls
  - [x] Update `features/view-game-details/components/game-library-status.tsx`: Update to display new status labels
  - [x] Update `features/view-game-details/components/game-status-actions.tsx`: Update quick action buttons to use new enum values
  - [x] Run tests: `bun run test features/view-game-details`
  - [x] Manual test: View game details page and verify status badge and quick actions work

- [x] **Slice 11: Refactor remaining features (Steam integration, wishlist, imported games)**
  - [x] Update `features/steam-integration/server-actions/import-steam-games.ts`: Update to create library items with `CURIOUS_ABOUT` status
  - [x] Update `features/view-imported-games/server-actions/confirm-import.ts`: Update repository calls
  - [x] Update `features/view-wishlist/server-actions/get-wishlist.ts`: Update repository calls (WISHLIST status unchanged)
  - [x] Update any remaining features that reference `BacklogItem`
  - [x] Run codebase-wide search: `grep -r "BacklogItem" --include="*.ts" --include="*.tsx"` and fix any remaining references
  - [x] Run typecheck: `bun typecheck` (should have zero errors)

## Phase 5: Shared Components

- [x] **Slice 12: Refactor shared UI components**
  - [x] Rename `shared/components/backlog-item-card.tsx` → `shared/components/library-item-card.tsx`
  - [x] Update `library-item-card.tsx`: Update prop types to use `LibraryItem`, update status badge rendering to use `LibraryStatusMapper`
  - [x] Update `shared/components/game-card.tsx`: Update libraryItem prop type
  - [x] Update `shared/components/status-badge.tsx`: Update to use `LibraryItemStatus` type and `LibraryStatusMapper`
  - [x] Update any other shared components that reference backlog types
  - [x] Update `shared/components/index.ts`: Update exports
  - [x] Run typecheck: `bun typecheck`

## Phase 6: Test Suite Updates

- [x] **Slice 13: Update test factories and utilities**

  - [x] Update `test/setup/db-factories/game.ts`: Update `createLibraryItem` factory to use new enum values (default: `CURIOUS_ABOUT`)
  - [x] Update factory method name: `createBacklogItem` → `createLibraryItem`
  - [x] Update `test/setup/test-helpers.ts`: Update any helper functions that reference backlog types
  - [x] Create new factory: `createJournalEntry` in `test/setup/db-factories/journal.ts`
  - [x] Run tests: `bun run test` (expect many failures, will fix next)

- [x] **Slice 14: Fix failing unit and integration tests**
  - [x] Update all test files in `features/manage-library-item/`: Fix imports, enum values, and assertions
  - [x] Update all test files in `features/add-game/`: Fix enum value expectations
  - [x] Update all test files in `features/view-collection/`: Fix filter tests with new enum values
  - [x] Update repository tests: `shared/lib/repository/library/*.test.ts`
  - [x] Update service tests that use library items
  - [x] Fix any remaining test failures revealed by `bun run test`
  - [x] Achieve >80% test coverage: `bun run test:coverage`

## Phase 7: Final Verification and Cleanup

- [ ] **Slice 15: Code quality and final verification**

  - [ ] Run full typecheck: `bun typecheck` (zero errors)
  - [ ] Run linter: `bun lint` and fix any issues
  - [ ] Run formatter: `bun format:check` and fix with `bun format:write`
  - [ ] Run full test suite: `bun run test` (all tests passing)
  - [ ] Clear Next.js cache: `rm -rf .next`
  - [ ] Start dev server: `bun dev` (should start without errors)

- [ ] **Slice 16: Manual QA of critical user flows**
  - [ ] Test: Sign in and view dashboard - verify stats show correct status counts
  - [ ] Test: Add new game to library - verify it defaults to "Curious About" status
  - [ ] Test: Update game status from "Curious About" to "Currently Exploring" - verify it saves and displays correctly
  - [ ] Test: View collection with status filters - verify all 6 statuses (including new "Revisiting") appear and filter correctly
  - [ ] Test: View game details page - verify status badge shows correct label
  - [ ] Test: Import Steam library - verify imported games create library items correctly
  - [ ] Test: Wishlist functionality - verify WISHLIST status still works (unchanged)
  - [ ] Check browser console for any errors
  - [ ] Use Prisma Studio to verify database data looks correct

## Phase 8: Documentation and Cleanup

- [x] **Slice 17: Update documentation**

  - [x] Update `CLAUDE.md`: Replace "backlog" terminology with "library" throughout
  - [x] Update `context/product/architecture.md`: Update data model section to reflect LibraryItem
  - [x] Update feature-specific `CLAUDE.md` files (if they exist) in affected features
  - [x] Update `context/spec/002-savepoint-database-migration/technical-considerations.md`: Mark as "Implemented"
  - [x] Update `context/product/roadmap.md`: Check off database migration tasks in Phase 2

- [x] **Slice 18: Final schema cleanup**
  - [x] Update `prisma/schema.prisma`: Remove temporary `@@map("BacklogItem")` and use `@@map("LibraryItem")` instead
  - [x] Generate final migration: `bun prisma migrate dev --name rename_backlog_table_to_library`
  - [x] Regenerate Prisma client: `bun prisma generate`
  - [x] Verify table is now named "LibraryItem" in Prisma Studio
  - [x] Run full test suite one final time: `bun run test`

---

## Notes

**Vertical Slicing Strategy**: Each main task represents a complete, testable increment:

- Slices 1-2: Database foundation (app still works with old code via Prisma regeneration)
- Slice 3-4: Repository layer (abstraction boundary maintained)
- Slice 5: Shared enums (needed by all features)
- Slices 6-11: Feature-by-feature updates (each feature works after its slice)
- Slice 12: Shared components (used across features)
- Slices 13-14: Tests (verification layer)
- Slices 15-18: Quality assurance and finalization

**Rollback Strategy**: If any slice fails, the previous slices remain working. Can rollback database with `bun prisma migrate reset`.

**Implementation Philosophy**: After completing each numbered slice, the application should remain in a runnable state (though some features may be temporarily broken until their specific slice is completed).
