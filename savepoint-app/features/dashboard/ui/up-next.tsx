import "server-only";

import { LibraryService } from "@/data-access-layer/services";

import type { LibraryItemWithGameDomain } from "@/features/library/types";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { LibraryItemStatus } from "@/shared/types/library";

const UP_NEXT_LIMIT = 4;

export interface UpNextData {
  items: LibraryItemWithGameDomain[];
}

interface UpNextProps {
  userId: string;
}

export async function UpNext({ userId }: UpNextProps) {
  const logger = createLogger({
    [LOGGER_CONTEXT.PAGE]: "UpNext",
  });

  try {
    const service = new LibraryService();

    logger.info({ userId }, "Fetching up next games");

    const data = await service.getLibraryItems({
      userId,
      status: LibraryItemStatus.UP_NEXT,
      sortBy: "updatedAt",
      sortOrder: "desc",
      distinctByGame: true,
    });

    const limitedItems = data.items.slice(0, UP_NEXT_LIMIT);

    logger.info(
      { userId, count: limitedItems.length },
      "Up next games fetched successfully"
    );

    const { DashboardGameSection } = await import("./dashboard-game-section");

    return (
      <DashboardGameSection
        title="Up Next"
        items={limitedItems}
        totalCount={data.items.length}
        viewAllHref="/library?status=UP_NEXT"
        viewAllLabel="View All Up Next"
        emptyMessage="No games queued up"
      />
    );
  } catch (error) {
    logger.error({ error }, "Error in UpNext");
    throw error;
  }
}
