"use server";

import { JournalService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";

import type { JournalEntryDomain } from "@/features/journal/types";
import { createServerAction } from "@/shared/lib";

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
    const result = await journalService.createJournalEntry({
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
    if (!result.success) {
      logger.error(
        { error: result.error, userId, gameId },
        "Failed to create journal entry"
      );
      return {
        success: false,
        error: result.error,
      };
    }
    revalidatePath("/journal");
    revalidatePath("/games/[slug]", "page");
    logger.info(
      {
        userId,
        entryId: result.data.id,
        gameId,
      },
      "Journal entry created successfully"
    );
    return {
      success: true,
      data: result.data,
    };
  },
});
