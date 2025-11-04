# Technical Specification: Game Detail Pages

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Technical Architect (with Claude Code)

---

## 1. High-Level Technical Approach

**Overview:**
Implement a Next.js 15 Server Component at `/games/[slug]` that fetches game metadata from IGDB API and displays it alongside user's personal library data and journal entries. The implementation follows the existing three-layer architecture (Page → Service → Repository → Prisma).

**Core Strategy:**
1. **Slug-based routing** using IGDB slugs for SEO-friendly URLs (e.g., `/games/zelda-breath-of-the-wild`)
2. **IGDB-first data flow**: Always fetch fresh data from IGDB API, display immediately to user
3. **Background database population**: Asynchronously populate our database with game metadata for library/journal associations
4. **Normalized data model**: Store genres and platforms in separate tables with lazy creation on first encounter
5. **Reusable UI components**: Move `PlatformBadges` to `shared/components/`, create new reusable components for genres, cover images, and related games

**Systems Affected:**
- Database schema (new tables: `Genre`, `Platform`, `GameGenre`, `GamePlatform`, `JournalEntry`)
- Data access layer (new repositories: `genre-repository`, `platform-repository`, `game-repository`, `journal-repository`)
- Service layer (new service: `GameDetailService`)
- IGDB service (extend with slug-based queries)
- App Router (new page at `app/games/[slug]/page.tsx`)
- Shared components (move/create reusable UI components)

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1. Database Schema Changes

#### **New Tables**

**Naming Convention for Repository Functions:**
- `byId` / `bySlug` = Application database lookups
- `byIgdbId` / `byIgdbSlug` = IGDB API queries (used in service layer)

```prisma
model Genre {
  id        String      @id @default(cuid())
  igdbId    Int         @unique
  name      String      @unique
  slug      String      @unique
  checksum  String?     // IGDB checksum for cache validation
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  games     GameGenre[]

  @@index([slug])
  @@index([name])
}

model Platform {
  id              String         @id @default(cuid())
  igdbId          Int            @unique
  name            String         @unique
  slug            String         @unique
  abbreviation    String?        // e.g., "PS5", "PC", "NSW"
  alternativeName String?        // Alternative name for the platform
  generation      Int?           // Console generation number
  platformFamily  Int?           // IGDB platform_family ID reference
  platformType    Int?           // Platform type (replaces deprecated category)
  checksum        String?        // IGDB checksum for cache validation
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  games           GamePlatform[]

  @@index([slug])
  @@index([name])
}

model GameGenre {
  gameId  String
  genreId String
  game    Game   @relation(fields: [gameId], references: [id], onDelete: Cascade)
  genre   Genre  @relation(fields: [genreId], references: [id], onDelete: Cascade)

  @@id([gameId, genreId])
  @@index([gameId])
  @@index([genreId])
}

model GamePlatform {
  gameId     String
  platformId String
  game       Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  platform   Platform @relation(fields: [platformId], references: [id], onDelete: Cascade)

  @@id([gameId, platformId])
  @@index([gameId])
  @@index([platformId])
}
```

#### **Modified Tables**

```prisma
model Game {
  // ... existing fields (id, igdbId, title, description, coverImage, etc.) ...
  slug          String        @unique  // IGDB slug for URL routing
  genres        GameGenre[]
  platforms     GamePlatform[]
  franchiseId   Int?          // IGDB franchise ID for related games

  @@index([slug])
}
```

**Migration Strategy:**
1. Add new tables via Prisma migration
2. Add `slug`, `franchiseId` columns to `Game` table (nullable initially)
3. Backfill existing games' slugs from IGDB (if any exist)
4. Lazy creation: Genres/platforms populated on first encounter

---

### 2.2. Repository Layer

#### **New Repository: `genre-repository.ts`**

```typescript
import { Genre } from 'igdb-api-types';
import { prisma } from '@/shared/lib';
import { repositorySuccess, repositoryError, type RepositoryResult } from '../types';

// Upsert genre from IGDB data (lazy creation)
export async function upsertGenre(igdbGenre: Genre): Promise<RepositoryResult<Genre>> {
  try {
    const genre = await prisma.genre.upsert({
      where: { igdbId: igdbGenre.id },
      update: {
        name: igdbGenre.name || 'Unknown Genre',
        slug: igdbGenre.slug || `genre-${igdbGenre.id}`,
        checksum: igdbGenre.checksum || null,
      },
      create: {
        igdbId: igdbGenre.id,
        name: igdbGenre.name || 'Unknown Genre',
        slug: igdbGenre.slug || `genre-${igdbGenre.id}`,
        checksum: igdbGenre.checksum || null,
      },
    });
    return repositorySuccess(genre);
  } catch (error) {
    return repositoryError(RepositoryErrorCode.DATABASE_ERROR, `Failed to upsert genre: ${error}`);
  }
}

// Find genre by its IGDB ID stored in our database
export async function findGenreByIgdbId(igdbId: number): Promise<RepositoryResult<Genre | null>> {
  try {
    const genre = await prisma.genre.findUnique({ where: { igdbId } });
    return repositorySuccess(genre);
  } catch (error) {
    return repositoryError(RepositoryErrorCode.DATABASE_ERROR, `Failed to find genre: ${error}`);
  }
}

// Bulk upsert genres (efficient game creation)
export async function upsertGenres(igdbGenres: Genre[]): Promise<RepositoryResult<Genre[]>> {
  try {
    const genres = await Promise.all(igdbGenres.map(g => upsertGenre(g)));
    const successfulGenres = genres
      .filter(r => r.ok)
      .map(r => r.data as Genre);
    return repositorySuccess(successfulGenres);
  } catch (error) {
    return repositoryError(RepositoryErrorCode.DATABASE_ERROR, `Failed to upsert genres: ${error}`);
  }
}
```

#### **New Repository: `platform-repository.ts`**

