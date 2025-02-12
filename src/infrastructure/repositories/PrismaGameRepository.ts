import { Game } from '@/domain/entities/Game';
import {
  FilterParams,
  GameRepository,
  GameWithBacklogItems,
} from '@/domain/repositories/GameRepository';
import { prisma } from '@/infrastructure/prisma/client';
import { BacklogItemStatus, Prisma } from '@prisma/client';

export class PrismaGameRepository implements GameRepository {
  async create(
    gameData: Game & {
      igdbId: number;
      name: string;
      coverImage?: string | null;
    },
  ) {
    const record = await prisma.game.create({
      data: {
        igdbId: gameData.igdbId,
        title: gameData.name,
        coverImage: gameData.coverImage,
      },
    });

    return record;
  }
  async findGameByIgdbId(igdbId: number): Promise<Game | null> {
    return prisma.game.findUnique({
      where: {
        igdbId,
      },
    });
  }
  async getUserGamesWithGroupedBacklog(
    userId: string,
    params: FilterParams,
    itemsPerPage?: number,
  ) {
    const { platform, status, search, page } = params;

    const buildPrismaGameFilter = () => {
      const backlogItemFilter: Prisma.BacklogItemWhereInput = {
        userId,
        platform: platform || undefined,
        status:
          !status || status === ''
            ? { not: BacklogItemStatus.WISHLIST }
            : {
                equals: status as BacklogItemStatus,
                not: BacklogItemStatus.WISHLIST,
              },
      };

      if (search) {
        backlogItemFilter.game = {
          is: {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
        };
      }

      return {
        backlogItems: {
          some: backlogItemFilter,
        },
      };
    };

    const buildPrismaBacklogFilter = () => {
      const filter: Prisma.BacklogItemWhereInput = {
        userId,
        platform: platform || undefined,
        status:
          !status || status === ''
            ? { not: BacklogItemStatus.WISHLIST }
            : {
                equals: status as BacklogItemStatus,
                not: BacklogItemStatus.WISHLIST,
              },
      };

      if (search) {
        filter.game = {
          is: {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
        };
      }

      return filter;
    };

    const skip = ((page || 1) - 1) * itemsPerPage!;
    const take = itemsPerPage;

    const gameFilter = buildPrismaGameFilter();
    const backlogFilter = buildPrismaBacklogFilter();

    const [games, totalGames] = await Promise.all([
      prisma.game.findMany({
        where: gameFilter,
        orderBy: { title: 'asc' },
        take,
        skip,
        include: {
          backlogItems: {
            where: backlogFilter,
          },
        },
      }),
      prisma.game.count({
        where: gameFilter,
      }),
    ]);

    const collection: GameWithBacklogItems[] = games.map((game) => ({
      game,
      backlogItems: game.backlogItems ?? [],
    }));

    return { collection, count: totalGames };
  }
}
