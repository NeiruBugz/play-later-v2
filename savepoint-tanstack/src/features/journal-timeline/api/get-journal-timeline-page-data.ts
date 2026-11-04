import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  getJournalTimeline,
  type JournalTimelineEntry,
} from "@/entities/journal-entry/api/get-journal.server";
import { requireUserId } from "@/entities/session/api/require-user-id";

const GET_JOURNAL_TIMELINE_INPUT = z
  .object({ gameId: z.string().min(1).optional() })
  .optional();

/**
 * Loader-only server fn for `/journal`. `gameId` narrows to one game; `"none"`
 * narrows to notes without a game; omitted returns every note.
 *
 * Wrapped in a `createServerFn` (not a loader-direct entity read) so the route
 * file stays client-safe — see foot-gun #2 / CONTEXT.md → loader-direct read.
 */
export const getJournalTimelinePageDataFn = createServerFn({
  method: "GET",
})
  .inputValidator((data: unknown) => GET_JOURNAL_TIMELINE_INPUT.parse(data))
  .handler(async ({ data }): Promise<JournalTimelineEntry[]> => {
    const userId = await requireUserId();
    return getJournalTimeline(userId, { gameId: data?.gameId });
  });
