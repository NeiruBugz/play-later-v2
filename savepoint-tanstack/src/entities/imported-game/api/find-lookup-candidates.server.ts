import { prisma } from "@/shared/lib/db.server";

import type { LookupCandidate, Storefront } from "../model/types";

/**
 * The rows a sync still has work for: live, not dismissed, not already added
 * (`MATCHED`) and not already in the user's library.
 *
 * `includeResolved: false` keeps only rows with no catalogue game yet
 * (`gameId` null, which includes earlier needs-a-match rows); `true` also
 * returns rows already linked to a game, which add-all needs. Ordered by `id`
 * so chunk boundaries are stable across redeliveries.
 */
export function findLookupCandidates(
  userId: string,
  storefront: Storefront,
  { includeResolved }: { includeResolved: boolean }
): Promise<LookupCandidate[]> {
  return prisma.importedGame.findMany({
    where: {
      userId,
      storefront,
      deletedAt: null,
      igdbMatchStatus: { in: ["PENDING", "UNMATCHED"] },
      ...(includeResolved ? {} : { gameId: null }),
      OR: [{ gameId: null }, { game: { libraryItems: { none: { userId } } } }],
    },
    select: {
      id: true,
      storefrontGameId: true,
      gameId: true,
      playtime: true,
      lastPlayedAt: true,
    },
    orderBy: { id: "asc" },
  });
}
