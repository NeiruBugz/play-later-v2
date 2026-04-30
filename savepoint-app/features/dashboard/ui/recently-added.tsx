import "server-only";

import { LibraryService } from "@/data-access-layer/services";

import type { LibraryItemWithGameDomain } from "@/features/library/types";
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

    const data = await service.getLibraryItems({
      userId,
      sortBy: "createdAt",
      sortOrder: "desc",
      distinctByGame: true,
      limit: RECENTLY_ADDED_LIMIT,
    });

    logger.info(
      { userId, count: data.items.length },
      "Recently added games fetched successfully"
    );

    const { DashboardGameSection } = await import("./dashboard-game-section");

    return (
      <DashboardGameSection
        title="Recently Added"
        items={data.items}
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
