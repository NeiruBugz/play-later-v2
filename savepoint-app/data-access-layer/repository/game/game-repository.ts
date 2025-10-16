import "server-only";

import { type Prisma } from "@prisma/client";

import { convertReleaseDateToIsoStringDate, prisma } from "@/shared/lib";
import igdbApi from "@/shared/lib/igdb";

import { type CreateGameInput, type GameInput } from "./types";

export async function createGame({ game }: CreateGameInput) {
  const createdGame = await prisma.game.create({
    data: {
      igdbId: Number(game.igdbId),
      title: game.title,
      coverImage: game.coverImage,
      hltbId: game.hltbId === "" ? null : game.hltbId,
      mainExtra: game.mainExtra !== null ? Number(game.mainExtra) : null,
      mainStory: game.mainStory !== null ? Number(game.mainStory) : null,
      completionist:
        game.completionist !== null ? Number(game.completionist) : null,
      releaseDate:
        game.releaseDate !== undefined && game.releaseDate !== null
          ? new Date(game.releaseDate)
          : null,
      description: game.description,
    },
  });

  return createdGame;
}

export async function isGameExisting({ igdbId }: { igdbId: number | string }) {
  const game = await prisma.game.findUnique({
    where: { igdbId: Number(igdbId) },
  });

  return !!game;
}

export async function findGameByIgdbId({
  igdbId,
}: {
  igdbId: number | string;
}) {
  const game = await prisma.game.findUnique({
    where: { igdbId: Number(igdbId) },
  });

  if (!game) {
    throw new Error("Game not found");
  }

  return game;
}

export async function findManyByIgdbIds({
  igdbIds,
}: {
  igdbIds: Array<number | string>;
}) {
  const numericIds = igdbIds.map((id) => Number(id)).filter((id) => !isNaN(id));
  const games = await prisma.game.findMany({
    where: { igdbId: { in: numericIds } },
  });

  if (games.length === 0) {
    throw new Error("Failed to find games");
  }

  return games;
}

export async function findGameById({ id }: { id: string }) {
  return prisma.game.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      title: true,
      igdbId: true,
      description: true,
      coverImage: true,
      hltbId: true,
      mainStory: true,
      mainExtra: true,
      completionist: true,
      releaseDate: true,
      steamAppId: true,
      createdAt: true,
      updatedAt: true,
      libraryItems: {
        orderBy: {
          updatedAt: "desc",
        },
      },
      Review: true,
    },
  });
}

export async function findGamesWithLibraryItemsPaginated({
  where,
  page,
  itemsPerPage = 24,
}: {
  where: Prisma.GameWhereInput;
  page: number;
  itemsPerPage?: number;
}) {
  const skip = Math.max((page || 1) - 1, 0) * itemsPerPage;

  return prisma.$transaction([
    prisma.game.findMany({
      where,
      orderBy: { title: "asc" },
      take: itemsPerPage,
      skip,
      include: {
        libraryItems: {
          where: where.libraryItems?.some,
        },
      },
    }),
    prisma.game.count({ where }),
  ]);
}

export async function findOrCreateGameByIgdbId({ igdbId }: { igdbId: number }) {
  try {
    return await findGameByIgdbId({ igdbId });
  } catch {
    const gameInfo = await igdbApi.getGameById(igdbId);

    if (!gameInfo) {
      throw new Error(`Game with IGDB ID ${igdbId} not found`);
    }

    const releaseDate = convertReleaseDateToIsoStringDate(
      gameInfo.release_dates[0]?.human
    );

    const gameInput: GameInput = {
      igdbId: String(igdbId),
      title: gameInfo.name,
      coverImage: gameInfo.cover.image_id,
      description: gameInfo.summary,
      releaseDate,
    };

    return createGame({ game: gameInput });
  }
}

export async function updateGame({
  id,
  data,
}: {
  id: string;
  data: Prisma.GameUpdateInput;
}) {
  const game = await prisma.game.update({
    where: { id },
    data,
  });

  return game;
}
