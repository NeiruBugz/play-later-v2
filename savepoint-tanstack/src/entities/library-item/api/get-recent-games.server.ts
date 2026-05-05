import { RECENT_GAMES_LIMIT } from "@/shared/lib/constants";
import { prisma } from "@/shared/lib/db";

import type { RecentGame } from "./get-library-stats.server";

export async function getRecentGames(userId: string): Promise<RecentGame[]> {
  const items = await prisma.libraryItem.findMany({
    where: { userId, status: "PLAYING" },
    include: {
      game: {
        select: { id: true, title: true, coverImage: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: RECENT_GAMES_LIMIT,
  });

  return items.map((item) => ({
    gameId: item.game.id,
    title: item.game.title,
    coverImage: item.game.coverImage,
    lastPlayed: item.updatedAt,
  }));
}
