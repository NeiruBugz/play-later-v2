import {
  getLibrary,
  type GetLibraryResult,
} from "@/entities/library-item/api/get-library.server";
import { UnauthorizedError } from "@/shared/lib/errors";

/**
 * Worker for getLoggableGamesFn — plain async, no TanStack Start runtime.
 * Returns the user's library games (id/slug/title/cover) for the game picker.
 * Integration tests import this directly (foot-gun #8).
 */
export async function getLoggableGamesWorker(
  userId: string | undefined
): Promise<GetLibraryResult> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  return getLibrary(userId, {});
}
