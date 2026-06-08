import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createJournalEntry } from "@/entities/journal-entry/api/create-journal-entry.server";
import type { JournalTimelineEntry } from "@/entities/journal-entry/model/types";
import { requireUserId } from "@/entities/session/api/require-user-id";

/**
 * Zod schema for the `createJournalEntryFn` payload.
 *
 * - `content` is required (min 1, max 5000) per the spec.
 * - `kind` is optional; the entity layer defaults to `"QUICK"`.
 * - `gameId` is optional and may be explicitly `null` to mean "no game
 *   association". `z.string().min(1)` — never `cuid()` (Better-Auth ids).
 * - `playedMinutes` is optional positive minutes for the logged session;
 *   omitted → the entity persists `null`. Feeds total playtime + Your Pace
 *   (spec 023 §2.3). `playSession` auto-derivation is intentionally deferred
 *   so the handler stays a trivial pass-through (no worker split needed).
 */
const CREATE_JOURNAL_ENTRY_INPUT = z.object({
  content: z.string().min(1, "Content is required").max(5000),
  kind: z.enum(["QUICK", "REFLECTION"]).optional(),
  gameId: z.string().min(1).nullable().optional(),
  playedMinutes: z.number().int().positive().optional(),
});

export const createJournalEntryFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CREATE_JOURNAL_ENTRY_INPUT.parse(data))
  .handler(async ({ data }): Promise<JournalTimelineEntry> => {
    const parsed = CREATE_JOURNAL_ENTRY_INPUT.parse(data);

    const userId = await requireUserId();

    return createJournalEntry(userId, parsed);
  });