```typescript
import { Platform } from 'igdb-api-types';
import { prisma } from '@/shared/lib';
import { repositorySuccess, repositoryError, type RepositoryResult } from '../types';

// Upsert platform from IGDB data (lazy creation)
export async function upsertPlatform(igdbPlatform: Platform): Promise<RepositoryResult<Platform>> {
  try {
    const platform = await prisma.platform.upsert({
      where: { igdbId: igdbPlatform.id },
      update: {
        name: igdbPlatform.name || 'Unknown Platform',
        slug: igdbPlatform.slug || `platform-${igdbPlatform.id}`,
        abbreviation: igdbPlatform.abbreviation || null,
        alternativeName: igdbPlatform.alternative_name || null,
        generation: igdbPlatform.generation || null,
        platformFamily: typeof igdbPlatform.platform_family === 'number'
          ? igdbPlatform.platform_family
          : null,
        platformType: typeof igdbPlatform.platform_type === 'number'
          ? igdbPlatform.platform_type
          : null,
        checksum: igdbPlatform.checksum || null,
      },
      create: {
        igdbId: igdbPlatform.id,
        name: igdbPlatform.name || 'Unknown Platform',
        slug: igdbPlatform.slug || `platform-${igdbPlatform.id}`,
        abbreviation: igdbPlatform.abbreviation || null,
        alternativeName: igdbPlatform.alternative_name || null,
        generation: igdbPlatform.generation || null,
        platformFamily: typeof igdbPlatform.platform_family === 'number'
          ? igdbPlatform.platform_family
          : null,
        platformType: typeof igdbPlatform.platform_type === 'number'
          ? igdbPlatform.platform_type
          : null,
        checksum: igdbPlatform.checksum || null,
      },
    });
    return repositorySuccess(platform);
  } catch (error) {
    return repositoryError(RepositoryErrorCode.DATABASE_ERROR, `Failed to upsert platform: ${error}`);
  }
}

// Bulk upsert platforms
export async function upsertPlatforms(igdbPlatforms: Platform[]): Promise<RepositoryResult<Platform[]>> {
  try {
    const platforms = await Promise.all(igdbPlatforms.map(p => upsertPlatform(p)));
    const successfulPlatforms = platforms
      .filter(r => r.ok)
      .map(r => r.data as Platform);
    return repositorySuccess(successfulPlatforms);
  } catch (error) {
    return repositoryError(RepositoryErrorCode.DATABASE_ERROR, `Failed to upsert platforms: ${error}`);
  }
}
```

#### **New Repository: `game-repository.ts`**

```typescript
import { Game, Prisma } from '@prisma/client';
import { FullGameInfoResponse } from '@/shared/types';
import { prisma } from '@/shared/lib';
import { repositorySuccess, repositoryError, type RepositoryResult } from '../types';

type GameWithRelations = Game & {
  genres: Array<GameGenre & { genre: Genre }>;
  platforms: Array<GamePlatform & { platform: Platform }>;
};

// Find game by slug in our database (primary routing)
export async function findGameBySlug(slug: string): Promise<RepositoryResult<GameWithRelations | null>> {
  try {
    const game = await prisma.game.findUnique({
      where: { slug },
      include: {
        genres: { include: { genre: true } },
        platforms: { include: { platform: true } },
      },
    });
    return repositorySuccess(game);
  } catch (error) {
    return repositoryError(RepositoryErrorCode.DATABASE_ERROR, `Failed to find game by slug: ${error}`);
  }
}

// Find game by internal database ID
export async function findGameById(gameId: string): Promise<RepositoryResult<GameWithRelations | null>> {
  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        genres: { include: { genre: true } },
        platforms: { include: { platform: true } },
      },
    });
    return repositorySuccess(game);
  } catch (error) {
    return repositoryError(RepositoryErrorCode.DATABASE_ERROR, `Failed to find game by ID: ${error}`);
  }
}

// Find game by IGDB ID stored in our database
export async function findGameByIgdbId(igdbId: number): Promise<RepositoryResult<GameWithRelations | null>> {
  try {
    const game = await prisma.game.findUnique({
      where: { igdbId },
      include: {
        genres: { include: { genre: true } },
        platforms: { include: { platform: true } },
      },
    });
    return repositorySuccess(game);
  } catch (error) {
    return repositoryError(RepositoryErrorCode.DATABASE_ERROR, `Failed to find game by IGDB ID: ${error}`);
  }
}

// Create game with genres and platforms in transaction
export async function createGameWithRelations(params: {
  igdbGame: FullGameInfoResponse;
  genreIds: string[];
  platformIds: string[];
}): Promise<RepositoryResult<Game>> {
  try {
    const { igdbGame, genreIds, platformIds } = params;

    const game = await prisma.game.create({
      data: {
        igdbId: igdbGame.id,
        slug: igdbGame.slug,
        title: igdbGame.name,
        description: igdbGame.summary || null,
        coverImage: igdbGame.cover?.url || null,
        releaseDate: igdbGame.release_dates?.[0]?.human
          ? new Date(igdbGame.release_dates[0].human)
          : null,
        franchiseId: igdbGame.franchise?.id || null,
        genres: {
          create: genreIds.map(genreId => ({ genreId })),
        },
        platforms: {
          create: platformIds.map(platformId => ({ platformId })),
        },
      },
    });

    return repositorySuccess(game);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return repositoryError(RepositoryErrorCode.DUPLICATE, 'Game already exists');
    }
    return repositoryError(RepositoryErrorCode.DATABASE_ERROR, `Failed to create game: ${error}`);
  }
}

// Check if game exists by IGDB ID
export async function gameExistsByIgdbId(igdbId: number): Promise<RepositoryResult<boolean>> {
  try {
    const count = await prisma.game.count({ where: { igdbId } });
    return repositorySuccess(count > 0);
  } catch (error) {
    return repositoryError(RepositoryErrorCode.DATABASE_ERROR, `Failed to check game existence: ${error}`);
  }
}
```

#### **New Repository: `journal-repository.ts`**

