import { z } from "zod";

import { createJournalEntry } from "@/entities/journal-entry/api/create-journal-entry.server";
import type { JournalTimelineEntry } from "@/entities/journal-entry/model/types";
import { UnauthorizedError } from "@/shared/lib/errors";

export const CREATE_JOURNAL_ENTRY_INPUT = z
  .object({
    content: z.string().max(5000),
    kind: z.enum(["QUICK", "REFLECTION"]).optional(),
    gameId: z.string().min(1).nullable().optional(),
    playedMinutes: z.number().int().positive().optional(),
    playthroughId: z.string().min(1).optional(),
  })
  .refine((d) => d.content.trim().length > 0 || d.playthroughId != null, {
    message: "Add a thought, or attach the session to a playthrough",
    path: ["content"],
  });

export type CreateJournalEntryInput = z.infer<
  typeof CREATE_JOURNAL_ENTRY_INPUT
>;

/**
 * Worker for createJournalEntryFn — plain async, no TanStack Start runtime
 * dependency. Integration tests import this directly (foot-gun #8).
 *
 * Responsibilities:
 * - Auth gate: throw UnauthorizedError if userId is undefined.
 * - Re-parse input with the same schema (validate-twice rule).
 * - Delegate to the entity query, which handles the optional playthroughId
 *   transaction (entry create + run playtimeMinutes increment).
 */
export async function createJournalEntryWorker(
  userId: string | undefined,
  data: unknown
): Promise<JournalTimelineEntry> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  const parsed = CREATE_JOURNAL_ENTRY_INPUT.parse(data);

  return createJournalEntry(userId, parsed);
}
