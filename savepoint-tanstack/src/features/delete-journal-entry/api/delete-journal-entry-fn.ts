import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { deleteJournalEntry } from "@/entities/journal-entry/api/delete-journal-entry.server";
import { requireUserId } from "@/entities/session/api/require-user-id";

/**
 * Zod schema for the `deleteJournalEntryFn` payload.
 *
 * `entryId` is a Better-Auth-style id (`z.string().min(1)`, never `cuid()`).
 */
const DELETE_JOURNAL_ENTRY_INPUT = z.object({
  entryId: z.string().min(1),
});

export const deleteJournalEntryFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => DELETE_JOURNAL_ENTRY_INPUT.parse(data))
  .handler(async ({ data }): Promise<void> => {
    // Re-parse server-side: inputValidator runs only on cross-network calls;
    // programmatic callers (other server fns, tests) bypass it.
    const { entryId } = DELETE_JOURNAL_ENTRY_INPUT.parse(data);

    const userId = await requireUserId();

    await deleteJournalEntry(userId, entryId);
  });