```typescript
import { JournalEntry } from '@prisma/client';
import { prisma } from '@/shared/lib';
import { repositorySuccess, repositoryError, type RepositoryResult } from '../types';

// Get last N journal entries for a game (by database game ID)
export async function findJournalEntriesByGameId(params: {
  gameId: string;
  userId: string;
  limit?: number;
}): Promise<RepositoryResult<JournalEntry[]>> {
  try {
    const { gameId, userId, limit = 3 } = params;

    const entries = await prisma.journalEntry.findMany({
      where: { gameId, userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return repositorySuccess(entries);
  } catch (error) {
    return repositoryError(RepositoryErrorCode.DATABASE_ERROR, `Failed to find journal entries: ${error}`);
  }
}

// Count total journal entries for a game
export async function countJournalEntriesByGameId(params: {
  gameId: string;
  userId: string;
}): Promise<RepositoryResult<number>> {
  try {
    const count = await prisma.journalEntry.count({
      where: { gameId: params.gameId, userId: params.userId },
    });
    return repositorySuccess(count);
  } catch (error) {
    return repositoryError(RepositoryErrorCode.DATABASE_ERROR, `Failed to count journal entries: ${error}`);
  }
}
```

#### **Enhancements to `library-repository.ts`**

```typescript
// Add new functions to existing library-repository.ts

// Find the most recently updated library item for a game
export async function findMostRecentLibraryItemByGameId(params: {
  userId: string;
  gameId: string;
}): Promise<RepositoryResult<LibraryItem | null>> {
  try {
    const item = await prisma.libraryItem.findFirst({
      where: { userId: params.userId, gameId: params.gameId },
      orderBy: { updatedAt: 'desc' },
    });
    return repositorySuccess(item);
  } catch (error) {
    return repositoryError(RepositoryErrorCode.DATABASE_ERROR, `Failed to find most recent library item: ${error}`);
  }
}

// Find all library items for a game (for modal display)
export async function findAllLibraryItemsByGameId(params: {
  userId: string;
  gameId: string;
}): Promise<RepositoryResult<LibraryItem[]>> {
  try {
    const items = await prisma.libraryItem.findMany({
      where: { userId: params.userId, gameId: params.gameId },
      orderBy: { createdAt: 'asc' },
    });
    return repositorySuccess(items);
  } catch (error) {
    return repositoryError(RepositoryErrorCode.DATABASE_ERROR, `Failed to find all library items: ${error}`);
  }
}
```

---

### 2.3. Service Layer

#### **New Service: `GameDetailService`**

The `GameDetailService` is responsible only for database population. It does NOT orchestrate IGDB calls - that responsibility belongs to the use-case layer.

```typescript
import { BaseService, isSuccessResult } from '../types';
import {
  genreRepository,
  platformRepository,
  gameRepository,
} from '../repository';
import { createLogger, LOGGER_CONTEXT } from '@/shared/lib/logger';
import type { FullGameInfoResponse } from '@/shared/types';

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: 'GameDetailService' });

class GameDetailService extends BaseService {

  // Background job: Populate database with game data
  async populateGameInDatabase(igdbGame: FullGameInfoResponse): Promise<void> {
    try {
      logger.debug({ igdbId: igdbGame.id }, 'Starting background game population');

      // Check if already exists
      const existsResult = await gameRepository.gameExistsByIgdbId(igdbGame.id);
      if (isSuccessResult(existsResult) && existsResult.data) {
        logger.debug({ igdbId: igdbGame.id }, 'Game already in database, skipping');
        return;
      }

      // 1. Upsert genres
      const genresResult = await genreRepository.upsertGenres(igdbGame.genres || []);
      if (!isSuccessResult(genresResult)) {
        throw new Error(`Failed to upsert genres: ${genresResult.error}`);
      }

      // 2. Upsert platforms
      const platformsResult = await platformRepository.upsertPlatforms(igdbGame.platforms || []);
      if (!isSuccessResult(platformsResult)) {
        throw new Error(`Failed to upsert platforms: ${platformsResult.error}`);
      }

      // 3. Create game with relations
      const gameResult = await gameRepository.createGameWithRelations({
        igdbGame,
        genreIds: genresResult.data.map(g => g.id),
        platformIds: platformsResult.data.map(p => p.id),
      });

      if (!isSuccessResult(gameResult)) {
        throw new Error(`Failed to create game: ${gameResult.error}`);
      }

      logger.info({ igdbId: igdbGame.id, gameId: gameResult.data.id }, 'Game populated in database');

    } catch (error) {
      // Log error but don't throw (background job)
      logger.error({ error, igdbId: igdbGame.id }, 'Failed to populate game in database');
    }
  }
}

export const gameDetailService = new GameDetailService();
```

#### **Enhancements to `IgdbService`**

Add methods to support game detail page:

```typescript
// In igdb-service.ts, add these methods:

class IgdbService extends BaseService {
  // ... existing methods ...

  // Get game details by slug (for routing)
  async getGameDetailsBySlug(slug: string): Promise<ServiceResult<FullGameInfoResponse>> {
    try {
      const query = this.queryBuilder
        .resource('games')
        .fields(['*', 'cover.*', 'genres.*', 'platforms.*', 'franchise.*'])
        .where(`slug = "${slug}"`)
        .limit(1)
        .build();

      const result = await this.request({ resource: 'games', body: query });

      if (!result.ok) {
        return this.error(result.error, ServiceErrorCode.EXTERNAL_SERVICE_ERROR);
      }

      const games = result.data as FullGameInfoResponse[];

      if (games.length === 0) {
        return this.error('Game not found', ServiceErrorCode.NOT_FOUND);
      }

      return this.success(games[0]);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch game by slug');
    }
  }

  // Get times to beat (separate endpoint)
  async getTimesToBeat(igdbId: number): Promise<ServiceResult<TimesToBeatResponse>> {
    try {
      const query = this.queryBuilder
        .resource('game_time_to_beats')
        .fields(['normally', 'completely'])
        .where(`game = ${igdbId}`)
        .limit(1)
        .build();

      const result = await this.request({ resource: 'game_time_to_beats', body: query });

      if (!result.ok) {
        return this.error(result.error, ServiceErrorCode.EXTERNAL_SERVICE_ERROR);
      }

      const data = result.data as Array<{ normally?: number; completely?: number }>;

      if (data.length === 0) {
        return this.success({ mainStory: undefined, completionist: undefined });
      }

      return this.success({
        mainStory: data[0].normally ? Math.round(data[0].normally / 3600) : undefined,
        completionist: data[0].completely ? Math.round(data[0].completely / 3600) : undefined,
      });
    } catch (error) {
      return this.handleError(error, 'Failed to fetch times to beat');
    }
  }

  // Get franchise games (related games)
  async getFranchiseGames(franchiseId: number, currentGameId: number): Promise<ServiceResult<RelatedGameResponse[]>> {
    try {
      const query = this.queryBuilder
        .resource('games')
        .fields(['id', 'name', 'slug', 'cover.*'])
        .where(`franchises = [${franchiseId}] & id != ${currentGameId}`)
        .limit(10)
        .build();

      const result = await this.request({ resource: 'games', body: query });

      if (!result.ok) {
        return this.error(result.error, ServiceErrorCode.EXTERNAL_SERVICE_ERROR);
      }

      return this.success(result.data as RelatedGameResponse[]);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch franchise games');
    }
  }
}

type TimesToBeatResponse = {
  mainStory?: number;
  completionist?: number;
};

type RelatedGameResponse = {
  id: number;
  name: string;
  slug: string;
  cover?: { url: string };
};
```

