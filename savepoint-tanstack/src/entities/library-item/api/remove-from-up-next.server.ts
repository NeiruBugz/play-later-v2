import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import { compactQueueAfter, lockUserQueue } from "./up-next-queue.server";

export async function removeFromUpNext(
  userId: string,
  id: number
): Promise<{ position: null }> {
  return prisma.$transaction(async (tx) => {
    await lockUserQueue(tx, userId);

    const item = await tx.libraryItem.findFirst({
      where: { id, userId },
      select: { upNextPosition: true },
    });
    if (!item) {
      throw new NotFoundError("Library item not found", { itemId: id });
    }
    if (item.upNextPosition === null) return { position: null };

    await tx.libraryItem.update({
      where: { id },
      data: { upNextPosition: null },
    });
    await compactQueueAfter(tx, userId, item.upNextPosition);
    return { position: null };
  });
}
