import { Game } from '@/domain/entities/Game';
import {
  FilterParams,
  GameRepository,
  GameWithBacklogItems,
} from '@/domain/repositories/GameRepository';
import { prisma } from '@/infrastructure/prisma/client';
import { BacklogItemStatus, Genre, Prisma, Screenshot } from '@prisma/client';

export class PrismaGameRepository implements GameRepository {
  async create(
    gameData: Partial<Game> & {
      igdbId: number;
      name: string;
      coverImage?: string | null;
      description?: string;
      releaseDate?: Date | null;
      screenshots?: Screenshot[];
      genres?: Genre[];
      aggregatedRating: number | null;
    },
  ): Promise<Game> {
    const genresConnectOrCreate = gameData.genres?.map((genre) => ({
      where: { id: genre.id },
      create: {
        id: genre.id,
        name: genre.name,
      },
    }));

    const screenshots = gameData.screenshots?.map((screenshot) => ({
      where: { id: screenshot.id },
      create: {
        id: screenshot.id,
        image_id: screenshot.image_id,
      },
    }));

    const record = await prisma.game.create({
      data: {
        igdbId: gameData.igdbId,
        title: gameData.name,
        coverImage: gameData.coverImage,
        releaseDate: gameData.releaseDate,
        description: gameData.description,
        aggregatedRating: gameData.aggregatedRating,
        screenshots: {
          connectOrCreate: screenshots || [],
        },
        genres: {
          connectOrCreate: genresConnectOrCreate || [],
        },
      },
    });

    return record;
  }
  async findGameByIgdbId(igdbId: number): Promise<Game | null> {
    return prisma.game.findUnique({ where: { igdbId } });
  }
  async findGameByIdWithUsersBacklog(gameId: string, userId: string) {
    return prisma.game.findUnique({
      where: { id: gameId },
      include: { backlogItems: { where: { userId } } },
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
          is: { title: { contains: search, mode: 'insensitive' } },
        };
      }

      return { backlogItems: { some: backlogItemFilter } };
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
          is: { title: { contains: search, mode: 'insensitive' } },
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
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          backlogItems: { where: backlogFilter },
          screenshots: false,
          genres: false,
        },
      }),
      prisma.game.count({ where: gameFilter }),
    ]);

    const collection: GameWithBacklogItems[] = games.map((game) => ({
      game,
      backlogItems: game.backlogItems ?? [],
    }));

    return { collection, count: totalGames };
  }

  async getUserWishlistedGamesGroupedBacklog(
    userId: string,
    pageParam: string,
  ) {
    const page = Number(pageParam);
    const skip = ((page || 1) - 1) * 24;
    const take = 24;

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
}
