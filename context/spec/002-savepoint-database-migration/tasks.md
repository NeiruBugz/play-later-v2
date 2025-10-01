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

- [ ] **Slice 3: Refactor backlog repository to library repository**
  - [ ] Rename directory: `shared/lib/repository/backlog/` → `shared/lib/repository/library/`
  - [ ] Rename file: `library/backlog-repository.ts` → `library/library-repository.ts`
  - [ ] Update `library/types.ts`: Replace all `BacklogItem` → `LibraryItem`, `BacklogItemStatus` → `LibraryItemStatus`
  - [ ] Update `library-repository.ts`: Rename all methods (`createBacklogItem` → `createLibraryItem`, etc.)
  - [ ] Update `library-repository.ts`: Update all Prisma queries to use `prisma.libraryItem`
  - [ ] Update `shared/lib/repository/index.ts`: Export library repository instead of backlog repository
  - [ ] Run typecheck: `bun typecheck` (expect errors in features, will fix later)

- [ ] **Slice 4: Create journal repository**
  - [ ] Create directory: `shared/lib/repository/journal/`
  - [ ] Create `journal/types.ts`: Define `CreateJournalEntryInput`, `UpdateJournalEntryInput`, `GetJournalEntriesInput` types
  - [ ] Create `journal/journal-repository.ts`: Implement `createJournalEntry` method
  - [ ] Create `journal/journal-repository.ts`: Implement `getJournalEntriesForUser` method with game/libraryItem includes
  - [ ] Create `journal/journal-repository.ts`: Implement `getJournalEntriesByGame` method
  - [ ] Create `journal/journal-repository.ts`: Implement `updateJournalEntry` and `deleteJournalEntry` methods
  - [ ] Create `journal/index.ts`: Export journal repository and types
  - [ ] Update `shared/lib/repository/index.ts`: Export journal repository
  - [ ] Write unit tests for journal repository methods

## Phase 3: Shared Foundation - Enum Mappers and Base Components

- [ ] **Slice 5: Update enum mappers and constants**
  - [ ] Update `shared/lib/enum-mappers.ts`: Delete `BacklogStatusMapper`
  - [ ] Update `shared/lib/enum-mappers.ts`: Create `LibraryStatusMapper` with new display labels (Curious About, Currently Exploring, Took a Break, Experienced, Wishlist, Revisiting)
  - [ ] Update `shared/lib/enum-mappers.ts`: Export `LibraryStatusMapper`
  - [ ] Search codebase for `BacklogStatusMapper` usage and update to `LibraryStatusMapper` (run `grep -r "BacklogStatusMapper"`)
  - [ ] Run typecheck: `bun typecheck`

## Phase 4: Feature-by-Feature Vertical Slices

- [ ] **Slice 6: Refactor "Add Game" feature to use LibraryItem**
  - [ ] Update `features/add-game/types/index.ts`: Replace `BacklogItem` → `LibraryItem`, `BacklogItemStatus` → `LibraryItemStatus`
  - [ ] Update `features/add-game/lib/validation.ts`: Update schema to use `LibraryItemStatus` enum
  - [ ] Update `features/add-game/lib/constants.ts`: Update `initialFormValues` to use `CURIOUS_ABOUT` as default
  - [ ] Update `features/add-game/server-actions/add-game.ts`: Update repository import and method calls to use library repository
  - [ ] Update `features/add-game/server-actions/create-game-action.ts`: Update types to use `LibraryItemStatus`
  - [ ] Update `features/add-game/components/add-game-form.tsx`: Update form to use new enum values and labels
  - [ ] Update `features/add-game/components/add-to-collection-modal.tsx`: Update modal to use new status options
  - [ ] Run tests: `bun test features/add-game` and fix any failures
  - [ ] Manual test: Add a game to library and verify it shows "Curious About" status

- [ ] **Slice 7: Refactor "Manage Backlog Item" feature to "Manage Library Item"**
  - [ ] Rename directory: `features/manage-backlog-item/` → `features/manage-library-item/`
  - [ ] Update `features/manage-library-item/index.ts`: Update all exports to use "library" naming
  - [ ] Update `features/manage-library-item/types/index.ts`: Replace `BacklogItem` → `LibraryItem`
  - [ ] Update `features/manage-library-item/lib/validation.ts`: Update schemas to use `LibraryItemStatus`
  - [ ] Update all server actions in `features/manage-library-item/server-actions/`: Update repository calls and types
  - [ ] Update all components in `features/manage-library-item/components/`: Update prop types and imports
  - [ ] Rename component files: `*-backlog-item-*` → `*-library-item-*`
  - [ ] Run tests: `bun test features/manage-library-item` and fix failures
  - [ ] Manual test: Edit a library item's status and verify all new statuses are available

- [ ] **Slice 8: Refactor "View Collection" feature**
  - [ ] Update `features/view-collection/types/index.ts`: Replace `BacklogItem` → `LibraryItem`
  - [ ] Update `features/view-collection/lib/filters.ts`: Update filter logic to use new enum values
  - [ ] Update `features/view-collection/server-actions/get-collection.ts`: Update repository calls
  - [ ] Update `features/view-collection/components/collection-view.tsx`: Update types and status rendering
  - [ ] Update `features/view-collection/components/collection-filters.tsx`: Update filter options to show new status labels
  - [ ] Update `features/view-collection/components/status-filter-dropdown.tsx`: Use `LibraryStatusMapper` for dropdown options
  - [ ] Run tests: `bun test features/view-collection`
  - [ ] Manual test: View collection, apply status filters, verify all new statuses appear and filter correctly