---

### 2.4. Use-Case Layer (Feature Orchestration)

**Architectural Pattern**: The use-case layer sits between pages and services, orchestrating business logic without creating service-to-service dependencies. This follows the **use-case architectural approach** where each use-case is a feature-coupled function that coordinates multiple services and repositories.

**Directory Structure:**
```
features/game-detail/
├── use-cases/
│   └── get-game-details.ts          # Orchestrates IGDB + repositories
├── ui/
│   ├── game-detail-layout.tsx
│   └── ...
├── server-actions/
│   └── library-actions.ts
└── schemas.ts
```

#### **Use Case: `get-game-details.ts`**

```typescript
'use server';

import { IgdbService } from '@/data-access-layer/services/igdb/igdb-service';
import { gameDetailService } from '@/data-access-layer/services/game-detail-service';
import {
  gameRepository,
  libraryRepository,
  journalRepository
} from '@/data-access-layer/repository';
import { isSuccessResult } from '@/data-access-layer/services/types';
import { createLogger, LOGGER_CONTEXT } from '@/shared/lib/logger';
import type { FullGameInfoResponse, JournalEntry, LibraryItem } from '@prisma/client';

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: 'getGameDetailsUseCase' });

type GameDetailsResult = {
  game: FullGameInfoResponse;
  gameDbId?: string;
  userLibraryStatus?: {
    mostRecent: LibraryItem;
    allItems: LibraryItem[];
    updatedAt: Date;
  };
  journalEntries: JournalEntry[];
  timesToBeat?: {
    mainStory?: number;
    completionist?: number;
  };
  relatedGames: Array<{
    id: number;
    name: string;
    slug: string;
    cover?: { url: string };
  }>;
};

/**
 * Use case: Get game details for the game detail page
 *
 * Orchestrates:
 * - IGDB API fetch (game metadata)
 * - Background database population
 * - User library data (if game exists in DB)
 * - Journal entries (if game exists in DB)
 * - Times to beat (IGDB)
 * - Related games (IGDB)
 */
export async function getGameDetails(params: {
  slug: string;
  userId: string;
}): Promise<{ success: true; data: GameDetailsResult } | { success: false; error: string }> {
  try {
    logger.info({ slug: params.slug, userId: params.userId }, 'Use case: Getting game details');

    // 1. Fetch game from IGDB (always fresh data)
    const igdbResult = await IgdbService.getGameDetailsBySlug(params.slug);

    if (!isSuccessResult(igdbResult)) {
      logger.error({ slug: params.slug, error: igdbResult.error }, 'IGDB fetch failed');
      return { success: false, error: igdbResult.error };
    }

    const game = igdbResult.data;

    // 2. Trigger background population (fire-and-forget)
    gameDetailService.populateGameInDatabase(game).catch(err =>
      logger.error({ err, slug: params.slug }, 'Background game population failed')
    );

    // 3. Check if game exists in database
    const gameDbResult = await gameRepository.findGameByIgdbId(game.id);

    let gameDbId: string | undefined;
    let userLibraryStatus;
    let journalEntries: JournalEntry[] = [];

    if (isSuccessResult(gameDbResult) && gameDbResult.data) {
      gameDbId = gameDbResult.data.id;

      // 4. Fetch user-specific data in parallel
      const [libraryResult, journalResult] = await Promise.all([
        libraryRepository.findMostRecentLibraryItemByGameId({
          userId: params.userId,
          gameId: gameDbId,
        }),
        journalRepository.findJournalEntriesByGameId({
          userId: params.userId,
          gameId: gameDbId,
          limit: 3,
        }),
      ]);

      if (isSuccessResult(libraryResult) && libraryResult.data) {
        const allItemsResult = await libraryRepository.findAllLibraryItemsByGameId({
          userId: params.userId,
          gameId: gameDbId,
        });

        userLibraryStatus = {
          mostRecent: libraryResult.data,
          allItems: isSuccessResult(allItemsResult) ? allItemsResult.data : [],
          updatedAt: libraryResult.data.updatedAt,
        };
      }

      if (isSuccessResult(journalResult)) {
        journalEntries = journalResult.data;
      }
    }

    // 5. Fetch IGDB metadata in parallel (times to beat + related games)
    const [timesToBeatResult, relatedGamesResult] = await Promise.all([
      IgdbService.getTimesToBeat(game.id),
      game.franchiseId
        ? IgdbService.getFranchiseGames(game.franchiseId, game.id)
        : Promise.resolve({ success: true, data: [] }),
    ]);

    logger.info(
      {
        igdbId: game.id,
        inDatabase: !!gameDbId,
        hasLibraryStatus: !!userLibraryStatus,
        journalEntriesCount: journalEntries.length,
      },
      'Game details fetched successfully'
    );

    return {
      success: true,
      data: {
        game,
        gameDbId,
        userLibraryStatus,
        journalEntries,
        timesToBeat: isSuccessResult(timesToBeatResult) ? timesToBeatResult.data : undefined,
        relatedGames: isSuccessResult(relatedGamesResult) ? relatedGamesResult.data : [],
      },
    };
  } catch (error) {
    logger.error({ error, slug: params.slug }, 'Use case failed: Get game details');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

**Benefits of Use-Case Pattern:**

1. ✅ **No Service-to-Service Dependencies**: Services only call repositories
2. ✅ **Clear Orchestration**: Business logic lives in feature-coupled use-cases
3. ✅ **Testable**: Easy to mock services and repositories in tests
4. ✅ **Clean Pages**: Pages just call use-cases and render results
5. ✅ **Single Responsibility**: Each layer has a clear, focused purpose

---

### 2.5. UI Components & Page Structure

#### **Page: `app/games/[slug]/page.tsx`**

The page component is now simplified - it calls the use-case and renders the result. No business logic lives in the page.

```typescript
import { notFound } from 'next/navigation';
import { requireServerUserId } from '@/shared/lib/auth';
import { getGameDetails } from '@/features/game-detail/use-cases/get-game-details';
import { GameDetailLayout } from '@/features/game-detail/ui/game-detail-layout';
import { GameDetailSidebar } from '@/features/game-detail/ui/game-detail-sidebar';
import { GameDetailContent } from '@/features/game-detail/ui/game-detail-content';
import { GameDetailSkeleton } from '@/features/game-detail/ui/game-detail-skeleton';

