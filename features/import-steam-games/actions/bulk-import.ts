'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/prisma/client';
import { nextSafeActionClient } from '@/shared/lib/next-safe-action-client';
import { getOwnedGames } from '@/shared/external-apis/steam';
import { IGDBClient } from '@/shared/external-apis/igdb/client';
import {
  normalizeGameName,
  getBaseGameName,
} from '@/shared/external-apis/steam/utils';
// import {
//   normalizeString,
//   normalizeTitle,
// } from '@/shared/external-apis/igdb/utils';
import { logger } from '@/shared/lib/logger';

// Schema for validating the bulk import input
const bulkImportSchema = z.object({
  steamId: z.string().min(1, 'Steam ID is required'),
  newOnly: z.boolean().optional(),
});

// Create a singleton instance of the IGDB client
const igdbClient = new IGDBClient();

/**
 * Start a bulk import job for Steam games
 * This creates a job record and returns the job ID
 */
export const startBulkImport = nextSafeActionClient
  .schema(bulkImportSchema)
  .action(async ({ parsedInput }) => {
    const { steamId, newOnly = false } = parsedInput;
    const context = 'startBulkImport';

    try {
      logger.info(
        `Starting bulk import for Steam ID: ${steamId}${newOnly ? ' (new games only)' : ''}`,
        { context },
      );

      // Get the current user
      const session = await auth();
      if (!session?.user?.id) {
        logger.warn('Authentication required for bulk import', { context });
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const userId = session.user.id;
      logger.debug(`User authenticated: ${userId}`, { context });

      // Create a new import job
      const importJob = await prisma.steamImportJob.create({
        data: {
          userId,
          steamId,
          status: 'PENDING',
          importNewOnly: newOnly,
        },
      });

      logger.info(
        `Created import job: ${importJob.id}${newOnly ? ' (new games only)' : ''}`,
        {
          context,
          data: { jobId: importJob.id, steamId, newOnly },
        },
      );

      // Start the import process in the background
      // We don't await this to avoid blocking the UI
      processBulkImport(importJob.id).catch((error) => {
        logger.error(
          `Error processing bulk import job ${importJob.id}`,
          error,
          { context, data: { jobId: importJob.id } },
        );
      });

      return {
        success: true,
        jobId: importJob.id,
      };
    } catch (error) {
      logger.error('Error starting bulk import', error, {
        context,
        data: { steamId, newOnly },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

/**
 * Get the status of a bulk import job
 */
export const getBulkImportStatus = nextSafeActionClient
  .schema(z.object({ jobId: z.string() }))
  .action(async ({ parsedInput }) => {
    const { jobId } = parsedInput;
    const context = 'getBulkImportStatus';

    try {
      logger.debug(`Getting status for job: ${jobId}`, { context });

      // Get the current user
      const session = await auth();
      if (!session?.user?.id) {
        logger.warn('Authentication required for getting job status', {
          context,
        });
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const userId = session.user.id;

      // Get the import job
      const importJob = await prisma.steamImportJob.findFirst({
        where: {
          id: jobId,
          userId,
        },
      });

      if (!importJob) {
        logger.warn(`Import job not found: ${jobId}`, {
          context,
          data: { userId, jobId },
        });

        return {
          success: false,
          error: 'Import job not found',
        };
      }

      logger.debug(`Found import job: ${jobId}, status: ${importJob.status}`, {
        context,
        data: {
          jobId,
          status: importJob.status,
          progress:
            importJob.processedGames && importJob.totalGames
              ? `${importJob.processedGames}/${importJob.totalGames}`
              : 'unknown',
        },
      });

      return {
        success: true,
        job: importJob,
      };
    } catch (error) {
      logger.error('Error getting bulk import status', error, {
        context,
        data: { jobId },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

/**
 * Process a bulk import job
 * This function runs in the background and updates the job status
 */
async function processBulkImport(jobId: string): Promise<void> {
  const context = 'processBulkImport';

  try {
    logger.info(`Processing bulk import job: ${jobId}`, { context });

    // Get the import job
    const importJob = await prisma.steamImportJob.findUnique({
      where: { id: jobId },
      include: { user: true },
    });

    if (!importJob) {
      logger.error(`Import job ${jobId} not found`, null, { context });
      throw new Error(`Import job ${jobId} not found`);
    }

    // Update job status to PROCESSING
    await prisma.steamImportJob.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    logger.info(`Updated job status to PROCESSING: ${jobId}`, { context });

    // Fetch all games from Steam
    logger.info(`Fetching games from Steam for ID: ${importJob.steamId}`, {
      context,
    });
    const steamGames = await getOwnedGames(importJob.steamId);
    logger.info(`Fetched ${steamGames.length} games from Steam`, {
      context,
      data: { count: steamGames.length },
    });

    // If importing only new games, filter out games that are already in the user's backlog
    let gamesToProcess = steamGames;
    if (importJob.importNewOnly) {
      logger.info('Filtering out already imported games', { context });

      // Get all Steam app IDs that are already in the user's backlog
      const existingGames = await prisma.game.findMany({
        where: {
          steamAppId: { not: null },
          backlogItems: {
            some: {
              userId: importJob.userId,
            },
          },
        },
        select: {
          steamAppId: true,
        },
      });

      const existingSteamAppIds = new Set(
        existingGames.map((g) => g.steamAppId),
      );

      // Filter out games that are already in the backlog
      gamesToProcess = steamGames.filter(
        (game) => !existingSteamAppIds.has(game.appid),
      );

      logger.info(`Filtered to ${gamesToProcess.length} new games to import`, {
        context,
        data: {
          totalGames: steamGames.length,
          newGames: gamesToProcess.length,
          alreadyImported: steamGames.length - gamesToProcess.length,
        },
      });
    }

    // Update job with total games count
    await prisma.steamImportJob.update({
      where: { id: jobId },
      data: {
        totalGames: gamesToProcess.length,
      },
    });

    let importedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Process games in batches to respect API rate limits
    const BATCH_SIZE = 10;
    for (let i = 0; i < gamesToProcess.length; i += BATCH_SIZE) {
      const batch = gamesToProcess.slice(i, i + BATCH_SIZE);
      logger.debug(
        `Processing batch ${i / BATCH_SIZE + 1} (${batch.length} games)`,
        { context },
      );

      // Process each game in the batch concurrently
      const results = await Promise.allSettled(
        batch.map((game) => processGame(game, importJob.userId, jobId)),
      );

      // Count results
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.action === 'imported') importedCount++;
          else if (result.value.action === 'skipped') skippedCount++;
        } else {
          failedCount++;
        }
      });

      // Update job progress
      await prisma.steamImportJob.update({
        where: { id: jobId },
        data: {
          processedGames: i + batch.length,
          importedGames: importedCount,
          skippedGames: skippedCount,
          failedGames: failedCount,
        },
      });

      logger.debug(
        `Batch processed. Progress: ${i + batch.length}/${gamesToProcess.length}`,
        {
          context,
          data: {
            imported: importedCount,
            skipped: skippedCount,
            failed: failedCount,
          },
        },
      );

      // Add a small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < gamesToProcess.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Update job status to COMPLETED
    await prisma.steamImportJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        importedGames: importedCount,
        skippedGames: skippedCount,
        failedGames: failedCount,
      },
    });

    logger.info(`Import job completed: ${jobId}`, {
      context,
      data: {
        imported: importedCount,
        skipped: skippedCount,
        failed: failedCount,
        totalProcessed: importedCount + skippedCount + failedCount,
      },
    });
  } catch (error) {
    logger.error(`Error processing bulk import job ${jobId}`, error, {
      context,
    });

    // Update job status to FAILED
    await prisma.steamImportJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });
  }
}

/**
 * Process a single game for import
 * Returns the result of the import operation
 */
async function processGame(
  game: { appid: number; name: string; playtime_forever: number },
  userId: string,
  jobId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ action: 'imported' | 'skipped'; game: any }> {
  const context = 'processGame';

  try {
    logger.debug(`Processing game: ${game.name} (${game.appid})`, {
      context,
      data: {
        appId: game.appid,
        playtime: game.playtime_forever,
      },
    });

    // Check if the item is software (not a game)
    const softwareKeywords = [
      'Source Filmmaker',
      'SDK',
      'Editor',
      'Creator',
      'Toolkit',
      'Tool',
      'Software',
      'Engine',
      'Maker',
      'Modding',
      'Development Kit',
    ];

    const isSoftware = softwareKeywords.some((keyword) =>
      game.name.toLowerCase().includes(keyword.toLowerCase()),
    );

    if (isSoftware) {
      logger.debug(`Skipping software: ${game.name} (${game.appid})`, {
        context,
      });

      // Record skipped software
      await prisma.failedImport.create({
        data: {
          userId,
          steamImportJobId: jobId,
          steamAppId: game.appid,
          gameName: game.name,
          reason: 'Software item skipped (not a game)',
          playtime: game.playtime_forever,
        },
      });

      return {
        action: 'skipped',
        game: { name: game.name, appid: game.appid },
      };
    }

    // Check if the item is a demo
    const isDemoOrBeta =
      game.name.toLowerCase().includes('demo') ||
      game.name.toLowerCase().includes('beta') ||
      game.name.toLowerCase().includes('trial') ||
      game.name.toLowerCase().includes('playtest');

    if (isDemoOrBeta) {
      logger.debug(`Skipping demo/beta: ${game.name} (${game.appid})`, {
        context,
      });

      // Record skipped demo
      await prisma.failedImport.create({
        data: {
          userId,
          steamImportJobId: jobId,
          steamAppId: game.appid,
          gameName: game.name,
          reason: 'Demo/Beta skipped',
          playtime: game.playtime_forever,
        },
      });

      return {
        action: 'skipped',
        game: { name: game.name, appid: game.appid },
      };
    }

    // Determine the status based on playtime
    const status =
      game.playtime_forever && game.playtime_forever > 0 ? 'PLAYED' : 'TO_PLAY';

    logger.debug(`Game status determined: ${status}`, {
      context,
      data: {
        appId: game.appid,
        playtime: game.playtime_forever,
        status,
      },
    });

    // Check if game is already in the user's backlog by Steam app ID
    const existingByAppId = await prisma.game.findFirst({
      where: {
        steamAppId: game.appid,
        backlogItems: {
          some: {
            userId,
          },
        },
      },
      include: {
        backlogItems: {
          where: {
            userId,
          },
        },
      },
    });

    if (existingByAppId) {
      logger.debug(`Game already in backlog: ${game.name} (${game.appid})`, {
        context,
      });
      return { action: 'skipped', game: existingByAppId };
    }

    // Check if game is in the ignored list
    const isIgnored = await prisma.ignoredImportedGames.findFirst({
      where: {
        userId,
        id: String(game.appid),
      },
    });

    if (isIgnored) {
      logger.debug(`Game is in ignored list: ${game.name} (${game.appid})`, {
        context,
      });
      return {
        action: 'skipped',
        game: { name: game.name, appid: game.appid },
      };
    }

    // Check if game exists in database by title similarity
    const allGames = await prisma.game.findMany({
      where: {
        deleted: false,
      },
      select: {
        id: true,
        title: true,
        steamAppId: true,
      },
    });

    // Enhanced normalization for better matching
    const normalizedGameName = normalizeGameName(game.name)
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    const baseGameName = getBaseGameName(game.name)
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Common words to remove for better matching (articles, etc.)
    const wordsToRemove = [
      'the',
      'a',
      'an',
      'of',
      'and',
      'for',
      'in',
      'on',
      'at',
    ];
    const cleanedGameName = normalizedGameName
      .split(' ')
      .filter((word) => !wordsToRemove.includes(word))
      .join(' ');

    const cleanedBaseName = baseGameName
      .split(' ')
      .filter((word) => !wordsToRemove.includes(word))
      .join(' ');

    // Find a game with similar title
    const similarGame = allGames.find((dbGame) => {
      const normalizedDbTitle = normalizeGameName(dbGame.title)
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const baseDbTitle = getBaseGameName(dbGame.title)
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const cleanedDbTitle = normalizedDbTitle
        .split(' ')
        .filter((word) => !wordsToRemove.includes(word))
        .join(' ');

      const cleanedBaseDbTitle = baseDbTitle
        .split(' ')
        .filter((word) => !wordsToRemove.includes(word))
        .join(' ');

      // Check for exact matches first
      if (
        normalizedDbTitle === normalizedGameName ||
        baseDbTitle === baseGameName
      ) {
        return true;
      }

      // Check for cleaned matches (without common words)
      if (
        cleanedDbTitle === cleanedGameName ||
        cleanedBaseDbTitle === cleanedBaseName
      ) {
        return true;
      }

      // Check for substring matches
      if (
        normalizedDbTitle.includes(normalizedGameName) ||
        normalizedGameName.includes(normalizedDbTitle)
      ) {
        return true;
      }

      // Check for word-by-word similarity
      const dbTitleWords = cleanedDbTitle.split(' ');
      const gameNameWords = cleanedGameName.split(' ');

      // If the game name has at least 2 words and more than 70% of words match
      if (gameNameWords.length >= 2) {
        const matchingWords = gameNameWords.filter((word) =>
          dbTitleWords.some(
            (dbWord) =>
              dbWord === word || dbWord.includes(word) || word.includes(dbWord),
          ),
        );

        if (matchingWords.length / gameNameWords.length > 0.7) {
          return true;
        }
      }

      return false;
    });

    if (similarGame) {
      logger.debug(`Found similar game in database: ${similarGame.title}`, {
        context,
        data: {
          originalName: game.name,
          similarGameId: similarGame.id,
          similarGameTitle: similarGame.title,
        },
      });

      // Check if user already has this game in backlog
      const existingBacklogItem = await prisma.backlogItem.findFirst({
        where: {
          userId,
          gameId: similarGame.id,
        },
      });

      if (existingBacklogItem) {
        logger.debug(`Similar game already in backlog: ${similarGame.title}`, {
          context,
        });
        return { action: 'skipped', game: similarGame };
      }

      // Add to backlog
      const backlogItem = await prisma.backlogItem.create({
        data: {
          userId,
          gameId: similarGame.id,
          status,
          platform: 'pc',
        },
        include: {
          game: true,
        },
      });

      logger.info(
        `Added similar game to backlog: ${similarGame.title} with status ${status}`,
        {
          context,
          data: {
            gameId: similarGame.id,
            backlogItemId: backlogItem.id,
            status,
          },
        },
      );

      // Update the game with Steam app ID if it doesn't have one
      if (!similarGame.steamAppId) {
        await prisma.game.update({
          where: { id: similarGame.id },
          data: {
            steamAppId: game.appid,
          },
        });

        logger.debug(`Updated similar game with Steam app ID: ${game.appid}`, {
          context,
        });
      }

      return { action: 'imported', game: backlogItem.game };
    }

    // Game not found in database, search in IGDB
    logger.debug(`Searching for game in IGDB: ${game.name}`, { context });

    // Try with different name variations for better IGDB matching
    const searchVariations = [
      game.name, // Original name
      normalizedGameName, // Normalized name
      baseGameName, // Base name (without edition info)
      cleanedGameName, // Cleaned name (without common words)
      cleanedBaseName, // Cleaned base name
    ];

    // Remove duplicates
    const uniqueSearchTerms = [...new Set(searchVariations)];

    // Try each variation until we find a match
    let igdbGame = null;
    for (const searchTerm of uniqueSearchTerms) {
      if (!searchTerm || searchTerm.length < 3) continue; // Skip too short terms

      logger.debug(`Trying IGDB search with term: ${searchTerm}`, { context });
      igdbGame = await igdbClient.getGameForSteamImport(searchTerm);

      if (igdbGame) {
        logger.debug(`Found match in IGDB with term: ${searchTerm}`, {
          context,
        });
        break;
      }
    }

    if (!igdbGame) {
      logger.warn(`Game not found in IGDB: ${game.name}`, {
        context,
        data: { appId: game.appid },
      });

      // Record failed import
      await prisma.failedImport.create({
        data: {
          userId,
          steamImportJobId: jobId,
          steamAppId: game.appid,
          gameName: game.name,
          reason: 'Game not found in IGDB',
          playtime: game.playtime_forever,
        },
      });

      throw new Error(`Game not found in IGDB: ${game.name}`);
    }

    logger.debug(`Found game in IGDB: ${igdbGame.name} (ID: ${igdbGame.id})`, {
      context,
    });

    // Create new game in database
    const newGame = await prisma.game.create({
      data: {
        title: igdbGame.name,
        description: igdbGame.summary,
        coverImage: igdbGame.cover?.image_id,
        releaseDate: igdbGame.first_release_date
          ? new Date(igdbGame.first_release_date * 1000)
          : null,
        igdbId: igdbGame.id,
        steamAppId: game.appid,
        // Add genres if available
        genres: igdbGame.genres
          ? {
              create: igdbGame.genres.map((genre) => ({
                genre: {
                  connectOrCreate: {
                    where: { id: genre.id },
                    create: { id: genre.id, name: genre.name },
                  },
                },
              })),
            }
          : undefined,
      },
    });

    logger.info(`Created new game in database: ${newGame.title}`, {
      context,
      data: {
        gameId: newGame.id,
        igdbId: igdbGame.id,
        steamAppId: game.appid,
      },
    });

    // Add to user's backlog
    const backlogItem = await prisma.backlogItem.create({
      data: {
        userId,
        gameId: newGame.id,
        status,
      },
      include: {
        game: true,
      },
    });

    logger.info(
      `Added new game to backlog: ${newGame.title} with status ${status}`,
      {
        context,
        data: {
          gameId: newGame.id,
          backlogItemId: backlogItem.id,
          status,
        },
      },
    );

    return { action: 'imported', game: backlogItem.game };
  } catch (error) {
    logger.error(`Error processing game: ${game.name} (${game.appid})`, error, {
      context,
      data: {
        appId: game.appid,
        name: game.name,
      },
    });

    // Record failed import
    await prisma.failedImport.create({
      data: {
        userId,
        steamImportJobId: jobId,
        steamAppId: game.appid,
        gameName: game.name,
        reason: 'Error processing game',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        playtime: game.playtime_forever,
      },
    });

    throw error;
  }
}

/**
 * Get all import jobs for the current user
 */
export const getImportJobs = nextSafeActionClient.action(async () => {
  const context = 'getImportJobs';

  try {
    logger.debug('Getting import jobs for user', { context });

    // Get the current user
    const session = await auth();
    if (!session?.user?.id) {
      logger.warn('Authentication required for getting import jobs', {
        context,
      });
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    const userId = session.user.id;

    // Get all import jobs for the user
    const importJobs = await prisma.steamImportJob.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.debug(`Found ${importJobs.length} import jobs for user`, {
      context,
      data: { count: importJobs.length },
    });

    return {
      success: true,
      jobs: importJobs,
    };
  } catch (error) {
    logger.error('Error getting import jobs', error, { context });

    return {
      success: false,
      jobs: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

/**
 * Get failed imports for a specific job
 */
export const getFailedImports = nextSafeActionClient
  .schema(z.object({ jobId: z.string() }))
  .action(async ({ parsedInput }) => {
    const { jobId } = parsedInput;
    const context = 'getFailedImports';

    try {
      logger.debug(`Getting failed imports for job: ${jobId}`, { context });

      // Get the current user
      const session = await auth();
      if (!session?.user?.id) {
        logger.warn('Authentication required for getting failed imports', {
          context,
        });
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const userId = session.user.id;

      // Get failed imports for the job
      const failedImports = await prisma.failedImport.findMany({
        where: {
          userId,
          steamImportJobId: jobId,
        },
        orderBy: {
          attemptedAt: 'desc',
        },
      });

      logger.debug(
        `Found ${failedImports.length} failed imports for job: ${jobId}`,
        {
          context,
          data: { count: failedImports.length },
        },
      );

      return {
        success: true,
        failedImports,
      };
    } catch (error) {
      logger.error('Error getting failed imports', error, {
        context,
        data: { jobId },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
