import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  getJournalEntryById,
  type JournalTimelineEntry,
} from "@/entities/journal-entry/api/get-journal-entry-by-id.server";
import { requireUserId } from "@/entities/session/api/require-user-id";

/**
 * Zod schema for the `getJournalEntryPageDataFn` payload.
 *
 * `entryId` is a Better-Auth-style id (`z.string().min(1)`, never `cuid()`).
 */
const GET_JOURNAL_ENTRY_INPUT = z.object({
  entryId: z.string().min(1),
});

/**
 * Loader-safe server fn for `/journal/$id` and `/journal/$id/edit`.
 *
 * Per the strict feature-server-fn rule this would be a loader-direct read of
 * `getJournalEntryById` (entity query, `.server.ts`). The Start route
 * extractor does not strip `.server.ts` imports from client preload, so the
 * canonical shape hangs on hover-preload (foot-gun #2 / CONTEXT.md →
 * loader-direct read). Wrapping the read in a `createServerFn` exported from
 * this non-`.server.ts` file keeps the route file client-safe.
 *
 * `userId` is resolved from the session inside the handler — never trusted
 * from input. Ownership / privacy is enforced by the entity query (throws
 * `NotFoundError` for both missing and cross-user).
 */
export const getJournalEntryPageDataFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => GET_JOURNAL_ENTRY_INPUT.parse(data))
  .handler(async ({ data }): Promise<JournalTimelineEntry> => {
    // Validate twice: inputValidator runs only on cross-network calls;
    // programmatic callers (route loaders) bypass it.
    const { entryId } = GET_JOURNAL_ENTRY_INPUT.parse(data);

    const userId = await requireUserId();

    return getJournalEntryById(userId, entryId);
  });
