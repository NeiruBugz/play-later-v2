import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import type { LibraryItem } from "../../../../shared/lib/prisma/client.ts";
import { syncLibraryStatusFromRuns } from "./sync-library-status.server";

/**
 * Clears the manual-status override: sets `statusIsManual = false`, then
 * recomputes `status` + `hasBeenPlayed` from the item's current runs via
 * `syncLibraryStatusFromRuns` — all in one transaction.
 *
 * This is the "Follow my playthroughs" action. After this call the derived
 * run status governs `LibraryItem.status` again; the pinned value is gone.
 *
 * Ownership two-step: `findUnique` + userId check → `NotFoundError` for
 * missing-or-not-yours (anti-enumeration).
 */
export async function clearLibraryStatusManual(
  userId: string,
  libraryItemId: number
): Promise<LibraryItem> {
  const item = await prisma.libraryItem.findUnique({
    where: { id: libraryItemId },
  });

  if (!item || item.userId !== userId) {
    throw new NotFoundError("Library item not found", { libraryItemId });
  }

  return prisma.$transaction(async (tx) => {
    await tx.libraryItem.update({
      where: { id: libraryItemId },
      data: { statusIsManual: false },
    });

    await syncLibraryStatusFromRuns(tx, libraryItemId);

    return tx.libraryItem.findUniqueOrThrow({
      where: { id: libraryItemId },
    });
  });
}
