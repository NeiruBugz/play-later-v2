import "server-only";

import {
  LibraryItemStatus,
  type LibraryItemWithGameDomain,
} from "@/data-access-layer/domain/library";
import { LibraryService } from "@/data-access-layer/services";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const CONTINUE_PLAYING_LIMIT = 6;

export interface ContinuePlayingData {
  items: LibraryItemWithGameDomain[];
}

interface ContinuePlayingServerProps {
  userId: string;
}

export async function ContinuePlayingServer({
  userId,
}: ContinuePlayingServerProps) {
  const logger = createLogger({
    [LOGGER_CONTEXT.PAGE]: "ContinuePlayingServer",
  });

  try {
    const service = new LibraryService();

    logger.info({ userId }, "Fetching continue playing games");

    const result = await service.getLibraryItems({
      userId,
      status: LibraryItemStatus.PLAYING,
      sortBy: "startedAt",
      sortOrder: "desc",
      distinctByGame: true,
    });

    if (!result.success) {
      logger.error(
        { error: result.error, userId },
        "Failed to fetch continue playing games"
      );
      throw new Error(result.error);
    }

    const limitedItems = result.data.slice(0, CONTINUE_PLAYING_LIMIT);

    logger.info(
      { userId, count: limitedItems.length },
      "Continue playing games fetched successfully"
    );

    const { DashboardGameSection } = await import("./dashboard-game-section");

    return (
      <DashboardGameSection
        title="Continue Playing"
        items={limitedItems}
        viewAllHref="/library?status=PLAYING"
        viewAllLabel="View All Playing"
        emptyMessage="No games in progress. Start exploring something new!"
      />
    );
  } catch (error) {
    logger.error({ error }, "Error in ContinuePlayingServer");
    throw error;
  }
}