export default async function GameDetailPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const userId = await requireServerUserId();

  // Call the use-case function
  const result = await getGameDetails({ slug, userId });

  if (!result.success) {
    notFound();
  }

  const { game, gameDbId, userLibraryStatus, journalEntries, timesToBeat, relatedGames } = result.data;

  return (
    <GameDetailLayout>
      <GameDetailSidebar
        game={game}
        userLibraryStatus={userLibraryStatus}
        userId={userId}
        gameDbId={gameDbId}
      />
      <GameDetailContent
        game={game}
        timesToBeat={timesToBeat}
        relatedGames={relatedGames}
        journalEntries={journalEntries}
        userId={userId}
      />
    </GameDetailLayout>
  );
}

// Skeleton for loading state
export function Loading() {
  return <GameDetailSkeleton />;
}
```

#### **Component Structure**

**New Components to Create:**

1. **`GameDetailLayout`** - Two-column responsive layout wrapper
2. **`GameDetailSidebar`** - Left column with cover + quick actions (sticky on desktop)
3. **`GameDetailContent`** - Right column with metadata + user data
4. **`GameCoverImage`** - Cover art with placeholder support
5. **`QuickActionButtons`** - All journey status buttons with icons
6. **`LibraryStatusDisplay`** - Current status with "Manage Library" button
7. **`AddToLibraryButton`** - Opens modal for non-library games
8. **`LibraryModal`** - Unified modal for add/manage library (merges both flows)
9. **`GenreBadges`** - Genre display (reusable, similar to PlatformBadges)
10. **`TimesToBeatSection`** - Main story + completionist times
11. **`JournalEntriesSection`** - Last 3 entries with "Write New Entry" button
12. **`RelatedGamesSection`** - Carousel with expand/collapse
13. **`GameDetailSkeleton`** - Loading state skeleton UI

**Components to Move to `shared/components/`:**
- **`PlatformBadges`** (from `features/game-search/ui/platform-badges.tsx`)

---

### 2.5. Server Actions

#### **File: `features/game-detail/schemas.ts`**

```typescript
import { z } from 'zod';
import { LibraryItemStatus } from '@prisma/client';

export const AddToLibrarySchema = z.object({
  gameId: z.string().cuid(),
  status: z.nativeEnum(LibraryItemStatus),
  platform: z.string().optional(),
});

export const UpdateLibraryStatusSchema = z.object({
  gameId: z.string().cuid(),
  status: z.nativeEnum(LibraryItemStatus),
});

export const UpdateLibraryEntrySchema = z.object({
  libraryItemId: z.number().int().positive(),
  status: z.nativeEnum(LibraryItemStatus),
  platform: z.string().optional(),
});

