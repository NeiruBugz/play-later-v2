import "server-only";

import { prisma } from "@/shared/lib/db";

import { CreateGameInput } from "./types";

export async function createGame({ game }: CreateGameInput) {
  const createdGame = await prisma.game.create({
    data: {
      igdbId: Number(game.igdbId),
      title: game.title,
      coverImage: game.coverImage,
      hltbId: game.hltbId === "" ? null : game.hltbId,
      mainExtra: game.mainExtra ? Number(game.mainExtra) : null,
      mainStory: game.mainStory ? Number(game.mainStory) : null,
      completionist: game.completionist ? Number(game.completionist) : null,
      releaseDate: game.releaseDate ? new Date(game.releaseDate) : null,
      description: game.description,
    },
  });

  if (!createdGame) {
    throw new Error("Failed to create game");
  }

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
  igdbIds: (number | string)[];
}) {
  const numericIds = igdbIds.map((id) => Number(id)).filter((id) => !isNaN(id));
  const games = await prisma.game.findMany({
    where: { igdbId: { in: numericIds } },
  });

  if (!games) {
    throw new Error("Failed to find games");
  }

  return games;
}
