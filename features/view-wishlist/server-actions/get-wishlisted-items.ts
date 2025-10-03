import { z } from "zod";

import {
  findWishlistItemsForUser,
  getWishlistedItemsByUsername as getWishlistedItemsByUsernameCommand,
} from "@/shared/lib/repository";
import { findGamesWithLibraryItemsPaginated } from "@/shared/lib/repository/game/game-repository";
import {
  authorizedActionClient,
  publicActionClient,
} from "@/shared/lib/safe-action-client";

import { groupWishlistedItemsByGameId } from "../lib/group-wishlisted-items-by-game-id";

export const getWishlistedItems = authorizedActionClient
  .metadata({
    actionName: "getWishlistedItems",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    try {
      const wishlisted = await findWishlistItemsForUser({ userId });

      const groupedGames = groupWishlistedItemsByGameId({ wishlisted });

      return Object.values(groupedGames);
    } catch (e) {
      console.error(e);
      return [];
    }
  });

export const getWishlistedItemsByUsername = publicActionClient
  .metadata({
    actionName: "getWishlistedItemsByUsername",
    requiresAuth: false,
  })
  .inputSchema(z.object({ username: z.string() }))
  .action(async ({ parsedInput: { username } }) => {
    try {
      const wishlisted = await getWishlistedItemsByUsernameCommand({
        username,
      });

      const groupedGames = groupWishlistedItemsByGameId({ wishlisted });

      return Object.values(groupedGames);
    } catch (e) {
      console.error(e);
      return [];
    }
  });

// New: paginated, searchable personal wishlist
export const getWishlistedGames = authorizedActionClient
  .metadata({ actionName: "getWishlistedGames", requiresAuth: true })
  .inputSchema(
    z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(24),
      search: z.string().optional(),
    })
  )
  .action(async ({ ctx: { userId }, parsedInput: { page, limit, search } }) => {
    try {
      const where = {
        title: search ? { contains: search, mode: "insensitive" as const } : undefined,
        libraryItems: {
          some: { userId, status: "WISHLIST" },
        },
      };

      const [games, total] = await findGamesWithLibraryItemsPaginated({
        where,
        page,
        itemsPerPage: limit,
      });

      const items = games.map((game) => ({ game, libraryItems: game.libraryItems }));
      return { items, count: total };
    } catch (e) {
      console.error(e);
      return { items: [], count: 0 };
    }
  });

// New: paginated, searchable shared wishlist by username
export const getWishlistedGamesByUsername = publicActionClient
  .metadata({ actionName: "getWishlistedGamesByUsername", requiresAuth: false })
  .inputSchema(
    z.object({
      username: z.string(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(24),
      search: z.string().optional(),
    })
  )
  .action(
    async ({ parsedInput: { username, page, limit, search } }) => {
      try {
        const where = {
          title: search ? { contains: search, mode: "insensitive" as const } : undefined,
          libraryItems: {
            some: { status: "WISHLIST", User: { username } },
          },
        };

        const [games, total] = await findGamesWithLibraryItemsPaginated({
          where,
          page,
          itemsPerPage: limit,
        });
        const items = games.map((game) => ({ game, libraryItems: game.libraryItems }));
        return { items, count: total };
      } catch (e) {
        console.error(e);
        return { items: [], count: 0 };
      }
    }
  );
