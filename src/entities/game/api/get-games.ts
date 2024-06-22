import { prisma } from "@/src/shared/api";
import { getServerUserId } from "@/auth";
import type { BacklogItem, Game } from "@prisma/client";

type GameWithBacklogItems = {
  game: Game;
  backlogItems: Omit<BacklogItem, 'game'>[];
}

export async function getGames() {
  try {
    const userId = await getServerUserId();

    if (!userId) {
      return [];
    }

    return prisma.game.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        title: true,
        coverImage: true,
        releaseDate: true,
        backlogItems: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        title: "asc"
      }
    });
  } catch (error) {
    console.error('Error fetching user game collection:', error);
    throw new Error('Could not fetch user game collection.');
  }
}

export async function getGamesWithStatuses() {
  try {
    const userId = await getServerUserId();

    if (!userId) {
      return [];
    }

    return prisma.backlogItem.findMany({
      where: {
        userId,
      },
      include: {
        game: true,
      }
    })
  } catch (e) {
    console.error('Error fetching user game collection:', e);
  }
}

export async function getUserGamesWithGroupedBacklog(): Promise<GameWithBacklogItems[]> {
  try {
    const userId = await getServerUserId();
    const userGames = await prisma.backlogItem.findMany({
      where: {
        userId: userId,
      },
      include: {
        game: true,
      },
    });

    const groupedGames = userGames.reduce((acc: Record<number, GameWithBacklogItems>, item) => {
      const { game, ...backlogItem } = item;
      if (!acc[game.id]) {
        acc[game.id] = { game, backlogItems: [] };
      }
      acc[game.id].backlogItems.push(backlogItem);
      return acc;
    }, {});

    return Object.values(groupedGames);
  } catch (e) {
    console.error('Error fetching user game collection:', e);
    return [];
  }
}
