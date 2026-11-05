import { prisma } from "@/shared/lib/db.server";

import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";

/**
 * Per-status counts across the user's **entire** library, independent of any
 * active filter. Every status key is always present (zeroed when absent) so
 * the filter rail can render a complete, stable list.
 *
 * This must be queried separately from the (filtered) library grid: deriving
 * counts from the returned page would collapse the rail the moment a status is
 * selected — picking "Playing" would make every other status read 0. The rail
 * answers "how big is each slice of my whole library?"; the grid answers "show
 * me the slice I picked."
 */
export type LibraryStatusCountMap = Record<LibraryItemStatus, number>;

export type LibraryStatusCounts = LibraryStatusCountMap & {
  /** Queued games (any status with a non-null `upNextPosition`). */
  upNext: number;
};

export async function getLibraryStatusCounts(
  userId: string
): Promise<LibraryStatusCounts> {
  const [grouped, upNext] = await Promise.all([
    prisma.libraryItem.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    }),
    prisma.libraryItem.count({
      where: { userId, upNextPosition: { not: null } },
    }),
  ]);

  const counts: LibraryStatusCounts = {
    WANT: 0,
    PLAYING: 0,
    DONE: 0,
    upNext,
  };
  for (const row of grouped) {
    counts[row.status] = row._count;
  }
  return counts;
}
