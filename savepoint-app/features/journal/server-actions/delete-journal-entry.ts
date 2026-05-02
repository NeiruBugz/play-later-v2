"use server";

import { JournalService } from "@/data-access-layer/services";
import { revalidatePath, updateTag } from "next/cache";

import { createServerAction, userTags } from "@/shared/lib";

import {
  DeleteJournalEntrySchema,
  type DeleteJournalEntryInput,
} from "../schemas";

export const deleteJournalEntryAction = createServerAction<
  DeleteJournalEntryInput,
  void
>({
  actionName: "deleteJournalEntryAction",
  schema: DeleteJournalEntrySchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const { entryId } = input;
    logger.info({ entryId, userId }, "Deleting journal entry");

    const journalService = new JournalService();

    await journalService.deleteJournalEntry({
      userId: userId!,
      entryId,
    });

    updateTag(userTags(userId!).profileStats);
    revalidatePath("/journal");
    revalidatePath("/games/[slug]", "page");

    logger.info({ userId, entryId }, "Journal entry deleted successfully");

    return {
      success: true,
      data: undefined,
    };
  },
});
