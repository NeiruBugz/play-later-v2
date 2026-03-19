# Library Status Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 4-status library model (WANT_TO_PLAY, OWNED, PLAYING, PLAYED) with a 5-status model (WISHLIST, SHELF, UP_NEXT, PLAYING, PLAYED) plus a `hasBeenPlayed` boolean flag.

**Architecture:** Single flat enum with 5 values, no two-axis model. `hasBeenPlayed` boolean drives "Replay" vs "Up Next" badge display. Migration renames existing enum values and backfills the new column. All changes flow bottom-up: schema → domain → service → UI.

**Tech Stack:** Prisma + PostgreSQL (Neon), Next.js 15, React 19, TanStack Query, Zod, Vitest, shadcn/ui, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-03-19-library-status-redesign-design.md`

---

## Agent Mapping

Tasks are assigned to specialized user-level agents (`~/.claude/agents/`). Tasks 1-4 are sequential. Tasks 5-9 can parallelize after Task 4. Task 10 runs after all implementation. Task 11 is final validation.

| Task | Agent (`subagent_type`) | Rationale |
|------|------------------------|-----------|
| 1: Prisma Schema + Migration | `nextjs-expert` | Schema/service layer, project architecture |
| 2: Domain Layer | `nextjs-expert` | Domain models, mappers, enums |
| 3: Repository Layer | `nextjs-expert` | Repository pattern, Prisma queries |
| 4: Service Layer + hasBeenPlayed | `nextjs-expert` | Business logic, Result types |
| 5: Shared Config, CSS, Badge | `react-architect` | Design system, CSS variables, component variants |
| 6: Library UI — Filters, Cards, Actions | `react-architect` | React components, FSD structure, UI patterns |
| 7: Manage Library Entry — Forms | `nextjs-expert` | Server actions, Zod schemas, use-cases |
| 8: Steam Import | `nextjs-expert` | Feature logic, status mapping |
| 9: Dashboard | `nextjs-expert` | Stats cards, server actions |
| 10: Test Updates + Full Test Run | `typescript-test-expert` | Bulk test updates, coverage verification |
| 11: Type Check + Lint | `nextjs-expert` | Final validation pass |
| 12: Manual Smoke Test | *(manual)* | Dev server verification |

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `prisma/schema.prisma` | Update enum + add `hasBeenPlayed` |
| Create | `prisma/migrations/YYYYMMDD_status_redesign/migration.sql` | Migration SQL |
| Modify | `data-access-layer/domain/library/enums.ts` | Update domain enum |
| Modify | `data-access-layer/domain/library/library-item.model.ts` | Add `hasBeenPlayed` to domain type |
| Modify | `data-access-layer/domain/library/library-item.mapper.ts` | Map `hasBeenPlayed` |
| Modify | `data-access-layer/services/library/library-service.ts` | `hasBeenPlayed` logic + rename query |
| Modify | `data-access-layer/repository/library/library-repository.ts` | Rename `findWantToPlayItemsForUser` → `findUpNextItemsForUser` |
| Modify | `shared/lib/library-status.ts` | New 5-status config |
| Modify | `shared/globals.css` | Add/rename CSS variables |
| Modify | `shared/components/ui/badge.tsx` | Add `upNext`, `shelf`, `wishlist` variants |
| Modify | `shared/components/ui/progress-ring.tsx` | Update `GameStatus` type |
| Modify | `shared/lib/profile/constants.ts` | Update `statusLabels` |
| Modify | `shared/types/library.ts` | Re-export updated types |
| Modify | `features/manage-library-entry/schemas.ts` | Verify Zod uses `z.enum(LibraryItemStatus)` — auto-updated if so |
| Modify | `features/manage-library-entry/use-cases/add-game-to-library.ts` | Update any hardcoded status references |
| Modify | `features/dashboard/ui/dashboard-stats.tsx` | Update status references |
| Modify | `features/library/ui/library-filters.tsx` | New tab order, new status colors |
| Modify | `features/library/ui/library-card.tsx` | "Replay" badge logic |
| Modify | `features/library/ui/library-card-action-bar.tsx` | Curated per-status actions |
| Modify | `features/library/ui/library-card-mobile-actions.tsx` | Curated per-status mobile actions |
| Modify | `features/library/hooks/use-update-library-status.ts` | Pass `hasBeenPlayed` in optimistic update |
| Modify | `features/manage-library-entry/ui/status-chip-group.tsx` | 5 chips (auto from config) |
| Modify | `features/manage-library-entry/ui/entry-form.tsx` | Default status → SHELF |
| Modify | `features/steam-import/lib/calculate-smart-status.ts` | OWNED → SHELF |
| Modify | `features/steam-import/use-cases/import-game-to-library.ts` | Update status map |
| Modify | `features/dashboard/ui/dashboard-stats-cards.tsx` | Update `statusMap` |
| Modify | `features/dashboard/server-actions/get-random-want-to-play.ts` | Rename to UP_NEXT |
| Modify | 24 test files | Update enum references |

---

### Task 1: Prisma Schema + Migration

**Files:**
- Modify: `savepoint-app/prisma/schema.prisma`
- Create: migration SQL via `prisma migrate dev`

- [ ] **Step 1: Update the Prisma enum**

In `prisma/schema.prisma`, replace:

```prisma
enum LibraryItemStatus {
  WANT_TO_PLAY
  OWNED
  PLAYING
  PLAYED
}
```

With:

```prisma
enum LibraryItemStatus {
  WISHLIST
  SHELF
  UP_NEXT
  PLAYING
  PLAYED
}
```

- [ ] **Step 2: Add `hasBeenPlayed` field to LibraryItem model**

In the `LibraryItem` model, after the `completedAt` field, add:

```prisma
  hasBeenPlayed   Boolean           @default(false)
