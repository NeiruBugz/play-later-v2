import { z } from "zod";

import {
  findWishlistItemsForUser,
  getWishlistedItemsByUsername as getWishlistedItemsByUsernameCommand,
} from "@/shared/lib/repository";
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
