"use server";

import { LibraryService } from "@/data-access-layer/services";

import { createServerAction } from "@/shared/lib";

import { GetRandomWishlistGameSchema } from "../schemas";

export const getRandomWishlistGameAction = createServerAction({
  actionName: "getRandomWishlistGameAction",
  schema: GetRandomWishlistGameSchema,
  requireAuth: true,
  handler: async ({ userId, logger }) => {
    logger.info({ userId }, "Fetching random wishlist game");

    const service = new LibraryService();
    const result = await service.getRandomWishlistGame({ userId: userId! });

    if (!result.success) {
      logger.error({ error: result.error, userId }, "Service call failed");
      return {
        success: false,
        error: result.error,
      };
    }

    logger.info(
      { userId, hasGame: result.data !== null },
      "Random wishlist game action completed"
    );

    return {
      success: true,
      data: result.data,
    };
  },
});
