import { User, type BacklogItem, type Game } from "@prisma/client";

import { prisma } from "@/shared/lib/db";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

type UserWithBacklogItems = {
  user: User;
  backlogItems: (BacklogItem & { game: Game })[];
};

export const getBacklogs = authorizedActionClient
  .metadata({
    actionName: "getBacklogs",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    try {
      const userGames = await prisma.backlogItem.findMany({
        where: {
          userId: { not: userId },
          User: { username: { not: null } },
        },
        include: { game: true, User: true },
        orderBy: { createdAt: "asc" },
      });

      const groupedByUser = userGames.reduce(
        (acc: Record<string, UserWithBacklogItems>, item) => {
          const { User } = item;
          acc[User.id] ??= { user: User, backlogItems: [] };
          acc[User.id].backlogItems.push(item);
          return acc;
        },
        {}
      );

      return Object.values(groupedByUser);
    } catch (e) {
      console.error("Error fetching user backlogs:", e);
      return [];
    }
  });
