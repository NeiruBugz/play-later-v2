"use server";

import { z } from "zod";

import { prisma } from "@/shared/lib/db";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const saveSteamGames = authorizedActionClient
  .metadata({
    actionName: "saveSteamGames",
    requiresAuth: true,
  })
  .inputSchema(
    z.object({
      games: z.array(
        z.object({
          name: z.string(),
          storefrontGameId: z.string(),
          playtime: z.number(),
          img_icon_url: z.string().optional(),
          img_logo_url: z.string().optional(),
        })
      ),
    })
  )
  .action(async ({ parsedInput: { games }, ctx: { userId } }) => {
    console.log(games);
    try {
      const importedGames = await prisma.importedGame.createMany({
        data: games.map((game) => ({
          name: game.name,
          storefront: "STEAM",
          playtime: game.playtime || 0,
          img_icon_url: game.img_icon_url || "",
          img_logo_url: game.img_logo_url || "",
          storefrontGameId: game.storefrontGameId,
          userId,
        })),
      });

      return importedGames;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to save steam games");
    }
  });
