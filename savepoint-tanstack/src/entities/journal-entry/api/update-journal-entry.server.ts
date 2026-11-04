import { prisma } from "@/shared/lib/db.server";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/shared/lib/errors";
import { mapP2025ToNotFound } from "@/shared/lib/prisma";

import type { Prisma } from "../../../../shared/lib/prisma/client.ts";
import {
  JOURNAL_ENTRY_READ_ARGS,
  type JournalTimelineEntry,
} from "../model/types";
import { TIME_NEEDS_GAME_CODE } from "./create-journal-entry.server";

export type UpdateJournalEntryInput = {
  content?: string;
  playedMinutes?: number | null;
};

/**
 * Edits a note's text and time. The result must still have text or time, time
 * needs the note's game, and `createdAt` never changes (so the note keeps its
 * date and place). Editing time does not touch any play's `playtimeMinutes`.
 */
export async function updateJournalEntry(
  userId: string,
  entryId: string,
  input: UpdateJournalEntryInput
): Promise<JournalTimelineEntry> {
  const existing = await prisma.journalEntry.findUnique({
    where: { id: entryId },
  });

  if (!existing) {
    throw new NotFoundError("Note not found", { entryId });
  }

  if (existing.userId !== userId) {
    throw new UnauthorizedError("Not the owner of this journal entry", {
      entryId,
    });
  }

  const content =
    input.content !== undefined ? input.content.trim() : existing.content;
  const playedMinutes =
    input.playedMinutes !== undefined
      ? input.playedMinutes && input.playedMinutes > 0
        ? input.playedMinutes
        : null
      : existing.playedMinutes;

  if (!content && !playedMinutes) {
    throw new ValidationError("Add a note or the time you played");
  }

  if (playedMinutes && !existing.gameId) {
    throw new ValidationError("Choose a game to log time.", {
      code: TIME_NEEDS_GAME_CODE,
    });
  }

  const data: Prisma.JournalEntryUncheckedUpdateInput = {};
  if (input.content !== undefined) data.content = content;
  if (input.playedMinutes !== undefined) data.playedMinutes = playedMinutes;

  try {
    return await prisma.journalEntry.update({
      where: { id: entryId },
      data,
      ...JOURNAL_ENTRY_READ_ARGS,
    });
  } catch (error) {
    mapP2025ToNotFound(error, "Note not found", { entryId });
  }
}
