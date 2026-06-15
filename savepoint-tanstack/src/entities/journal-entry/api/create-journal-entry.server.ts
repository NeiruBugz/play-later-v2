import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import { Prisma } from "../../../../shared/lib/prisma/client.ts";
import {
  JOURNAL_ENTRY_GAME_SELECT,
  type JournalTimelineEntry,
} from "../model/types";

export type CreateJournalEntryInput = {
  content: string;
  kind?: "QUICK" | "REFLECTION";
  gameId?: string | null;
  playedMinutes?: number | null;
  playthroughId?: string | null;
};

/**
 * Creates a journal entry. When `playthroughId` is provided the whole
 * operation runs inside a single `prisma.$transaction`:
 *  1. Load the run and verify the run's libraryItem.userId === userId
 *     (anti-tamper: users can't attach entries to runs they don't own).
 *  2. Create the journal entry with `playthroughId` set.
 *  3. If `playedMinutes` is provided, increment the run's `playtimeMinutes`.
 *
 * When `playthroughId` is absent the original single-create path is used.
 */
export async function createJournalEntry(
  userId: string,
  input: CreateJournalEntryInput
): Promise<JournalTimelineEntry> {
  if (input.playthroughId) {
    return createJournalEntryWithPlaythrough(
      userId,
      input,
      input.playthroughId
    );
  }

  return createJournalEntrySimple(userId, input);
}

async function createJournalEntrySimple(
  userId: string,
  input: CreateJournalEntryInput
): Promise<JournalTimelineEntry> {
  try {
    return await prisma.journalEntry.create({
      data: {
        userId,
        content: input.content,
        kind: input.kind ?? "QUICK",
        gameId: input.gameId ?? null,
        playedMinutes: input.playedMinutes ?? null,
      },
      include: { game: { select: JOURNAL_ENTRY_GAME_SELECT } },
    });
  } catch (error) {
    mapJournalEntryPrismaError(error, input);
    throw error;
  }
}

async function createJournalEntryWithPlaythrough(
  userId: string,
  input: CreateJournalEntryInput,
  playthroughId: string
): Promise<JournalTimelineEntry> {
  try {
    return await prisma.$transaction(async (tx) => {
      const run = await tx.playthrough.findUnique({
        where: { id: playthroughId },
        include: { libraryItem: { select: { userId: true, gameId: true } } },
      });

      if (!run || run.libraryItem.userId !== userId) {
        throw new NotFoundError("Playthrough not found", { playthroughId });
      }

      const entry = await tx.journalEntry.create({
        data: {
          userId,
          content: input.content,
          kind: input.kind ?? "QUICK",
          gameId: run.libraryItem.gameId,
          playedMinutes: input.playedMinutes ?? null,
          playthroughId,
        },
        include: { game: { select: JOURNAL_ENTRY_GAME_SELECT } },
      });

      if (input.playedMinutes) {
        await tx.playthrough.update({
          where: { id: playthroughId },
          data: { playtimeMinutes: { increment: input.playedMinutes } },
        });
      }

      return entry;
    });
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    mapJournalEntryPrismaError(error, input);
    throw error;
  }
}

function mapJournalEntryPrismaError(
  error: unknown,
  input: CreateJournalEntryInput
): void {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    // Prisma 7 driver-adapter puts the constraint under
    // meta.driverAdapterError.cause.constraint.index; older shapes use
    // meta.field_name / meta.constraint. Probe the whole blob to cover both.
    const probe = JSON.stringify(error.meta ?? {}).toLowerCase();

    if (probe.includes("playthrough")) {
      throw new NotFoundError("Playthrough not found", {
        playthroughId: input.playthroughId ?? null,
      });
    }

    if (probe.includes("game")) {
      throw new NotFoundError("Referenced game does not exist", {
        gameId: input.gameId ?? null,
      });
    }
  }
}
