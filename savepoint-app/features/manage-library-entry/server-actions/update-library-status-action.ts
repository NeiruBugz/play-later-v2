"use server";

import { LibraryService } from "@/data-access-layer/services";
import { revalidatePath, revalidateTag } from "next/cache";

import type { LibraryItemDomain } from "@/features/library/types";
import { createServerAction, userTags } from "@/shared/lib";

import {
  UpdateLibraryStatusByIgdbSchema,
  type UpdateLibraryStatusByIgdbInput,
} from "../schemas";
import { addToLibraryAction } from "./add-to-library-action";

export const updateLibraryStatusAction = createServerAction<
  UpdateLibraryStatusByIgdbInput,
  LibraryItemDomain
>({
  actionName: "updateLibraryStatusAction",
  schema: UpdateLibraryStatusByIgdbSchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const { igdbId, status } = input;

    logger.info({ igdbId, status, userId }, "Updating library status");

    const libraryService = new LibraryService();
    const game = await libraryService.findGameByIgdbId(igdbId);

    if (!game) {
      logger.info(
        { igdbId, userId },
        "Game not in library, adding with new status"
      );
      return addToLibraryAction({ igdbId, status, platform: undefined });
    }

    const mostRecentItem =
      await libraryService.findMostRecentLibraryItemByGameId({
        userId: userId!,
        gameId: game.id,
      });

    if (!mostRecentItem) {
      logger.info(
        { igdbId, userId },
        "No library item found, adding game to library"
      );
      return addToLibraryAction({ igdbId, status, platform: undefined });
    }

    if (status === mostRecentItem.status) {
      logger.info(
        { igdbId, userId, status },
        "Status unchanged, skipping update"
      );
      return { success: true, data: mostRecentItem };
    }

    const data = await libraryService.updateLibraryItem({
      userId: userId!,
      libraryItem: {
        id: mostRecentItem.id,
        status,
        statusChangedAt: new Date(),
      },
    });

    const tags = userTags(userId!);
    revalidateTag(tags.libraryCounts, "max");
    revalidateTag(tags.profileStats, "max");
    revalidatePath(`/games/${game.slug}`);
    logger.info(
      {
        userId,
        libraryItemId: data.id,
        status,
      },
      "Library status updated successfully"
    );

    return {
      success: true,
      data,
    };
  },
});
