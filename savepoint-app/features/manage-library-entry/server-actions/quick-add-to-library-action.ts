"use server";

import { revalidatePath } from "next/cache";

import type { LibraryItemDomain } from "@/features/library/types";
import { createServerAction } from "@/shared/lib";
import { AcquisitionType, LibraryItemStatus } from "@/shared/types";

import {
  QuickAddToLibrarySchema,
  type QuickAddToLibraryInput,
} from "../schemas";
import { addGameToLibrary } from "../use-cases/add-game-to-library";

export const quickAddToLibraryAction = createServerAction<
  QuickAddToLibraryInput,
  LibraryItemDomain
>({
  actionName: "quickAddToLibraryAction",
  schema: QuickAddToLibrarySchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const { igdbId } = input;
    const status = input.status ?? LibraryItemStatus.UP_NEXT;

    logger.info({ igdbId, status, userId }, "Quick-adding game to library");

    const result = await addGameToLibrary({
      userId: userId!,
      igdbId,
      status,
      acquisitionType: AcquisitionType.DIGITAL,
      autoDetectPlatform: true,
    });

    if (!result.success) {
      logger.error(
        { error: result.error, userId, igdbId },
        "Use case failed to quick-add game"
      );
      return {
        success: false,
        error: result.error,
      };
    }

    revalidatePath(`/games/${result.data.gameSlug}`);
    revalidatePath("/library");

    logger.info(
      {
        userId,
        igdbId,
        libraryItemId: result.data.libraryItem.id,
        resolvedPlatform: result.data.libraryItem.platform,
        autoDetect: true,
        status,
      },
      "Game quick-added to library successfully"
    );

    return {
      success: true,
      data: result.data.libraryItem,
    };
  },
});
