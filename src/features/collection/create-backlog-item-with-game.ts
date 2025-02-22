'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { nextSafeActionClient } from '@/infra/next-safe-action-client';
import { getServerUserId } from '@/domain/auth/auth-service';
import {
  createBacklogRecord,
  createGame,
  findExistingGame,
} from '@/features/collection/collection-queries';
import { revalidatePath } from 'next/cache';
import {
  AcquisitionType,
  BacklogItemStatus,
} from '@/domain/entities/BacklogItem';

const createBacklogItemWithGameSchema = z.object({
  igdbGame: z.object({
    igdbId: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    releaseDate: z.date().nullable(),
    aggregatedRating: z.number().nullable(),
    screenshots: z
      .array(
        z.object({
          id: z.number(),
          image_id: z.string(),
        }),
      )
      .optional(),
    genres: z
      .array(
        z.object({
          id: z.number(),
          name: z.string(),
        }),
      )
      .optional(),
    coverImage: z.string().nullable(),
  }),
  status: z.string(),
  acquisitionType: z.string(),
  platform: z.string(),
});

export const createBacklogItemWithGame = nextSafeActionClient
  .schema(createBacklogItemWithGameSchema)
  .action(async ({ parsedInput }) => {
    const userId = await getServerUserId();

    if (!userId) {
      console.error('Unable to find authenticated user');
      redirect('/');
    }

    const { igdbGame, status, acquisitionType, platform } = parsedInput;

    try {
      let gameId: string;
      const existingGame = await findExistingGame(igdbGame.igdbId);

      if (!existingGame) {
        const genresConnectOrCreate = igdbGame.genres?.map((genre) => ({
          where: { id: genre.id },
          create: { id: genre.id, name: genre.name },
        }));

        const screenshots = igdbGame.screenshots?.map((screenshot) => ({
          where: { id: screenshot.id },
          create: { id: screenshot.id, image_id: screenshot.image_id },
        }));

        const createdGame = await createGame({
          title: igdbGame.name,
          description: igdbGame.description,
          releaseDate: igdbGame.releaseDate,
          aggregatedRating: igdbGame.aggregatedRating,
          igdbId: igdbGame.igdbId,
          screenshots: { connectOrCreate: screenshots ?? [] },
          genres: { connectOrCreate: genresConnectOrCreate ?? [] },
          coverImage: igdbGame.coverImage,
        });

        gameId = createdGame.id;
      } else {
        gameId = existingGame.id;
      }
      await createBacklogRecord({
        status: status as BacklogItemStatus,
        acquisitionType: acquisitionType as AcquisitionType,
        platform: platform,
        gameId,
        userId: userId,
      });

      revalidatePath('/collection');
      revalidatePath('/wishlist');

      return { success: true };
    } catch (error) {
      console.error('Error creating backlog item:', error);
      return { error: 'Failed to create backlog item.' };
    }
  });
