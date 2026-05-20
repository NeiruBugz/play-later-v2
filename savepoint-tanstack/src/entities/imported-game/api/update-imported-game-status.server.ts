import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import type { IgdbMatchStatus, ImportedGame } from "../model/types";

/**
 * Update the `igdbMatchStatus` on an imported-game row.
 *
 * Two-step ownership check: first read the row, then compare its `userId`.
 * Both "missing" and "denied" throw `NotFoundError` — privacy invariant.
 * (See `.claude/rules/tanstack/errors.md`: "Privacy invariants throw
 * NotFoundError for both missing and denied".)
 */
export async function updateImportedGameStatus(
  userId: string,
  importedGameId: string,
  status: IgdbMatchStatus
): Promise<ImportedGame> {
  const existing = await prisma.importedGame.findUnique({
    where: { id: importedGameId },
  });

  if (!existing || existing.userId !== userId || existing.deletedAt !== null) {
    throw new NotFoundError("Imported game not found", { importedGameId });
  }

  return prisma.importedGame.update({
    where: { id: importedGameId },
    data: { igdbMatchStatus: status },
  });
}
