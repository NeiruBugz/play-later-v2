import { prisma } from "@/shared/lib/db.server";

export type ImportableRow = {
  id: string;
  gameId: string;
  playtime: number | null;
  lastPlayedAt: Date | null;
};

/**
 * The rows of a chunk that add-all may still put in the library: live, not
 * dismissed, not already added (`MATCHED`) and linked to a catalogue game.
 * Ordered by `id`, the order gather chunked them in, so a redelivery resumes
 * where the failed one stopped.
 */
export async function findImportableRowsInChunk(
  userId: string,
  importedGameIds: string[]
): Promise<ImportableRow[]> {
  const rows = await prisma.importedGame.findMany({
    where: {
      id: { in: importedGameIds },
      userId,
      deletedAt: null,
      igdbMatchStatus: { in: ["PENDING", "UNMATCHED"] },
      gameId: { not: null },
    },
    select: {
      id: true,
      gameId: true,
      playtime: true,
      lastPlayedAt: true,
    },
    orderBy: { id: "asc" },
  });

  return rows.flatMap(({ gameId, ...row }) =>
    gameId === null ? [] : [{ ...row, gameId }]
  );
}
