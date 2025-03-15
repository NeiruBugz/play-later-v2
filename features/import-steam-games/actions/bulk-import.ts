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

// Constants for IGDB API rate limiting
const IGDB_REQUEST_DELAY = 500; // ms between IGDB requests
const IGDB_RATE_LIMIT_RETRY_DELAY = 2000; // ms to wait after a rate limit error
const IGDB_MAX_RETRIES = 3; // Maximum number of retries for rate-limited requests
const BATCH_PROCESSING_DELAY = 3000; // ms between processing batches

// Schema for validating the bulk import input
const bulkImportSchema = z.object({
  steamId: z.string().min(1, 'Steam ID is required'),
  newOnly: z.boolean().optional(),
});

// Schema for validating the single game import input
const singleGameImportSchema = z.object({
  steamId: z.string().min(1, 'Steam ID is required'),
  appid: z.number().int().positive('App ID is required'),
});

// Create a singleton instance of the IGDB client
const igdbClient = new IGDBClient();

/**
 * Helper function to make IGDB requests with rate limit handling
 */
async function makeIGDBRequest<T>(
  requestFn: () => Promise<T>,
  context: string,
  retryCount = 0,
): Promise<T | null> {
  try {
    // Add a delay before making the request to avoid overwhelming the API
    await new Promise((resolve) => setTimeout(resolve, IGDB_REQUEST_DELAY));

    return await requestFn();
  } catch (error) {
    // Check if this is a rate limit error
    const isRateLimit =
      error instanceof Error &&
      (error.message.includes('429') ||
        error.message.includes('rate limit') ||
        error.message.toLowerCase().includes('too many requests'));

    if (isRateLimit && retryCount < IGDB_MAX_RETRIES) {
      // Log the rate limit error
      logger.warn(
        `IGDB rate limit hit, retrying in ${IGDB_RATE_LIMIT_RETRY_DELAY}ms (attempt ${retryCount + 1}/${IGDB_MAX_RETRIES})`,
        {
          context,
        },
      );

      // Wait longer before retrying
      await new Promise((resolve) =>
        setTimeout(resolve, IGDB_RATE_LIMIT_RETRY_DELAY),
      );

      // Retry the request with an increased retry count
      return makeIGDBRequest(requestFn, context, retryCount + 1);
    }

    // If it's not a rate limit error or we've exceeded retries, log and return null
    logger.error(
      `Error making IGDB request: ${error instanceof Error ? error.message : String(error)}`,
      {
        context,
      },
    );

    return null;
  }
}

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

          // Check if any failures were due to rate limiting
          const isRateLimit =
            result.reason instanceof Error &&
            (result.reason.message.includes('429') ||
              result.reason.message.includes('rate limit') ||
              result.reason.message
                .toLowerCase()
                .includes('too many requests'));

          if (isRateLimit) {
            logger.warn(
              `Rate limit detected in batch, adding extra delay before next batch`,
              { context },
            );
            // We'll add an extra delay below
          }
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

      // Add a delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < gamesToProcess.length) {
        logger.debug(
          `Waiting ${BATCH_PROCESSING_DELAY}ms before processing next batch`,
          { context },
        );
        await new Promise((resolve) =>
          setTimeout(resolve, BATCH_PROCESSING_DELAY),
        );
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

      // Record skipped game
      await prisma.failedImport.create({
        data: {
          userId,
          steamImportJobId: jobId,
          steamAppId: game.appid,
          gameName: game.name,
          reason: 'Game already in backlog',
          playtime: game.playtime_forever,
        },
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

      // Record skipped game
      await prisma.failedImport.create({
        data: {
          userId,
          steamImportJobId: jobId,
          steamAppId: game.appid,
          gameName: game.name,
          reason: 'Game is in ignored list',
          playtime: game.playtime_forever,
        },
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

    // Detect special game types
    const isRemakeOrRemaster =
      /remake|remaster|rebirth|reunion|intergrade|definitive|enhanced|remastered|directors cut/i.test(
        game.name,
      );
    const isSequelOrPrequel =
      /\b(II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)\b|\b\d+\b/i.test(
        game.name,
      );

    // Find a game with similar title using improved matching algorithm
    const similarGame = allGames.find((dbGame) => {
      // Skip if the Steam App IDs are different but both exist
      if (dbGame.steamAppId && game.appid && dbGame.steamAppId !== game.appid) {
        return false;
      }

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

      // Check if the DB game is also a remake/remaster
      const isDbGameRemakeOrRemaster =
        /remake|remaster|rebirth|reunion|intergrade|definitive|enhanced|remastered|directors cut/i.test(
          dbGame.title,
        );

      // Check if the DB game is also a sequel/prequel
      const isDbGameSequelOrPrequel =
        /\b(II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)\b|\b\d+\b/i.test(
          dbGame.title,
        );

      // For remakes/remasters, we need exact matches
      if (isRemakeOrRemaster || isDbGameRemakeOrRemaster) {
        // If one is a remake and the other isn't, they're different games
        if (isRemakeOrRemaster !== isDbGameRemakeOrRemaster) {
          return false;
        }

        // For remakes, require exact match
        return normalizedDbTitle === normalizedGameName;
      }

      // For sequels/prequels, we need to be careful with matching
      if (isSequelOrPrequel || isDbGameSequelOrPrequel) {
        // If one is a sequel and the other isn't, they're different games
        if (isSequelOrPrequel !== isDbGameSequelOrPrequel) {
          return false;
        }

        // For sequels, require exact match or very close match
        if (normalizedDbTitle === normalizedGameName) {
          return true;
        }

        // Extract numbers/roman numerals to check if they're the same sequel number
        const extractSequelNumber = (title: string) => {
          const romanMatch = title.match(
            /\b(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)\b/i,
          );
          if (romanMatch) return romanMatch[0];

          const numberMatch = title.match(/\b\d+\b/);
          if (numberMatch) return numberMatch[0];

          return null;
        };

        const gameSequelNum = extractSequelNumber(game.name);
        const dbGameSequelNum = extractSequelNumber(dbGame.title);

        // If they have different sequel numbers, they're different games
        if (
          gameSequelNum &&
          dbGameSequelNum &&
          gameSequelNum !== dbGameSequelNum
        ) {
          return false;
        }
      }

      // Check for exact matches
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

      // For non-remake/non-sequel games, we can be a bit more lenient
      // Check for substring matches, but only if the titles are substantial
      if (normalizedGameName.length > 5 && normalizedDbTitle.length > 5) {
        // Only consider substring matches if one title fully contains the other
        // and they share at least 80% of characters
        if (
          normalizedDbTitle.includes(normalizedGameName) ||
          normalizedGameName.includes(normalizedDbTitle)
        ) {
          const longerTitle =
            normalizedDbTitle.length > normalizedGameName.length
              ? normalizedDbTitle
              : normalizedGameName;
          const shorterTitle =
            normalizedDbTitle.length > normalizedGameName.length
              ? normalizedGameName
              : normalizedDbTitle;

          // If the shorter title is at least 80% of the longer title's length, consider it a match
          if (shorterTitle.length / longerTitle.length > 0.8) {
            return true;
          }
        }
      }

      // Check for word-by-word similarity for non-remake/non-sequel games
      if (
        !isRemakeOrRemaster &&
        !isSequelOrPrequel &&
        !isDbGameRemakeOrRemaster &&
        !isDbGameSequelOrPrequel
      ) {
        const dbTitleWords = cleanedDbTitle.split(' ');
        const gameNameWords = cleanedGameName.split(' ');

        // If the game name has at least 2 words and more than 80% of words match
        if (gameNameWords.length >= 2 && dbTitleWords.length >= 2) {
          const matchingWords = gameNameWords.filter((word) =>
            dbTitleWords.some(
              (dbWord) =>
                dbWord === word ||
                dbWord.includes(word) ||
                word.includes(dbWord),
            ),
          );

          if (
            matchingWords.length / gameNameWords.length > 0.8 &&
            matchingWords.length / dbTitleWords.length > 0.8
          ) {
            return true;
          }
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

        // Record skipped game
        await prisma.failedImport.create({
          data: {
            userId,
            steamImportJobId: jobId,
            steamAppId: game.appid,
            gameName: game.name,
            reason: `Similar game "${similarGame.title}" already in backlog`,
            playtime: game.playtime_forever,
          },
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

      // Use the rate limit helper function
      igdbGame = await makeIGDBRequest(
        () => igdbClient.getGameForSteamImport(searchTerm),
        context,
      );

      if (igdbGame) {
        logger.debug(`Found match in IGDB with term: ${searchTerm}`, {
          context,
        });
        break;
      }
    }

    // If standard search failed, try the alternative search approach
    if (!igdbGame) {
      logger.debug(
        `Standard IGDB search failed, trying alternative search approach`,
        { context },
      );

      // Try each variation with a different search approach
      for (const searchTerm of uniqueSearchTerms) {
        if (!searchTerm || searchTerm.length < 3) continue; // Skip too short terms

        try {
          // Try a different search approach - use the base name without any modifiers
          const baseSearchTerm = searchTerm
            .replace(
              /remake|remaster|rebirth|reunion|intergrade|definitive|enhanced|remastered|directors cut/gi,
              '',
            )
            .trim();

          if (baseSearchTerm.length < 3) continue; // Skip if too short after removing modifiers

          logger.debug(
            `Trying alternative IGDB search with base term: ${baseSearchTerm}`,
            { context },
          );

          // Use the rate limit helper function
          const alternativeResults = await makeIGDBRequest(
            () => igdbClient.getGameForSteamImport(baseSearchTerm),
            context,
          );

          if (alternativeResults) {
            logger.debug(
              `Found alternative match in IGDB: ${alternativeResults.name}`,
              {
                context,
                data: {
                  originalName: game.name,
                  matchedName: alternativeResults.name,
                  searchTerm: baseSearchTerm,
                },
              },
            );
            igdbGame = alternativeResults;
            break;
          }
        } catch (error) {
          // Check if this is a rate limit error
          const isRateLimit =
            error instanceof Error &&
            (error.message.includes('429') ||
              error.message.includes('rate limit') ||
              error.message.toLowerCase().includes('too many requests'));

          if (isRateLimit) {
            logger.warn(
              `IGDB rate limit hit during alternative search, skipping remaining variations`,
              {
                context,
              },
            );
            // Break out of the loop to avoid more rate limit errors
            break;
          }

          logger.warn(
            `Error in alternative IGDB search: ${error instanceof Error ? error.message : String(error)}`,
            {
              context,
            },
          );
          // Continue to next search term for non-rate-limit errors
        }
      }
    }

    // If still no match, try one more approach for remakes/remasters
    if (!igdbGame && isRemakeOrRemaster) {
      logger.debug(
        `Trying core name extraction for remake/remaster: ${game.name}`,
        { context },
      );

      try {
        // Extract the core game name by removing common remake/remaster indicators
        const extractCoreGameName = (name: string): string => {
          // Remove common remake/remaster suffixes and prefixes
          let coreName = name
            .replace(/\s*remake\s*/gi, ' ')
            .replace(/\s*remaster(ed)?\s*/gi, ' ')
            .replace(/\s*definitive\s*edition\s*/gi, ' ')
            .replace(/\s*enhanced\s*edition\s*/gi, ' ')
            .replace(/\s*directors\s*cut\s*/gi, ' ')
            .replace(/\s*rebirth\s*/gi, ' ')
            .replace(/\s*reunion\s*/gi, ' ')
            .replace(/\s*intergrade\s*/gi, ' ')
            .trim();

          // Remove anything in parentheses or brackets
          coreName = coreName.replace(/\s*[\(\[\{].*?[\)\]\}]\s*/g, ' ').trim();

          // Remove special characters and extra spaces
          coreName = coreName
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          return coreName;
        };

        const coreGameName = extractCoreGameName(game.name);

        if (coreGameName.length >= 3) {
          logger.debug(
            `Extracted core game name: "${coreGameName}" from "${game.name}"`,
            { context },
          );

          // Try to find the game with the core name, using rate limit helper
          const coreNameResults = await makeIGDBRequest(
            () => igdbClient.getGameForSteamImport(coreGameName),
            context,
          );

          if (coreNameResults) {
            logger.debug(
              `Found match using core game name: ${coreNameResults.name}`,
              {
                context,
                data: {
                  originalName: game.name,
                  coreName: coreGameName,
                  matchedName: coreNameResults.name,
                },
              },
            );
            igdbGame = coreNameResults;
          }
        }
      } catch (error) {
        // Check if this is a rate limit error
        const isRateLimit =
          error instanceof Error &&
          (error.message.includes('429') ||
            error.message.includes('rate limit') ||
            error.message.toLowerCase().includes('too many requests'));

        if (isRateLimit) {
          logger.warn(
            `IGDB rate limit hit during core name extraction, skipping`,
            {
              context,
            },
          );
        } else {
          logger.warn(
            `Error in core name extraction search: ${error instanceof Error ? error.message : String(error)}`,
            {
              context,
            },
          );
        }
      }
    }

    if (!igdbGame) {
      logger.warn(`Game not found in IGDB: ${game.name}`, {
        context,
        data: { appId: game.appid },
      });

      // Record failed import with specific reason if it was a rate limit issue
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
        platform: 'pc',
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
    // Check if this is a rate limit error
    const isRateLimit =
      error instanceof Error &&
      (error.message.includes('429') ||
        error.message.includes('rate limit') ||
        error.message.toLowerCase().includes('too many requests'));

    const errorReason = isRateLimit
      ? 'IGDB rate limit exceeded'
      : 'Error processing game';

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    logger.error(
      `${errorReason}: ${game.name} (${game.appid}) - ${errorMessage}`,
      {
        context,
        data: {
          appId: game.appid,
          name: game.name,
          isRateLimit,
        },
      },
    );

    // Record failed import with specific rate limit reason if applicable
    await prisma.failedImport.create({
      data: {
        userId,
        steamImportJobId: jobId,
        steamAppId: game.appid,
        gameName: game.name,
        reason: errorReason,
        errorMessage: errorMessage,
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
          errorMessage: { not: null }, // Only get actual failures
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

/**
 * Get skipped imports for a specific job
 */
export const getSkippedImports = nextSafeActionClient
  .schema(z.object({ jobId: z.string() }))
  .action(async ({ parsedInput }) => {
    const { jobId } = parsedInput;
    const context = 'getSkippedImports';

    try {
      logger.debug(`Getting skipped imports for job: ${jobId}`, { context });

      // Get the current user
      const session = await auth();
      if (!session?.user?.id) {
        logger.warn('Authentication required for getting skipped imports', {
          context,
        });
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const userId = session.user.id;

      // Get skipped imports for the job
      const skippedImports = await prisma.failedImport.findMany({
        where: {
          userId,
          steamImportJobId: jobId,
          errorMessage: null, // Skipped games don't have error messages
        },
        orderBy: {
          attemptedAt: 'desc',
        },
      });

      logger.debug(
        `Found ${skippedImports.length} skipped imports for job: ${jobId}`,
        {
          context,
          data: { count: skippedImports.length },
        },
      );

      return {
        success: true,
        skippedImports,
      };
    } catch (error) {
      logger.error('Error getting skipped imports', error, {
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
 * Import a single game from Steam
 * This creates a job record and processes the game immediately
 */
export const importSingleGame = nextSafeActionClient
  .schema(singleGameImportSchema)
  .action(async ({ parsedInput }) => {
    const { steamId, appid } = parsedInput;
    const context = 'importSingleGame';

    try {
      logger.info(
        `Importing single game for Steam ID: ${steamId}, App ID: ${appid}`,
        { context },
      );

      // Get the current user
      const session = await auth();
      if (!session?.user?.id) {
        logger.warn('Authentication required for single game import', {
          context,
        });
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const userId = session.user.id;

      // Get the game details from Steam
      const ownedGames = await getOwnedGames(steamId);
      const gameToImport = ownedGames.find((game) => game.appid === appid);

      if (!gameToImport) {
        return {
          success: false,
          error: `Game with App ID ${appid} not found in Steam library`,
        };
      }

      // Create a job record for tracking
      const importJob = await prisma.steamImportJob.create({
        data: {
          userId,
          steamId,
          status: 'PROCESSING',
          importNewOnly: false,
          processedGames: 0,
          totalGames: 1,
          startedAt: new Date(),
        },
      });

      logger.debug(`Created single import job: ${importJob.id}`, {
        context,
        data: { jobId: importJob.id, steamId, appid },
      });

      try {
        // Process the single game with the real job ID
        const result = await processGame(gameToImport, userId, importJob.id);

        // Update job status
        await prisma.steamImportJob.update({
          where: { id: importJob.id },
          data: {
            status: 'COMPLETED',
            processedGames: 1,
            importedGames: result.action === 'imported' ? 1 : 0,
            skippedGames: result.action === 'skipped' ? 1 : 0,
            completedAt: new Date(),
          },
        });

        return {
          success: true,
          action: result.action,
          game: result.game,
          jobId: importJob.id,
        };
      } catch (error) {
        // Check if this is a rate limit error
        const isRateLimit =
          error instanceof Error &&
          (error.message.includes('429') ||
            error.message.includes('rate limit') ||
            error.message.toLowerCase().includes('too many requests'));

        const errorReason = isRateLimit
          ? 'IGDB rate limit exceeded'
          : 'Error processing game';

        logger.error(
          `${errorReason}: ${error instanceof Error ? error.message : String(error)}`,
          {
            context,
            error,
            gameId: appid,
            isRateLimit,
          },
        );

        // Update job status to FAILED
        await prisma.steamImportJob.update({
          where: { id: importJob.id },
          data: {
            status: 'FAILED',
            error: isRateLimit
              ? 'IGDB rate limit exceeded. Please try again later.'
              : error instanceof Error
                ? error.message
                : String(error),
            completedAt: new Date(),
          },
        });

        return {
          success: false,
          error: isRateLimit
            ? 'IGDB rate limit exceeded. Please try again later.'
            : error instanceof Error
              ? error.message
              : 'Unknown error',
          jobId: importJob.id,
        };
      }
    } catch (error) {
      logger.error(`Error in importSingleGame: ${error}`, {
        context,
        error,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
