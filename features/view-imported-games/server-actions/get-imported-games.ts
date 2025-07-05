"use server";

import { Storefront } from "@prisma/client";
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
      limit: z.number().default(20),
      search: z.string().optional(),
      storefront: z.nativeEnum(Storefront).optional(),
      sortBy: z
        .enum(["name", "playtime", "storefront", "createdAt"])
        .default("name"),
      sortOrder: z.enum(["asc", "desc"]).default("asc"),
    })
  )
  .action(
    async ({
      ctx: { userId },
      parsedInput: { page, limit, search, storefront, sortBy, sortOrder },
    }) => {
      // Build where clause for filtering
      const where = {
        userId,
        ...(storefront && { storefront }),
        ...(search && {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        }),
      };

      // Build orderBy clause for sorting
      const orderBy = (() => {
        switch (sortBy) {
          case "name":
            return { name: sortOrder };
          case "playtime":
            return { playtime: sortOrder };
          case "storefront":
            return { storefront: sortOrder };
          case "createdAt":
            return { createdAt: sortOrder };
          default:
            return { name: sortOrder };
        }
      })();

      const [totalGames, games] = await Promise.all([
        prisma.importedGame.count({ where }),
        prisma.importedGame.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
          select: {
            id: true,
            name: true,
            storefront: true,
            storefrontGameId: true,
            playtime: true,
            img_icon_url: true,
            img_logo_url: true,
          },
        }),
      ]);

      return { games, totalGames };
    }
  );
