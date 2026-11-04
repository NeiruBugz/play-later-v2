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
          select: { id: true, slug: true, title: true, coverImage: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: RECENT_GAMES_LIMIT,
    }),
    prisma.journalEntry.count({ where: { userId } }),
  ]);

  const countOf = (status: "WANT" | "PLAYING" | "DONE") =>
    statusCountsRaw.find((row) => row.status === status)?._count ?? 0;

  const recentGames: RecentGame[] = recentItems.map((item) => ({
    gameId: item.game.id,
    slug: item.game.slug,
    title: item.game.title,
    coverImage: item.game.coverImage,
    lastPlayed: item.updatedAt,
  }));

  return {
    want: countOf("WANT"),
    playing: countOf("PLAYING"),
    done: countOf("DONE"),
    recentGames,
    journalCount,
  };
}
