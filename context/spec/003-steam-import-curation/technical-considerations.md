# Technical Specification: Steam Import Curation

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Claude (AI-assisted)

---

## 1. High-Level Technical Approach

This feature enhances the existing `steam-import` feature to enable users to curate their imported Steam games before adding them to their SavePoint library. The implementation leverages existing infrastructure with minimal changes.

**Key Architecture Decisions:**
- IGDB matching happens **on-demand when importing** using Steam App ID lookup (same pattern as Lambda)
- No new fields on `ImportedGame` — status tracking via existing `igdbMatchStatus` enum
- `MATCHED` status indicates game was imported to library (filtered out of curation list)
- Individual game actions only (bulk operations deferred to Stage 3)

**Existing Infrastructure (minimal changes):**
- `ImportedGame` Prisma model with pagination, filtering, sorting
- `ImportedGameService` and repository layer
- `GET /api/steam/games` API endpoint
- `ImportedGamesList` UI component with filters and pagination
- `useImportedGames` TanStack Query hook

**New Development:**
- Port the Lambda matcher to TypeScript (Steam App ID → IGDB `external_games` lookup)
- Create `importGameToLibrary` use-case orchestrating match + import flow
- Create server actions for import and dismiss
- Add manual IGDB search modal component
- Enhance `ImportedGameCard` with import/dismiss action buttons
- Update default filter to hide `MATCHED` games from curation list

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Data Model / Database Changes

**No schema changes required.** The `ImportedGame` model already has all necessary fields:

| Field | Purpose |
|-------|---------|
| `storefrontGameId` | Steam App ID (used for IGDB lookup) |
| `playtime`, `lastPlayedAt` | Smart status calculation |
| `igdbMatchStatus` | Track import state |

**Status Flow:**
```
PENDING (initial)
    → MATCHED (imported to library)
    → UNMATCHED (auto-match failed, needs manual search)
    → IGNORED (user dismissed)
```

**Curation List Filter:** Default to showing `PENDING` and `UNMATCHED` only (hide `MATCHED` and `IGNORED`).

### 2.2 IGDB Matcher Service (Port from Lambda)

**New file:** `data-access-layer/services/igdb/igdb-matcher.ts`

**Port the Lambda matching logic** (see `lambdas-py/src/lambdas/clients/igdb.py`):

```typescript
import { IgdbService } from './igdb-service';

const STEAM_STORE_URL = 'https://store.steampowered.com/app';

/**
 * Match a Steam game to IGDB using Steam App ID lookup.
 * Uses IGDB's external_games table which has Steam Store URL mappings.
 *
 * This mirrors the Lambda implementation in lambdas-py/src/lambdas/clients/igdb.py
 */
export async function matchSteamGameToIgdb(
  steamAppId: string
): Promise<ServiceResult<IgdbGame | null>> {
  const igdbService = new IgdbService();

  // Construct Steam Store URL (same as Lambda)
  const steamUrl = `${STEAM_STORE_URL}/${steamAppId}`;

  // Query IGDB external_games table
  const query = `
    fields id, name, slug, summary, cover.image_id, first_release_date,
           release_dates.platform.name, release_dates.human;
    where external_games.url = "${steamUrl}";
    limit 1;
  `;

  const result = await igdbService.executeQuery('games', query);

  if (!result.ok) {
    return { success: false, error: result.error.message };
  }

  // Return first match or null if not found
  const games = result.data;
  if (games.length === 0) {
    return { success: true, data: null };
  }

  return { success: true, data: games[0] };
}
```

**Key characteristics (matching Lambda):**
- Direct URL matching via `external_games.url` field
- No fuzzy matching or name normalization needed
- Single IGDB API call per match attempt
- Returns `null` if no match found (user can search manually)

### 2.3 Use-Case Layer

**New file:** `features/steam-import/use-cases/import-game-to-library.ts`

