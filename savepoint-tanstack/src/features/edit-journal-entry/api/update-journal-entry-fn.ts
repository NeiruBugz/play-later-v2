import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { updateJournalEntry } from "@/entities/journal-entry/api/update-journal-entry.server";
import type { JournalTimelineEntry } from "@/entities/journal-entry/model/types";
import { requireUserId } from "@/entities/session/api/require-user-id";

/**
 * `id` is a Better-Auth-style id (`z.string().min(1)`, never `cuid()`).
 * Only keys present are changed; the note must keep text or time, and time
 * needs the note's game (enforced by the entity query).
 */
const UPDATE_JOURNAL_ENTRY_INPUT = z.object({
  id: z.string().min(1),
  content: z.string().max(5000).optional(),
  playedMinutes: z.number().int().positive().nullable().optional(),
});

export const updateJournalEntryFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => UPDATE_JOURNAL_ENTRY_INPUT.parse(data))
  .handler(async ({ data }): Promise<JournalTimelineEntry> => {
    const { id, ...input } = UPDATE_JOURNAL_ENTRY_INPUT.parse(data);
    const userId = await requireUserId();
    return updateJournalEntry(userId, id, input);
  });
