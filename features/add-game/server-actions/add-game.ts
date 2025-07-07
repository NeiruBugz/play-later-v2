import "server-only";

import { BacklogItemService } from "@/domain/backlog-item/service";
import { GameService } from "@/domain/game/service";
import type { GameInput } from "@/domain/game/types";
import { AcquisitionType, BacklogItemStatus, type Game } from "@prisma/client";
import { z } from "zod";

import { convertReleaseDateToIsoStringDate } from "@/shared/lib/date-functions";
import { prisma } from "@/shared/lib/db";
import igdbApi from "@/shared/lib/igdb";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

async function ensureGameExists(igdbId: number) {
  const existingGame = await GameService.findByIgdbId(igdbId);

  if (existingGame.isSuccess && existingGame.value) {
    return existingGame.value;
  }

  return null;
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
        const createdGameResult = await GameService.create({ game: gameInput });

        if (createdGameResult.isFailure) {
          throw new Error(
            `Failed to create game: ${createdGameResult.error.message}`
          );
        }

        savedGame = createdGameResult.value.createdGame;
      }

      const backlogItemResult = await BacklogItemService.create(
        {
          backlogItem: {
            ...backlogItem,
          },
          userId,
          gameId: savedGame.id,
        },
        userId
      );

      if (backlogItemResult.isFailure) {
        throw new Error(
          `Failed to create backlog item: ${backlogItemResult.error.message}`
        );
      }

      return savedGame;
    });
  });
