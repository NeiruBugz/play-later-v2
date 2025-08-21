"use server";

import { Storefront } from "@prisma/client";

import { upsertManyImportedGames } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

import { SaveManySteamGamesInput } from "../types/type";

export const saveSteamGames = authorizedActionClient
  .metadata({
    actionName: "saveSteamGames",
    requiresAuth: true,
  })
  .inputSchema(SaveManySteamGamesInput)
  .action(async ({ parsedInput: { games }, ctx: { userId } }) => {
    const mappedGames = games.map((game) => ({
      name: game.name,
      storefront: Storefront.STEAM,
      playtime: game.playtime ?? 0,
      img_icon_url: game.img_icon_url ?? "",
      img_logo_url: game.img_logo_url ?? "",
      storefrontGameId: game.storefrontGameId,
      userId,
    }));

    try {
      const importedGames = await upsertManyImportedGames({
        games: mappedGames,
      });

      return importedGames;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to save steam games");
    }
  });
