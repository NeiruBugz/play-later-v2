import { getServerUserId } from "@/auth";
import { db } from "@/src/shared/api";

export async function getGamesFromWishlist(id?: string) {
  const userId = id ?? (await getServerUserId());

  return db.game.findMany({
    orderBy: { updatedAt: "desc" as "asc" | "desc" },
    select: { gameplayTime: true, id: true, imageUrl: true, title: true },
    where: { deletedAt: null, isWishlisted: true, userId },
  });
}
