import { createServerFn } from "@tanstack/react-start";

import {
  getJournalTimeline,
  type JournalTimelineEntry,
} from "@/entities/journal-entry/api/get-journal.server";
import { requireUserId } from "@/entities/session/api/require-user-id";

/**
 * Loader-only server fn for `/journal`.
 *
 * Per the strict feature-server-fn rule this would be a loader-direct read of
 * `getJournalTimeline` (entity query, `.server.ts`). The Start route extractor
 * does not strip `.server.ts` imports from client preload, so the canonical
 * shape hangs on hover-preload (foot-gun #2 / CONTEXT.md → loader-direct read).
 * Wrapping the read in a `createServerFn` exported from this non-`.server.ts`
 * file keeps the route file client-safe.
 */
export const getJournalTimelinePageDataFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<JournalTimelineEntry[]> => {
  const userId = await requireUserId();
  return getJournalTimeline(userId);
});
