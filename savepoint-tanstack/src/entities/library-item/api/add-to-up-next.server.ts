import { prisma } from "@/shared/lib/db.server";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/shared/lib/errors";

import { UP_NEXT_MAX } from "../model";
import { lockUserQueue } from "./up-next-queue.server";

export async function addToUpNext(
  userId: string,
  id: number
): Promise<{ position: number }> {
  return prisma.$transaction(async (tx) => {
    await lockUserQueue(tx, userId);

    const item = await tx.libraryItem.findFirst({
      where: { id, userId },
      select: { status: true, upNextPosition: true },
    });
    if (!item) {
      throw new NotFoundError("Library item not found", { itemId: id });
    }
    if (item.status === "PLAYING") {
      throw new ValidationError("A game being played can't join Up Next", {
        itemId: id,
      });
    }
    if (item.upNextPosition !== null) {
      return { position: item.upNextPosition };
    }

    const queued = await tx.libraryItem.count({
      where: { userId, upNextPosition: { not: null } },
    });
    if (queued >= UP_NEXT_MAX) {
      throw new ConflictError("Up Next is full", { code: "UP_NEXT_FULL" });
    }

    const position = queued + 1;
    await tx.libraryItem.update({
      where: { id },
      data: { upNextPosition: position },
    });
    return { position };
  });
}
