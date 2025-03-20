import { prisma } from '@/prisma/client';
import { getServerUserId } from '@/shared/lib/auth-service';

async function getUpcomingGames() {
  try {
    const userId = await getServerUserId();
    const upcomingGames = await prisma.game.findMany({
      where: {
        backlogItems: {
          some: {
            userId,
            status: 'WISHLIST',
          },
        },
        releaseDate: {
          gt: new Date(),
        },
      },
      orderBy: {
        releaseDate: 'asc',
      },
      take: 3,
    });

    return upcomingGames;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export { getUpcomingGames };
