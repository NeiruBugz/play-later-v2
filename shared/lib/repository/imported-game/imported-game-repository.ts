import "server-only";

import { prisma } from "@/shared/lib/db";

import type { GetFilteredImportedGamesInput } from "./types";

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
