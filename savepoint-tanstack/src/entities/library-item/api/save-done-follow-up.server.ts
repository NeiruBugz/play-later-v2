import { prisma } from "@/shared/lib/db.server";
import { NotFoundError, ValidationError } from "@/shared/lib/errors";

import type { DoneOutcome } from "../../../../shared/lib/prisma/client.ts";
import { RATING_MAX, RATING_MIN } from "./set-rating.server";

export type DoneFollowUpInput = {
  outcome?: DoneOutcome | null;
  rating?: number | null;
  stayed?: string;
};

export type SaveDoneFollowUpResult = { noteId?: string };

/**
 * One transaction for the Done follow-up's Save. A Done game has no open play,
 * so the "What stayed with you?" note needs no play link or time increment.
 * Omitted fields are left untouched; an empty input writes nothing.
 */
export async function saveDoneFollowUp(
  userId: string,
  id: number,
  input: DoneFollowUpInput
): Promise<SaveDoneFollowUpResult> {
  const { outcome, rating } = input;
  if (
    rating !== undefined &&
    rating !== null &&
    (!Number.isInteger(rating) || rating < RATING_MIN || rating > RATING_MAX)
  ) {
    throw new ValidationError("Rating must be between 1 and 10", {
      itemId: id,
    });
  }
  const stayed = (input.stayed ?? "").trim();

  return prisma.$transaction(async (tx) => {
    const item = await tx.libraryItem.findFirst({
      where: { id, userId },
      select: { gameId: true, status: true },
    });
    if (!item) {
      throw new NotFoundError("Library item not found", { itemId: id });
    }
    if (item.status !== "DONE") {
      throw new ValidationError("The follow-up applies to a Done game", {
        itemId: id,
      });
    }

    if (outcome !== undefined || rating !== undefined) {
      await tx.libraryItem.update({
        where: { id },
        data: {
          ...(outcome !== undefined ? { doneOutcome: outcome } : {}),
          ...(rating !== undefined ? { rating } : {}),
        },
      });
    }

    if (!stayed) return {};

    const note = await tx.journalEntry.create({
      data: {
        userId,
        gameId: item.gameId,
        content: stayed,
        prompt: "STAYED",
      },
      select: { id: true },
    });
    return { noteId: note.id };
  });
}
