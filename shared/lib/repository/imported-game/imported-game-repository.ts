import "server-only";

import { ImportedGame } from "@prisma/client";

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
  // Validate that games array is not empty
  if (!games || games.length === 0) {
    throw new Error("Games array cannot be empty");
  }

  // Get userId from first game and validate it exists
  const userId = games[0].userId;
  if (!userId) {
    throw new Error("UserId is required");
  }

  // Validate that all games belong to the same user
  const allGamesBelongToSameUser = games.every(
    (game) => game.userId === userId
  );
  if (!allGamesBelongToSameUser) {
    throw new Error("All games in the batch must belong to the same user");
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
        // Construct update data, conditionally including image fields
        const updateData: Partial<ImportedGame> = {
          name: game.name,
          playtime: game.playtime,
          deletedAt: null, // Restore if it was soft deleted
          updatedAt: new Date(),
        };

        // Only include image fields if they have truthy values
        if (game.img_icon_url) {
          updateData.img_icon_url = game.img_icon_url;
        }
        if (game.img_logo_url) {
          updateData.img_logo_url = game.img_logo_url;
        }

        const updated = await tx.importedGame.updateMany({
          where: {
            userId,
            storefrontGameId: game.storefrontGameId,
          },
          data: updateData,
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
