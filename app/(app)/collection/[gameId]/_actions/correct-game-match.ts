'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/prisma/client';
import { nextSafeActionClient } from '@/shared/lib/next-safe-action-client';
import { getServerUserId } from '@/shared/lib/auth-service';
import { getIGDBGameData } from '@/shared/external-apis/igdb/igdb-actions';
import { logger } from '@/shared/lib/logger';

const correctGameMatchSchema = z.object({
  gameId: z.string(),
  steamAppId: z.number(),
  steamTitle: z.string(),
  newIgdbId: z.number(),
  newIgdbTitle: z.string(),
});

export const correctGameMatch = nextSafeActionClient
  .schema(correctGameMatchSchema)
  .action(async ({ parsedInput }) => {
    const userId = await getServerUserId();
    if (!userId) {
      logger.error('User authentication failed during game correction');
      throw new Error('User not authenticated');
    }

    const { gameId, steamAppId, steamTitle, newIgdbId, newIgdbTitle } =
      parsedInput;

    logger.info('Starting game correction process', {
      context: 'correctGameMatch',
      data: { gameId, steamAppId, newIgdbId },
    });

    // Fetch updated game data from IGDB
    const igdbData = await getIGDBGameData(newIgdbId);
    if (!igdbData) {
      logger.error('Failed to fetch IGDB data', null, {
        context: 'correctGameMatch',
        data: { newIgdbId },
      });
      throw new Error('Failed to fetch game data from IGDB');
    }

    // Start a transaction to handle the correction and update
    try {
      const result = await prisma.$transaction(async (tx) => {
        logger.debug('Starting database transaction for game correction', {
          context: 'correctGameMatch',
          data: { igdbData },
        });

        // Update or create the game match record
        const gameMatch = await tx.gameMatch.upsert({
          where: {
            gameId_steamAppId: {
              gameId,
              steamAppId,
            },
          },
          create: {
            gameId,
            steamAppId,
            steamTitle,
            confidence: 1, // Manual match has 100% confidence
            isVerified: true,
            verifiedBy: userId,
            verifiedAt: new Date(),
            status: 'VERIFIED',
            notes: `Manually corrected to ${newIgdbTitle} (IGDB ID: ${newIgdbId})`,
          },
          update: {
            isVerified: true,
            verifiedBy: userId,
            verifiedAt: new Date(),
            status: 'CORRECTED',
            notes: `Manually corrected to ${newIgdbTitle} (IGDB ID: ${newIgdbId})`,
          },
        });

        // Prepare screenshots data
        const screenshots =
          igdbData.screenshots?.map((screenshot) => ({
            imageId: screenshot.image_id,
          })) || [];

        // Prepare genres data
        const genres =
          igdbData.genres?.map((genre) => ({
            genre: {
              connectOrCreate: {
                where: { id: genre.id },
                create: { id: genre.id, name: genre.name },
              },
            },
          })) || [];

        // Update the game with new IGDB data
        await tx.game.update({
          where: { id: gameId },
          data: {
            igdbId: newIgdbId,
            title: igdbData.name,
            description: igdbData.summary || null,
            releaseDate: igdbData.first_release_date
              ? new Date(igdbData.first_release_date * 1000)
              : null,
            aggregatedRating: igdbData.aggregated_rating || null,
            coverImage: igdbData.cover?.image_id || null,
            // Clear existing relationships and create new ones
            screenshots: {
              deleteMany: {},
              create: screenshots,
            },
            genres: {
              deleteMany: {},
              create: genres,
            },
          },
        });

        logger.info('Successfully updated game match and data', {
          context: 'correctGameMatch',
          data: { gameId, newIgdbId },
        });

        return gameMatch;
      });

      // Revalidate the game page and collection
      revalidatePath(`/collection/${gameId}`);
      revalidatePath('/collection');

      logger.info('Game correction completed successfully', {
        context: 'correctGameMatch',
        data: { gameId },
      });

      return { success: true, data: result };
    } catch (error) {
      logger.error('Error during game correction process', error, {
        context: 'correctGameMatch',
        data: { gameId, newIgdbId },
      });
      throw error;
    }
  });
