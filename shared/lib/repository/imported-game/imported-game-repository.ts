import "server-only";

import { prisma } from "@/shared/lib/db";

import {
  type CreateManyImportedGamesInput,
  type GetFilteredImportedGamesInput,
} from "./types";

export async function softDeleteImportedGame({ id }: { id: string }) {
  return prisma.importedGame.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function getImportedGamesCount({ userId }: { userId: string }) {
  return prisma.importedGame.count({
    where: { userId, deletedAt: null },
  });
}

export async function getFilteredImportedGamesCount({
  whereClause,
}: Pick<GetFilteredImportedGamesInput, "whereClause">) {
  return prisma.importedGame.count({
    where: whereClause,
  });
}

export async function getFilteredImportedGames({
  whereClause,
  page,
  limit,
  orderBy,
}: GetFilteredImportedGamesInput) {
  return prisma.importedGame.findMany({
    where: whereClause,
    skip: (page - 1) * limit,
    take: limit,
    orderBy,
    select: {
      id: true,
      name: true,
      storefront: true,
      storefrontGameId: true,
      playtime: true,
      img_icon_url: true,
      img_logo_url: true,
    },
  });
}

export async function findByStorefrontGameId({
  storefrontGameId,
}: {
  storefrontGameId: string;
}) {
  return prisma.importedGame.findFirst({
    where: { storefrontGameId },
  });
}

export async function createManyImportedGames({
  games,
}: CreateManyImportedGamesInput) {
  return prisma.importedGame.createMany({
    data: games,
  });
}

export async function upsertManyImportedGames({
  games,
}: CreateManyImportedGamesInput) {
  // First, find existing games for this user
  const userId = games[0]?.userId;
  if (!userId) {
    throw new Error("UserId is required");
  }

  const storefrontGameIds = games
    .map((game) => game.storefrontGameId)
    .filter(Boolean) as string[];

  const existingGames = await prisma.importedGame.findMany({
    where: {
      userId,
      storefrontGameId: { in: storefrontGameIds },
    },
    select: {
      id: true,
      storefrontGameId: true,
    },
  });

  const existingGameIds = new Set(
    existingGames.map((game) => game.storefrontGameId)
  );

  // Separate games into updates and creates
  const gamesToUpdate = games.filter(
    (game) =>
      game.storefrontGameId && existingGameIds.has(game.storefrontGameId)
  );
  const gamesToCreate = games.filter(
    (game) =>
      !game.storefrontGameId || !existingGameIds.has(game.storefrontGameId)
  );

  // Use transaction to handle both operations
  return prisma.$transaction(async (tx) => {
    const results = [];

    // Update existing games
    for (const game of gamesToUpdate) {
      if (game.storefrontGameId) {
        const updated = await tx.importedGame.updateMany({
          where: {
            userId,
            storefrontGameId: game.storefrontGameId,
          },
          data: {
            name: game.name,
            playtime: game.playtime,
            img_icon_url: game.img_icon_url,
            img_logo_url: game.img_logo_url,
            deletedAt: null, // Restore if it was soft deleted
            updatedAt: new Date(),
          },
        });
        results.push(updated);
      }
    }

    // Create new games
    if (gamesToCreate.length > 0) {
      const created = await tx.importedGame.createMany({
        data: gamesToCreate,
      });
      results.push(created);
    }

    return results;
  });
}