export type AddToLibraryInput = z.infer<typeof AddToLibrarySchema>;
export type UpdateLibraryStatusInput = z.infer<typeof UpdateLibraryStatusSchema>;
export type UpdateLibraryEntryInput = z.infer<typeof UpdateLibraryEntrySchema>;
```

#### **File: `features/game-detail/server-actions/library-actions.ts`**

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { requireServerUserId } from '@/shared/lib/auth';
import { createLogger, LOGGER_CONTEXT } from '@/shared/lib/logger';
import { isSuccessResult } from '@/data-access-layer/services/types';
import { libraryRepository, gameRepository } from '@/data-access-layer/repository';
import {
  AddToLibrarySchema,
  UpdateLibraryStatusSchema,
  UpdateLibraryEntrySchema,
  type AddToLibraryInput,
  type UpdateLibraryStatusInput,
  type UpdateLibraryEntryInput,
} from '../schemas';

const logger = createLogger({ [LOGGER_CONTEXT.SERVER_ACTION]: 'libraryActions' });

export async function addToLibraryAction(input: AddToLibraryInput) {
  const userId = await requireServerUserId();

  const parsed = AddToLibrarySchema.safeParse(input);
  if (!parsed.success) {
    logger.warn({ errors: parsed.error.errors }, 'Invalid input for addToLibrary');
    return { success: false, error: 'Invalid input data' };
  }

  const { gameId, status, platform } = parsed.data;

  // Verify game exists in database
  const gameResult = await gameRepository.findGameById(gameId);
  if (!isSuccessResult(gameResult) || !gameResult.data) {
    logger.error({ gameId }, 'Game not found in database');
    return { success: false, error: 'Game not found' };
  }

  // Create library item
  const result = await libraryRepository.createLibraryItem({
    userId,
    gameId,
    libraryItem: {
      status,
      platform: platform || null,
    },
  });

  if (isSuccessResult(result)) {
    logger.info({ userId, gameId, status }, 'Library item created');
    revalidatePath(`/games/${gameResult.data.slug}`);
    return { success: true, data: result.data };
  }

  logger.error({ error: result.error }, 'Failed to create library item');
  return { success: false, error: result.error.message };
}

export async function updateLibraryStatusAction(input: UpdateLibraryStatusInput) {
  const userId = await requireServerUserId();

  const parsed = UpdateLibraryStatusSchema.safeParse(input);
  if (!parsed.success) {
    logger.warn({ errors: parsed.error.errors }, 'Invalid input for updateLibraryStatus');
    return { success: false, error: 'Invalid input data' };
  }

  const { gameId, status } = parsed.data;

  // Find most recent library item
  const libraryResult = await libraryRepository.findMostRecentLibraryItemByGameId({
    userId,
    gameId,
  });

  if (!isSuccessResult(libraryResult) || !libraryResult.data) {
    // No existing library item, create one
    logger.info({ userId, gameId, status }, 'Creating new library item via quick action');
    return addToLibraryAction({ gameId, status });
  }

  // Update existing item
  const updateResult = await libraryRepository.updateLibraryItem({
    userId,
    libraryItem: {
      id: libraryResult.data.id,
      status,
    },
  });

  if (isSuccessResult(updateResult)) {
    logger.info({ userId, gameId, status }, 'Library status updated');
    const gameResult = await gameRepository.findGameById(gameId);
    if (isSuccessResult(gameResult) && gameResult.data) {
      revalidatePath(`/games/${gameResult.data.slug}`);
    }
    return { success: true, data: updateResult.data };
  }

  logger.error({ error: updateResult.error }, 'Failed to update library status');
  return { success: false, error: updateResult.error.message };
}

export async function updateLibraryEntryAction(input: UpdateLibraryEntryInput) {
  const userId = await requireServerUserId();

  const parsed = UpdateLibraryEntrySchema.safeParse(input);
  if (!parsed.success) {
    logger.warn({ errors: parsed.error.errors }, 'Invalid input for updateLibraryEntry');
    return { success: false, error: 'Invalid input data' };
  }

  const { libraryItemId, status, platform } = parsed.data;

  const result = await libraryRepository.updateLibraryItem({
    userId,
    libraryItem: {
      id: libraryItemId,
      status,
      platform: platform || null,
    },
  });

  if (isSuccessResult(result)) {
    logger.info({ userId, libraryItemId, status }, 'Library entry updated');
    const libraryItem = result.data;
    const gameResult = await gameRepository.findGameById(libraryItem.gameId);
    if (isSuccessResult(gameResult) && gameResult.data) {
      revalidatePath(`/games/${gameResult.data.slug}`);
    }
    return { success: true, data: result.data };
  }

  logger.error({ error: result.error }, 'Failed to update library entry');
  return { success: false, error: result.error.message };
}
```

---

### 2.6. Type Updates

**Update IGDB types in `shared/types/igdb.ts`:**

```typescript
// Add slug to SearchResponse
export type SearchResponse = {
  cover: Cover;
  first_release_date: number;
  id: number;
  name: string;
  slug: string;  // ADD THIS
  platforms: Platform[];
  release_dates?: ReleaseDate[];
  game_type: number;
};

// Add slug to FullGameInfoResponse
export type FullGameInfoResponse = {
  // ... existing fields ...
  slug: string;  // ADD THIS
  franchise?: Franchise;
  franchises: number[];
  // ... rest of fields
};
```

---

## 3. Impact and Risk Analysis

### 3.1. System Dependencies

**Depends On:**
- IGDB API availability and rate limits
- Existing `IgdbService` for API communication
- Existing `library-repository` for user library data
- NextAuth session management (`requireServerUserId`)
- Prisma ORM for database operations

**Affects:**
- Game search feature (search results will link to detail pages)
- Library views (when implemented, will link to detail pages)
- Journal entry creation (will link from detail page)

**Integration Points:**
- `PlatformBadges` component will be moved to `shared/components/` - verify no breaking changes in search feature
- New database tables will increase database size - monitor PostgreSQL performance
- Background job pattern may be reused for other async operations

---

### 3.2. Potential Risks & Mitigations

**Risk 1: IGDB API Rate Limiting**
- **Impact**: Users see error page if rate limit exceeded
- **Mitigation**:
  - Implement exponential backoff in `IgdbService`
  - Cache IGDB responses in database for frequently accessed games
  - Monitor API usage with CloudWatch metrics

**Risk 2: Database Population Failures**
- **Impact**: User sees IGDB data but cannot add game to library
- **Mitigation**:
  - Background job logs errors but doesn't throw
  - Retry failed populations on next page visit
  - Display user-friendly error message with retry button

**Risk 3: Slow Page Load Times**
- **Impact**: Poor user experience on initial page load
- **Mitigation**:
  - Use React Server Components for optimal performance
  - Implement skeleton loading states
  - Parallel data fetching for times to beat and related games
  - Consider adding games to database cache during search phase

**Risk 4: Duplicate Game Records**
- **Impact**: Same game created multiple times due to race conditions
- **Mitigation**:
  - Unique constraint on `Game.igdbId` in Prisma schema
  - Repository layer checks for existence before creation
  - Transaction-based game creation with genres/platforms

**Risk 5: Stale IGDB Data in Cache**
- **Impact**: Users see outdated game information
- **Mitigation**:
  - Store IGDB `checksum` field for cache invalidation
  - Future enhancement: Periodic background job to refresh popular games
  - Always display fresh IGDB data on page load, update cache asynchronously

**Risk 6: Slug Conflicts**
- **Impact**: Multiple games with same IGDB slug (rare but possible)
- **Mitigation**:
  - IGDB guarantees slug uniqueness per their documentation
  - Unique constraint on `Game.slug` in Prisma schema
  - Fallback to IGDB ID-based routing if slug lookup fails

---

## 4. Testing Strategy

### 4.1. Unit Tests

**Repository Layer** (`.unit.test.ts` with mocked Prisma):

