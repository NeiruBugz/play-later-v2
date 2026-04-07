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

    const [
      wishlistResult,
      shelfResult,
      upNextResult,
      playingResult,
      playedResult,
    ] = await Promise.all([
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

    if (!wishlistResult.success) {
      logger.error(
        { error: wishlistResult.error, userId },
        "Failed to fetch wishlist stats"
      );
      throw new Error(wishlistResult.error);
    }
    if (!shelfResult.success) {
      logger.error(
        { error: shelfResult.error, userId },
        "Failed to fetch shelf stats"
      );
      throw new Error(shelfResult.error);
    }
    if (!upNextResult.success) {
      logger.error(
        { error: upNextResult.error, userId },
        "Failed to fetch up next stats"
      );
      throw new Error(upNextResult.error);
    }
    if (!playingResult.success) {
      logger.error(
        { error: playingResult.error, userId },
        "Failed to fetch playing stats"
      );
      throw new Error(playingResult.error);
    }
    if (!playedResult.success) {
      logger.error(
        { error: playedResult.error, userId },
        "Failed to fetch played stats"
      );
      throw new Error(playedResult.error);
    }

    const stats: DashboardStatsData = {
      wishlist: wishlistResult.data.total,
      shelf: shelfResult.data.total,
      upNext: upNextResult.data.total,
      playing: playingResult.data.total,
      played: playedResult.data.total,
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
