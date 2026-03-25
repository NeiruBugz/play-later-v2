import "server-only";

import { LibraryService } from "@/data-access-layer/services";
import { LibraryItemStatus } from "@/shared/types/library";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import type { LibraryItemWithGameDomain } from "@/shared/types/library";

const CONTINUE_PLAYING_LIMIT = 6;

export interface ContinuePlayingData {
  items: LibraryItemWithGameDomain[];
}

interface ContinuePlayingProps {
  userId: string;
}

export async function ContinuePlaying({ userId }: ContinuePlayingProps) {
  const logger = createLogger({
    [LOGGER_CONTEXT.PAGE]: "ContinuePlaying",
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

    const limitedItems = result.data.items.slice(0, CONTINUE_PLAYING_LIMIT);

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
    logger.error({ error }, "Error in ContinuePlaying");
    throw error;
  }
}
