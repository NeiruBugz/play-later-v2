'use server';

import { getServerUserId } from '@/domain/auth/auth-service';
import { prisma } from '@/infra/prisma/client';
import { BacklogItemStatus, Prisma } from '@prisma/client';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { GameWithBacklogItems } from '@/shared/types/backlog.types';

const ITEMS_PER_PAGE = 21;

const FilterParamsSchema = z.object({
  platform: z.string().optional().default(''),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.number().optional().default(1),
});

export type GetUserGamesWithGroupedBacklogInput = z.infer<
  typeof FilterParamsSchema
>;

async function buildPrismaFilter(
  userId: string,
  filterParams: GetUserGamesWithGroupedBacklogInput,
): Promise<Prisma.BacklogItemWhereInput> {
  const { platform, search, status } = filterParams;

  const backlogItemFilter: Prisma.BacklogItemWhereInput = {
    userId,
    platform: platform || undefined,
    status: {
      not: BacklogItemStatus.WISHLIST,
      ...(status && status !== '' && { equals: status as BacklogItemStatus }),
    },
  };

  if (search) {
    backlogItemFilter.game = {
      is: { title: { contains: search, mode: 'insensitive' } },
    };
  }

  return backlogItemFilter;
}

export async function getUserGamesWithGroupedBacklog(
  params: GetUserGamesWithGroupedBacklogInput,
) {
  const userId = await getServerUserId();

  if (!userId) {
    console.error('Unable to find authenticated user');
    redirect('/');
  }

  const parsedParams = FilterParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    console.error('Invalid filters:', parsedParams.error);
    throw new Error('Invalid filters');
  }

  const filterParams = parsedParams.data;
  const { page } = filterParams;

  const backlogFilter = await buildPrismaFilter(userId, filterParams);
  const skip = (page - 1) * ITEMS_PER_PAGE;
  const take = ITEMS_PER_PAGE;

  const [games, count] = await Promise.all([
    prisma.game.findMany({
      where: {
        backlogItems: {
          some: backlogFilter,
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        backlogItems: { where: backlogFilter },
        screenshots: false,
        genres: false,
      },
    }),
    prisma.game.count({
      where: {
        backlogItems: {
          some: backlogFilter,
        },
      },
    }),
  ]);

  const collection: GameWithBacklogItems[] = games.map((game) => ({
    game,
    backlogItems: game.backlogItems ?? [],
  }));

  return { collection, count };
}

export async function findGameByIdWithUsersBacklog(gameId: string) {
  const userId = await getServerUserId();
  if (!userId) {
    console.error('Unable to find authenticated user');
    redirect('/');
  }

  return prisma.game.findUnique({
    where: { id: gameId },
    include: { backlogItems: { where: { userId } } },
  });
}
