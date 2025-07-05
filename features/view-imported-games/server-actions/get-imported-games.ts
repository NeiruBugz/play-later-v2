"use server";

import { z } from "zod";

import { prisma } from "@/shared/lib/db";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getImportedGames = authorizedActionClient
  .metadata({
    actionName: "getImportedGames",
    requiresAuth: true,
  })
  .inputSchema(
    z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
    })
  )
  .action(async ({ ctx: { userId }, parsedInput: { page, limit } }) => {
    const totalGames = await prisma.importedGame.count({
      where: { userId },
    });

    const games = await prisma.importedGame.findMany({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        storefront: true,
        storefrontGameId: true,
        playtime: true,
        img_icon_url: true,
        img_logo_url: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return { games, totalGames };
  });
