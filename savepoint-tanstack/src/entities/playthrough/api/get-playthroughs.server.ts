import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import type { PlaythroughWithEntries } from "../model/types";

/**
 * Returns all playthroughs for a library item, newest-first (ordinal desc),
 * with their journal entries included (createdAt desc).
 *
 * Ownership two-step: `findUnique` + userId check → `NotFoundError` for
 * missing-or-not-yours (anti-enumeration).
 */
export async function getPlaythroughs(
  userId: string,
  libraryItemId: number
): Promise<PlaythroughWithEntries[]> {
  const item = await prisma.libraryItem.findUnique({
    where: { id: libraryItemId },
  });

  if (!item || item.userId !== userId) {
    throw new NotFoundError("Library item not found", { libraryItemId });
  }

  return prisma.playthrough.findMany({
    where: { libraryItemId },
    include: {
      journalEntries: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { ordinal: "desc" },
  });
}