```

Also change the default status from `PLAYED` to `SHELF`:

```prisma
  status          LibraryItemStatus @default(SHELF)
```

- [ ] **Step 3: Create the migration**

Run: `cd savepoint-app && pnpm prisma migrate dev --name status_redesign --create-only`

This creates the migration SQL without applying it.

- [ ] **Step 4: Edit the migration SQL to rename enum values instead of drop/recreate**

The auto-generated migration will try to drop and recreate the enum. Replace it with this migration that preserves data:

```sql
-- Rename existing enum values
ALTER TYPE "LibraryItemStatus" RENAME VALUE 'WANT_TO_PLAY' TO 'WISHLIST';
ALTER TYPE "LibraryItemStatus" RENAME VALUE 'OWNED' TO 'SHELF';

-- Add new enum value
ALTER TYPE "LibraryItemStatus" ADD VALUE 'UP_NEXT';

-- Add hasBeenPlayed column
ALTER TABLE "LibraryItem" ADD COLUMN "hasBeenPlayed" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: all items currently PLAYED should have hasBeenPlayed = true
UPDATE "LibraryItem" SET "hasBeenPlayed" = true WHERE "status" = 'PLAYED';

-- Change default status from PLAYED to SHELF
ALTER TABLE "LibraryItem" ALTER COLUMN "status" SET DEFAULT 'SHELF';
```

- [ ] **Step 5: Apply the migration**

Run: `cd savepoint-app && pnpm prisma migrate dev`

- [ ] **Step 6: Regenerate Prisma client**

Run: `cd savepoint-app && pnpm prisma generate`

- [ ] **Step 7: Commit**

```bash
git add savepoint-app/prisma/
git commit -m "feat: migrate library status enum to 5-status model with hasBeenPlayed"
```

---

### Task 2: Domain Layer (Enum + Model + Mapper)

**Files:**
- Modify: `savepoint-app/data-access-layer/domain/library/enums.ts`
- Modify: `savepoint-app/data-access-layer/domain/library/library-item.model.ts`
- Modify: `savepoint-app/data-access-layer/domain/library/library-item.mapper.ts`
- Test: `savepoint-app/data-access-layer/domain/library/library-item.mapper.unit.test.ts`

- [ ] **Step 1: Update domain enum**

In `enums.ts`, replace:

```typescript
export enum LibraryItemStatus {
  WANT_TO_PLAY = "WANT_TO_PLAY",
  OWNED = "OWNED",
  PLAYING = "PLAYING",
  PLAYED = "PLAYED",
}
```

With:

```typescript
export enum LibraryItemStatus {
  WISHLIST = "WISHLIST",
  SHELF = "SHELF",
  UP_NEXT = "UP_NEXT",
  PLAYING = "PLAYING",
  PLAYED = "PLAYED",
}
```

- [ ] **Step 2: Add `hasBeenPlayed` to domain model**

In `library-item.model.ts`, add to the `LibraryItemDomain` interface after `completedAt`:

```typescript
  hasBeenPlayed: boolean;
```

- [ ] **Step 3: Update mapper to include `hasBeenPlayed`**

In `library-item.mapper.ts`, in `LibraryItemMapper.toDomain()`, add:

```typescript
    hasBeenPlayed: prisma.hasBeenPlayed,
```

- [ ] **Step 4: Update mapper tests**

In `library-item.mapper.unit.test.ts`, update all test data to use new enum values (WISHLIST, SHELF, UP_NEXT instead of WANT_TO_PLAY, OWNED) and verify `hasBeenPlayed` is mapped.

- [ ] **Step 5: Run mapper tests**

Run: `cd savepoint-app && pnpm vitest run data-access-layer/domain/library/library-item.mapper.unit.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add savepoint-app/data-access-layer/domain/
git commit -m "feat: update domain enum, model, and mapper for 5-status model"
```

---

### Task 3: Repository Layer

**Files:**
- Modify: `savepoint-app/data-access-layer/repository/library/library-repository.ts`
- Test: `savepoint-app/data-access-layer/repository/library/library-repository.integration.test.ts`

- [ ] **Step 1: Rename `findWantToPlayItemsForUser` to `findUpNextItemsForUser`**

In `library-repository.ts`, rename the function and change the query filter:

```typescript
export async function findUpNextItemsForUser({
  userId,
}: {
  userId: string;
}): Promise<
  RepositoryResult<
    Array<Prisma.LibraryItemGetPayload<{ include: { game: true } }>>
  >
