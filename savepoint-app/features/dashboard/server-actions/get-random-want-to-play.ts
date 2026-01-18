"use server";

import { LibraryService } from "@/data-access-layer/services";

import { createServerAction } from "@/shared/lib";

import { GetRandomWantToPlaySchema } from "../schemas";

export const getRandomWantToPlayAction = createServerAction({
  actionName: "getRandomWantToPlayAction",
  schema: GetRandomWantToPlaySchema,
  requireAuth: true,
  handler: async ({ userId, logger }) => {
    logger.info({ userId }, "Fetching random want-to-play game");

    const service = new LibraryService();
    const result = await service.getRandomWantToPlayGame({ userId: userId! });

    if (!result.success) {
      logger.error({ error: result.error, userId }, "Service call failed");
      return {
        success: false,
        error: result.error,
      };
    }

    logger.info(
      { userId, hasGame: result.data !== null },
      "Random want-to-play game action completed"
    );

    return {
      success: true,
      data: result.data,
    };
  },
});
