import { z } from "zod";

import { dismissImportedGame } from "@/entities/imported-game/api/dismiss-imported-game.server";
import { UnauthorizedError } from "@/shared/lib/errors";

/**
 * Worker for `dismissImportedGameFn` (Slice 21 Phase C).
 *
 * Plain async function — auth gate, Zod input parse, delegate to entity.
 */
export const DISMISS_IMPORTED_GAME_INPUT = z.object({
  importedGameId: z.string().min(1),
});

export async function dismissImportedGameWorker(
  userId: string | undefined,
  data: unknown
): Promise<void> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }
  const { importedGameId } = DISMISS_IMPORTED_GAME_INPUT.parse(data);
  await dismissImportedGame(userId, importedGameId);
}
