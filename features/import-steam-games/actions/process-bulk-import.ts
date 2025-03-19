import { logger } from '@/shared/lib/logger';

import { prisma } from '@/prisma/client';
import { getOwnedGames } from '@/shared/external-apis/steam/steam-actions';
import { processGame } from '@/features/import-steam-games/actions/process-game';

const BATCH_PROCESSING_DELAY = 3000; // ms between processing batches

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

export { processBulkImport };