> {
  try {
    const items = await prisma.libraryItem.findMany({
      where: { userId, status: LibraryItemStatus.UP_NEXT },
      include: { game: true },
      orderBy: { createdAt: "asc" },
    });
    return repositorySuccess(items);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find up-next items: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
```

- [ ] **Step 2: Update the repository barrel export**

Update `index.ts` to export the renamed function.

- [ ] **Step 3: Update repository integration tests**

In `library-repository.integration.test.ts`, update all enum references from `WANT_TO_PLAY`/`OWNED` to `WISHLIST`/`SHELF`/`UP_NEXT` and rename test references to the new function name.

- [ ] **Step 4: Run repository tests**

Run: `cd savepoint-app && pnpm vitest run data-access-layer/repository/library/library-repository.integration.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add savepoint-app/data-access-layer/repository/
git commit -m "feat: rename findWantToPlayItemsForUser to findUpNextItemsForUser"
```

---

### Task 4: Service Layer — `hasBeenPlayed` Logic

**Files:**
- Modify: `savepoint-app/data-access-layer/services/library/library-service.ts`
- Test: `savepoint-app/data-access-layer/services/library/library-service.unit.test.ts`

- [ ] **Step 1: Write failing test for `hasBeenPlayed` enforcement**

In `library-service.unit.test.ts`, add:

```typescript
describe("hasBeenPlayed logic", () => {
  it("should set hasBeenPlayed to true when transitioning to PLAYED", async () => {
    // Arrange: mock a library item with status PLAYING, hasBeenPlayed false
    // Act: call updateLibraryItem with status PLAYED
    // Assert: the update call includes hasBeenPlayed: true
  });

  it("should not reset hasBeenPlayed when transitioning away from PLAYED", async () => {
    // Arrange: mock a library item with status PLAYED, hasBeenPlayed true
    // Act: call updateLibraryItem with status UP_NEXT
    // Assert: hasBeenPlayed remains true (not explicitly set to false)
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd savepoint-app && pnpm vitest run data-access-layer/services/library/library-service.unit.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement `hasBeenPlayed` logic in `updateLibraryItem`**

In `library-service.ts`, in `updateLibraryItem`, after fetching the current item, add logic before the repository update call:

```typescript
const hasBeenPlayed =
  params.libraryItem.status === LibraryItemStatus.PLAYED
    ? true
    : undefined; // undefined = don't change the value

const result = await updateLibraryItem({
  userId: params.userId,
  libraryItem: {
    id: params.libraryItem.id,
    status: mapLibraryItemStatusToPrisma(params.libraryItem.status),
    startedAt: params.libraryItem.startedAt,
    completedAt: params.libraryItem.completedAt,
    hasBeenPlayed,
  },
});
```

Note: The repository `updateLibraryItem` function will need to accept the optional `hasBeenPlayed` field. Check and update its signature to include `hasBeenPlayed?: boolean` in the `libraryItem` parameter.

Additionally, handle `startedAt`/`completedAt` for replay flows. When transitioning to `PLAYING`, always overwrite `startedAt` with the current date (enabling replay tracking). When transitioning to `PLAYED`, always overwrite `completedAt`:

```typescript
const now = new Date();
const startedAt =
  params.libraryItem.status === LibraryItemStatus.PLAYING
    ? params.libraryItem.startedAt ?? now
    : undefined;
const completedAt =
  params.libraryItem.status === LibraryItemStatus.PLAYED
    ? params.libraryItem.completedAt ?? now
    : undefined;
```

On replay (transitioning from PLAYED → UP_NEXT → PLAYING): `startedAt` is overwritten with the new date since the caller won't provide one. On PLAYING → PLAYED: `completedAt` is set. Only the most recent play-through dates are stored.

- [ ] **Step 4: Rename `getRandomWantToPlayGame` and update import**

In `library-service.ts`:
1. Change `findWantToPlayItemsForUser` import to `findUpNextItemsForUser`
2. Rename method to `getRandomUpNextGame`
3. Update all internal references and log messages

- [ ] **Step 5: Update all existing service tests to use new enum values**

In `library-service.unit.test.ts`, replace all `WANT_TO_PLAY` with `WISHLIST`, `OWNED` with `SHELF` throughout, and update the random game test to reference `getRandomUpNextGame`.

- [ ] **Step 6: Run service tests**

Run: `cd savepoint-app && pnpm vitest run data-access-layer/services/library/library-service.unit.test.ts`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add savepoint-app/data-access-layer/services/ savepoint-app/data-access-layer/repository/
git commit -m "feat: add hasBeenPlayed enforcement and rename getRandomUpNextGame"
```

---

### Task 5: Shared Config — Status Config, CSS Variables, Badge

**Files:**
- Modify: `savepoint-app/shared/lib/library-status.ts`
- Modify: `savepoint-app/shared/globals.css`
- Modify: `savepoint-app/shared/components/ui/badge.tsx`
- Modify: `savepoint-app/shared/components/ui/progress-ring.tsx`
- Modify: `savepoint-app/shared/lib/profile/constants.ts`

- [ ] **Step 1: Update `library-status.ts`**

Replace the entire `StatusBadgeVariant` type:

```typescript
export type StatusBadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "wishlist"
  | "shelf"
  | "upNext"
  | "playing"
  | "played";
```

Replace `LIBRARY_STATUS_CONFIG`:

```typescript
export const LIBRARY_STATUS_CONFIG: readonly StatusConfig[] = [
  {
    value: LibraryItemStatus.UP_NEXT,
    label: "Up Next",
    description: "Want to play or replay",
    badgeVariant: "upNext",
    icon: StarIcon,
    ariaLabel: "Mark as Up Next",
  },
  {
    value: LibraryItemStatus.PLAYING,
    label: "Playing",
    description: "Actively engaged",
    badgeVariant: "playing",
    icon: GamepadIcon,
    ariaLabel: "Mark as Playing",
  },
  {
    value: LibraryItemStatus.SHELF,
    label: "Shelf",
    description: "Own it, sitting there",
    badgeVariant: "shelf",
    icon: BoxIcon,
    ariaLabel: "Mark as Shelf",
  },
  {
    value: LibraryItemStatus.PLAYED,
    label: "Played",
    description: "Have experienced",
    badgeVariant: "played",
    icon: CheckCircleIcon,
    ariaLabel: "Mark as Played",
  },
  {
    value: LibraryItemStatus.WISHLIST,
    label: "Wishlist",
    description: "Want it someday",
    badgeVariant: "wishlist",
    icon: BookmarkIcon,
    ariaLabel: "Mark as Wishlist",
  },
] as const;
```

Note: Array order = tab order (Up Next first).

Add `StarIcon` to the imports from `lucide-react`.

- [ ] **Step 2: Update CSS variables in `globals.css`**

In the light mode `:root` section, replace status variables:

```css
/* Status colors - game journey states */
--status-wishlist: oklch(0.55 0.14 260);
--status-wishlist-foreground: oklch(0.99 0 0);
--status-shelf: oklch(0.65 0.15 55);
--status-shelf-foreground: oklch(0.15 0.01 55);
--status-upNext: oklch(0.62 0.16 45);
--status-upNext-foreground: oklch(0.15 0.01 45);
--status-playing: oklch(0.65 0.14 175);
--status-playing-foreground: oklch(0.99 0 0);
--status-played: oklch(0.6 0.16 145);
--status-played-foreground: oklch(0.99 0 0);
```

In the `.dark` section:

```css
/* Status colors - vibrant for dark mode */
--status-wishlist: oklch(0.65 0.15 260);
--status-wishlist-foreground: oklch(0.99 0 0);
--status-shelf: oklch(0.75 0.15 55);
--status-shelf-foreground: oklch(0.15 0.01 55);
--status-upNext: oklch(0.72 0.16 45);
--status-upNext-foreground: oklch(0.12 0.01 45);
--status-playing: oklch(0.72 0.15 175);
--status-playing-foreground: oklch(0.12 0.01 175);
--status-played: oklch(0.7 0.17 145);
--status-played-foreground: oklch(0.12 0.01 145);
```

In the `@theme` section, replace status color references:

```css
/* Status colors - game journey states */
--color-status-wishlist: var(--status-wishlist);
--color-status-wishlist-foreground: var(--status-wishlist-foreground);
--color-status-shelf: var(--status-shelf);
--color-status-shelf-foreground: var(--status-shelf-foreground);
--color-status-upNext: var(--status-upNext);
--color-status-upNext-foreground: var(--status-upNext-foreground);
--color-status-playing: var(--status-playing);
--color-status-playing-foreground: var(--status-playing-foreground);
--color-status-played: var(--status-played);
--color-status-played-foreground: var(--status-played-foreground);
```

Remove all old `--status-wantToPlay` and `--status-owned` variables.

- [ ] **Step 3: Update `badge.tsx` variants**

Replace status badge variants:

```typescript
wishlist:
  "border-transparent bg-[var(--status-wishlist)] text-[var(--status-wishlist-foreground)]",
shelf:
  "border-transparent bg-[var(--status-shelf)] text-[var(--status-shelf-foreground)]",
upNext:
  "border-transparent bg-[var(--status-upNext)] text-[var(--status-upNext-foreground)]",
playing:
  "border-transparent bg-[var(--status-playing)] text-[var(--status-playing-foreground)]",
played:
  "border-transparent bg-[var(--status-played)] text-[var(--status-played-foreground)]",
```

Remove old `wantToPlay` and `owned` variants.

- [ ] **Step 4: Update `progress-ring.tsx`**

Replace `GameStatus` and `LibraryItemStatusType`:

```typescript
export type GameStatus = "WISHLIST" | "SHELF" | "UP_NEXT" | "PLAYING" | "PLAYED";
export type LibraryItemStatusType = "WISHLIST" | "SHELF" | "UP_NEXT" | "PLAYING" | "PLAYED";
```

Replace `statusColors`:

```typescript
const statusColors: Record<GameStatus, string> = {
  WISHLIST: "var(--status-wishlist)",
  SHELF: "var(--status-shelf)",
  UP_NEXT: "var(--status-upNext)",
  PLAYING: "var(--status-playing)",
  PLAYED: "var(--status-played)",
};
```

Replace `statusDefaults`:

```typescript
const statusDefaults: Record<GameStatus, number> = {
  WISHLIST: 0,
  SHELF: 10,
  UP_NEXT: 25,
  PLAYING: 50,
  PLAYED: 100,
};
```

Replace `mapLibraryStatusToGameStatus`:

```typescript
export function mapLibraryStatusToGameStatus(
  libraryStatus: LibraryItemStatusType | string
): GameStatus {
  switch (libraryStatus) {
    case "WISHLIST": return "WISHLIST";
    case "SHELF": return "SHELF";
    case "UP_NEXT": return "UP_NEXT";
    case "PLAYING": return "PLAYING";
    case "PLAYED": return "PLAYED";
    default: return "SHELF";
  }
}
```

- [ ] **Step 5: Update `profile/constants.ts`**

Replace `statusLabels`:

```typescript
export const statusLabels: Record<string, string> = {
  WISHLIST: "Wishlist",
  SHELF: "Shelf",
  UP_NEXT: "Up Next",
  PLAYING: "Playing",
  PLAYED: "Played",
};
```

- [ ] **Step 6: Commit**

```bash
git add savepoint-app/shared/
git commit -m "feat: update shared config, CSS variables, and badge for 5-status model"
```

---

### Task 6: Library UI — Filters, Card, Action Bars

**Files:**
- Modify: `savepoint-app/features/library/ui/library-filters.tsx`
- Modify: `savepoint-app/features/library/ui/library-card.tsx`
- Modify: `savepoint-app/features/library/ui/library-card-action-bar.tsx`
- Modify: `savepoint-app/features/library/ui/library-card-mobile-actions.tsx`
- Modify: `savepoint-app/features/library/hooks/use-update-library-status.ts`

- [ ] **Step 1: Update `library-filters.tsx`**

The `getStatusFilterStyles` function uses `badgeVariant` as CSS variable name. Since we changed variant names from `wantToPlay`/`owned` to `wishlist`/`shelf`/`upNext`, this function will auto-work with the new CSS variables. No logic change needed — just verify the config drives the filters correctly.

The filter tab order is driven by `LIBRARY_STATUS_CONFIG` array order (updated in Task 5 to: Up Next, Playing, Shelf, Played, Wishlist).

- [ ] **Step 2: Update `library-card.tsx` for "Replay" badge**

The card currently displays `statusConfig.label` as the badge text. Add `hasBeenPlayed` logic:

```typescript
const badgeLabel =
  item.status === LibraryItemStatus.UP_NEXT && item.hasBeenPlayed
    ? "Replay"
    : statusConfig.label;
```

Use `badgeLabel` instead of `statusConfig.label` in the Badge component. The card component will need `hasBeenPlayed` from the library item data.

For Shelf and Wishlist cards, hide the badge entirely (no badge shown):

```typescript
const showBadge =
  item.status !== LibraryItemStatus.SHELF &&
  item.status !== LibraryItemStatus.WISHLIST;
```

- [ ] **Step 3: Replace action bar with curated per-status actions**

In `library-card-action-bar.tsx`, replace the current "show all other statuses" pattern with explicit action sets.

Replace `STATUS_BUTTON_STYLES`:

```typescript
const STATUS_BUTTON_STYLES: Record<string, string> = {
  wishlist:
    "bg-[var(--status-wishlist)]/90 text-[var(--status-wishlist-foreground)] hover:bg-[var(--status-wishlist)]",
  shelf:
    "bg-[var(--status-shelf)]/90 text-[var(--status-shelf-foreground)] hover:bg-[var(--status-shelf)]",
  upNext:
    "bg-[var(--status-upNext)]/90 text-[var(--status-upNext-foreground)] hover:bg-[var(--status-upNext)]",
  playing:
    "bg-[var(--status-playing)]/90 text-[var(--status-playing-foreground)] hover:bg-[var(--status-playing)]",
  played:
    "bg-[var(--status-played)]/90 text-[var(--status-played-foreground)] hover:bg-[var(--status-played)]",
};
```

Define action sets per status:

```typescript
type CardAction = {
  label: string;
  status: LibraryItemStatus;
  variant: string;
};

function getActionsForStatus(
  currentStatus: LibraryItemStatus,
  hasBeenPlayed: boolean
): CardAction[] {
  switch (currentStatus) {
    case LibraryItemStatus.SHELF:
      return [
        { label: "★ Up Next", status: LibraryItemStatus.UP_NEXT, variant: "upNext" },
        { label: "✓ Played", status: LibraryItemStatus.PLAYED, variant: "played" },
      ];
    case LibraryItemStatus.UP_NEXT:
      return hasBeenPlayed
        ? [
            { label: "▶ Playing", status: LibraryItemStatus.PLAYING, variant: "playing" },
            { label: "✓ Played", status: LibraryItemStatus.PLAYED, variant: "played" },
          ]
        : [
            { label: "▶ Playing", status: LibraryItemStatus.PLAYING, variant: "playing" },
            { label: "← Shelf", status: LibraryItemStatus.SHELF, variant: "shelf" },
          ];
    case LibraryItemStatus.PLAYING:
      return [
        { label: "✓ Played", status: LibraryItemStatus.PLAYED, variant: "played" },
        { label: "⏸ Up Next", status: LibraryItemStatus.UP_NEXT, variant: "upNext" },
      ];
    case LibraryItemStatus.PLAYED:
      return [
        { label: "★ Replay", status: LibraryItemStatus.UP_NEXT, variant: "upNext" },
        { label: "← Shelf", status: LibraryItemStatus.SHELF, variant: "shelf" },
      ];
    case LibraryItemStatus.WISHLIST:
      return [
        { label: "→ Shelf", status: LibraryItemStatus.SHELF, variant: "shelf" },
      ];
    default:
      return [];
  }
}
```

Render actions using this function instead of the current filter-all-except-current pattern.

- [ ] **Step 4: Update `library-card-mobile-actions.tsx`**

Apply the same curated action pattern as the desktop action bar. Update `STATUS_BUTTON_STYLES` to use new variant names.

- [ ] **Step 5: Update `use-update-library-status.ts` optimistic update**

The optimistic update currently only patches `status`. Since `hasBeenPlayed` is read-only (only set server-side when transitioning to PLAYED), the optimistic update doesn't need to handle it. However, if the mutation target is PLAYED, optimistically set `hasBeenPlayed: true`:

```typescript
items: page.items.map((item) =>
  item.id === params.libraryItemId
    ? {
        ...item,
        status: params.status,
        ...(params.status === "PLAYED" ? { hasBeenPlayed: true } : {}),
      }
    : item
),
```

- [ ] **Step 6: Run library UI component tests**

Run: `cd savepoint-app && pnpm vitest run features/library/`

Expected: PASS (after updating test enum references)

- [ ] **Step 7: Commit**

```bash
git add savepoint-app/features/library/
git commit -m "feat: update library UI for curated per-status actions and Replay badge"
```

---

### Task 7: Manage Library Entry — Forms, Chips, Server Actions

**Files:**
- Modify: `savepoint-app/features/manage-library-entry/ui/entry-form.tsx`
- Modify: `savepoint-app/features/manage-library-entry/use-cases/add-game-to-library.ts`
- Modify: `savepoint-app/features/manage-library-entry/server-actions/update-library-status-action.ts`
- Verify: `savepoint-app/features/manage-library-entry/schemas.ts` (uses `z.enum(LibraryItemStatus)` — auto-updated)
- Tests: `savepoint-app/features/manage-library-entry/ui/*.test.tsx`
- Tests: `savepoint-app/features/manage-library-entry/use-cases/add-game-to-library.unit.test.ts`
- Tests: `savepoint-app/features/manage-library-entry/use-cases/add-game-to-library.integration.test.ts`
- Tests: `savepoint-app/features/manage-library-entry/server-actions/library-actions.integration.test.ts`

- [ ] **Step 1: Update `entry-form.tsx` default status**

Change the default from `LibraryItemStatus.WANT_TO_PLAY` to `LibraryItemStatus.SHELF`:

```typescript
defaultValues: {
  igdbId,
  status: LibraryItemStatus.SHELF,
  platform: "",
},
```

Note: `StatusChipGroup` and `StatusSelect` consume `LIBRARY_STATUS_CONFIG` from shared — they auto-update with the new 5-status config from Task 5. No changes needed in those components.

- [ ] **Step 2: Update `update-library-status-action.ts`**

No logic change needed — the action passes status through to the service layer, which now handles `hasBeenPlayed`. The Zod schema uses `z.enum(LibraryItemStatus)` which auto-picks up new enum values.

Verify no hardcoded references to old enum values exist.

- [ ] **Step 2b: Update `add-game-to-library.ts` use case**

Search for any hardcoded references to `WANT_TO_PLAY` or `OWNED` in this file and replace with `WISHLIST`/`SHELF`. If the use case sets a default status, update it to `SHELF`.

- [ ] **Step 3: Update all manage-library-entry tests**

In all test files under `features/manage-library-entry/`, replace:
- `WANT_TO_PLAY` → `WISHLIST`
- `OWNED` → `SHELF`
- `LibraryItemStatus.WANT_TO_PLAY` → `LibraryItemStatus.WISHLIST`
- `LibraryItemStatus.OWNED` → `LibraryItemStatus.SHELF`
- `"Want to Play"` → `"Wishlist"` (label text in UI tests)
- `"Owned"` → `"Shelf"` (label text in UI tests)

Add test for UP_NEXT status in chip group and select tests.

- [ ] **Step 4: Run manage-library-entry tests**

Run: `cd savepoint-app && pnpm vitest run features/manage-library-entry/`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add savepoint-app/features/manage-library-entry/
git commit -m "feat: update manage-library-entry forms and tests for 5-status model"
```

---

### Task 8: Steam Import

**Files:**
- Modify: `savepoint-app/features/steam-import/lib/calculate-smart-status.ts`
- Modify: `savepoint-app/features/steam-import/use-cases/import-game-to-library.ts`
- Test: `savepoint-app/features/steam-import/lib/calculate-smart-status.unit.test.ts`
- Test: `savepoint-app/features/steam-import/use-cases/import-game-to-library.unit.test.ts`

- [ ] **Step 1: Update `calculate-smart-status.ts`**

Replace `LibraryItemStatus.OWNED` with `LibraryItemStatus.SHELF`:

```typescript
export function calculateSmartStatus(
  importedGame: ImportedGame
): LibraryItemStatus {
  if (!importedGame.playtime || importedGame.playtime === 0) {
    return LibraryItemStatus.SHELF;
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (
    importedGame.lastPlayedAt &&
    new Date(importedGame.lastPlayedAt) > sevenDaysAgo
  ) {
    return LibraryItemStatus.PLAYING;
  }

  return LibraryItemStatus.PLAYED;
}
```

- [ ] **Step 2: Update `import-game-to-library.ts` status map**

Replace `LIBRARY_STATUS_MAP`:

```typescript
const LIBRARY_STATUS_MAP: Record<LibraryStatus, LibraryItemStatus> = {
  want_to_play: LibraryItemStatus.WISHLIST,
  owned: LibraryItemStatus.SHELF,
  playing: LibraryItemStatus.PLAYING,
  played: LibraryItemStatus.PLAYED,
};
```

Note: The `LibraryStatus` type from the import form may also need `up_next` added if the import UI allows selecting UP_NEXT. Check the import form — if it uses the same `LibraryStatus` type, add `up_next: LibraryItemStatus.UP_NEXT` to the map.

Also update the library item creation to set `hasBeenPlayed: true` when the calculated/selected status is `PLAYED`:

```typescript
const createResult = await libraryService.createLibraryItem({
  userId,
  gameId,
  libraryItem: {
    status: LIBRARY_STATUS_MAP[status],
    acquisitionType: AcquisitionType.DIGITAL,
    platform: "PC (Microsoft Windows)",
    hasBeenPlayed: LIBRARY_STATUS_MAP[status] === LibraryItemStatus.PLAYED,
  },
});
```

- [ ] **Step 3: Update smart status tests**

In `calculate-smart-status.unit.test.ts`, replace `OWNED` with `SHELF` in expected values.

- [ ] **Step 4: Update import use-case tests**

In `import-game-to-library.unit.test.ts`, replace `WANT_TO_PLAY`/`OWNED` references with `WISHLIST`/`SHELF`.

- [ ] **Step 5: Run steam import tests**

Run: `cd savepoint-app && pnpm vitest run features/steam-import/`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add savepoint-app/features/steam-import/
git commit -m "feat: update steam import for new status enum values"
```

---

### Task 9: Dashboard

**Files:**
- Modify: `savepoint-app/features/dashboard/ui/dashboard-stats-cards.tsx`
- Modify: `savepoint-app/features/dashboard/server-actions/get-random-want-to-play.ts`

- [ ] **Step 1: Update `dashboard-stats-cards.tsx`**

Replace `statusMap`:

```typescript
const statusMap: Record<
  LibraryItemStatus,
  { count: number; gameStatus: GameStatus }
> = {
  [LibraryItemStatus.WISHLIST]: {
    count: stats.wishlist ?? stats.wantToPlay ?? 0,
    gameStatus: "WISHLIST",
  },
  [LibraryItemStatus.SHELF]: {
    count: stats.shelf ?? stats.owned ?? 0,
    gameStatus: "SHELF",
  },
  [LibraryItemStatus.UP_NEXT]: {
    count: stats.upNext ?? 0,
    gameStatus: "UP_NEXT",
  },
  [LibraryItemStatus.PLAYING]: {
    count: stats.playing,
    gameStatus: "PLAYING",
  },
  [LibraryItemStatus.PLAYED]: {
    count: stats.played,
    gameStatus: "PLAYED",
  },
};
```

Note: The `stats` object shape may need updating depending on how the dashboard stats are fetched. Check the stats query/service and update the property names (`wantToPlay` → `wishlist`, `owned` → `shelf`, add `upNext`).

- [ ] **Step 1b: Update `dashboard-stats.tsx`**

Search for any references to old status enum values (`WANT_TO_PLAY`, `OWNED`) and replace with `WISHLIST`, `SHELF`. Add `UP_NEXT` if status breakdown is displayed.

- [ ] **Step 2: Update `get-random-want-to-play.ts`**

Update the service call from `getRandomWantToPlayGame` to `getRandomUpNextGame`:

```typescript
const result = await service.getRandomUpNextGame({ userId: userId! });
```

Update log messages accordingly.

- [ ] **Step 3: Commit**

```bash
git add savepoint-app/features/dashboard/
git commit -m "feat: update dashboard for new status model"
```

---

### Task 10: Remaining Test Updates + Full Test Run

**Files:**
- All 24 test files from the grep results that reference old enum values

- [ ] **Step 1: Bulk update test files**

Run a search-and-replace across all test files:
- `LibraryItemStatus.WANT_TO_PLAY` → `LibraryItemStatus.WISHLIST`
- `LibraryItemStatus.OWNED` → `LibraryItemStatus.SHELF`
- `WANT_TO_PLAY` (string literal) → `WISHLIST`
- `OWNED` (string literal in status context) → `SHELF`
- `"Want to Play"` → `"Wishlist"` or `"Up Next"` (context-dependent)
- `"Owned"` → `"Shelf"` (in label context)
- `findWantToPlayItemsForUser` → `findUpNextItemsForUser`
- `getRandomWantToPlayGame` → `getRandomUpNextGame`

Be careful with `OWNED` — only replace when it's a status reference, not a general word.

Test files to update:
- `test/migrations/status-simplification.integration.test.ts`
- `features/game-detail/ui/quick-action-buttons.test.tsx`
- `features/journal/ui/journal-entry-form.test.tsx`
- `features/library/ui/library-page-view.test.tsx`
- `features/library/server-actions/update-library-status.integration.test.ts`
- `data-access-layer/services/onboarding/onboarding-service.unit.test.ts`
- `data-access-layer/services/profile/profile-service.unit.test.ts`
- `data-access-layer/repository/database-constraints.integration.test.ts`
- `data-access-layer/handlers/library/get-library-handler.unit.test.ts`

- [ ] **Step 2: Run the full test suite**

Run: `cd savepoint-app && pnpm vitest run`

Expected: ALL PASS

- [ ] **Step 3: Fix any remaining failures**

Address each failure individually — likely missed enum references or test assertions checking old labels.

- [ ] **Step 4: Commit**

```bash
git add savepoint-app/
git commit -m "test: update all tests for 5-status library model"
```

---

### Task 11: Type Check + Lint

- [ ] **Step 1: Run TypeScript type check**

Run: `cd savepoint-app && pnpm tsc --noEmit`

Expected: No errors. If there are errors, they'll point to missed enum references.

- [ ] **Step 2: Run ESLint**

Run: `cd savepoint-app && pnpm eslint .`

Expected: No new errors.

- [ ] **Step 3: Fix any issues**

Address remaining type/lint errors.

- [ ] **Step 4: Commit if fixes were needed**

```bash
git add savepoint-app/
git commit -m "fix: resolve type and lint errors from status redesign"
```

---

### Task 12: Manual Smoke Test

- [ ] **Step 1: Start dev server**

Run: `cd savepoint-app && pnpm dev`

- [ ] **Step 2: Verify library page**

1. Open `/library` — confirm 5 tabs appear in correct order: Up Next, Playing, Shelf, Played, Wishlist
2. Click each tab — confirm games filter correctly
3. Hover a Shelf card — confirm actions show "★ Up Next" and "✓ Played"
4. Hover a Played card — confirm actions show "★ Replay" and "← Shelf"

- [ ] **Step 3: Verify add game flow**

1. Search for a game
2. Open add form — confirm 5 status chips appear
3. Add a game with "Shelf" status
4. Verify it appears under Shelf tab

- [ ] **Step 4: Verify status transitions**

1. Move a Shelf game to "Up Next" — verify it appears under Up Next tab
2. Move it to "Playing" — verify Playing tab
3. Move it to "Played" — verify Played tab
4. From Played, click "Replay" — verify it goes to Up Next with "Replay" badge
5. From Wishlist, click "Move to Shelf" — verify it appears on Shelf
