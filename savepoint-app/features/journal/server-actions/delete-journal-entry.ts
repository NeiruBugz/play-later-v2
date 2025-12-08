"use server";

import { JournalService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";

import { createServerAction } from "@/shared/lib";

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

    const result = await journalService.deleteJournalEntry({
      userId: userId!,
      entryId,
    });

    if (!result.success) {
      logger.error(
        { error: result.error, userId, entryId },
        "Failed to delete journal entry"
      );
      return {
        success: false,
        error: result.error,
      };
    }

    revalidatePath("/journal");
    revalidatePath("/games/[slug]", "page");

    logger.info({ userId, entryId }, "Journal entry deleted successfully");

    return {
      success: true,
      data: undefined,
    };
  },
});
