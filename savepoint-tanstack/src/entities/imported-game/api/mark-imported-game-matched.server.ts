import type { Prisma } from "../../../../shared/lib/prisma/client.ts";

/**
 * Flip a row to `MATCHED` inside the caller's transaction, so it leaves the
 * "needs work" list in the same commit that adds the game to the library.
 */
export async function markImportedGameMatchedInTx(
  tx: Prisma.TransactionClient,
  importedGameId: string
): Promise<void> {
  await tx.importedGame.update({
    where: { id: importedGameId },
    data: { igdbMatchStatus: "MATCHED" },
  });
}
