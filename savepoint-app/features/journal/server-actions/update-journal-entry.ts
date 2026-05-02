"use server";

import { JournalService } from "@/data-access-layer/services";
import { revalidatePath, updateTag } from "next/cache";

import type { JournalEntryDomain } from "@/features/journal/types";
import { createServerAction, userTags } from "@/shared/lib";

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
    const {
      entryId,
      kind,
      title,
      content,
      playedMinutes,
      tags,
      mood,
      playSession,
      libraryItemId,
    } = input;
    logger.info({ entryId, userId }, "Updating journal entry");

    const journalService = new JournalService();

    const updateParams: Parameters<
      typeof journalService.updateJournalEntry
    >[0] = {
      userId: userId!,
      entryId,
      updates: {},
    };

    if (kind !== undefined) updateParams.updates.kind = kind;
    if (title !== undefined) updateParams.updates.title = title;
    if (content !== undefined) updateParams.updates.content = content;
    if (playedMinutes !== undefined)
      updateParams.updates.playedMinutes = playedMinutes;
    if (tags !== undefined) updateParams.updates.tags = tags;
    if (mood !== undefined) updateParams.updates.mood = mood;
    if (playSession !== undefined)
      updateParams.updates.playSession = playSession;
    if (libraryItemId !== undefined)
      updateParams.updates.libraryItemId = libraryItemId;

    const entry = await journalService.updateJournalEntry(updateParams);

    updateTag(userTags(userId!).profileStats);
    revalidatePath("/journal/[id]", "page");
    revalidatePath("/journal");
    revalidatePath("/games/[slug]", "page");

    logger.info(
      {
        userId,
        entryId: entry.id,
      },
      "Journal entry updated successfully"
    );

    return {
      success: true,
      data: entry,
    };
  },
});
