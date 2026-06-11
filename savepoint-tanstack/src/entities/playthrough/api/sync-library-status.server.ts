import {
  deriveHasBeenPlayed,
  deriveLibraryStatus,
} from "@/shared/lib/derive-playthrough-status";
import { NotFoundError } from "@/shared/lib/errors";

import type { Prisma } from "../../../../shared/lib/prisma/client.ts";

/**
 * Recomputes and persists `LibraryItem.status` + `hasBeenPlayed` from the
 * item's current playthroughs. Called inside every playthrough mutation's
 * transaction so status never drifts.
 *
 * Rules:
 * - If `!statusIsManual`: update both `status` (derived from runs) and
 *   `hasBeenPlayed` (fact about runs).
 * - If `statusIsManual`: update ONLY `hasBeenPlayed` — the user pinned
 *   their status, so we leave it alone.
 *
 * Throws `NotFoundError` if the item does not exist (guards callers from
 * silently writing to a deleted row).
 */
export async function syncLibraryStatusFromRuns(
  tx: Prisma.TransactionClient,
  libraryItemId: number
): Promise<void> {
  const item = await tx.libraryItem.findUnique({
    where: { id: libraryItemId },
    select: {
      status: true,
      statusIsManual: true,
      playthroughs: {
        select: { status: true },
      },
    },
  });

  if (!item) {
    throw new NotFoundError("Library item not found", { libraryItemId });
  }

  const runs = item.playthroughs;
  const hasBeenPlayed = deriveHasBeenPlayed(runs);

  if (!item.statusIsManual) {
    const derivedStatus = deriveLibraryStatus(runs, item.status);
    await tx.libraryItem.update({
      where: { id: libraryItemId },
      data: { status: derivedStatus, hasBeenPlayed },
    });
  } else {
    await tx.libraryItem.update({
      where: { id: libraryItemId },
      data: { hasBeenPlayed },
    });
  }
}
