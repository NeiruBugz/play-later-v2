"use server";

import { Storefront } from "@prisma/client";
import { z } from "zod";

import {
  getFilteredImportedGames,
  getFilteredImportedGamesCount,
} from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getImportedGames = authorizedActionClient
  .metadata({
    actionName: "getImportedGames",
    requiresAuth: true,
  })
  .inputSchema(
    z.object({
      page: z.number().default(1),
      limit: z.number().default(18),
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
        ...(search != null && {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        }),
        deletedAt: null,
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
        getFilteredImportedGamesCount({ whereClause: where }),
        getFilteredImportedGames({
          whereClause: where,
          page,
          limit,
          orderBy,
        }),
      ]);

      return { games, totalGames };
    }
  );