```typescript
import { matchSteamGameToIgdb } from '@/data-access-layer/services/igdb/igdb-matcher';
import { GameDetailService } from '@/data-access-layer/services/game-detail';
import { LibraryService } from '@/data-access-layer/services/library';
import { ImportedGameService } from '@/data-access-layer/services/imported-game';
import { updateImportedGameStatus } from '@/data-access-layer/repository/imported-game';

type ImportGameToLibraryInput = {
  importedGameId: string;
  userId: string;
  status: LibraryStatus;        // From smart default or user override
  manualIgdbId?: number;        // If user manually selected IGDB game
};

type ImportGameToLibraryResult =
  | { success: true; data: { libraryItem: LibraryItem; gameSlug: string } }
  | { success: false; error: string; errorCode: 'NOT_FOUND' | 'NO_MATCH' | 'DUPLICATE' | 'IGDB_ERROR' };

export async function importGameToLibrary(
  input: ImportGameToLibraryInput
): Promise<ImportGameToLibraryResult> {
  const { importedGameId, userId, status, manualIgdbId } = input;

  // 1. Fetch ImportedGame by ID (verify ownership)
  const importedGameResult = await ImportedGameService.findById({ id: importedGameId, userId });
  if (!importedGameResult.success || !importedGameResult.data) {
    return { success: false, error: 'Game not found', errorCode: 'NOT_FOUND' };
  }
  const importedGame = importedGameResult.data;

  // 2. Determine IGDB game
  let igdbGame: IgdbGame;

  if (manualIgdbId) {
    // User manually selected an IGDB game
    const fetchResult = await IgdbService.getGameById(manualIgdbId);
    if (!fetchResult.ok) {
      return { success: false, error: 'Failed to fetch IGDB game', errorCode: 'IGDB_ERROR' };
    }
    igdbGame = fetchResult.data;
  } else {
    // Auto-match via Steam App ID
    if (!importedGame.storefrontGameId) {
      return { success: false, error: 'No Steam App ID available', errorCode: 'NO_MATCH' };
    }

    const matchResult = await matchSteamGameToIgdb(importedGame.storefrontGameId);
    if (!matchResult.success) {
      return { success: false, error: matchResult.error, errorCode: 'IGDB_ERROR' };
    }
    if (!matchResult.data) {
      // Update status to UNMATCHED so user knows to search manually
      await updateImportedGameStatus(importedGameId, userId, 'UNMATCHED');
      return { success: false, error: 'No IGDB match found', errorCode: 'NO_MATCH' };
    }
    igdbGame = matchResult.data;
  }

  // 3. Find or create Game record from IGDB data
  const gameResult = await GameDetailService.findOrCreateByIgdbId(igdbGame.id);
  if (!gameResult.success) {
    return { success: false, error: 'Failed to create game record', errorCode: 'IGDB_ERROR' };
  }
  const game = gameResult.data;

  // 4. Check for duplicate LibraryItem
  const existingResult = await LibraryService.findByUserAndGame(userId, game.id);
  if (existingResult.success && existingResult.data) {
    // Game already in library - still mark as MATCHED
    await updateImportedGameStatus(importedGameId, userId, 'MATCHED');
    return { success: false, error: 'Game already in library', errorCode: 'DUPLICATE' };
  }

  // 5. Create LibraryItem with status
  const libraryItemResult = await LibraryService.createLibraryItem({
    userId,
    gameId: game.id,
    status,
    acquisitionType: 'DIGITAL',
    platform: 'PC',
  });

  if (!libraryItemResult.success) {
    return { success: false, error: 'Failed to add to library', errorCode: 'IGDB_ERROR' };
  }

  // 6. Update ImportedGame status to MATCHED
  await updateImportedGameStatus(importedGameId, userId, 'MATCHED');

  // 7. Return success
  return {
    success: true,
    data: {
      libraryItem: libraryItemResult.data,
      gameSlug: game.slug
    }
  };
}
```

**Smart status calculation helper:**

```typescript
export function calculateSmartStatus(importedGame: ImportedGame): LibraryStatus {
  // No playtime = Owned (user has it but hasn't played)
  if (!importedGame.playtime || importedGame.playtime === 0) {
    return 'OWNED';
  }

  // Played within 7 days = Playing
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (importedGame.lastPlayedAt && new Date(importedGame.lastPlayedAt) > sevenDaysAgo) {
    return 'PLAYING';
  }

  // Has playtime but not recent = Played
  return 'PLAYED';
}
```

### 2.4 Repository Layer Additions

**File:** `data-access-layer/repository/imported-game/imported-game-repository.ts`

**Add new function:**

```typescript
export async function updateImportedGameStatus(
  id: string,
  userId: string,
  status: IgdbMatchStatus
): Promise<RepositoryResult<ImportedGame>> {
  try {
    const updated = await prisma.importedGame.update({
      where: {
        id,
        userId, // Authorization check
        deletedAt: null,
      },
      data: {
        igdbMatchStatus: status,
        updatedAt: new Date(),
      },
    });
    return { ok: true, data: updated };
  } catch (error) {
    return { ok: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update status' } };
  }
}
```

**Update default filter** in `findImportedGamesByUserId`:
- Add `matchStatus` filter option
- Default to excluding `MATCHED` and `IGNORED` from curation list

