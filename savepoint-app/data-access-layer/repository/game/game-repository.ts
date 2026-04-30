import "server-only";

import { Prisma, type Game as PrismaGame } from "@prisma/client";

import { prisma } from "@/shared/lib/app/db";
import { ConflictError } from "@/shared/lib/errors";

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
): Promise<GameWithRelations | null> {
  return prisma.game.findUnique({
    where: { slug },
    include: {
      genres: { include: { genre: true } },
      platforms: { include: { platform: true } },
    },
  });
}

export async function findGameByIgdbId(
  igdbId: number
): Promise<GameWithRelations | null> {
  return prisma.game.findUnique({
    where: { igdbId },
    include: {
      genres: { include: { genre: true } },
      platforms: { include: { platform: true } },
    },
  });
}

export async function gameExistsByIgdbId(igdbId: number): Promise<boolean> {
  const count = await prisma.game.count({ where: { igdbId } });
  return count > 0;
}

export type GameBasicInfo = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
};

export async function findGamesByIds(ids: string[]): Promise<GameBasicInfo[]> {
  if (ids.length === 0) return [];
  return prisma.game.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
    },
  });
}

export async function findGameById(id: string): Promise<GameBasicInfo | null> {
  return prisma.game.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
    },
  });
}

export async function createGameWithRelations(params: {
  igdbGame: IgdbGame;
  genreIds: string[];
  platformIds: string[];
}): Promise<PrismaGame> {
  const { igdbGame, genreIds, platformIds } = params;
  try {
    return await prisma.game.create({
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
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictError("Game already exists", {
        igdbId: params.igdbGame.id,
        slug: params.igdbGame.slug,
      });
    }
    throw error;
  }
}