- [ ] **Slice 9: Refactor Dashboard feature**
  - [ ] Update `features/dashboard/types/index.ts`: Replace `BacklogItem` → `LibraryItem`
  - [ ] Update `features/dashboard/server-actions/get-dashboard-stats.ts`: Update repository calls and type references
  - [ ] Update `features/dashboard/components/library-stats-widget.tsx`: Update prop types and status counting logic
  - [ ] Update `features/dashboard/components/recent-activity.tsx`: Update to show correct status labels
  - [ ] Update `features/dashboard/components/currently-exploring-widget.tsx`: Update filter to use `CURRENTLY_EXPLORING` enum
  - [ ] Run tests: `bun test features/dashboard`
  - [ ] Manual test: View dashboard and verify stats show correct counts for new statuses

- [ ] **Slice 10: Refactor "View Game Details" feature**
  - [ ] Update `features/view-game-details/types/index.ts`: Replace `BacklogItem` → `LibraryItem`
  - [ ] Update `features/view-game-details/server-actions/get-game-details.ts`: Update repository calls
  - [ ] Update `features/view-game-details/components/game-library-status.tsx`: Update to display new status labels
  - [ ] Update `features/view-game-details/components/game-status-actions.tsx`: Update quick action buttons to use new enum values
  - [ ] Run tests: `bun test features/view-game-details`
  - [ ] Manual test: View game details page and verify status badge and quick actions work

- [ ] **Slice 11: Refactor remaining features (Steam integration, wishlist, imported games)**
  - [ ] Update `features/steam-integration/server-actions/import-steam-games.ts`: Update to create library items with `CURIOUS_ABOUT` status
  - [ ] Update `features/view-imported-games/server-actions/confirm-import.ts`: Update repository calls
  - [ ] Update `features/view-wishlist/server-actions/get-wishlist.ts`: Update repository calls (WISHLIST status unchanged)
  - [ ] Update any remaining features that reference `BacklogItem`
  - [ ] Run codebase-wide search: `grep -r "BacklogItem" --include="*.ts" --include="*.tsx"` and fix any remaining references
  - [ ] Run typecheck: `bun typecheck` (should have zero errors)

## Phase 5: Shared Components

- [ ] **Slice 12: Refactor shared UI components**
  - [ ] Rename `shared/components/backlog-item-card.tsx` → `shared/components/library-item-card.tsx`
  - [ ] Update `library-item-card.tsx`: Update prop types to use `LibraryItem`, update status badge rendering to use `LibraryStatusMapper`
  - [ ] Update `shared/components/game-card.tsx`: Update libraryItem prop type
  - [ ] Update `shared/components/status-badge.tsx`: Update to use `LibraryItemStatus` type and `LibraryStatusMapper`
  - [ ] Update any other shared components that reference backlog types
  - [ ] Update `shared/components/index.ts`: Update exports
  - [ ] Run typecheck: `bun typecheck`

## Phase 6: Test Suite Updates

- [ ] **Slice 13: Update test factories and utilities**
  - [ ] Update `test/setup/db-factories/game.ts`: Update `createLibraryItem` factory to use new enum values (default: `CURIOUS_ABOUT`)
  - [ ] Update factory method name: `createBacklogItem` → `createLibraryItem`
  - [ ] Update `test/setup/test-helpers.ts`: Update any helper functions that reference backlog types
  - [ ] Create new factory: `createJournalEntry` in `test/setup/db-factories/journal.ts`
  - [ ] Run tests: `bun test` (expect many failures, will fix next)

- [ ] **Slice 14: Fix failing unit and integration tests**
  - [ ] Update all test files in `features/manage-library-item/`: Fix imports, enum values, and assertions
  - [ ] Update all test files in `features/add-game/`: Fix enum value expectations
  - [ ] Update all test files in `features/view-collection/`: Fix filter tests with new enum values
  - [ ] Update repository tests: `shared/lib/repository/library/*.test.ts`
  - [ ] Update service tests that use library items
  - [ ] Fix any remaining test failures revealed by `bun test`
  - [ ] Achieve >80% test coverage: `bun test:coverage`

## Phase 7: Final Verification and Cleanup

- [ ] **Slice 15: Code quality and final verification**
  - [ ] Run full typecheck: `bun typecheck` (zero errors)
  - [ ] Run linter: `bun lint` and fix any issues
  - [ ] Run formatter: `bun format:check` and fix with `bun format:write`
  - [ ] Run full test suite: `bun test` (all tests passing)
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

- [ ] **Slice 17: Update documentation**
  - [ ] Update `CLAUDE.md`: Replace "backlog" terminology with "library" throughout
  - [ ] Update `context/product/architecture.md`: Update data model section to reflect LibraryItem
  - [ ] Update feature-specific `CLAUDE.md` files (if they exist) in affected features
  - [ ] Update `context/spec/002-savepoint-database-migration/technical-considerations.md`: Mark as "Implemented"
  - [ ] Update `context/product/roadmap.md`: Check off database migration tasks in Phase 2

- [ ] **Slice 18: Final schema cleanup**
  - [ ] Update `prisma/schema.prisma`: Remove temporary `@@map("BacklogItem")` and use `@@map("LibraryItem")` instead
  - [ ] Generate final migration: `bun prisma migrate dev --name rename_backlog_table_to_library`
  - [ ] Regenerate Prisma client: `bun prisma generate`
  - [ ] Verify table is now named "LibraryItem" in Prisma Studio
  - [ ] Run full test suite one final time: `bun test`

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
