import "server-only";

import {
  repositoryError,
  RepositoryErrorCode,
  repositorySuccess,
  type RepositoryResult,
} from "@/data-access-layer/repository/types";
import { Prisma, type Game as PrismaGame } from "@prisma/client";

import { prisma } from "@/shared/lib/app/db";

type GameWithRelations = PrismaGame & {
  genres: Array<{ genre: { id: string; name: string; slug: string } }>;
  platforms: Array<{ platform: { id: string; name: string; slug: string } }>;
};
type IgdbGame = {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  cover?: { image_id?: string };
  first_release_date?: number;
  franchise?: { id: number };
};
export async function findGameBySlug(
  slug: string
): Promise<RepositoryResult<GameWithRelations | null>> {
  try {
    const game = await prisma.game.findUnique({
      where: { slug },
      include: {
        genres: { include: { genre: true } },
        platforms: { include: { platform: true } },
      },
    });
    return repositorySuccess(game);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find game by slug: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
export async function findGameByIgdbId(
  igdbId: number
): Promise<RepositoryResult<GameWithRelations | null>> {
  try {
    const game = await prisma.game.findUnique({
      where: { igdbId },
      include: {
        genres: { include: { genre: true } },
        platforms: { include: { platform: true } },
      },
    });
    return repositorySuccess(game);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find game by IGDB ID: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
export async function gameExistsByIgdbId(
  igdbId: number
): Promise<RepositoryResult<boolean>> {
  try {
    const count = await prisma.game.count({ where: { igdbId } });
    return repositorySuccess(count > 0);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to check game existence: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export type GameBasicInfo = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
};

export async function findGamesByIds(
  ids: string[]
): Promise<RepositoryResult<GameBasicInfo[]>> {
  try {
    if (ids.length === 0) {
      return repositorySuccess([]);
    }
    const games = await prisma.game.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
      },
    });
    return repositorySuccess(games);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find games by IDs: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function findGameById(
  id: string
): Promise<RepositoryResult<GameBasicInfo | null>> {
  try {
    const game = await prisma.game.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
      },
    });
    return repositorySuccess(game);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find game by ID: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
export async function createGameWithRelations(params: {
  igdbGame: IgdbGame;
  genreIds: string[];
  platformIds: string[];
}): Promise<RepositoryResult<PrismaGame>> {
  try {
    const { igdbGame, genreIds, platformIds } = params;
    const game = await prisma.game.create({
      data: {
        igdbId: igdbGame.id,
        slug: igdbGame.slug,
        title: igdbGame.name,
        description: igdbGame.summary || null,
        coverImage: igdbGame.cover?.image_id || null,
        releaseDate: igdbGame.first_release_date
          ? new Date(igdbGame.first_release_date * 1000)
          : null,
        franchiseId: igdbGame.franchise?.id || null,
        genres: {
          create: genreIds.map((genreId) => ({ genreId })),
        },
        platforms: {
          create: platformIds.map((platformId) => ({ platformId })),
        },
      },
    });
    return repositorySuccess(game);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return repositoryError(
        RepositoryErrorCode.DUPLICATE,
        "Game already exists"
      );
    }
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to create game: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
