import { UserService } from "@/domain/user/service";
import { BacklogItemStatus, type BacklogItem, type Game } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/shared/lib/db";
import {
  authorizedActionClient,
  publicActionClient,
} from "@/shared/lib/safe-action-client";

type GameWithBacklogItems = {
  game: Game;
  backlogItems: Omit<BacklogItem, "game">[];
};

export const getWishlistedItems = authorizedActionClient
  .metadata({
    actionName: "getWishlistedItems",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    try {
      const wishlisted = await prisma.backlogItem.findMany({
        where: {
          userId: userId,
          status: BacklogItemStatus.WISHLIST,
        },
        include: {
          game: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const groupedGames = wishlisted.reduce(
        (acc: Record<string, GameWithBacklogItems>, item) => {
          const { game, ...backlogItem } = item;
          if (!acc[game.id]) {
            acc[game.id] = { game, backlogItems: [] };
          }
          acc[game.id].backlogItems.push(backlogItem);
          return acc;
        },
        {}
      );

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
      const user = await UserService.getUserByUsername(username);
      if (!user) {
        throw new Error("User not found");
      }

      const wishlisted = await prisma.backlogItem.findMany({
        where: {
          User: {
            username: username,
          },
          status: BacklogItemStatus.WISHLIST,
        },
        include: {
          game: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const groupedGames = wishlisted.reduce(
        (acc: Record<string, GameWithBacklogItems>, item) => {
          const { game, ...backlogItem } = item;
          if (!acc[game.id]) {
            acc[game.id] = { game, backlogItems: [] };
          }
          acc[game.id].backlogItems.push(backlogItem);
          return acc;
        },
        {}
      );

      return Object.values(groupedGames);
    } catch (e) {
      console.error(e);
      return [];
    }
  });
