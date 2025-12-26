import "server-only";

import { LibraryItemStatus } from "@/data-access-layer/domain/library";
import { LibraryService } from "@/data-access-layer/services";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

export interface DashboardStatsData {
  wantToPlay: number;
  owned: number;
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

    const [wantToPlayResult, ownedResult, playingResult, playedResult] =
      await Promise.all([
        service.getLibraryItems({
          userId,
          status: LibraryItemStatus.WANT_TO_PLAY,
          distinctByGame: true,
        }),
        service.getLibraryItems({
          userId,
          status: LibraryItemStatus.OWNED,
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

    if (!wantToPlayResult.success) {
      logger.error(
        { error: wantToPlayResult.error, userId },
        "Failed to fetch want to play stats"
      );
      throw new Error(wantToPlayResult.error);
    }
    if (!ownedResult.success) {
      logger.error(
        { error: ownedResult.error, userId },
        "Failed to fetch owned stats"
      );
      throw new Error(ownedResult.error);
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
      wantToPlay: wantToPlayResult.data.total,
      owned: ownedResult.data.total,
      playing: playingResult.data.total,
      played: playedResult.data.total,
      total: 0,
    };

    stats.total = stats.wantToPlay + stats.owned + stats.playing + stats.played;

    logger.info(
      { userId, total: stats.total },
      "Dashboard stats fetched successfully"
    );

    const { DashboardStatsCards } = await import("./dashboard-stats-cards");

    return <DashboardStatsCards stats={stats} />;
  } catch (error) {
    logger.error({ error }, "Error in DashboardStats");
    throw error;
  }
}
