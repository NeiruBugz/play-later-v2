"use server";

import { LibraryService, ProfileService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";

import { createServerAction } from "@/shared/lib";

import { SetLibraryRatingSchema, type SetLibraryRatingInput } from "../schemas";

export const setLibraryRatingAction = createServerAction<
  SetLibraryRatingInput,
  void
>({
  actionName: "setLibraryRatingAction",
  schema: SetLibraryRatingSchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const { libraryItemId, rating } = input;
    logger.info(
      { libraryItemId, rating, userId },
      "Setting library item rating"
    );

    const libraryService = new LibraryService();
    await libraryService.setRating({
      libraryItemId,
      userId: userId!,
      rating,
    });

    revalidatePath("/library");

    const profileService = new ProfileService();
    const profileResult = await profileService.getProfile({ userId: userId! });
    if (profileResult.success && profileResult.data.profile.username) {
      revalidatePath(`/u/${profileResult.data.profile.username}`);
    }

    logger.info(
      { userId, libraryItemId, rating },
      "Library rating set successfully"
    );

    return {
      success: true,
      data: undefined,
    };
  },
});
