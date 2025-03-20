'use server';

import { prisma } from '@/prisma/client';
import { getServerUserId } from '@/shared/lib/auth-service';

async function collectBacklogStatistics() {
  try {
    const userId = await getServerUserId();
    const backlogItemCounts = await prisma.backlogItem.groupBy({
      by: ['status'],
      where: {
        userId,
      },
      _count: {
        status: true,
      },
    });

    const totalGames = backlogItemCounts.reduce(
      (acc, curr) => acc + curr._count.status,
      0,
    );

    const statusCounts = backlogItemCounts.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalGames,
      statusCounts,
    };
  } catch (error) {
    console.error(error);
    return {
      totalGames: 0,
      statusCounts: {},
    };
  }
}

async function collectGenreStatistics() {
  try {
    const userId = await getServerUserId();
    const genreCounts = await prisma.genre.findMany({
      select: {
        name: true,
        games: {
          where: {
            game: {
              backlogItems: {
                some: {
                  userId,
                },
              },
            },
          },
          select: {
            gameId: true,
          },
        },
      },
    });
    const topGenres = genreCounts
      .map((genre) => ({
        name: genre.name,
        count: genre.games.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return topGenres;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export { collectBacklogStatistics, collectGenreStatistics };
