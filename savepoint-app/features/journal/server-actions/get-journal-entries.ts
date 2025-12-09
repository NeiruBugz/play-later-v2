"use server";

import type { JournalEntryDomain } from "@/data-access-layer/domain/journal";
import { JournalService } from "@/data-access-layer/services";
import { z } from "zod";

import { createServerAction } from "@/shared/lib";

const GetJournalEntriesSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
});

export const getJournalEntriesAction = createServerAction<
  z.input<typeof GetJournalEntriesSchema>,
  JournalEntryDomain[]
>({
  actionName: "getJournalEntriesAction",
  schema: GetJournalEntriesSchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    // After parsing, limit will always be a number due to default
    const { cursor, limit } = input;
    logger.info({ userId, cursor, limit }, "Fetching journal entries");

    const journalService = new JournalService();
    const result = await journalService.findJournalEntriesByUserId({
      userId: userId!,
      limit,
      cursor,
    });

    if (!result.success) {
      logger.error(
        { error: result.error, userId, cursor },
        "Failed to fetch journal entries"
      );
      return {
        success: false,
        error: result.error,
      };
    }

    logger.info(
      { userId, count: result.data.length, cursor },
      "Journal entries fetched successfully"
    );
    return {
      success: true,
      data: result.data,
    };
  },
});