### 2.5 Server Actions

**New file:** `features/steam-import/server-actions/import-to-library-action.ts`

```typescript
"use server";

import { createServerAction } from '@/shared/lib/safe-action';
import { importGameToLibrary, calculateSmartStatus } from '../use-cases/import-game-to-library';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ImportToLibrarySchema = z.object({
  importedGameId: z.string().cuid(),
  status: z.enum(['WANT_TO_PLAY', 'OWNED', 'PLAYING', 'PLAYED']).optional(),
  manualIgdbId: z.number().int().positive().optional(),
});

export const importToLibraryAction = createServerAction({
  actionName: 'importToLibraryAction',
  schema: ImportToLibrarySchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    logger.info({ importedGameId: input.importedGameId }, 'Importing game to library');

    const result = await importGameToLibrary({
      importedGameId: input.importedGameId,
      userId,
      status: input.status ?? 'OWNED', // Fallback if not provided
      manualIgdbId: input.manualIgdbId,
    });

    if (!result.success) {
      logger.warn({ error: result.error, errorCode: result.errorCode }, 'Import failed');
      return { success: false, error: result.error, errorCode: result.errorCode };
    }

    revalidatePath('/library');
    revalidatePath('/steam/games');

    logger.info({ gameSlug: result.data.gameSlug }, 'Game imported successfully');
    return { success: true, data: result.data };
  },
});
```

**New file:** `features/steam-import/server-actions/dismiss-imported-game-action.ts`

```typescript
"use server";

import { createServerAction } from '@/shared/lib/safe-action';
import { updateImportedGameStatus } from '@/data-access-layer/repository/imported-game';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const DismissSchema = z.object({
  importedGameId: z.string().cuid(),
});

export const dismissImportedGameAction = createServerAction({
  actionName: 'dismissImportedGameAction',
  schema: DismissSchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    logger.info({ importedGameId: input.importedGameId }, 'Dismissing imported game');

    await updateImportedGameStatus(input.importedGameId, userId, 'IGNORED');

    revalidatePath('/steam/games');
    return { success: true };
  },
});
```

### 2.6 Component Enhancements

**Enhanced:** `features/steam-import/ui/imported-game-card.tsx`

Add to existing card:
- **"Import" button** — Opens import flow (auto-match → status selector → confirm)
- **"Dismiss" button** (X or trash icon) — Sets status to IGNORED
- **Smart status badge** — Shows auto-calculated status (Owned/Playing/Played) as preview

**New:** `features/steam-import/ui/import-game-modal.tsx`

Modal flow:
1. Show game info (Steam name, playtime, last played)
2. Show smart status default with selector to override
3. "Import" button triggers `importToLibraryAction`
4. **Loading state** while matching/importing
5. **If `NO_MATCH` error** → transition to manual search UI
6. **Success** → close modal, show toast, list refreshes automatically

**New:** `features/steam-import/ui/igdb-manual-search.tsx`

Simple search component for when auto-match fails:
- Search input with 300ms client-side debounce
- Uses existing game search API (`/api/games/search`)
- Results show: cover thumbnail, title, release year, platforms
- "Select" button calls `importToLibraryAction` with `manualIgdbId`

**Enhanced:** `features/steam-import/ui/imported-games-list.tsx`

Update filter defaults:
- Default `matchStatus` filter excludes `MATCHED` and `IGNORED`
- Add filter option to show "Already imported" (MATCHED status)

### 2.7 Hooks

**New:** `features/steam-import/hooks/use-import-game.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importToLibraryAction } from '../server-actions/import-to-library-action';
import { toast } from 'sonner';

export function useImportGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importToLibraryAction,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['imported-games'] });
        queryClient.invalidateQueries({ queryKey: ['library'] });
        toast.success('Game added to library');
      }
    },
    onError: (error) => {
      toast.error('Failed to import game');
    },
  });
}
```

**New:** `features/steam-import/hooks/use-dismiss-game.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dismissImportedGameAction } from '../server-actions/dismiss-imported-game-action';
import { toast } from 'sonner';

export function useDismissGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dismissImportedGameAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imported-games'] });
      toast.success('Game dismissed');
    },
  });
}
```

---

## 3. Impact and Risk Analysis

### 3.1 System Dependencies

| Dependency | Impact | Notes |
|------------|--------|-------|
| IGDB API | Read | On-demand matching; 1 call per import attempt |
| `Game` table | Read/Write | May create new Game records during import |
| `LibraryItem` table | Write | Creates new library entries |
| `ImportedGame` table | Read/Write | Update status (MATCHED/UNMATCHED/IGNORED) |
| Existing Steam import UI | Enhance | Adds action buttons, updates filter defaults |

