import { prisma } from "@/shared/lib/db.server";
import { NotFoundError, ValidationError } from "@/shared/lib/errors";

import type { JournalPrompt } from "../../../../shared/lib/prisma/client.ts";
import {
  JOURNAL_ENTRY_READ_ARGS,
  type JournalTimelineEntry,
} from "../model/types";

export const TIME_NEEDS_GAME_CODE = "TIME_NEEDS_GAME";

export type CreateJournalEntryInput = {
  gameId?: string | null;
  content?: string;
  playedMinutes?: number | null;
  prompt?: JournalPrompt;
};

/**
 * Creates a note. Needs non-empty text or `playedMinutes > 0`; minutes need a
 * game; a game must be in the user's library. No run is required: when the
 * game's item has an open play, that play's `playtimeMinutes` is incremented
 * and the note is linked to it.
 */
export async function createJournalEntry(
  userId: string,
  input: CreateJournalEntryInput
): Promise<JournalTimelineEntry> {
  const content = (input.content ?? "").trim();
  const playedMinutes =
    input.playedMinutes && input.playedMinutes > 0 ? input.playedMinutes : null;
  const gameId = input.gameId ?? null;

  if (!content && playedMinutes === null) {
    throw new ValidationError("Add a note or the time you played");
  }

  if (playedMinutes !== null && !gameId) {
    throw new ValidationError("Choose a game to log time.", {
      code: TIME_NEEDS_GAME_CODE,
    });
  }

  return prisma.$transaction(async (tx) => {
    let playthroughId: string | null = null;

    if (gameId) {
      const item = await tx.libraryItem.findFirst({
        where: { userId, gameId },
        select: { id: true },
      });
      if (!item) {
        throw new NotFoundError("Game is not in your library", { gameId });
      }

      const openPlay = await tx.playthrough.findFirst({
        where: { libraryItemId: item.id, finishedAt: null },
        orderBy: { ordinal: "desc" },
        select: { id: true },
      });

      if (openPlay) {
        playthroughId = openPlay.id;
        if (playedMinutes !== null) {
          await tx.playthrough.update({
            where: { id: openPlay.id },
            data: { playtimeMinutes: { increment: playedMinutes } },
          });
        }
      }
    }

    return tx.journalEntry.create({
      data: {
        userId,
        content,
        gameId,
        playedMinutes,
        playthroughId,
        ...(input.prompt ? { prompt: input.prompt } : {}),
      },
      ...JOURNAL_ENTRY_READ_ARGS,
    });
  });
}
