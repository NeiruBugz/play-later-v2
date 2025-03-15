'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { nextSafeActionClient } from '../../../shared/lib/next-safe-action-client';
import { getServerUserId } from '../../../shared/lib/auth-service';
import { createBacklogRecord } from '../../backlog/queries/backlog-queries';
import { createGame, findExistingGame } from '../queries/game-queries';
import { revalidatePath } from 'next/cache';
import {
  AcquisitionType,
  BacklogItemStatus,
} from '../../../shared/types/entities/BacklogItem';
import {
  IGDBGenres,
  IGDBScreenshots,
  PreparedGameData,
} from '../types/game-types';
import { BacklogItemData } from '../../backlog/types/backlog-types';

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

function prepareGenresForCreate(genres?: IGDBGenres) {
  return (
    genres?.map((genre) => ({
      genre: {
        connectOrCreate: {
          where: { id: genre.id },
          create: { id: genre.id, name: genre.name },
        },
      },
    })) || []
  );
}

function prepareScreenshotsForCreate(screenshots?: IGDBScreenshots) {
  return (
    screenshots?.map((screenshot) => ({
      imageId: screenshot.image_id,
    })) || []
  );
}

async function getOrCreateGame(gameData: PreparedGameData) {
  const existingGame = await findExistingGame(gameData.igdbId);

  if (existingGame) {
    return existingGame;
  }

  const genresCreate = prepareGenresForCreate(gameData.genres);
  const screenshotsCreate = prepareScreenshotsForCreate(gameData.screenshots);

  const createdGame = await createGame({
    title: gameData.name,
    description: gameData.description,
    releaseDate: gameData.releaseDate,
    aggregatedRating: gameData.aggregatedRating,
    igdbId: gameData.igdbId,
    screenshots: { create: screenshotsCreate },
    genres: { create: genresCreate },
    coverImage: gameData.coverImage,
  });

  return createdGame;
}

async function createUserBacklogItem(
  backlogData: BacklogItemData,
  gameId: string,
  userId: string,
) {
  return createBacklogRecord({
    status: backlogData.status as BacklogItemStatus,
    acquisitionType: backlogData.acquisitionType as AcquisitionType,
    platform: backlogData.platform,
    gameId,
    userId,
  });
}

function refreshPages() {
  revalidatePath('/collection');
  revalidatePath('/wishlist');
}

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
      const game = await getOrCreateGame(igdbGame);

      await createUserBacklogItem(
        { status, acquisitionType, platform },
        game.id,
        userId,
      );

      refreshPages();

      return { success: true };
    } catch (error) {
      console.error('Error creating backlog item:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }

      return { error: 'Failed to create backlog item.' };
    }
  });