```typescript
// genre-repository.unit.test.ts
describe('Genre Repository', () => {
  it('should upsert genre with IGDB data', async () => {
    const mockGenre = { id: 1, name: 'Action', slug: 'action' };
    // Mock Prisma upsert
    const result = await upsertGenre(mockGenre);
    expect(result.ok).toBe(true);
  });

  it('should handle duplicate genre errors', async () => {
    // Mock Prisma error with P2002 code
    const result = await upsertGenre(mockGenre);
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('DUPLICATE');
  });
});

// game-repository.unit.test.ts
describe('Game Repository', () => {
  it('should find game by slug', async () => {
    const result = await findGameBySlug('zelda-breath-of-the-wild');
    expect(result.ok).toBe(true);
    expect(result.data?.slug).toBe('zelda-breath-of-the-wild');
  });

  it('should create game with genres and platforms in transaction', async () => {
    const mockGame = { /* IGDB game data */ };
    const result = await createGameWithRelations({
      igdbGame: mockGame,
      genreIds: ['genre-1', 'genre-2'],
      platformIds: ['platform-1', 'platform-2'],
    });
    expect(result.ok).toBe(true);
    // Verify join tables populated
  });
});

// journal-repository.unit.test.ts
describe('Journal Repository', () => {
  it('should fetch last 3 journal entries ordered by createdAt desc', async () => {
    const result = await findJournalEntriesByGameId({
      gameId: 'game-1',
      userId: 'user-1',
      limit: 3,
    });
    expect(result.ok).toBe(true);
    expect(result.data.length).toBeLessThanOrEqual(3);
  });
});
```

**Service Layer** (`.unit.test.ts` with mocked repositories):

```typescript
// game-detail-service.unit.test.ts
import { createGameWithRelations } from '@/data-access-layer/repository';
import { GameDetailService } from './game-detail-service';

vi.mock('@/data-access-layer/repository', () => ({
  createGameWithRelations: vi.fn(),
  upsertGenres: vi.fn(),
  upsertPlatforms: vi.fn(),
}));

describe('GameDetailService', () => {
  let service: GameDetailService;
  let mockCreateGameWithRelations: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GameDetailService();
    mockCreateGameWithRelations = vi.mocked(createGameWithRelations);
  });

  it('should populate game in database with genres and platforms', async () => {
    const mockIgdbGame = {
      id: 12345,
      name: 'The Legend of Zelda',
      slug: 'the-legend-of-zelda',
      genres: [{ id: 1, name: 'Action', slug: 'action' }],
      platforms: [{ id: 48, name: 'PlayStation 4', slug: 'ps4' }],
    };

    mockCreateGameWithRelations.mockResolvedValue({
      ok: true,
      data: { id: 'game-1', igdbId: 12345, title: 'The Legend of Zelda' },
    });

    await service.populateGameInDatabase(mockIgdbGame);

    expect(mockCreateGameWithRelations).toHaveBeenCalledWith(
      expect.objectContaining({
        igdbId: 12345,
        title: 'The Legend of Zelda',
        slug: 'the-legend-of-zelda',
      })
    );
  });

  it('should not throw errors when database population fails', async () => {
    const mockIgdbGame = { id: 12345, name: 'Test Game', slug: 'test-game' };
    mockCreateGameWithRelations.mockRejectedValue(new Error('Database error'));

    // Should not throw - fire-and-forget pattern
    await expect(
      service.populateGameInDatabase(mockIgdbGame)
    ).resolves.not.toThrow();
  });
});
```

**Component Tests** (`.test.tsx` with jsdom):

```typescript
// game-cover-image.test.tsx
describe('GameCoverImage', () => {
  it('should display placeholder when no cover available', () => {
    render(<GameCoverImage cover={null} title="Test Game" />);
    expect(screen.getByText('No cover available')).toBeInTheDocument();
  });

  it('should render cover image with alt text', () => {
    const cover = { url: 'https://example.com/cover.jpg' };
    render(<GameCoverImage cover={cover} title="Zelda" />);
    expect(screen.getByAltText('Zelda cover')).toBeInTheDocument();
  });
});

// times-to-beat-section.test.tsx
describe('TimesToBeatSection', () => {
  it('should display dashes when no data available', () => {
    render(<TimesToBeatSection timesToBeat={undefined} />);
    expect(screen.getByText('Main Story: —')).toBeInTheDocument();
    expect(screen.getByText('100% Completion: —')).toBeInTheDocument();
  });

  it('should display time values in hours', () => {
    render(<TimesToBeatSection timesToBeat={{ mainStory: 30, completionist: 80 }} />);
    expect(screen.getByText('Main Story: 30 hours')).toBeInTheDocument();
  });
});

// related-games-section.test.tsx
describe('RelatedGamesSection', () => {
  it('should display first 5 games initially', () => {
    const games = Array(10).fill(null).map((_, i) => ({ id: i, name: `Game ${i}` }));
    render(<RelatedGamesSection games={games} />);
    expect(screen.getAllByRole('link')).toHaveLength(5);
  });

  it('should expand to show all games on "View More" click', async () => {
    const games = Array(10).fill(null).map((_, i) => ({ id: i, name: `Game ${i}` }));
    render(<RelatedGamesSection games={games} />);

    await userEvent.click(screen.getByText('View More'));
    expect(screen.getAllByRole('link')).toHaveLength(10);
    expect(screen.getByText('Show Less')).toBeInTheDocument();
  });
});
```

---

### 4.2. Integration Tests

**Repository Integration** (`.integration.test.ts` with real PostgreSQL):

```typescript
// game-repository.integration.test.ts
describe('Game Repository Integration', () => {
  beforeAll(async () => {
    // Create test database
    await createTestDatabase();
    await runMigrations();
  });

  afterAll(async () => {
    await dropTestDatabase();
  });

  it('should create game with genres and platforms in transaction', async () => {
    // 1. Create genres
    const genreResults = await Promise.all([
      genreRepository.upsertGenre({ id: 1, name: 'Action', slug: 'action' }),
      genreRepository.upsertGenre({ id: 2, name: 'RPG', slug: 'rpg' }),
    ]);

    const genreIds = genreResults.map(r => r.data.id);

    // 2. Create platforms
    const platformResults = await Promise.all([
      platformRepository.upsertPlatform({ id: 6, name: 'PC', slug: 'pc' }),
      platformRepository.upsertPlatform({ id: 48, name: 'PS4', slug: 'ps4' }),
    ]);

    const platformIds = platformResults.map(r => r.data.id);

    // 3. Create game with relations
    const gameResult = await gameRepository.createGameWithRelations({
      igdbGame: mockIgdbGame,
      genreIds,
      platformIds,
    });

    expect(gameResult.ok).toBe(true);

    // 4. Verify relations loaded correctly
    const fetchedGame = await gameRepository.findGameById(gameResult.data.id);
    expect(fetchedGame.data.genres).toHaveLength(2);
    expect(fetchedGame.data.platforms).toHaveLength(2);
  });

  it('should handle duplicate game creation gracefully', async () => {
    const game1 = await gameRepository.createGameWithRelations({ /* data */ });
    const game2 = await gameRepository.createGameWithRelations({ /* same igdbId */ });

    expect(game1.ok).toBe(true);
    expect(game2.ok).toBe(false);
    expect(game2.error.code).toBe('DUPLICATE');
  });
});
```

