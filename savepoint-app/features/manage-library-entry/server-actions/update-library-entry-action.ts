"use server";

import { LibraryService } from "@/data-access-layer/services";
import { revalidatePath, revalidateTag } from "next/cache";

import type { LibraryItemDomain } from "@/features/library/types";
import { createServerAction, userTags } from "@/shared/lib";

import {
  UpdateLibraryEntrySchema,
  type UpdateLibraryEntryInput,
} from "../schemas";

export const updateLibraryEntryAction = createServerAction<
  UpdateLibraryEntryInput,
  LibraryItemDomain
>({
  actionName: "updateLibraryEntryAction",
  schema: UpdateLibraryEntrySchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const { libraryItemId, status, startedAt, completedAt, platform } = input;
    logger.info({ libraryItemId, status, userId }, "Updating library entry");
    const libraryService = new LibraryService();
    const normalizedPlatform =
      platform === undefined ? undefined : platform === "" ? null : platform;
    const data = await libraryService.updateLibraryItem({
      userId: userId!,
      libraryItem: {
        id: libraryItemId,
        status,
        ...(status !== undefined && { statusChangedAt: new Date() }),
        ...(startedAt !== undefined && { startedAt }),
        ...(completedAt !== undefined && { completedAt }),
        ...(normalizedPlatform !== undefined && {
          platform: normalizedPlatform,
        }),
      },
    });
    const tags = userTags(userId!);
    revalidateTag(tags.libraryCounts, "max");
    revalidateTag(tags.profileStats, "max");
    revalidatePath("/games/[slug]", "page");
    logger.info(
      {
        userId,
        libraryItemId: data.id,
        status,
      },
      "Library entry updated successfully"
    );
    return {
      success: true,
      data,
    };
  },
});
