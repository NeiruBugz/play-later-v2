import { prisma } from "@/shared/lib/db.server";
import { NotFoundError, UnauthorizedError } from "@/shared/lib/errors";
import { mapP2025ToNotFound } from "@/shared/lib/prisma";

import { Prisma } from "../../../../shared/lib/prisma/client.ts";
import {
  JOURNAL_ENTRY_GAME_SELECT,
  type JournalTimelineEntry,
} from "../model/types";

export type UpdateJournalEntryInput = {
  content?: string;
  kind?: "QUICK" | "REFLECTION";
  gameId?: string | null;
};

export async function updateJournalEntry(
  userId: string,
  entryId: string,
  input: UpdateJournalEntryInput
): Promise<JournalTimelineEntry> {
  const existing = await prisma.journalEntry.findUnique({
    where: { id: entryId },
  });

  if (!existing) {
    throw new NotFoundError("Journal entry not found", { entryId });
  }

  if (existing.userId !== userId) {
    throw new UnauthorizedError("Not the owner of this journal entry", {
      entryId,
    });
  }

  const data: Prisma.JournalEntryUncheckedUpdateInput = {};
  if (input.content !== undefined) data.content = input.content;
  if (input.kind !== undefined) data.kind = input.kind;
  if (input.gameId !== undefined) data.gameId = input.gameId;

  try {
    return await prisma.journalEntry.update({
      where: { id: entryId },
      data,
      include: { game: { select: JOURNAL_ENTRY_GAME_SELECT } },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      // Same Prisma 7 meta-probe as createJournalEntry — see that file.
      const probe = JSON.stringify(error.meta ?? {}).toLowerCase();

      if (probe.includes("game")) {
        throw new NotFoundError("Referenced game does not exist", {
          gameId: input.gameId ?? null,
        });
      }
    }
    mapP2025ToNotFound(error, "Journal entry not found", { entryId });
  }
}
