"use server";

import { prisma } from "@/shared/lib/db";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getImportedGamesCount = authorizedActionClient
  .metadata({
    actionName: "getImportedGamesCount",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    const count = await prisma.importedGame.count({
      where: {
        userId,
        deletedAt: null,
      },
    });

    return { count };
  });
