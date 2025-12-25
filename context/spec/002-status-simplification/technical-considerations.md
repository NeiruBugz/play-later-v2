# Technical Specification: Status Simplification

- **Functional Specification:** [002-status-simplification/functional-spec.md](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Claude (AI Assistant)

---

## 1. High-Level Technical Approach

This change consolidates the library status model from 6 statuses to 4, reducing cognitive load while maintaining full functionality. The implementation follows the four-layer architecture and affects all layers from database to UI.

### Status Migration Mapping

| Old Status | New Status | Rationale |
|------------|------------|-----------|
| `WISHLIST` | `WANT_TO_PLAY` | Renamed for clarity |
| `CURIOUS_ABOUT` | `WANT_TO_PLAY` | Consolidated—both mean "on your radar" |
| `CURRENTLY_EXPLORING` | `PLAYING` | Simplified label |
| `REVISITING` | `PLAYING` | Replaying is still playing |
| `TOOK_A_BREAK` | `PLAYED` | User has experienced it |
| `EXPERIENCED` | `PLAYED` | User has experienced it |
| *(new)* | `OWNED` | New concept for owned but unstarted games |

### Key Architectural Decisions

1. **Single Prisma migration** handles schema change + data transformation via raw SQL
2. **Default status** changes from `CURIOUS_ABOUT` to `PLAYED` (per functional spec 2.3)
3. **Status transitions** become fully permissive (any → any, per functional spec 2.2)
4. **Centralized configuration** eliminates hardcoded status mappings across components
5. **Old enum values** remain in PostgreSQL (dead values) to avoid complex column recreation

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Database / Prisma Schema Changes

**File:** `savepoint-app/prisma/schema.prisma`

**Current enum:**
```prisma
enum LibraryItemStatus {
  CURIOUS_ABOUT
  CURRENTLY_EXPLORING
  TOOK_A_BREAK
  EXPERIENCED
  WISHLIST
  REVISITING
}
```

**New enum:**
```prisma
enum LibraryItemStatus {
  WANT_TO_PLAY
  OWNED
  PLAYING
  PLAYED
}
```

**Default change:**
```prisma
// Before
status LibraryItemStatus @default(CURIOUS_ABOUT)

// After
status LibraryItemStatus @default(PLAYED)
```

**Migration SQL:**
```sql
-- Step 1: Add new enum values
ALTER TYPE "LibraryItemStatus" ADD VALUE 'WANT_TO_PLAY';
ALTER TYPE "LibraryItemStatus" ADD VALUE 'OWNED';
ALTER TYPE "LibraryItemStatus" ADD VALUE 'PLAYING';
ALTER TYPE "LibraryItemStatus" ADD VALUE 'PLAYED';

-- Step 2: Migrate existing data
UPDATE "LibraryItem" SET status = 'WANT_TO_PLAY' WHERE status IN ('WISHLIST', 'CURIOUS_ABOUT');
UPDATE "LibraryItem" SET status = 'PLAYING' WHERE status IN ('CURRENTLY_EXPLORING', 'REVISITING');
UPDATE "LibraryItem" SET status = 'PLAYED' WHERE status IN ('TOOK_A_BREAK', 'EXPERIENCED');

-- Step 3: Update default
ALTER TABLE "LibraryItem" ALTER COLUMN status SET DEFAULT 'PLAYED';

-- Note: Old enum values remain in PostgreSQL (cannot be removed without column recreation)
-- They become "dead" values that cannot be set via application code
```

---

### 2.2 Domain Layer Changes

**File:** `savepoint-app/data-access-layer/domain/library/enums.ts`

```typescript
export enum LibraryItemStatus {
  WANT_TO_PLAY = "WANT_TO_PLAY",
  OWNED = "OWNED",
  PLAYING = "PLAYING",
  PLAYED = "PLAYED",
}
```

Mapper files (`library-item.mapper.ts`) use type casting—no changes needed.

---

### 2.3 Repository Layer Changes

**File:** `savepoint-app/data-access-layer/repository/library/library-repository.ts`

Update hardcoded status filters and rename functions for clarity:

| Function | Current Status | New Status | Rename To |
|----------|----------------|------------|-----------|
| `getRecentlyCompletedLibraryItems` | `EXPERIENCED` | `PLAYED` | *(keep name)* |
| `getWishlistedItemsByUsername` | `WISHLIST` | `WANT_TO_PLAY` | `getWantToPlayItemsByUsername` |
| `findWishlistItemsForUser` | `WISHLIST` | `WANT_TO_PLAY` | `findWantToPlayItemsForUser` |
| `findUpcomingWishlistItems` | `WISHLIST` | `WANT_TO_PLAY` | `findUpcomingWantToPlayItems` |
| `findCurrentlyPlayingGames` | `CURRENTLY_EXPLORING` | `PLAYING` | *(keep name)* |
| `getLibraryStatsByUserId` | `CURRENTLY_EXPLORING` | `PLAYING` | *(keep name)* |

Parameterized functions (`getLibraryCount`, `buildCollectionFilter`, `findLibraryItemsWithFilters`) require no changes.

---

### 2.4 Service Layer Changes

**File:** `savepoint-app/data-access-layer/services/library/library-service.ts`

Remove status transition restriction (all transitions now allowed per functional spec 2.2):

```typescript
// Before
private validateStatusTransition(
  currentStatus: LibraryItemStatus,
  newStatus: LibraryItemStatus
): { valid: boolean; error?: string } {
  if (
    newStatus === LibraryItemStatus.WISHLIST &&
    currentStatus !== LibraryItemStatus.WISHLIST
  ) {
    return {
      valid: false,
      error: "Cannot move a game back to Wishlist...",
    };
  }
  return { valid: true };
}

// After
private validateStatusTransition(
  _currentStatus: LibraryItemStatus,
  _newStatus: LibraryItemStatus
): { valid: boolean } {
  // All transitions are valid per functional spec 2.2
  return { valid: true };
}
```

---

### 2.5 Centralized UI Configuration

**File:** `savepoint-app/shared/lib/library-status.ts`

Consolidate all status metadata into a single source of truth:

```typescript
import {
  BookmarkIcon,
  BoxIcon,
  GamepadIcon,
  CheckCircleIcon,
} from "lucide-react";

export interface StatusConfig {
  value: LibraryItemStatus;
  label: string;
  description: string;
  badgeVariant: StatusBadgeVariant;
  icon: React.ComponentType<{ className?: string }>;
  ariaLabel: string;
}

export const LIBRARY_STATUS_CONFIG: readonly StatusConfig[] = [
  {
    value: LibraryItemStatus.WANT_TO_PLAY,
    label: "Want to Play",
    description: "On your radar, haven't started",
    badgeVariant: "wantToPlay",
    icon: BookmarkIcon,
    ariaLabel: "Mark as Want to Play",
  },
  {
    value: LibraryItemStatus.OWNED,
    label: "Owned",
    description: "In your library, haven't started",
    badgeVariant: "owned",
    icon: BoxIcon,
    ariaLabel: "Mark as Owned",
  },
  {
    value: LibraryItemStatus.PLAYING,
    label: "Playing",
    description: "Currently engaged",
    badgeVariant: "playing",
    icon: GamepadIcon,
    ariaLabel: "Mark as Playing",
  },
  {
    value: LibraryItemStatus.PLAYED,
    label: "Played",
    description: "Have experienced it",
    badgeVariant: "played",
    icon: CheckCircleIcon,
    ariaLabel: "Mark as Played",
  },
] as const;

// Derived lookups
export const LIBRARY_STATUS_MAP = new Map(
  LIBRARY_STATUS_CONFIG.map((config) => [config.value, config])
);

export function getStatusConfig(status: LibraryItemStatus): StatusConfig {
  const config = LIBRARY_STATUS_MAP.get(status);
  if (!config) throw new Error(`Unknown status: ${status}`);
  return config;
}

// Convenience accessors
export const getStatusLabel = (status: LibraryItemStatus) =>
  getStatusConfig(status).label;

export const getStatusIcon = (status: LibraryItemStatus) =>
  getStatusConfig(status).icon;

export const getStatusVariant = (status: LibraryItemStatus) =>
  getStatusConfig(status).badgeVariant;
```

**Benefits:**
- Array order = display order (no separate `STATUS_ORDER` needed)
- Icons, labels, variants colocated
- Single file to update when adding/changing statuses

---

### 2.6 CSS Theme Variables

**File:** `savepoint-app/shared/globals.css`

Update status color definitions (4 statuses instead of 6):

```css
/* Light mode */
--status-wantToPlay: oklch(0.58 0.1 240);      /* Blue - anticipation */
--status-wantToPlay-foreground: oklch(0.98 0.005 50);
--status-owned: oklch(0.62 0.16 55);           /* Amber - ownership */
--status-owned-foreground: oklch(0.98 0.005 50);
--status-playing: oklch(0.5 0.15 20);          /* Burgundy - active */
--status-playing-foreground: oklch(0.98 0.005 50);
--status-played: oklch(0.55 0.12 145);         /* Green - complete */
--status-played-foreground: oklch(0.98 0.005 50);

/* Dark mode - adjusted lightness for visibility */
```

Remove old variables: `--status-curious`, `--status-break`, `--status-experienced`, `--status-wishlist`, `--status-revisiting`.

---

### 2.7 Component Updates

Components refactored to use central configuration instead of local mappings:

| Component | File | Changes |
|-----------|------|---------|
| `QuickActionButtons` | `features/game-detail/ui/quick-action-buttons.tsx` | Use `LIBRARY_STATUS_CONFIG`, render 2x2 grid |
| `LibraryStatusDisplay` | `features/game-detail/ui/library-status-display.tsx` | Use `getStatusConfig()` for icon |
| `LibraryFilters` | `features/library/ui/library-filters.tsx` | Derive styles from `badgeVariant` |
| `LibraryCardQuickActions` | `features/library/ui/library-card-quick-actions.tsx` | Use central config |
| `LibraryCardActionBar` | `features/library/ui/library-card-action-bar.tsx` | Use central config |
| `LibraryCardInteractiveBadge` | `features/library/ui/library-card-interactive-badge.tsx` | Use central config |
| `DashboardStatsServer` | `features/dashboard/ui/dashboard-stats-server.tsx` | Update to 4 parallel fetches |
| Badge variants | `shared/components/ui/badge.tsx` | Update CVA variants |

**Delete:** `LibraryStatusMapper` in `shared/lib/ui/enum-mappers.ts` (replaced by `getStatusLabel()`).

**Example refactor pattern:**
```typescript
// Before: Hardcoded local mapping
const STATUS_ICONS: Record<LibraryItemStatus, Icon> = { ... };

// After: Use central config
import { getStatusConfig } from "@/shared/lib/library-status";

const config = getStatusConfig(status);
const Icon = config.icon;
```

---

## 3. Impact and Risk Analysis

### 3.1 System Dependencies

| System Area | Impact Level | Description |
|-------------|--------------|-------------|
| **Database** | 🔴 High | Prisma schema change + data migration |
| **Repository Layer** | 🟡 Medium | 6 functions with hardcoded status values |
| **Service Layer** | 🟢 Low | Remove one validation rule |
| **UI Components** | 🟡 Medium | ~10 components refactored to central config |
| **CSS Theme** | 🟢 Low | 6 variables → 4 variables |
| **Tests** | 🟡 Medium | 33+ test files reference old status values |
| **Dashboard** | 🟢 Low | 6 parallel fetches → 4 |

### 3.2 Potential Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Data loss during migration** | 🔴 Critical | Run in transaction, test on staging first, create backup |
| **PostgreSQL enum removal complexity** | 🟡 Medium | Leave old values as "dead" (acceptable tradeoff) |
| **Missed component updates** | 🟡 Medium | TypeScript catches most issues; grep for old values before merge |
| **User confusion after migration** | 🟢 Low | Mapping is intuitive; new names are clearer |
| **Test suite failures** | 🟢 Low | Expected—update tests as part of implementation |

### 3.3 Rollback Strategy

- **Before production deployment:** Revert PR
- **After production deployment:** Restore from backup + revert code (complex)
- **Recommendation:** Thoroughly test on staging before production

---

## 4. Testing Strategy

### 4.1 Test Fixtures

**File:** `test/fixtures/enum-test-cases.ts`

```typescript
import { LibraryItemStatus } from "@/data-access-layer/domain/library";

export const LIBRARY_STATUS_TEST_CASES = [
  { status: LibraryItemStatus.WANT_TO_PLAY, label: "Want to Play" },
  { status: LibraryItemStatus.OWNED, label: "Owned" },
  { status: LibraryItemStatus.PLAYING, label: "Playing" },
  { status: LibraryItemStatus.PLAYED, label: "Played" },
] as const;

export const STATUS_SELECT_OPTIONS = [
  { label: "Want to Play", description: "On your radar, haven't started" },
  { label: "Owned", description: "In your library, haven't started" },
  { label: "Playing", description: "Currently engaged" },
  { label: "Played", description: "Have experienced it" },
] as const;
```

### 4.2 Component Test Pattern

All component tests follow these conventions:
- **`elements` object:** All selectors using accessible queries
- **`actions` object:** User interaction functions via `userEvent`
- **`render*()` function:** Extracted render helper with default props
- **`toBeVisible()`:** Assert user visibility, not just DOM presence
- **Exact strings:** No regex patterns for UI text assertions

**Example: QuickActionButtons**

```typescript
const elements = {
  getWantToPlayButton: () => screen.getByLabelText("Mark as Want to Play"),
  getOwnedButton: () => screen.getByLabelText("Mark as Owned"),
  getPlayingButton: () => screen.getByLabelText("Mark as Playing"),
  getPlayedButton: () => screen.getByLabelText("Mark as Played"),
  getAllStatusButtons: () => screen.getAllByRole("button"),
  getQuickActionsGroup: () =>
    screen.getByRole("group", { name: "Journey status quick actions" }),
  getAnnouncementRegion: () => screen.getByRole("status"),
};

const actions = {
  clickWantToPlayButton: async () => {
    await userEvent.click(elements.getWantToPlayButton());
  },
  clickOwnedButton: async () => {
    await userEvent.click(elements.getOwnedButton());
  },
  clickPlayingButton: async () => {
    await userEvent.click(elements.getPlayingButton());
  },
  clickPlayedButton: async () => {
    await userEvent.click(elements.getPlayedButton());
  },
};

function renderQuickActionButtons(props: Partial<QuickActionButtonsProps> = {}) {
  const defaultProps = {
    igdbId: 12345,
    gameTitle: "Test Game",
    currentStatus: undefined,
  };
  return render(<QuickActionButtons {...defaultProps} {...props} />);
}

describe("QuickActionButtons", () => {
  describe("given component just rendered", () => {
    it("should render all 4 status buttons visible to user", () => {
      renderQuickActionButtons();

      expect(elements.getWantToPlayButton()).toBeVisible();
      expect(elements.getOwnedButton()).toBeVisible();
      expect(elements.getPlayingButton()).toBeVisible();
      expect(elements.getPlayedButton()).toBeVisible();
    });

    it("should render buttons in correct order: Want to Play, Owned, Playing, Played", () => {
      renderQuickActionButtons();

      const buttons = elements.getAllStatusButtons();
      expect(buttons[0]).toHaveAccessibleName("Mark as Want to Play");
      expect(buttons[1]).toHaveAccessibleName("Mark as Owned");
      expect(buttons[2]).toHaveAccessibleName("Mark as Playing");
      expect(buttons[3]).toHaveAccessibleName("Mark as Played");
    });
  });

  describe("given current status is PLAYING", () => {
    it("should mark Playing button as pressed and others as not pressed", () => {
      renderQuickActionButtons({ currentStatus: LibraryItemStatus.PLAYING });

      expect(elements.getPlayingButton()).toHaveAttribute("aria-pressed", "true");
      expect(elements.getWantToPlayButton()).toHaveAttribute("aria-pressed", "false");
      expect(elements.getOwnedButton()).toHaveAttribute("aria-pressed", "false");
      expect(elements.getPlayedButton()).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("given user clicks Played button", () => {
    it("should call updateLibraryStatusAction with PLAYED status", async () => {
      renderQuickActionButtons();

      await actions.clickPlayedButton();

      await waitFor(() => {
        expect(mockUpdateLibraryStatusAction).toHaveBeenCalledWith({
          igdbId: 12345,
          status: LibraryItemStatus.PLAYED,
        });
      });
    });

    it("should display success toast with status name", async () => {
      renderQuickActionButtons();

      await actions.clickPlayedButton();

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith(
          "Status updated to Played",
          { description: "Test Game" }
        );
      });
    });

    it("should announce status change to screen readers", async () => {
      renderQuickActionButtons();

      await actions.clickPlayedButton();

      await waitFor(() => {
        expect(elements.getAnnouncementRegion()).toHaveTextContent(
          "Status updated to Played"
        );
      });
    });
  });

  describe("given user transitions from Want to Play directly to Played", () => {
    it("should allow the transition without validation error", async () => {
      renderQuickActionButtons({ currentStatus: LibraryItemStatus.WANT_TO_PLAY });

      await actions.clickPlayedButton();

      await waitFor(() => {
        expect(mockUpdateLibraryStatusAction).toHaveBeenCalledWith({
          igdbId: 12345,
          status: LibraryItemStatus.PLAYED,
        });
      });
      expect(mockToastError).not.toHaveBeenCalled();
    });
  });
});
```

### 4.3 Migration Integration Test

```typescript
describe("Status Simplification Migration", () => {
  describe("given database has entries with all 6 old statuses", () => {
    beforeAll(async () => {
      await createLibraryItem({ status: "WISHLIST" });
      await createLibraryItem({ status: "CURIOUS_ABOUT" });
      await createLibraryItem({ status: "CURRENTLY_EXPLORING" });
      await createLibraryItem({ status: "REVISITING" });
      await createLibraryItem({ status: "TOOK_A_BREAK" });
      await createLibraryItem({ status: "EXPERIENCED" });
    });

    describe("when migration is executed", () => {
      it("should consolidate WISHLIST and CURIOUS_ABOUT into WANT_TO_PLAY", async () => {
        await runMigration();

        const wantToPlay = await countByStatus("WANT_TO_PLAY");
        expect(wantToPlay).toBe(2);
      });

      it("should consolidate CURRENTLY_EXPLORING and REVISITING into PLAYING", async () => {
        await runMigration();

        const playing = await countByStatus("PLAYING");
        expect(playing).toBe(2);
      });

      it("should consolidate TOOK_A_BREAK and EXPERIENCED into PLAYED", async () => {
        await runMigration();

        const played = await countByStatus("PLAYED");
        expect(played).toBe(2);
      });

      it("should leave no entries with old status values", async () => {
        await runMigration();

        const oldStatuses = ["WISHLIST", "CURIOUS_ABOUT", "CURRENTLY_EXPLORING",
                            "REVISITING", "TOOK_A_BREAK", "EXPERIENCED"];
        for (const status of oldStatuses) {
          const count = await countByStatus(status);
          expect(count).toBe(0);
        }
      });
    });
  });
});
```

### 4.4 Pre-Merge Checklist

- [ ] All unit tests pass (`pnpm test --project=unit`)
- [ ] All integration tests pass (`pnpm test --project=integration`)
- [ ] All component tests pass (`pnpm test --project=components`)
- [ ] Coverage threshold met (≥80%)
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] Grep for old enum values returns zero matches (excluding migration file)
- [ ] Test fixtures updated in `test/fixtures/enum-test-cases.ts`
- [ ] Status order assertions validate correct sequence
