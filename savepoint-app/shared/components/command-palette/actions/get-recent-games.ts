"use server";

import { LibraryItemStatus } from "@/data-access-layer/domain/library";
import { LibraryService } from "@/data-access-layer/services";
import { z } from "zod";

import { createServerAction } from "@/shared/lib";

import type { RecentGameItem } from "../command-palette.types";

const RECENT_GAMES_LIMIT = 5;

export const getRecentGamesAction = createServerAction<void, RecentGameItem[]>({
  actionName: "getRecentGamesAction",
  schema: z.void().optional(),
  requireAuth: false,
  handler: async ({ userId, logger }) => {
    if (!userId) {
      logger.debug("No user authenticated, returning empty recent games");
      return { success: true, data: [] };
    }

    logger.info({ userId }, "Fetching recent games for command palette");

    const service = new LibraryService();

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
        "Failed to fetch recent games"
      );
      return { success: false, error: result.error };
    }

    const recentGames: RecentGameItem[] = result.data.items
      .slice(0, RECENT_GAMES_LIMIT)
      .map((item) => ({
        id: item.id,
        name: item.game.title,
        slug: item.game.slug,
        coverImageId: item.game.coverImage,
        status: item.status,
      }));

    logger.info({ userId, count: recentGames.length }, "Recent games fetched");

    return { success: true, data: recentGames };
  },
});
