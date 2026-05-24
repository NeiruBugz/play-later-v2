import { z } from "zod";

import { getGamePlatforms } from "@/entities/game/api";
import { getUniqueLibraryPlatforms } from "@/entities/library-item/api/get-unique-platforms.server";
import { UnauthorizedError } from "@/shared/lib/errors";

export const GET_PLATFORM_OPTIONS_INPUT = z.object({
  gameId: z.string().min(1),
});

/**
 * Default platform list shown when a game has no stored IGDB platform data.
 * Single source of truth for the modal's fallback option set.
 */
export const DEFAULT_PLATFORMS = [
  "PC",
  "PlayStation 5",
  "PlayStation 4",
  "Xbox Series X|S",
  "Xbox One",
  "Nintendo Switch",
] as const;

/**
 * Platform options for the library modal's Platform dropdown:
 * the game's stored IGDB platforms ∪ the user's distinct logged platforms,
 * falling back to (DEFAULT_PLATFORMS ∪ the user's logged platforms) when the
 * game has no IGDB platform data. De-duplicated and sorted (localeCompare).
 */
export async function getPlatformOptionsWorker(
  userId: string | undefined,
  data: unknown
): Promise<string[]> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  const { gameId } = GET_PLATFORM_OPTIONS_INPUT.parse(data);

  const [igdb, mine] = await Promise.all([
    getGamePlatforms(gameId),
    getUniqueLibraryPlatforms(userId),
  ]);

  const base = igdb.length > 0 ? igdb : [...DEFAULT_PLATFORMS];

  return Array.from(new Set([...base, ...mine])).sort((a, b) =>
    a.localeCompare(b)
  );
}
