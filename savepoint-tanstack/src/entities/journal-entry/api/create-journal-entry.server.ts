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
};

export async function createJournalEntry(
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
      },
      include: { game: { select: JOURNAL_ENTRY_GAME_SELECT } },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      // Prisma 7 driver-adapter puts the constraint under
      // meta.driverAdapterError.cause.constraint.index; older shapes use
      // meta.field_name / meta.constraint. Probe the whole blob to cover both.
      const probe = JSON.stringify(error.meta ?? {}).toLowerCase();

      if (probe.includes("game")) {
        throw new NotFoundError("Referenced game does not exist", {
          gameId: input.gameId ?? null,
        });
      }
    }
    throw error;
  }
}
