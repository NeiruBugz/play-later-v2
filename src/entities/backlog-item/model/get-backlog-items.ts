import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";
import { User, type BacklogItem, type Game } from "@prisma/client";

export type GameWithBacklogItems = {
  game: Game;
  backlogItems: Omit<BacklogItem, "game">[];
  totalMainStoryHours?: number;
};

type UserWithBacklogItems = {
  user: User;
  backlogItems: (BacklogItem & { game: Game })[];
};

export async function getBacklogs() {
  try {
    const userId = await getServerUserId();

    const userGames = await prisma.backlogItem.findMany({
      where: {
        userId: { not: userId },
      },
      include: {
        game: true,
        User: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const groupedByUser = userGames.reduce(
      (acc: Record<string, UserWithBacklogItems>, item) => {
        const { User, ...backlogItem } = item;
        if (!acc[User.id]) {
          acc[User.id] = { user: User, backlogItems: [] };
        }
        acc[User.id].backlogItems.push(item);
        return acc;
      },
      {}
    );

    return Object.values(groupedByUser);
  } catch (e) {
    console.error("Error fetching user game collection:", e);
    return [];
  }
}

export async function getUsersBacklog({ backlogId }: { backlogId: string }) {
  try {
    return await prisma.backlogItem.findMany({
      where: {
        userId: backlogId,
      },
      include: {
        game: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  } catch (e) {
    console.error("Error fetching user game collection:", e);
    return [];
  }
}

export async function getBacklogItems({ gameId }: { gameId: string }) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      throw new Error("No user ID found");
    }

    return await prisma.backlogItem.findMany({
      where: {
        gameId: gameId,
        userId: userId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  } catch (e) {
    console.error("Error fetching user game collection:", e);
    return [];
  }
}
