import { prisma } from "@/shared/lib/db.server";

import type { Storefront } from "../model/types";

/**
 * The games a sync refreshes rather than discovers: live rows created before
 * the job that are not removed (`IGNORED`), not already added (`MATCHED`) and
 * not in the user's library by `gameId`. These are exactly the games the
 * import page showed before the sync. Call it at gather, before any add-all
 * addition, and pass the result to `recordGatherPlan` as `refreshedGames`.
 */
export function countRefreshedImportedGames(
  userId: string,
  storefront: Storefront,
  jobCreatedAt: Date
): Promise<number> {
  return prisma.importedGame.count({
    where: {
      userId,
      storefront,
      deletedAt: null,
      createdAt: { lt: jobCreatedAt },
      igdbMatchStatus: { in: ["PENDING", "UNMATCHED"] },
      OR: [{ gameId: null }, { game: { libraryItems: { none: { userId } } } }],
    },
  });
}