### 3.2 Potential Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **IGDB rate limiting** | Low | User sees error | Client-side 300ms debounce on manual search; user-friendly error message |
| **Steam App ID not in IGDB** | Medium | Auto-match fails | Graceful fallback to manual search; update status to UNMATCHED |
| **Duplicate library entries** | Low | Data inconsistency | Check existing LibraryItem; mark as MATCHED anyway |
| **Network failure mid-import** | Low | Partial state | Use-case is mostly atomic; status update is last step |

### 3.3 Backward Compatibility

- **No database migrations** — No schema changes needed
- **API unchanged** — Existing endpoints work as before
- **UI additive** — New buttons/modals added to existing components
- **Filter default change** — Now hides MATCHED games; user can override

---

## 4. Testing Strategy

### 4.1 Unit Tests

**Matcher service** (`igdb-matcher.unit.test.ts`):
- Constructs correct Steam Store URL format
- Returns IgdbGame on successful match
- Returns null when no match found
- Handles IGDB API errors gracefully

**Use-case** (`import-game-to-library.unit.test.ts`):
- Happy path: auto-match succeeds → LibraryItem created → status set to MATCHED
- Manual match: uses provided igdbId → imports successfully
- Error: ImportedGame not found → returns NOT_FOUND
- Error: no IGDB match → updates status to UNMATCHED, returns NO_MATCH
- Error: duplicate library entry → updates status to MATCHED, returns DUPLICATE

**Smart status calculation** (`calculate-smart-status.unit.test.ts`):
- 0 playtime → OWNED
- Playtime > 0, last played within 7 days → PLAYING
- Playtime > 0, last played > 7 days ago → PLAYED
- Null lastPlayedAt with playtime → PLAYED

### 4.2 Integration Tests

**Repository** (`imported-game-repository.integration.test.ts`):
- `updateImportedGameStatus` updates correctly
- Authorization check prevents updating other user's games
- Filter by matchStatus works correctly

**Use-case integration** (`import-game-to-library.integration.test.ts`):
- Full flow with mocked IGDB (MSW)
- Verify LibraryItem created with correct status
- Verify ImportedGame status updated to MATCHED
- Verify Game record created if new

### 4.3 Component Tests

**ImportGameModal** (`import-game-modal.test.tsx`):
- Shows game info and smart status default
- User can select different status
- Shows loading state during import
- Transitions to manual search on NO_MATCH
- Closes and shows toast on success

**IgdbManualSearch** (`igdb-manual-search.test.tsx`):
- Search input debounces correctly
- Results display with correct data
- Selection calls import action with igdbId

**ImportedGameCard** (`imported-game-card.test.tsx`):
- Import button opens modal
- Dismiss button triggers dismiss action
- Shows correct smart status badge

### 4.4 Coverage Targets

| Layer | Target | Files |
|-------|--------|-------|
| Matcher service | 90% | `igdb-matcher.ts` |
| Use-case | 90% | `import-game-to-library.ts` |
| Repository additions | 100% | `updateImportedGameStatus` |
| Server actions | 80% | `import-to-library-action.ts`, `dismiss-imported-game-action.ts` |
| UI components | 80% | New modal and search components |

---

## 5. File Summary

| Type | Path | Description |
|------|------|-------------|
| **New Service** | `data-access-layer/services/igdb/igdb-matcher.ts` | Steam→IGDB matching via App ID |
| **New Use-Case** | `features/steam-import/use-cases/import-game-to-library.ts` | Import orchestration |
| **New Action** | `features/steam-import/server-actions/import-to-library-action.ts` | Import server action |
| **New Action** | `features/steam-import/server-actions/dismiss-imported-game-action.ts` | Dismiss server action |
| **New Hook** | `features/steam-import/hooks/use-import-game.ts` | Import mutation hook |
| **New Hook** | `features/steam-import/hooks/use-dismiss-game.ts` | Dismiss mutation hook |
| **New Component** | `features/steam-import/ui/import-game-modal.tsx` | Import flow modal |
| **New Component** | `features/steam-import/ui/igdb-manual-search.tsx` | Manual IGDB search |
| **Enhanced** | `features/steam-import/ui/imported-game-card.tsx` | Add action buttons |
| **Enhanced** | `features/steam-import/ui/imported-games-list.tsx` | Update filter defaults |
| **Enhanced** | `data-access-layer/repository/imported-game/imported-game-repository.ts` | Add status update function |
