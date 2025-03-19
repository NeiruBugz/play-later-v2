'use server';

import { auth } from '@/auth';
import { processGame } from '@/features/import-steam-games/actions/process-game';
import { prisma } from '@/prisma/client';
import { getOwnedGames } from '@/shared/external-apis/steam/steam-actions';
import { logger } from '@/shared/lib/logger';
import { nextSafeActionClient } from '@/shared/lib/next-safe-action-client';
import { z } from 'zod';

const singleGameImportSchema = z.object({
  steamId: z.string().min(1, 'Steam ID is required'),
  appid: z.number().int().positive('App ID is required'),
});

const importSingleGame = nextSafeActionClient
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

export { importSingleGame };
