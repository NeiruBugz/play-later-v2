import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import type {
  LibraryItem,
  LibraryItemStatus,
} from "../../../../shared/lib/prisma/client.ts";

/**
 * Pins a `LibraryItem` to the given status and sets `statusIsManual = true`.
 *
 * This is the "Set manually" override — the manual value wins until
 * `clearLibraryStatusManual` is called to re-engage run-derived sync.
 * Subsequent `syncLibraryStatusFromRuns` calls will still update
 * `hasBeenPlayed` (a fact about runs) but will NOT overwrite `status`
 * while `statusIsManual` is true.
 *
 * Ownership two-step: `findUnique` + userId check → `NotFoundError` for
 * missing-or-not-yours (anti-enumeration).
 */
export async function setLibraryStatusManual(
  userId: string,
  libraryItemId: number,
  status: LibraryItemStatus
): Promise<LibraryItem> {
  const item = await prisma.libraryItem.findUnique({
    where: { id: libraryItemId },
  });

  if (!item || item.userId !== userId) {
    throw new NotFoundError("Library item not found", { libraryItemId });
  }

  return prisma.libraryItem.update({
    where: { id: libraryItemId },
    data: { status, statusIsManual: true },
  });
}
