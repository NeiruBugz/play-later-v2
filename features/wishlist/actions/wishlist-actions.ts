import { getServerUserId } from '@/shared/lib/auth-service';
import { prisma } from '@/prisma/client';
import { redirect } from 'next/navigation';
import { GameWithBacklogItems } from '@/shared/types/backlog.types';
import { nextSafeActionClient } from '@/shared/lib/next-safe-action-client';
import { z } from 'zod';

export const getUserWishlistedGamesGroupedBacklog = nextSafeActionClient
  .schema(z.object({ page: z.string().optional().default('1') }))
  .action(async ({ parsedInput }) => {
    const { page: pageParam } = parsedInput;
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
  });
