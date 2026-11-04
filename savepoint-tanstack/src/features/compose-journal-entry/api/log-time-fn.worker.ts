import { z } from "zod";

import { createJournalEntry } from "@/entities/journal-entry/api/create-journal-entry.server";
import { prisma } from "@/shared/lib/db.server";
import { UnauthorizedError } from "@/shared/lib/errors";

export const LOG_TIME_INPUT = z.object({
  gameId: z.string().min(1).nullable().optional(),
  content: z.string().max(5000).optional(),
  playedMinutes: z.number().int().positive().nullable().optional(),
});

export type LogTimeInput = z.infer<typeof LOG_TIME_INPUT>;

export type LogTimeResult = { noteId: string; offerMarkPlaying: boolean };

/**
 * Worker for logTimeFn — plain async, no TanStack Start runtime. Integration
 * tests import this directly (foot-gun #8). Logging time never changes the
 * game's status: `offerMarkPlaying` only tells the UI to offer it.
 */
export async function logTimeWorker(
  userId: string | undefined,
  data: unknown
): Promise<LogTimeResult> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  const parsed = LOG_TIME_INPUT.parse(data);
  const entry = await createJournalEntry(userId, parsed);

  const logsTimeOnGame = Boolean(entry.gameId && entry.playedMinutes);
  if (!entry.gameId || !logsTimeOnGame) {
    return { noteId: entry.id, offerMarkPlaying: false };
  }

  const item = await prisma.libraryItem.findFirst({
    where: { userId, gameId: entry.gameId },
    select: { status: true },
  });

  return {
    noteId: entry.id,
    offerMarkPlaying: item !== null && item.status !== "PLAYING",
  };
}
