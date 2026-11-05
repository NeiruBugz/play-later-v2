import {
  getLoggableGames,
  type LoggableGame,
} from "@/entities/library-item/api/get-loggable-games.server";
import { UnauthorizedError } from "@/shared/lib/errors";

/**
 * Worker for getLoggableGamesFn — plain async, no TanStack Start runtime.
 * Returns the user's library games for the Log form picker, Playing first.
 * Integration tests import this directly (foot-gun #8).
 */
export async function getLoggableGamesWorker(
  userId: string | undefined
): Promise<LoggableGame[]> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  return getLoggableGames(userId);
}
