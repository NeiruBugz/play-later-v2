import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import { syncLibraryStatusFromRuns } from "./sync-library-status.server";

/**
 * Deletes a playthrough by id.
 *
 * Ownership two-step (inside the transaction): loads the run with its
 * `libraryItem.userId`, then checks against `userId`. Both "missing" and
 * "not-yours" produce `NotFoundError` (anti-enumeration).
 *
 * Journal entries that reference this run have their `playthroughId` set to
 * null via the schema's `onDelete: SetNull` — entries are never deleted.
 *
 * Ordinals are not recomputed after deletion; gaps are intentional (a run's
 * ordinal is a stable identity label, not a display position).
 *
 * Prisma constraint errors are NOT mapped here — delete cannot violate
 * `@@unique([libraryItemId, ordinal])`. update-playthrough.server.ts is the
 * single seam for that constraint.
 */
export async function deletePlaythrough(
  userId: string,
  id: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.playthrough.findUnique({
      where: { id },
      select: {
        id: true,
        libraryItem: { select: { id: true, userId: true } },
      },
    });

    if (!existing || existing.libraryItem.userId !== userId) {
      throw new NotFoundError("Playthrough not found", { id });
    }

    const libraryItemId = existing.libraryItem.id;

    await tx.playthrough.delete({ where: { id } });
    await syncLibraryStatusFromRuns(tx, libraryItemId);
  });
}
