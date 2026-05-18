import { RECENT_GAMES_LIMIT } from "@/shared/lib/constants";
import { prisma } from "@/shared/lib/db.server";

import type { LibraryStats, RecentGame } from "../model/types";

export type { LibraryStats, RecentGame } from "../model/types";

export async function getLibraryStats(userId: string): Promise<LibraryStats> {
  const [statusCountsRaw, recentItems, journalCount] = await Promise.all([
    prisma.libraryItem.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    }),
    prisma.libraryItem.findMany({
      where: { userId, status: "PLAYING" },
      include: {
        game: {
          select: { id: true, title: true, coverImage: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: RECENT_GAMES_LIMIT,
    }),
    prisma.journalEntry.count({ where: { userId } }),
  ]);

  const statusCounts = statusCountsRaw.reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.status] = item._count;
      return acc;
    },
    {}
  );

  const recentGames: RecentGame[] = recentItems.map((item) => ({
    gameId: item.game.id,
    title: item.game.title,
    coverImage: item.game.coverImage,
    lastPlayed: item.updatedAt,
  }));

  return { statusCounts, recentGames, journalCount };
}
