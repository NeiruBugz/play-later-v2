import "server-only";

import type { LibraryItemWithGameDomain } from "@/data-access-layer/domain/library";
import { LibraryService } from "@/data-access-layer/services";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const RECENTLY_ADDED_LIMIT = 8;

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
    });

    if (!result.success) {
      logger.error(
        { error: result.error, userId },
        "Failed to fetch recently added games"
      );
      throw new Error(result.error);
    }

    const limitedItems = result.data.items.slice(0, RECENTLY_ADDED_LIMIT);

    logger.info(
      { userId, count: limitedItems.length },
      "Recently added games fetched successfully"
    );

    const { DashboardGameSection } = await import("./dashboard-game-section");

    return (
      <DashboardGameSection
        title="Recently Added"
        items={limitedItems}
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
