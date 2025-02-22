import { getServerUserId } from '@/domain/auth/auth-service';
import { prisma } from '@/infra/prisma/client';
import { redirect } from 'next/navigation';
import { GameWithBacklogItems } from '@/shared/types/backlog.types';

export async function getUserWishlistedGamesGroupedBacklog(pageParam: string) {
  const userId = await getServerUserId();
  if (!userId) {
    redirect('/');
  }

  const page = Number(pageParam);
  const skip = ((page || 1) - 1) * 21;
  const take = 21;

  const [games, totalGames] = await Promise.all([
    prisma.game.findMany({
      where: { backlogItems: { some: { userId, status: 'WISHLIST' } } },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        backlogItems: {
          where: {
            userId,
            status: 'WISHLIST',
          },
        },
      },
    }),
    prisma.game.count({
      where: { backlogItems: { some: { userId, status: 'WISHLIST' } } },
    }),
  ]);

  const wishlistedGames: GameWithBacklogItems[] = games.map((game) => ({
    game,
    backlogItems: game.backlogItems ?? [],
  }));

  return { wishlistedGames, count: totalGames };
}
