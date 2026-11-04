import { prisma } from "@/shared/lib/db.server";
import { NotFoundError, ValidationError } from "@/shared/lib/errors";

import type { Prisma } from "../../../../shared/lib/prisma/client.ts";
import { lockUserQueue, readQueue } from "./up-next-queue.server";

export type MoveInUpNextTarget =
  | { direction: "up" | "down" }
  | { toPosition: number };

export type UpNextQueueEntry = { id: number; position: number };

export async function moveInUpNext(
  userId: string,
  id: number,
  target: MoveInUpNextTarget
): Promise<UpNextQueueEntry[]> {
  return prisma.$transaction(async (tx) => {
    await lockUserQueue(tx, userId);

    const item = await tx.libraryItem.findFirst({
      where: { id, userId },
      select: { upNextPosition: true },
    });
    if (!item) {
      throw new NotFoundError("Library item not found", { itemId: id });
    }
    if (item.upNextPosition === null) {
      throw new ValidationError("Game is not in Up Next", { itemId: id });
    }

    const queue = await readQueue(tx, userId);
    const from = item.upNextPosition;
    const to = resolveDestination(target, from, queue.length);
    if (to === from) return queue;

    if (Math.abs(to - from) === 1) {
      await swapWithNeighbour(tx, userId, id, from, to);
    } else {
      await insertAt(tx, userId, id, from, to);
    }
    return readQueue(tx, userId);
  });
}

function resolveDestination(
  target: MoveInUpNextTarget,
  from: number,
  queueLength: number
): number {
  const wanted =
    "direction" in target
      ? from + (target.direction === "up" ? -1 : 1)
      : target.toPosition;
  return Math.min(Math.max(wanted, 1), queueLength);
}

async function swapWithNeighbour(
  tx: Prisma.TransactionClient,
  userId: string,
  id: number,
  from: number,
  to: number
): Promise<void> {
  const neighbour = await tx.libraryItem.findFirstOrThrow({
    where: { userId, upNextPosition: to },
    select: { id: true },
  });
  await setPosition(tx, id, null);
  await setPosition(tx, neighbour.id, from);
  await setPosition(tx, id, to);
}

async function insertAt(
  tx: Prisma.TransactionClient,
  userId: string,
  id: number,
  from: number,
  to: number
): Promise<void> {
  const movesLater = to > from;
  const displaced = await tx.libraryItem.findMany({
    where: {
      userId,
      upNextPosition: movesLater
        ? { gt: from, lte: to }
        : { gte: to, lt: from },
    },
    orderBy: { upNextPosition: movesLater ? "asc" : "desc" },
    select: { id: true, upNextPosition: true },
  });

  await setPosition(tx, id, null);
  for (const row of displaced) {
    await setPosition(
      tx,
      row.id,
      (row.upNextPosition as number) + (movesLater ? -1 : 1)
    );
  }
  await setPosition(tx, id, to);
}

async function setPosition(
  tx: Prisma.TransactionClient,
  id: number,
  upNextPosition: number | null
): Promise<void> {
  await tx.libraryItem.update({ where: { id }, data: { upNextPosition } });
}
