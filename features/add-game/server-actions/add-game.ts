import { getServerUserId } from "@/auth";
import { BacklogItemService } from "@/domain/backlog-item/service";
import { GameService } from "@/domain/game/service";
import { prisma } from "@/shared/lib/db";
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
          igdbId: game.igdbId,
        },
      });

      let savedGame;

      if (existingGame) {
        savedGame = existingGame;
      } else {
        const createdGameResponse = await GameService.create({ game });
        if (createdGameResponse?.createdGame) {
          savedGame = createdGameResponse?.createdGame;
        } else {
          throw new Error("Failed to create game");
        }
      }

      if (savedGame) {
        try {
          await BacklogItemService.create({
            gameId: savedGame.id,
            userId,
            backlogItem,
          });
        } catch (error) {
          console.error("Error creating backlog item:", error);
          throw new Error("Failed to create backlog item.");
        }
      } else {
        throw new Error("Failed to save game.");
      }
    } catch (error) {
      console.error("Error in transaction:", error);
      throw new Error("Transaction failed.");
    }
  });
}
