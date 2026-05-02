"use server";

import { JournalService } from "@/data-access-layer/services";
import { revalidatePath, revalidateTag } from "next/cache";

import type { JournalEntryDomain } from "@/features/journal/types";
import { createServerAction, userTags } from "@/shared/lib";

import {
  CreateJournalEntrySchema,
  type CreateJournalEntryInput,
} from "../schemas";

export const createJournalEntryAction = createServerAction<
  CreateJournalEntryInput,
  JournalEntryDomain
>({
  actionName: "createJournalEntryAction",
  schema: CreateJournalEntrySchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const {
      gameId,
      kind,
      title,
      content,
      playedMinutes,
      tags,
      mood,
      playSession,
      libraryItemId,
    } = input;
    logger.info({ gameId, userId }, "Creating journal entry");
    const journalService = new JournalService();
    const entry = await journalService.createJournalEntry({
      userId: userId!,
      gameId,
      kind,
      title,
      content,
      playedMinutes,
      tags,
      mood,
      playSession,
      libraryItemId,
    });
    revalidateTag(userTags(userId!).profileStats, "max");
    revalidatePath("/journal");
    revalidatePath("/games/[slug]", "page");
    logger.info(
      {
        userId,
        entryId: entry.id,
        gameId,
      },
      "Journal entry created successfully"
    );
    return {
      success: true,
      data: entry,
    };
  },
});
