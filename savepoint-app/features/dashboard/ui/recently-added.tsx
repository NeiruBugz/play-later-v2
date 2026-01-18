import "server-only";

import type { LibraryItemWithGameDomain } from "@/data-access-layer/domain/library";
import { LibraryService } from "@/data-access-layer/services";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const RECENTLY_ADDED_LIMIT = 6;

export interface RecentlyAddedData {
  items: LibraryItemWithGameDomain[];
}

interface RecentlyAddedProps {
  userId: string;
}

export async function RecentlyAdded({ userId }: RecentlyAddedProps) {
  const logger = createLogger({ [LOGGER_CONTEXT.PAGE]: "RecentlyAdded" });

  try {
    const service = new LibraryService();

    logger.info({ userId }, "Fetching recently added games");

    const result = await service.getLibraryItems({
      userId,
      sortBy: "createdAt",
      sortOrder: "desc",
      distinctByGame: true,
      limit: RECENTLY_ADDED_LIMIT,
    });

    if (!result.success) {
      logger.error(
        { error: result.error, userId },
        "Failed to fetch recently added games"
      );
      throw new Error(result.error);
    }

    logger.info(
      { userId, count: result.data.items.length },
      "Recently added games fetched successfully"
    );

    const { DashboardGameSection } = await import("./dashboard-game-section");

    return (
      <DashboardGameSection
        title="Recently Added"
        items={result.data.items}
        viewAllHref="/library?sortBy=createdAt&sortOrder=desc"
        viewAllLabel="View Library"
        emptyMessage="Your library is empty. Add some games to get started!"
      />
    );
  } catch (error) {
    logger.error({ error }, "Error in RecentlyAdded");
    throw error;
  }
}
