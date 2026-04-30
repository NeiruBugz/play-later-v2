"use server";

import { JournalService } from "@/data-access-layer/services";
import { z } from "zod";

import type { JournalEntryDomain } from "@/features/journal/types";
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
    const { cursor, limit } = input;
    logger.info({ userId, cursor, limit }, "Fetching journal entries");

    const journalService = new JournalService();
    const entries = await journalService.findJournalEntriesByUserId({
      userId: userId!,
      limit,
      cursor,
    });

    logger.info(
      { userId, count: entries.length, cursor },
      "Journal entries fetched successfully"
    );
    return {
      success: true,
      data: entries,
    };
  },
});
