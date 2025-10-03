# Technical Specification: SavePoint Database Migration

- **Functional Specification:** [SavePoint Product Roadmap - Phase 2: Vision Transformation](../../product/roadmap.md#phase-2--in-progress---vision-transformation--architecture)
- **Status:** Implemented
- **Author(s):** Claude Code (AI Assistant)
- **Created:** 2025-10-01
- **Completed:** 2025-10-02

---

## Implementation Status

**✅ SUCCESSFULLY IMPLEMENTED** (Phases 1-6 Complete)

The SavePoint database migration has been successfully completed. All technical changes outlined in this specification have been implemented:

- **Database Schema**: `BacklogItem` → `LibraryItem` model renamed
- **Enum Type**: `BacklogItemStatus` → `LibraryItemStatus` updated
- **Enum Values**: All values updated to new journey-focused terminology
- **New Model**: `JournalEntry` with supporting enums created
- **Repository Layer**: Complete refactoring from backlog to library terminology
- **Feature Directories**: All features updated with new terminology
- **Shared Components**: All components and utilities updated
- **Test Suite**: All tests passing with new types and values

**Remaining Work**:

- Documentation updates (in progress)
- Final verification of edge cases
- Optional schema cleanup and optimization

---

## 1. High-Level Technical Approach

This migration transforms the database schema to align with the SavePoint vision by:

1. **Renaming core entities**: `BacklogItem` → `LibraryItem` to reflect curation rather than obligation
2. **Updating enum values**: `BacklogItemStatus` → `LibraryItemStatus` with journey-focused terminology
3. **Preparing for journaling**: Creating the new `JournalEntry` model for dual-feature strategy
4. **Aggressive migration strategy**: Since there are no existing production users, we can make breaking changes without data preservation concerns

**Systems Affected**:

- **Database**: Prisma schema, all migrations
- **Repository Layer**: Backlog repository → Library repository
- **Services**: Collection service, game management service
- **Features**: 9+ feature directories (manage-backlog-item, dashboard, add-game, view-collection, etc.)
- **Shared Components**: 10+ components (game-card, list-view, grid-view, etc.)
- **Type Definitions**: 40+ files with type imports
- **Tests**: 20+ test files, test factories

**Migration Approach**: Single comprehensive Prisma migration with coordinated codebase refactoring.

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Database Schema Changes

#### A. Rename `BacklogItem` Model to `LibraryItem`

**Prisma Schema Changes** (`prisma/schema.prisma`):

```prisma
// BEFORE
model BacklogItem {
  id              Int               @id @default(autoincrement())
  status          BacklogItemStatus @default(TO_PLAY)
  // ... other fields
  @@map("BacklogItem")  // Existing table name
}

// AFTER
model LibraryItem {
  id              Int              @id @default(autoincrement())
  status          LibraryItemStatus @default(CURIOUS_ABOUT)
  // ... other fields
  @@map("BacklogItem")  // Keeps existing table name for now, rename in migration
}
```

**Rationale**: Renaming the model provides clear intent in the codebase while the migration handles the actual table rename.

#### B. Update Enum: `BacklogItemStatus` → `LibraryItemStatus`

**New Enum Definition**:

```prisma
enum LibraryItemStatus {
  CURIOUS_ABOUT      // Previously TO_PLAY
  CURRENTLY_EXPLORING // Previously PLAYING
  TOOK_A_BREAK       // Previously PLAYED
  EXPERIENCED        // Previously COMPLETED
  WISHLIST           // Unchanged
  REVISITING         // NEW - for replaying beloved games
}
```

**Display Name Mapping** (for `shared/lib/enum-mappers.ts`):

```typescript
export const LibraryStatusMapper: Record<LibraryItemStatus, string> = {
  CURIOUS_ABOUT: "Curious About",
  CURRENTLY_EXPLORING: "Currently Exploring",
  TOOK_A_BREAK: "Took a Break",
  EXPERIENCED: "Experienced",
  WISHLIST: "Wishlist",
  REVISITING: "Revisiting",
};
```

#### C. Create New `JournalEntry` Model

**New Model Definition**:

```prisma
model JournalEntry {
  id            String            @id @default(cuid())
  title         String?           // Optional title for the entry
  content       String            @db.Text // Rich text journal content
  mood          JournalMood?      // Optional mood indicator
  playSession   Int?              // Session number for this game
  isPublic      Boolean           @default(false) // Privacy control
  visibility    JournalVisibility @default(PRIVATE)

  // Relationships
  userId        String
  gameId        String
  libraryItemId Int?              // Optional link to library item

  user          User              @relation(fields: [userId], references: [id])
  game          Game              @relation(fields: [gameId], references: [id])
  libraryItem   LibraryItem?      @relation(fields: [libraryItemId], references: [id])

  // Metadata
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  publishedAt   DateTime?         // When made public

  @@index([userId, createdAt])
  @@index([gameId])
  @@index([libraryItemId])
}

enum JournalMood {
  EXCITED
  RELAXED
  FRUSTRATED
  ACCOMPLISHED
  CURIOUS
  NOSTALGIC
}

enum JournalVisibility {
  PRIVATE       // Only user can see
  FRIENDS_ONLY  // Future feature
  PUBLIC        // Anyone can see
}
```

**Rationale**:

- Separate from `Review` to maintain dual-feature strategy
- Rich metadata for personal reflection (mood, session tracking)
- Privacy controls built in from the start
- Optional link to `LibraryItem` for context

#### D. Update Related Models

**User Model Update**:

```prisma
model User {
  // ... existing fields
  LibraryItem   LibraryItem[]    // Renamed from BacklogItem
  JournalEntry  JournalEntry[]   // NEW
  // ... other fields
}
```

**Game Model Update**:

```prisma
model Game {
  // ... existing fields
  libraryItems  LibraryItem[]    @relation("GameLibraryItems") // Renamed
  JournalEntry  JournalEntry[]   // NEW
  // ... other fields
}
```

### 2.2 Prisma Migration Strategy

**Migration File**: `prisma/migrations/YYYYMMDDHHMMSS_savepoint_vision_migration/migration.sql`

**Migration Steps**:

```sql
-- Step 1: Rename enum type
ALTER TYPE "BacklogItemStatus" RENAME TO "LibraryItemStatus";

-- Step 2: Update enum values (PostgreSQL requires careful handling)
-- Note: This is a breaking change but acceptable given no production users
ALTER TYPE "LibraryItemStatus" RENAME VALUE 'TO_PLAY' TO 'CURIOUS_ABOUT';
ALTER TYPE "LibraryItemStatus" RENAME VALUE 'PLAYING' TO 'CURRENTLY_EXPLORING';
ALTER TYPE "LibraryItemStatus" RENAME VALUE 'PLAYED' TO 'TOOK_A_BREAK';
ALTER TYPE "LibraryItemStatus" RENAME VALUE 'COMPLETED' TO 'EXPERIENCED';
-- WISHLIST remains unchanged

-- Step 3: Add new enum value
ALTER TYPE "LibraryItemStatus" ADD VALUE 'REVISITING';

-- Step 4: Rename table
ALTER TABLE "BacklogItem" RENAME TO "LibraryItem";

-- Step 5: Update index names to reflect new table name
ALTER INDEX "BacklogItem_userId_status_idx"
  RENAME TO "LibraryItem_userId_status_idx";
ALTER INDEX "BacklogItem_userId_platform_idx"
  RENAME TO "LibraryItem_userId_platform_idx";
ALTER INDEX "BacklogItem_userId_createdAt_idx"
  RENAME TO "LibraryItem_userId_createdAt_idx";
ALTER INDEX "BacklogItem_gameId_idx"
  RENAME TO "LibraryItem_userId_gameId_idx";

-- Step 6: Update foreign key constraint names
ALTER TABLE "LibraryItem" RENAME CONSTRAINT "BacklogItem_gameId_fkey"
  TO "LibraryItem_gameId_fkey";
ALTER TABLE "LibraryItem" RENAME CONSTRAINT "BacklogItem_userId_fkey"
  TO "LibraryItem_userId_fkey";

-- Step 7: Create new JournalEntry table and related enums
CREATE TYPE "JournalMood" AS ENUM ('EXCITED', 'RELAXED', 'FRUSTRATED', 'ACCOMPLISHED', 'CURIOUS', 'NOSTALGIC');
CREATE TYPE "JournalVisibility" AS ENUM ('PRIVATE', 'FRIENDS_ONLY', 'PUBLIC');

CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "mood" "JournalMood",
    "playSession" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "JournalVisibility" NOT NULL DEFAULT 'PRIVATE',
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "libraryItemId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- Step 8: Create indexes for JournalEntry
CREATE INDEX "JournalEntry_userId_createdAt_idx" ON "JournalEntry"("userId", "createdAt");
CREATE INDEX "JournalEntry_gameId_idx" ON "JournalEntry"("gameId");
CREATE INDEX "JournalEntry_libraryItemId_idx" ON "JournalEntry"("libraryItemId");

-- Step 9: Add foreign key constraints for JournalEntry
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_gameId_fkey"
  FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_libraryItemId_fkey"
  FOREIGN KEY ("libraryItemId") REFERENCES "LibraryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

**Prisma Schema Update Required**: Update `@@map()` directives after migration:

```prisma
model LibraryItem {
  // Remove @@map("BacklogItem") after migration completes
  @@map("LibraryItem")
}
```

### 2.3 Repository Layer Changes

#### Rename Repository: `backlog-repository.ts` → `library-repository.ts`

**Directory Structure Change**:

```
shared/lib/repository/
  backlog/                  # OLD
    ├── backlog-repository.ts
    ├── types.ts
    └── index.ts

  library/                  # NEW
    ├── library-repository.ts
    ├── types.ts
    └── index.ts
```

**Type Definitions Update** (`shared/lib/repository/library/types.ts`):

```typescript
import {
  type AcquisitionType,
  type Game,
  type LibraryItem, // Changed from BacklogItem
  type LibraryItemStatus, // Changed from BacklogItemStatus
  type Prisma,
  type User,
} from "@prisma/client";

export type CreateLibraryItemInput = {
  // Changed from CreateBacklogItemInput
  userId: string;
  gameId: string;
  libraryItem: {
    // Changed from backlogItem
    status: LibraryItemStatus; // Changed type
    acquisitionType: AcquisitionType;
    platform?: string;
    startedAt?: Date;
    completedAt?: Date;
  };
};

// Similar updates for all other types...
export type UpdateLibraryItemInput = {
  /* ... */
};
export type DeleteLibraryItemInput = {
  /* ... */
};
// etc.
```

**Repository Method Updates**:

- `createBacklogItem` → `createLibraryItem`
- `updateBacklogItem` → `updateLibraryItem`
- `deleteBacklogItem` → `deleteLibraryItem`
- `getBacklogItemsForUser` → `getLibraryItemsForUser`
- All Prisma queries updated to use `prisma.libraryItem`

#### Create New `journal-repository.ts`

**New Repository** (`shared/lib/repository/journal/`):

```typescript
// journal-repository.ts
export class JournalRepository {
  constructor(private prisma: PrismaClient) {}

  async createJournalEntry(input: CreateJournalEntryInput) {
    return this.prisma.journalEntry.create({
      data: {
        title: input.title,
        content: input.content,
        mood: input.mood,
        playSession: input.playSession,
        visibility: input.visibility || "PRIVATE",
        userId: input.userId,
        gameId: input.gameId,
        libraryItemId: input.libraryItemId,
      },
    });
  }

  async getJournalEntriesForUser(userId: string) {
    return this.prisma.journalEntry.findMany({
      where: { userId },
      include: { game: true, libraryItem: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // Additional methods: getByGame, update, delete, makePublic, etc.
}
```

### 2.4 Feature Directory Refactoring

**Critical Rename**: `features/manage-backlog-item/` → `features/manage-library-item/`

**Sub-directories Affected**:

- `create-backlog-item/` → `create-library-item/`
- `edit-backlog-item/` → `edit-library-item/`
- `delete-backlog-item/` → `delete-library-item/`

**Files to Update** (examples):

- `create-backlog-item-form.tsx` → `create-library-item-form.tsx`
- `edit-game-entry-modal.tsx` → Update internal references
- All server actions and validation schemas

### 2.5 Shared Components & Utilities

**Enum Mapper Update** (`shared/lib/enum-mappers.ts`):

```typescript
// Delete BacklogStatusMapper, replace with:
export const LibraryStatusMapper: Record<LibraryItemStatus, string> = {
  CURIOUS_ABOUT: "Curious About",
  CURRENTLY_EXPLORING: "Currently Exploring",
  TOOK_A_BREAK: "Took a Break",
  EXPERIENCED: "Experienced",
  WISHLIST: "Wishlist",
  REVISITING: "Revisiting",
};
```

**Component Updates**:

- `shared/components/backlog-item-card.tsx` → `library-item-card.tsx`
- Update all prop types from `BacklogItem` → `LibraryItem`
- Update status rendering to use new `LibraryStatusMapper`

### 2.6 Test Factory Updates

**Test Factory** (`test/setup/db-factories/game.ts`):

```typescript
// Update factory to use new enum values
export function createLibraryItem(overrides?: Partial<LibraryItem>) {
  return {
    id: faker.number.int(),
    status: LibraryItemStatus.CURIOUS_ABOUT, // Updated default
    // ... other fields
  };
}
```

**Test Files**: Update 20+ test files to use new types and enum values.

### 2.7 Codebase-Wide Search & Replace Strategy

**Phase 1: Type Imports**

```bash
# Find all BacklogItem imports
grep -r "import.*BacklogItem" --include="*.ts" --include="*.tsx"

# Replace with LibraryItem (automated with sed/tools)
```

**Phase 2: Enum Value Updates**

- `TO_PLAY` → `CURIOUS_ABOUT`
- `PLAYING` → `CURRENTLY_EXPLORING`
- `PLAYED` → `TOOK_A_BREAK`
- `COMPLETED` → `EXPERIENCED`

**Phase 3: Variable & Function Names**

- `backlogItem` → `libraryItem`
- `backlogItems` → `libraryItems`
- `getBacklog*` → `getLibrary*`
- etc.

**Estimated File Changes**: 100+ files across the codebase.

---

## 3. Impact and Risk Analysis

### 3.1 System Dependencies

**Directly Affected Systems**:

1. **Database Layer**: Prisma schema, all migrations, indexes
2. **Repository Layer**: Complete refactor of backlog repository → library repository
3. **Service Layer**: Collection service, game management service
4. **Feature Layer**: 9 feature directories with 50+ components
5. **Shared Layer**: 10+ reusable components, enum mappers, type definitions
6. **Test Layer**: 20+ test files, all test factories

**Indirectly Affected Systems**:

1. **API Routes**: Any route handlers using backlog types
2. **Server Actions**: All server actions importing backlog types
3. **Client Components**: Any component displaying status or library items
4. **Type Generation**: Prisma client regeneration affects entire codebase

### 3.2 Potential Risks & Mitigations

#### Risk 1: Incomplete Refactoring

**Problem**: Missing a file during the rename process causes runtime errors.

**Mitigation**:

1. Use TypeScript compiler to catch type errors: `bun typecheck`
2. Run comprehensive test suite: `bun run test`
3. Use IDE/editor find-and-replace with regex to ensure complete coverage
4. Create a checklist of all affected areas (see Implementation Checklist below)

#### Risk 2: Migration Failure

**Problem**: Prisma migration fails midway, leaving database in inconsistent state.

**Mitigation**:

1. Test migration on local development database first
2. Use Docker test database to verify migration
3. Keep migration file idempotent where possible
4. Document rollback procedure (drop table, restore from backup)
5. Since no production users, can reset database if needed

#### Risk 3: Import Cycle Issues

**Problem**: Renaming repository creates circular import dependencies.

**Mitigation**:

1. Update all imports simultaneously using automated tools
2. Run build process to detect cycles: `bun build`
3. Use TypeScript path aliases to maintain clean import structure

#### Risk 4: Test Failures

**Problem**: Tests fail due to outdated enum values or type references.

**Mitigation**:

1. Update test factories first before running tests
2. Update mock data to use new enum values
3. Run tests incrementally (unit → integration) to isolate issues
4. Fix test files in logical groups (by feature)

#### Risk 5: Cache Invalidation

**Problem**: Next.js build cache or Prisma cache causes stale data issues.

**Mitigation**:

1. Clear Next.js cache: `rm -rf .next`
2. Regenerate Prisma client: `bun prisma generate`
3. Restart development server after schema changes
4. Clear browser cache for client-side issues

---

## 4. Testing Strategy

### 4.1 Pre-Migration Testing

**Database Migration Testing**:

1. **Local Docker Test**:

   ```bash
   # Start test database
   bun run test:db:setup

   # Run migration
   bun prisma migrate dev --name savepoint_vision_migration

   # Verify schema
   bun prisma db pull
   bun prisma studio  # Visual inspection
   ```

2. **Migration Dry Run**:
   ```bash
   # Generate SQL without applying
   bun prisma migrate diff \
     --from-schema-datamodel prisma/schema.prisma \
     --to-schema-datamodel prisma/schema-new.prisma \
     --script > migration-preview.sql
   ```

### 4.2 Post-Migration Testing

**Type Safety Verification**:

```bash
# TypeScript compilation
bun typecheck

# No TypeScript errors should exist
```

**Unit Test Execution**:

```bash
# Run all unit tests
bun run test:unit

# Target specific test suites
bun run test:unit shared/lib/repository/library
bun run test:unit features/manage-library-item
```

**Integration Test Execution**:

```bash
# Run integration tests with test database
bun run test:integration

# Verify database operations work correctly
```

### 4.3 Feature-Specific Testing

**Critical User Flows to Test**:

1. **Add Game to Library**: Verify new enum values are saved correctly
2. **Update Library Item Status**: Test all new status transitions
3. **View Collection**: Ensure filtering/sorting works with new statuses
4. **Dashboard Statistics**: Verify counts are accurate with new enum
5. **Search & Filter**: Test status filter dropdowns use new values

**Component Testing Checklist**:

- [ ] Status dropdowns render new values correctly
- [ ] Enum mapper displays proper labels
- [ ] Game cards show correct status badges
- [ ] Dashboard counts match database queries
- [ ] Collection filters work with new enum values

### 4.4 Regression Testing

**Areas Requiring Manual QA**:

1. Game addition flow (all entry points)
2. Status update flows (quick actions + modal)
3. Collection views (list, grid, filters)
4. Dashboard widgets (counts, recent activity)
5. Wishlist functionality (should be unchanged)
6. Steam import flow (creates library items correctly)

**Performance Testing**:

- Verify database queries perform efficiently with renamed table
- Check that indexes are properly maintained after rename
- Measure load times for collection pages (should be unchanged)

---

## 5. Implementation Checklist

### 5.1 Pre-Implementation

- [ ] Create feature branch: `feature/savepoint-database-migration`
- [ ] Document current database state (schema snapshot)
- [ ] Back up local development database
- [ ] Review all affected files (run grep analysis)

### 5.2 Database Schema Updates

- [ ] Update `prisma/schema.prisma`:
  - [ ] Rename `BacklogItem` → `LibraryItem`
  - [ ] Rename `BacklogItemStatus` → `LibraryItemStatus`
  - [ ] Update enum values (CURIOUS_ABOUT, etc.)
  - [ ] Add `REVISITING` enum value
  - [ ] Create `JournalEntry` model
  - [ ] Create `JournalMood` enum
  - [ ] Create `JournalVisibility` enum
  - [ ] Update User and Game relations
- [ ] Generate migration: `bun prisma migrate dev --name savepoint_vision_migration`
- [ ] Test migration on local Docker database
- [ ] Verify schema with `bun prisma studio`
- [ ] Regenerate Prisma client: `bun prisma generate`

### 5.3 Repository Layer Refactoring

- [ ] Rename directory: `backlog/` → `library/`
- [ ] Rename file: `backlog-repository.ts` → `library-repository.ts`
- [ ] Update `types.ts` with new type names
- [ ] Update all method names (create, update, delete, get)
- [ ] Update all Prisma queries to use `libraryItem`
- [ ] Create new `journal/` repository directory
- [ ] Implement `journal-repository.ts` with CRUD methods
- [ ] Create journal types in `journal/types.ts`
- [ ] Update `shared/lib/repository/index.ts` exports

### 5.4 Feature Directory Refactoring

- [ ] Rename `features/manage-backlog-item/` → `features/manage-library-item/`
- [ ] Update sub-directories:
  - [ ] `create-backlog-item/` → `create-library-item/`
  - [ ] `edit-backlog-item/` → `edit-library-item/`
  - [ ] `delete-backlog-item/` → `delete-library-item/`
- [ ] Update component file names
- [ ] Update server action file names
- [ ] Update all imports in feature directories
- [ ] Update `CLAUDE.md` and `PRD.md` files

### 5.5 Shared Code Updates

- [ ] Update `shared/lib/enum-mappers.ts`:
  - [ ] Delete `BacklogStatusMapper`
  - [ ] Create `LibraryStatusMapper` with new labels
- [ ] Rename components:
  - [ ] `backlog-item-card.tsx` → `library-item-card.tsx`
- [ ] Update all component imports and prop types
- [ ] Update `shared/types/collection.ts`
- [ ] Update `shared/services/` using library items

### 5.6 Test Updates

- [ ] Update test factories:
  - [ ] `test/setup/db-factories/game.ts` → use new enum values
- [ ] Update all test files (20+ files):
  - [ ] Replace `BacklogItem` → `LibraryItem`
  - [ ] Replace `BacklogItemStatus` → `LibraryItemStatus`
  - [ ] Update enum values in test assertions
  - [ ] Update mock data with new types
- [ ] Run test suite: `bun run test`
- [ ] Fix any failing tests

### 5.7 Type Safety Verification

- [ ] Run TypeScript compiler: `bun typecheck`
- [ ] Fix all TypeScript errors
- [ ] Run ESLint: `bun lint`
- [ ] Fix linting issues
- [ ] Run Prettier: `bun format:check`

### 5.8 Final Verification

- [ ] Run full test suite: `bun run test`
- [ ] Start dev server: `bun dev`
- [ ] Manually test critical flows:
  - [ ] Add game to library
  - [ ] Update game status
  - [ ] View collection with filters
  - [ ] Check dashboard statistics
  - [ ] Test wishlist functionality
- [ ] Verify no console errors
- [ ] Check database with Prisma Studio
- [ ] Review PR diff for missed files

### 5.9 Documentation Updates

- [ ] Update `CLAUDE.md` with new terminology
- [ ] Update feature `CLAUDE.md` files
- [ ] Update `context/product/architecture.md` if needed
- [ ] Add migration notes to roadmap
- [ ] Document breaking changes (if any API consumers exist)

---

## 6. Rollback Plan

Since there are no production users, rollback is simplified but still important for development:

### 6.1 Database Rollback

**Revert Migration**:

```bash
# Roll back last migration
bun prisma migrate reset

# Or manually restore from backup
psql -U username -d database_name < backup.sql
```

### 6.2 Code Rollback

**Git Revert**:

```bash
# Revert all commits in feature branch
git revert <commit-range>

# Or reset branch to main
git reset --hard origin/main
```

### 6.3 Prisma Client Regeneration

```bash
# Regenerate Prisma client from schema
bun prisma generate

# Clear Next.js build cache
rm -rf .next

# Restart development server
bun dev
```

---

## 7. Estimated Timeline

**Total Estimated Time**: 12-16 hours (single developer)

**Breakdown**:

1. **Prisma Schema & Migration** (2-3 hours)

   - Update schema
   - Create migration
   - Test migration locally

2. **Repository Layer Refactoring** (2-3 hours)

   - Rename directories and files
   - Update all methods
   - Create journal repository

3. **Feature Directory Refactoring** (3-4 hours)

   - Rename directories
   - Update components
   - Update server actions

4. **Shared Code & Components** (2-3 hours)

   - Update enum mappers
   - Rename components
   - Update types and services

5. **Test Updates** (2-3 hours)

   - Update test factories
   - Fix failing tests
   - Add new tests for journal feature

6. **Verification & Testing** (1 hour)
   - Manual testing
   - TypeScript/ESLint checks
   - Final verification

---

## 8. Post-Migration Tasks

### 8.1 Immediate Follow-Up

1. **Create Journal Entry UI Components**:

   - Rich text editor integration
   - Journal entry form
   - Timeline view component

2. **Update API Documentation**:

   - Document new LibraryItem types
   - Document JournalEntry endpoints (when created)

3. **Performance Monitoring**:
   - Verify query performance with renamed table
   - Check index usage
   - Optimize if needed

### 8.2 Future Enhancements

1. **Journal Feature Implementation**:

   - Create server actions for journal CRUD
   - Build journal timeline UI
   - Implement privacy controls
   - Add mood indicators

2. **UI/UX Language Revision**:

   - Update all user-facing text
   - Revise empty states
   - Update tooltips and help text

3. **Homepage Redesign**:
   - New hero section
   - Updated marketing copy
   - Emphasis on journaling feature

---

## Notes & Assumptions

1. **No Production Data**: This migration assumes zero production users, allowing aggressive breaking changes
2. **PostgreSQL Enum Handling**: Enum value renaming requires careful PostgreSQL syntax
3. **Test Coverage**: Assumes existing test coverage is >80% to catch regressions
4. **Type Safety**: TypeScript strict mode will catch most errors during refactoring
5. **Journal Feature**: Creates the database foundation; UI implementation is separate task
6. **Review Model**: Kept unchanged to maintain dual-feature strategy
7. **Git History**: Directory/file renames should preserve git history using `git mv`

---

**Review Status**: Ready for technical review and approval before implementation.
