"use server";

import type { JournalEntryDomain } from "@/data-access-layer/domain/journal";
import { JournalService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";

import { createServerAction } from "@/shared/lib";

import {
  UpdateJournalEntrySchema,
  type UpdateJournalEntryInput,
} from "../schemas";

export const updateJournalEntryAction = createServerAction<
  UpdateJournalEntryInput,
  JournalEntryDomain
>({
  actionName: "updateJournalEntryAction",
  schema: UpdateJournalEntrySchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const { entryId, title, content, mood, playSession, libraryItemId } = input;
    logger.info({ entryId, userId }, "Updating journal entry");

    const journalService = new JournalService();

    const updateParams: Parameters<
      typeof journalService.updateJournalEntry
    >[0] = {
      userId: userId!,
      entryId,
      updates: {},
    };

    if (title !== undefined) updateParams.updates.title = title;
    if (content !== undefined) updateParams.updates.content = content;
    if (mood !== undefined) updateParams.updates.mood = mood;
    if (playSession !== undefined)
      updateParams.updates.playSession = playSession;
    if (libraryItemId !== undefined)
      updateParams.updates.libraryItemId = libraryItemId;

    const result = await journalService.updateJournalEntry(updateParams);

    if (!result.success) {
      logger.error(
        { error: result.error, userId, entryId },
        "Failed to update journal entry"
      );
      return {
        success: false,
        error: result.error,
      };
    }

    revalidatePath("/journal/[id]", "page");
    revalidatePath("/journal");
    revalidatePath("/games/[slug]", "page");

    logger.info(
      {
        userId,
        entryId: result.data.id,
      },
      "Journal entry updated successfully"
    );

    return {
      success: true,
      data: result.data,
    };
  },
});
