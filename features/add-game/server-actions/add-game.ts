import { getServerUserId } from "@/auth";
import { BacklogItemService } from "@/domain/backlog-item/service";
import { GameService } from "@/domain/game/service";
import { GameInput } from "@/domain/game/types";
import { prisma } from "@/shared/lib/db";
import { RevalidationService } from "@/shared/ui/revalidation";
import { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import type { AddGameToBacklogInput } from "../types";

export async function saveGameAndAddToBacklog(payload: AddGameToBacklogInput) {
  const userId = await getServerUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  await prisma.$transaction(async (prisma) => {
    const { game, backlogItem } = payload;

    try {
      const existingGame = await prisma.game.findUnique({
        where: {
          igdbId: Number(game.igdbId),
        },
      });

      let savedGame;

      if (existingGame) {
        savedGame = existingGame;
      } else {
        const gameInput: GameInput = {
          igdbId: String(game.igdbId),
          title: game.title,
          coverImage: game.coverImage,
          hltbId: game.hltbId,
          mainExtra: game.mainExtra,
          mainStory: game.mainStory,
          completionist: game.completionist,
          releaseDate: game.releaseDate
            ? new Date(game.releaseDate).toISOString()
            : null,
          description: game.description,
        };

        const createdGameResult = await GameService.create({ game: gameInput });
        if (createdGameResult.isFailure) {
          throw new Error(
            `Failed to create game: ${createdGameResult.error.message}`
          );
        }

        savedGame = createdGameResult.value.createdGame;
      }

      if (savedGame) {
        const backlogItemResult = await BacklogItemService.create(
          {
            backlogItem: {
              ...backlogItem,
              backlogStatus: backlogItem.backlogStatus as BacklogItemStatus,
              acquisitionType: backlogItem.acquisitionType as AcquisitionType,
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

        RevalidationService.revalidateCollection();
      } else {
        throw new Error("Failed to save game.");
      }
    } catch (error) {
      console.error("Error in transaction:", error);
      throw new Error("Transaction failed.");
    }
  });
}
