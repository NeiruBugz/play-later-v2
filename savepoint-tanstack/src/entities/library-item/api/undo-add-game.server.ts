import { prisma } from "@/shared/lib/db.server";
import { ConflictError, NotFoundError } from "@/shared/lib/errors";

import { compactQueueAfter, lockUserQueue } from "./up-next-queue.server";

export const UNDO_ADD_WINDOW_MS = 60_000;

export const UNDO_ADD_UNAVAILABLE = "UNDO_ADD_UNAVAILABLE";

export async function undoAddGame(
  userId: string,
  libraryItemId: number
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await lockUserQueue(tx, userId);

    const item = await tx.libraryItem.findFirst({
      where: { id: libraryItemId, userId },
      select: {
        createdAt: true,
        upNextPosition: true,
        _count: { select: { playthroughs: true } },
        JournalEntry: { select: { id: true, prompt: true } },
      },
    });
    if (!item) {
      throw new NotFoundError("Library item not found", { libraryItemId });
    }

    const isRecent = Date.now() - item.createdAt.getTime() < UNDO_ADD_WINDOW_MS;
    const hasPlays = item._count.playthroughs > 0;
    const hasOtherNotes = item.JournalEntry.some(
      (entry) => entry.prompt !== "WHY"
    );
    if (!isRecent || hasPlays || hasOtherNotes) {
      throw new ConflictError("This add can no longer be undone", {
        code: UNDO_ADD_UNAVAILABLE,
        libraryItemId,
      });
    }

    await tx.journalEntry.deleteMany({
      where: { libraryItemId, prompt: "WHY" },
    });
    await tx.libraryItem.delete({ where: { id: libraryItemId } });
    if (item.upNextPosition !== null) {
      await compactQueueAfter(tx, userId, item.upNextPosition);
    }
  });
}
