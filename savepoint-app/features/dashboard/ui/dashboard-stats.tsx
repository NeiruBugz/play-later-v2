import "server-only";

import { LibraryService } from "@/data-access-layer/services";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { LibraryItemStatus } from "@/shared/types/library";

export interface DashboardStatsData {
  wishlist: number;
  shelf: number;
  upNext: number;
  playing: number;
  played: number;
  total: number;
}

interface DashboardStatsProps {
  userId: string;
}

export async function DashboardStats({ userId }: DashboardStatsProps) {
  const logger = createLogger({
    [LOGGER_CONTEXT.PAGE]: "DashboardStats",
  });

  try {
    const service = new LibraryService();

    logger.info({ userId }, "Fetching dashboard stats");

    const [wishlist, shelf, upNext, playing, played] = await Promise.all([
      service.getLibraryItems({
        userId,
        status: LibraryItemStatus.WISHLIST,
        distinctByGame: true,
      }),
      service.getLibraryItems({
        userId,
        status: LibraryItemStatus.SHELF,
        distinctByGame: true,
      }),
      service.getLibraryItems({
        userId,
        status: LibraryItemStatus.UP_NEXT,
        distinctByGame: true,
      }),
      service.getLibraryItems({
        userId,
        status: LibraryItemStatus.PLAYING,
        distinctByGame: true,
      }),
      service.getLibraryItems({
        userId,
        status: LibraryItemStatus.PLAYED,
        distinctByGame: true,
      }),
    ]);

    const stats: DashboardStatsData = {
      wishlist: wishlist.total,
      shelf: shelf.total,
      upNext: upNext.total,
      playing: playing.total,
      played: played.total,
      total: 0,
    };

    stats.total =
      stats.wishlist +
      stats.shelf +
      stats.upNext +
      stats.playing +
      stats.played;

    logger.info(
      { userId, total: stats.total },
      "Dashboard stats fetched successfully"
    );

    if (stats.total < 3) {
      return null;
    }

    const { DashboardStatsCards } = await import("./dashboard-stats-cards");

    return <DashboardStatsCards stats={stats} />;
  } catch (error) {
    logger.error({ error }, "Error in DashboardStats");
    throw error;
  }
}
