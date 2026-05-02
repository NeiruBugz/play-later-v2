"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import type { LibraryItemDomain } from "@/features/library/types";
import { createServerAction, userTags } from "@/shared/lib";

import { AddToLibrarySchema, type AddToLibraryInput } from "../schemas";
import { addGameToLibrary } from "../use-cases/add-game-to-library";

export const addToLibraryAction = createServerAction<
  AddToLibraryInput,
  LibraryItemDomain
>({
  actionName: "addToLibraryAction",
  schema: AddToLibrarySchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const { igdbId, status, platform, startedAt, completedAt } = input;
    logger.info({ igdbId, userId }, "Adding game to library");
    const result = await addGameToLibrary({
      userId: userId!,
      igdbId,
      status,
      platform,
      startedAt,
      completedAt,
    });
    if (!result.success) {
      logger.error(
        { error: result.error, userId, igdbId },
        "Use case failed to add game"
      );
      return {
        success: false,
        error: result.error,
      };
    }
    const tags = userTags(userId!);
    revalidateTag(tags.libraryCounts, "max");
    revalidateTag(tags.profileStats, "max");
    revalidatePath(`/games/${result.data.gameSlug}`);
    logger.info(
      {
        userId,
        libraryItemId: result.data.libraryItem.id,
        status,
      },
      "Game added to library successfully"
    );
    return {
      success: true,
      data: result.data.libraryItem,
    };
  },
});
