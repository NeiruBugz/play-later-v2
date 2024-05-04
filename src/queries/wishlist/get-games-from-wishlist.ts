import { getServerUserId } from "@/auth";
import { prisma } from "@/src/packages/prisma";

export async function getGamesFromWishlist(id?: string) {
  const userId = id ?? (await getServerUserId());

  return prisma.game.findMany({
    orderBy: { updatedAt: "desc" as "asc" | "desc" },
    select: { gameplayTime: true, id: true, imageUrl: true, title: true },
    where: { deletedAt: null, isWishlisted: true, userId },
  });
}
