import { createServerFn } from "@tanstack/react-start";

import {
  getJournalGameOptions,
  type JournalGameOption,
} from "@/entities/journal-entry/api/get-journal.server";
import { requireUserId } from "@/entities/session/api/require-user-id";

/** Journal filter options: the user's games that have notes (`{ id, title }`), by title. */
export const getJournalGameOptionsFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<JournalGameOption[]> => {
  const userId = await requireUserId();
  return getJournalGameOptions(userId);
});
