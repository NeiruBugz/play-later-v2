import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import type {
  DoneOutcome,
  LibraryItem,
  LibraryItemStatus,
  Prisma,
} from "../../../../shared/lib/prisma/client.ts";
import { compactQueueAfter, lockUserQueue } from "./up-next-queue.server";

export type LibraryItemStatusSnapshot = {
  status: LibraryItemStatus;
  upNextPosition: number | null;
  statusChangedAt: Date | null;
  doneOutcome: DoneOutcome | null;
};

export type SetLibraryItemStatusUndo = {
  snapshot: LibraryItemStatusSnapshot;
  createdPlayId: string | null;
  closedPlayId: string | null;
};

export type SetLibraryItemStatusResult = {
  item: LibraryItem;
  undo: SetLibraryItemStatusUndo;
};

export async function setLibraryItemStatus(
  userId: string,
  id: number,
  to: LibraryItemStatus
): Promise<SetLibraryItemStatusResult> {
  return prisma.$transaction((tx) =>
    setLibraryItemStatusInTx(tx, userId, id, to)
  );
}

/**
 * Same as {@link setLibraryItemStatus} but joins the caller's transaction, so a
 * larger unit of work (e.g. import-to-library) commits or rolls back as one.
 */
export async function setLibraryItemStatusInTx(
  tx: Prisma.TransactionClient,
  userId: string,
  id: number,
  to: LibraryItemStatus
): Promise<SetLibraryItemStatusResult> {
  await lockUserQueue(tx, userId);

  const owned = await tx.libraryItem.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!owned) {
    throw new NotFoundError("Library item not found", { itemId: id });
  }

  await tx.$executeRaw`SELECT 1 FROM "LibraryItem" WHERE id = ${id} FOR UPDATE`;

  const current = await tx.libraryItem.findUniqueOrThrow({ where: { id } });
  const snapshot: LibraryItemStatusSnapshot = {
    status: current.status,
    upNextPosition: current.upNextPosition,
    statusChangedAt: current.statusChangedAt,
    doneOutcome: current.doneOutcome,
  };
  const noChange: SetLibraryItemStatusUndo = {
    snapshot,
    createdPlayId: null,
    closedPlayId: null,
  };

  if (current.status === to) {
    return { item: current, undo: noChange };
  }

  const now = new Date();
  let createdPlayId: string | null = null;
  let closedPlayId: string | null = null;

  if (current.status === "PLAYING") {
    const openPlay = await tx.playthrough.findFirst({
      where: { libraryItemId: id, finishedAt: null },
      orderBy: { ordinal: "desc" },
      select: { id: true },
    });
    if (openPlay) {
      await tx.playthrough.update({
        where: { id: openPlay.id },
        data: { finishedAt: now },
      });
      closedPlayId = openPlay.id;
    }
  }

  const leavesQueue = to === "PLAYING" && current.upNextPosition !== null;
  if (leavesQueue) {
    await tx.libraryItem.update({
      where: { id },
      data: { upNextPosition: null },
    });
    await compactQueueAfter(tx, userId, current.upNextPosition as number);
  }

  if (to === "PLAYING") {
    const { _max } = await tx.playthrough.aggregate({
      where: { libraryItemId: id },
      _max: { ordinal: true },
    });
    const ordinal = (_max.ordinal ?? 0) + 1;
    const play = await tx.playthrough.create({
      data: {
        libraryItemId: id,
        ordinal,
        kind: ordinal === 1 ? "FIRST" : "REPLAY",
        status: "PLAYING",
        startedAt: now,
      },
      select: { id: true },
    });
    createdPlayId = play.id;
  }

  const item = await tx.libraryItem.update({
    where: { id },
    data: { status: to, statusChangedAt: now },
  });

  return { item, undo: { snapshot, createdPlayId, closedPlayId } };
}
