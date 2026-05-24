import { getGamePlatforms } from "@/entities/game/api";
import { getUniqueLibraryPlatforms } from "@/entities/library-item/api/get-unique-platforms.server";
import { UnauthorizedError } from "@/shared/lib/errors";

import {
  GET_PLATFORM_OPTIONS_INPUT,
  PLATFORM_GROUP_LABELS,
  type PlatformOptions,
} from "./get-platform-options.constants";

export { GET_PLATFORM_OPTIONS_INPUT } from "./get-platform-options.constants";

const sortUnique = (platforms: string[]): string[] =>
  Array.from(new Set(platforms)).sort((a, b) => a.localeCompare(b));

/**
 * Platform options for the library modal's Platform combobox, grouped by
 * provenance so the UI can visually separate them:
 *  - "This game": the game's stored IGDB platforms (if any),
 *  - "Your platforms": the user's distinct logged platforms not already in
 *    the first group (if any).
 * Each group is de-duplicated and sorted (localeCompare); empty groups are
 * omitted. The result may be an empty array when the game has no IGDB
 * platforms and the user has logged none — the combobox still lets the user
 * type and add any platform.
 */
export async function getPlatformOptionsWorker(
  userId: string | undefined,
  data: unknown
): Promise<PlatformOptions> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  const { gameId } = GET_PLATFORM_OPTIONS_INPUT.parse(data);

  const [igdb, mine] = await Promise.all([
    getGamePlatforms(gameId),
    getUniqueLibraryPlatforms(userId),
  ]);

  const groups: PlatformOptions = [];

  const gamePlatforms = sortUnique(igdb);
  if (gamePlatforms.length > 0) {
    groups.push({
      label: PLATFORM_GROUP_LABELS.game,
      platforms: gamePlatforms,
    });
  }

  const alreadyListed = new Set(gamePlatforms);
  const userOnly = sortUnique(mine.filter((p) => !alreadyListed.has(p)));
  if (userOnly.length > 0) {
    groups.push({ label: PLATFORM_GROUP_LABELS.user, platforms: userOnly });
  }

  return groups;
}
