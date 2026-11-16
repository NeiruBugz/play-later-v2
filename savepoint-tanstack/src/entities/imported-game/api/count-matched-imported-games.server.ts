import { prisma } from "@/shared/lib/db.server";

/** How many of the given rows are already added to the library (`MATCHED`). */
export function countMatchedImportedGames(
  userId: string,
  importedGameIds: string[]
): Promise<number> {
  return prisma.importedGame.count({
    where: {
      id: { in: importedGameIds },
      userId,
      igdbMatchStatus: "MATCHED",
    },
  });
}
