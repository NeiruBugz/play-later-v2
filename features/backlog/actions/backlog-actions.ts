'use server';

import { prisma } from '@/prisma/client';
import { BacklogItemStatus, Prisma } from '@prisma/client';
import { redirect } from 'next/navigation';
import { GameWithBacklogItems } from '@/shared/types/backlog.types';
import { getServerUserId } from '@/shared/lib/auth-service';
import {
  FilterParamsSchema,
  GetUserGamesWithGroupedBacklogInput,
} from '../types/backlog-types';
import type { Game } from '@/shared/types/entities/Game';
import type { BacklogItem } from '@/shared/types/entities/BacklogItem';
import { nextSafeActionClient } from '@/shared/lib/next-safe-action-client';
import { z } from 'zod';

const ITEMS_PER_PAGE = 21;

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

async function fetchGamesWithFilter(
  backlogFilter: Prisma.BacklogItemWhereInput,
  skip: number,
  take: number,
  sort: string,
): Promise<Array<Game & { backlogItems: BacklogItem[] }>> {
  let orderBy: Prisma.GameOrderByWithRelationInput = { createdAt: 'desc' };
  if (sort) {
    const [field, direction] = sort.split('_');
    if (field === 'title') {
      orderBy = { title: direction as Prisma.SortOrder };
    } else if (field === 'releaseDate') {
      orderBy = { releaseDate: direction as Prisma.SortOrder };
    } else if (field === 'rating') {
      orderBy = { aggregatedRating: direction as Prisma.SortOrder };
    }
  }
  return prisma.game.findMany({
    where: {
      backlogItems: {
        some: backlogFilter,
      },
    },
    orderBy,
    take,
    skip,
    include: {
      backlogItems: { where: backlogFilter },
      screenshots: false,
      genres: false,
    },
  });
}

async function countGamesWithFilter(
  backlogFilter: Prisma.BacklogItemWhereInput,
) {
  return prisma.game.count({
    where: {
      backlogItems: {
        some: backlogFilter,
      },
    },
  });
}

function transformGamesToCollection(
  games: Array<Game & { backlogItems: BacklogItem[] }>,
): GameWithBacklogItems[] {
  return games.map((game) => ({
    game,
    backlogItems: game.backlogItems ?? [],
  }));
}

export const getUserGamesWithGroupedBacklog = nextSafeActionClient
  .schema(FilterParamsSchema)
  .action(async ({ parsedInput }) => {
    const userId = await getServerUserId();

    if (!userId) {
      console.error('Unable to find authenticated user');
      redirect('/');
    }

    const filterParams = parsedInput;
    const { page } = filterParams;

    const backlogFilter = await buildPrismaFilter(userId, filterParams);
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const take = ITEMS_PER_PAGE;

    const [games, count] = await Promise.all([
      fetchGamesWithFilter(backlogFilter, skip, take, filterParams.sort),
      countGamesWithFilter(backlogFilter),
    ]);

    const collection = transformGamesToCollection(games);

    return { collection, count };
  });

export const findGameByIdWithUsersBacklog = nextSafeActionClient
  .schema(z.object({ gameId: z.string() }))
  .action(async ({ parsedInput }) => {
    const { gameId } = parsedInput;
    const userId = await getServerUserId();

    if (!userId) {
      console.error('Unable to find authenticated user');
      redirect('/');
    }

    return prisma.game.findUnique({
      where: { id: gameId },
      include: {
        backlogItems: { where: { userId } },
        genres: { include: { genre: true } },
        screenshots: true,
      },
    });
  });
