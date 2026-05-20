import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

/**
 * Dismiss an imported-game row by setting its `igdbMatchStatus` to `IGNORED`.
 *
 * Schema reality check (confirmed in `prisma/schema.prisma`):
 *   - `ImportedGame` has NO `dismissed` boolean.
 *   - The canonical convention (see
 *     `savepoint-app/data-access-layer/services/imported-game/
 *     imported-game-service.ts`) is `igdbMatchStatus: "IGNORED"`.
 *   - The separate `IgnoredImportedGames` table is a name-based blocklist
 *     (3 columns: id, name, userId), not a per-row dismissal join. Out of
 *     scope for Phase C; may be revisited in Phase D for the UI surface.
 *
 * Two-step ownership check + idempotency: re-dismissing a row already in
 * `IGNORED` is a value-equivalent no-op.
 */
export async function dismissImportedGame(
  userId: string,
  importedGameId: string
): Promise<void> {
  const existing = await prisma.importedGame.findUnique({
    where: { id: importedGameId },
  });

  if (!existing || existing.userId !== userId || existing.deletedAt !== null) {
    throw new NotFoundError("Imported game not found", { importedGameId });
  }

  await prisma.importedGame.update({
    where: { id: importedGameId },
    data: { igdbMatchStatus: "IGNORED" },
  });
}
