import "server-only";

import { LibraryService } from "@/data-access-layer/services";
import { LibraryItemStatus } from "@/data-access-layer/domain/library";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

export interface DashboardStatsData {
  wishlist: number;
  curiousAbout: number;
  currentlyExploring: number;
  tookABreak: number;
  experienced: number;
  revisiting: number;
  total: number;
}

interface DashboardStatsServerProps {
  userId: string;
}

export async function DashboardStatsServer({
  userId,
}: DashboardStatsServerProps) {
  const logger = createLogger({ [LOGGER_CONTEXT.PAGE]: "DashboardStatsServer" });

  try {
    const service = new LibraryService();

    logger.info({ userId }, "Fetching dashboard stats");

    const [
      wishlistResult,
      curiousAboutResult,
      currentlyExploringResult,
      tookABreakResult,
      experiencedResult,
      revisitingResult,
    ] = await Promise.all([
      service.getLibraryItems({
        userId,
        status: LibraryItemStatus.WISHLIST,
        distinctByGame: true,
      }),
      service.getLibraryItems({
        userId,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        distinctByGame: true,
      }),
      service.getLibraryItems({
        userId,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
        distinctByGame: true,
      }),
      service.getLibraryItems({
        userId,
        status: LibraryItemStatus.TOOK_A_BREAK,
        distinctByGame: true,
      }),
      service.getLibraryItems({
        userId,
        status: LibraryItemStatus.EXPERIENCED,
        distinctByGame: true,
      }),
      service.getLibraryItems({
        userId,
        status: LibraryItemStatus.REVISITING,
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
    if (!curiousAboutResult.success) {
      logger.error(
        { error: curiousAboutResult.error, userId },
        "Failed to fetch curious about stats"
      );
      throw new Error(curiousAboutResult.error);
    }
    if (!currentlyExploringResult.success) {
      logger.error(
        { error: currentlyExploringResult.error, userId },
        "Failed to fetch currently exploring stats"
      );
      throw new Error(currentlyExploringResult.error);
    }
    if (!tookABreakResult.success) {
      logger.error(
        { error: tookABreakResult.error, userId },
        "Failed to fetch took a break stats"
      );
      throw new Error(tookABreakResult.error);
    }
    if (!experiencedResult.success) {
      logger.error(
        { error: experiencedResult.error, userId },
        "Failed to fetch experienced stats"
      );
      throw new Error(experiencedResult.error);
    }
    if (!revisitingResult.success) {
      logger.error(
        { error: revisitingResult.error, userId },
        "Failed to fetch revisiting stats"
      );
      throw new Error(revisitingResult.error);
    }

    const stats: DashboardStatsData = {
      wishlist: wishlistResult.data.length,
      curiousAbout: curiousAboutResult.data.length,
      currentlyExploring: currentlyExploringResult.data.length,
      tookABreak: tookABreakResult.data.length,
      experienced: experiencedResult.data.length,
      revisiting: revisitingResult.data.length,
      total: 0,
    };

    stats.total =
      stats.wishlist +
      stats.curiousAbout +
      stats.currentlyExploring +
      stats.tookABreak +
      stats.experienced +
      stats.revisiting;

    logger.info(
      { userId, total: stats.total },
      "Dashboard stats fetched successfully"
    );

    const { DashboardStatsCards } = await import("./dashboard-stats-cards");

    return <DashboardStatsCards stats={stats} />;
  } catch (error) {
    logger.error({ error }, "Error in DashboardStatsServer");
    throw error;
  }
}
