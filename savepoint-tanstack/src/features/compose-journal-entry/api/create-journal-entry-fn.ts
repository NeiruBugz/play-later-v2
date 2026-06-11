import { createServerFn } from "@tanstack/react-start";

import type { JournalTimelineEntry } from "@/entities/journal-entry/model/types";
import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  CREATE_JOURNAL_ENTRY_INPUT,
  createJournalEntryWorker,
} from "./create-journal-entry-fn.worker";

export const createJournalEntryFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CREATE_JOURNAL_ENTRY_INPUT.parse(data))
  .handler(async ({ data }): Promise<JournalTimelineEntry> => {
    const userId = await requireUserId();
    return createJournalEntryWorker(userId, data);
  });
