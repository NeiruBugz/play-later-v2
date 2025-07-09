import "server-only";

import { AcquisitionType, BacklogItemStatus, type Game } from "@prisma/client";
import { z } from "zod";

import { convertReleaseDateToIsoStringDate } from "@/shared/lib/date-functions";
import { prisma } from "@/shared/lib/db";
import igdbApi from "@/shared/lib/igdb";
import {
  createBacklogItem,
  createGame,
  findGameByIgdbId,
} from "@/shared/lib/repository";
import { GameInput } from "@/shared/lib/repository/game/types";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

async function ensureGameExists(igdbId: number) {
  const existingGame = await findGameByIgdbId({ igdbId });

  if (!existingGame) {
    return null;
  }

  return existingGame;
}

export const saveGameAndAddToBacklog = authorizedActionClient
  .metadata({
    actionName: "saveGameAndAddToBacklog",
    requiresAuth: true,
  })
  .inputSchema(
    z.object({
      game: z.object({
        igdbId: z.number(),
      }),
      backlogItem: z.object({
        backlogStatus: z.nativeEnum(BacklogItemStatus),
        acquisitionType: z.nativeEnum(AcquisitionType),
        platform: z.string().optional(),
      }),
    })
  )
  .action(async ({ parsedInput: payload, ctx: { userId } }) => {
    return await prisma.$transaction(async () => {
      const { game, backlogItem } = payload;
      const existingGame = await ensureGameExists(game.igdbId);

      let savedGame: Game | null = null;

      if (existingGame) {
        savedGame = structuredClone(existingGame);
      } else {
        const gameInfo = await igdbApi.getGameById(game.igdbId);

        const releaseDate = convertReleaseDateToIsoStringDate(
          gameInfo?.release_dates[0]?.human
        );

        if (!gameInfo) {
          throw new Error(`Game with IGDB ID ${game.igdbId} not found`);
        }

        const gameInput: GameInput = {
          igdbId: String(game.igdbId),
          title: gameInfo.name,
          coverImage: gameInfo.cover.image_id,
          description: gameInfo.summary,
          releaseDate,
        };
        const createdGameResult = await createGame({ game: gameInput });

        if (!createdGameResult) {
          throw new Error(`Failed to create game`);
        }

        savedGame = createdGameResult;
      }

      const backlogItemResult = await createBacklogItem({
        backlogItem: {
          status: backlogItem.backlogStatus,
          acquisitionType: backlogItem.acquisitionType,
          platform: backlogItem.platform,
        },
        userId,
        gameId: savedGame.id,
      });

      if (!backlogItemResult) {
        throw new Error(`Failed to create backlog item`);
      }

      return savedGame;
    });
  });
