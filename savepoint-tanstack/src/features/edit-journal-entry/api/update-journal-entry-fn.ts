import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { updateJournalEntry } from "@/entities/journal-entry/api/update-journal-entry.server";
import type { JournalTimelineEntry } from "@/entities/journal-entry/model/types";
import { requireUserId } from "@/entities/session/api/require-user-id";

/**
 * Zod schema for the `updateJournalEntryFn` payload.
 *
 * - `entryId` is required (Better-Auth-style id; never `cuid()`).
 * - `content`, `kind`, `gameId` are optional — only keys explicitly present
 *   in `input` are forwarded to Prisma at the entity layer.
 *   `gameId: null` clears the association; `gameId: undefined` leaves it
 *   untouched.
 */
const UPDATE_JOURNAL_ENTRY_INPUT = z.object({
  entryId: z.string().min(1),
  content: z.string().min(1).max(5000).optional(),
  kind: z.enum(["QUICK", "REFLECTION"]).optional(),
  gameId: z.string().min(1).nullable().optional(),
});

export const updateJournalEntryFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => UPDATE_JOURNAL_ENTRY_INPUT.parse(data))
  .handler(async ({ data }): Promise<JournalTimelineEntry> => {
    // Re-parse server-side: inputValidator runs only on cross-network calls;
    // programmatic callers (other server fns, tests) bypass it.
    const parsed = UPDATE_JOURNAL_ENTRY_INPUT.parse(data);
    const { entryId, ...input } = parsed;

    const userId = await requireUserId();

    return updateJournalEntry(userId, entryId, input);
  });
