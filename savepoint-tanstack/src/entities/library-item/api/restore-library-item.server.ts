import { z } from "zod";

import { prisma } from "@/shared/lib/db.server";
import { NotFoundError, ValidationError } from "@/shared/lib/errors";

import type {
  LibraryItem,
  Prisma,
} from "../../../../shared/lib/prisma/client.ts";
import { libraryItemStatusSchema, UP_NEXT_MAX } from "../model";
import type { SetLibraryItemStatusUndo } from "./set-library-item-status.server";

const clampToQueue = (position: number) =>
  Math.min(Math.max(position, 1), UP_NEXT_MAX);

const SET_LIBRARY_ITEM_STATUS_UNDO = z.object({
  snapshot: z.object({
    status: libraryItemStatusSchema,
    upNextPosition: z
      .number()
      .int()
      .nullable()
      .transform((position) =>
        position === null ? null : clampToQueue(position)
      ),
    statusChangedAt: z.union([z.null(), z.coerce.date()]),
    doneOutcome: z.enum(["FINISHED", "LET_GO"]).nullable(),
  }),
  createdPlayId: z.string().min(1).nullable(),
  closedPlayId: z.string().min(1).nullable(),
});

export type RestoreLibraryItemResult = {
  item: LibraryItem;
  queueRestored: boolean;
};

export async function restoreLibraryItem(
  userId: string,
  id: number,
  undo: SetLibraryItemStatusUndo
): Promise<RestoreLibraryItemResult> {
  const parsed = SET_LIBRARY_ITEM_STATUS_UNDO.safeParse(undo);
  if (!parsed.success) {
    throw new ValidationError("Invalid undo payload", { itemId: id });
  }
  const { snapshot, createdPlayId, closedPlayId } = parsed.data;

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

    const owned = await tx.libraryItem.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!owned) {
      throw new NotFoundError("Library item not found", { itemId: id });
    }

    await tx.$executeRaw`SELECT 1 FROM "LibraryItem" WHERE id = ${id} FOR UPDATE`;

    for (const playId of [createdPlayId, closedPlayId]) {
      if (playId === null) continue;
      const play = await tx.playthrough.findFirst({
        where: { id: playId, libraryItemId: id },
        select: { id: true },
      });
      if (!play) {
        throw new ValidationError("Play does not belong to this game", {
          itemId: id,
        });
      }
    }

    if (createdPlayId !== null) {
      await tx.playthrough.delete({ where: { id: createdPlayId } });
    }
    if (closedPlayId !== null) {
      await tx.playthrough.update({
        where: { id: closedPlayId },
        data: { finishedAt: null },
      });
      await tx.playthrough.updateMany({
        where: {
          libraryItemId: id,
          finishedAt: null,
          id: { not: closedPlayId },
        },
        data: { finishedAt: new Date() },
      });
    }

    const current = await tx.libraryItem.findUniqueOrThrow({ where: { id } });
    const item = await tx.libraryItem.update({
      where: { id },
      data: {
        status: snapshot.status,
        statusChangedAt: snapshot.statusChangedAt,
        doneOutcome: snapshot.doneOutcome,
      },
    });

    const wantsQueuePlace =
      snapshot.upNextPosition !== null &&
      current.upNextPosition === null &&
      snapshot.status !== "PLAYING";
    if (!wantsQueuePlace) {
      return { item, queueRestored: true };
    }

    const restored = await reinsertIntoQueue(
      tx,
      userId,
      id,
      snapshot.upNextPosition as number
    );
    if (!restored) return { item, queueRestored: false };
    return { item: { ...item, upNextPosition: restored }, queueRestored: true };
  });
}

async function reinsertIntoQueue(
  tx: Prisma.TransactionClient,
  userId: string,
  id: number,
  wantedPosition: number
): Promise<number | null> {
  const queued = await tx.libraryItem.findMany({
    where: { userId, upNextPosition: { not: null } },
    orderBy: { upNextPosition: "desc" },
    select: { id: true, upNextPosition: true },
  });
  if (queued.length >= UP_NEXT_MAX) return null;

  const position = Math.min(wantedPosition, queued.length + 1);
  for (const row of queued) {
    if ((row.upNextPosition as number) < position) break;
    await tx.libraryItem.update({
      where: { id: row.id },
      data: { upNextPosition: (row.upNextPosition as number) + 1 },
    });
  }
  await tx.libraryItem.update({
    where: { id },
    data: { upNextPosition: position },
  });
  return position;
}
