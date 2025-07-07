"use server";

import { saveGameAndAddToBacklog } from "@/features/add-game/server-actions/add-game";
import { importToApplicationSchema } from "@/features/view-imported-games/validation/import-to-application.schema";
import { prisma } from "@/shared/lib/db";
import igdbApi from "@/shared/lib/igdb";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { RevalidationService } from "@/shared/ui/revalidation";

export const importToApplication = authorizedActionClient
  .metadata({
    actionName: "importToApplication",
    requiresAuth: true,
  })
  .inputSchema(importToApplicationSchema)
  .action(async ({ parsedInput: { steamAppId, playtime } }) => {
    const game = await igdbApi.getGameBySteamAppId(steamAppId);
    const importedGame = await prisma.importedGame.findFirst({
      where: {
        storefrontGameId: steamAppId.toString(),
      },
    });

    if (!game) {
      throw new Error("Game not found in IGDB database");
    }

    try {
      const { data: savedGame } = await saveGameAndAddToBacklog({
        game: {
          igdbId: game.id,
        },
        backlogItem: {
          backlogStatus: playtime ? "PLAYED" : "TO_PLAY",
          acquisitionType: "DIGITAL",
          platform: "pc",
        },
      });

      if (importedGame) {
        await prisma.importedGame.update({
          where: {
            id: importedGame.id,
          },
          data: {
            deletedAt: new Date(),
          },
        });
      }

      RevalidationService.revalidateImportedGames();
      RevalidationService.revalidateCollection();

      return {
        success: true,
        gameTitle: savedGame?.title,
        gameId: savedGame?.id,
        message: `"${savedGame?.title}" has been added to your collection!`,
      };
    } catch (error) {
      console.error(error);
      throw new Error("Failed to import game to application");
    }
  });
