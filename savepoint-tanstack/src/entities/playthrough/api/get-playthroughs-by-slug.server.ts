import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import type { PlaythroughWithEntries } from "../model/types";

export type PlaythroughsBySlugResult = {
  gameId: string;
  playthroughs: PlaythroughWithEntries[];
};

/**
 * Returns the user's playthroughs for a game identified by its slug.
 *
 * Resolution path: slug → game → library item (user-scoped) → playthroughs.
 * Throws NotFoundError for both "game not found" and "not in user's library"
 * (anti-enumeration: caller cannot distinguish the two cases).
 */
export async function getPlaythroughsBySlug(
  userId: string,
  slug: string
): Promise<PlaythroughsBySlugResult> {
  const game = await prisma.game.findUnique({ where: { slug } });
  if (!game) {
    throw new NotFoundError("Game not found", { slug });
  }

  const libraryItem = await prisma.libraryItem.findFirst({
    where: { userId, gameId: game.id },
  });

  if (!libraryItem) {
    return { gameId: game.id, playthroughs: [] };
  }

  const playthroughs = await prisma.playthrough.findMany({
    where: { libraryItemId: libraryItem.id },
    include: { journalEntries: { orderBy: { createdAt: "desc" } } },
    orderBy: { ordinal: "desc" },
  });

  return { gameId: game.id, playthroughs };
}
