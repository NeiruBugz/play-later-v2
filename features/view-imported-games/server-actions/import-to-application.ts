"use server";

import { importToApplicationSchema } from "@/features/view-imported-games/validation/import-to-application.schema";
import igdbApi from "@/shared/lib/igdb";
import {
  findByStorefrontGameId,
  softDeleteImportedGame,
} from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { addGameToCollection } from "@/shared/services/game-management";
import { RevalidationService } from "@/shared/ui/revalidation";

export const importToApplication = authorizedActionClient
  .metadata({
    actionName: "importToApplication",
    requiresAuth: true,
  })
  .inputSchema(importToApplicationSchema)
  .action(async ({ parsedInput: { steamAppId, playtime } }) => {
    const [game, importedGame] = await Promise.all([
      igdbApi.getGameBySteamAppId(steamAppId),
      findByStorefrontGameId({
        storefrontGameId: steamAppId.toString(),
      }),
    ]);

    if (!game) {
      throw new Error("Game not found in IGDB database");
    }

    try {
      const { data: savedGame } = await addGameToCollection({
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
        await softDeleteImportedGame({ id: importedGame.id });
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