**Server Actions Integration** (`.integration.test.ts`):

```typescript
// library-actions.integration.test.ts
describe('Library Actions Integration', () => {
  it('should create library item and revalidate path', async () => {
    const game = await createTestGame();

    const result = await addToLibraryAction({
      gameId: game.id,
      status: LibraryItemStatus.CURIOUS_ABOUT,
    });

    expect(result.success).toBe(true);
    expect(result.data.status).toBe(LibraryItemStatus.CURIOUS_ABOUT);

    // Verify created in database
    const libraryItem = await prisma.libraryItem.findFirst({
      where: { gameId: game.id },
    });
    expect(libraryItem).not.toBeNull();
  });

  it('should update existing library item via quick action', async () => {
    const game = await createTestGame();
    await createTestLibraryItem({ gameId: game.id, status: 'WISHLIST' });

    const result = await updateLibraryStatusAction({
      gameId: game.id,
      status: LibraryItemStatus.CURRENTLY_EXPLORING,
    });

    expect(result.success).toBe(true);
    expect(result.data.status).toBe(LibraryItemStatus.CURRENTLY_EXPLORING);
  });
});
```

---

### 4.3. E2E Tests (Future - Playwright)

```typescript
// game-detail.e2e.test.ts
describe('Game Detail Page E2E', () => {
  it('should display game details from IGDB', async ({ page }) => {
    await page.goto('/games/zelda-breath-of-the-wild');

    await expect(page.locator('h1')).toContainText('The Legend of Zelda: Breath of the Wild');
    await expect(page.locator('[data-testid="cover-image"]')).toBeVisible();
    await expect(page.locator('[data-testid="platform-badges"]')).toBeVisible();
  });

  it('should add game to library via modal', async ({ page }) => {
    await page.goto('/games/zelda-breath-of-the-wild');

    await page.click('[data-testid="add-to-library-button"]');
    await page.selectOption('[data-testid="status-select"]', 'CURIOUS_ABOUT');
    await page.click('[data-testid="submit-button"]');

    await expect(page.locator('[data-testid="library-status"]')).toContainText('Curious About');
  });

  it('should update status with quick action button', async ({ page }) => {
    await page.goto('/games/zelda-breath-of-the-wild');

    // Add to library first
    await page.click('[data-testid="add-to-library-button"]');
    await page.selectOption('[data-testid="status-select"]', 'WISHLIST');
    await page.click('[data-testid="submit-button"]');

    // Update via quick action
    await page.click('[data-testid="quick-action-currently-exploring"]');

    await expect(page.locator('[data-testid="library-status"]')).toContainText('Currently Exploring');
  });
});
```

---

### 4.4. Test Coverage Requirements

- **Repository Layer**: 90%+ coverage (critical data access logic)
- **Service Layer**: 85%+ coverage (business logic and error handling)
- **Server Actions**: 80%+ coverage (validation and authorization)
- **UI Components**: 70%+ coverage (focus on interaction logic)

---

## 5. Implementation Checklist

### Phase 1: Database & Repository Layer
- [ ] Create Prisma migration for new tables (Genre, Platform, GameGenre, GamePlatform)
- [ ] Add `slug` and `franchiseId` to Game model
- [ ] Implement `genre-repository.ts` with upsert logic
- [ ] Implement `platform-repository.ts` with upsert logic
- [ ] Implement `game-repository.ts` with slug/ID lookups
- [ ] Implement `journal-repository.ts` with game-based queries
- [ ] Add new functions to `library-repository.ts`
- [ ] Write integration tests for repository layer

### Phase 2: Service Layer
- [ ] Implement `GameDetailService` with background population
- [ ] Add slug-based query to `IgdbService`
- [ ] Add `getTimesToBeat()` to `IgdbService`
- [ ] Add `getFranchiseGames()` to `IgdbService`
- [ ] Update IGDB types to include `slug` field
- [ ] Write unit tests for service layer

### Phase 3: UI Components
- [ ] Move `PlatformBadges` to `shared/components/`
- [ ] Create `GameDetailLayout` component
- [ ] Create `GameDetailSidebar` component
- [ ] Create `GameDetailContent` component
- [ ] Create `GameCoverImage` with placeholder
- [ ] Create `GenreBadges` component
- [ ] Create `QuickActionButtons` component
- [ ] Create `LibraryStatusDisplay` component
- [ ] Create `LibraryModal` (unified add/manage)
- [ ] Create `TimesToBeatSection` component
- [ ] Create `JournalEntriesSection` component
- [ ] Create `RelatedGamesSection` with expand/collapse
- [ ] Create `GameDetailSkeleton` loading state
- [ ] Write component tests

### Phase 4: Server Actions & Page
- [ ] Create Zod schemas in `schemas.ts`
- [ ] Implement `addToLibraryAction`
- [ ] Implement `updateLibraryStatusAction`
- [ ] Implement `updateLibraryEntryAction`
- [ ] Create `app/games/[slug]/page.tsx`
- [ ] Add error boundary and not-found page
- [ ] Write integration tests for server actions

### Phase 5: Testing & Polish
- [ ] Test background population job
- [ ] Test error states (IGDB API failures, invalid slugs)
- [ ] Test loading states and skeleton UI
- [ ] Verify mobile responsive layout
- [ ] Performance testing (page load times)
- [ ] Accessibility audit (keyboard navigation, screen readers)

---

**End of Technical Specification**
