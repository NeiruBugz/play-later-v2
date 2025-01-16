import type { GameWithBacklogItems } from "@/slices/backlog/api/get/get-user-games-with-grouped-backlog";
import { SteamAppInfo } from "@/src/shared/types";
import { BacklogItemStatus, IgnoredImportedGames } from "@prisma/client";
import Fuse from "fuse.js";
import { useMemo } from "react";
import { mergeSteamGames } from "./merge-steam-games";

function normalizeString(input: string) {
  return input
    .toLowerCase()
    .replace(/[:\-]/g, "")
    .replace(/\b(?:the)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function createFuse(items: { name: string }[]) {
  return new Fuse(items, {
    keys: ["name"],
    threshold: 0.3,
    distance: 100,
  });
}

/**
 * Removes special characters like trademarks, copyright, and similar from the string.
 */
function normalizeTitle(input: string): string {
  const specialCharsRegex =
    /[\u2122\u00A9\u00AE\u0024\u20AC\u00A3\u00A5\u2022\u2026]/g;
  return input.replace(specialCharsRegex, "").toLowerCase().trim();
}

/**
 * Filters out games already present in the existing backlog for the PC platform.
 */
function filterExistingGames(
  steamGames: SteamAppInfo[],
  existingGames: GameWithBacklogItems[]
): SteamAppInfo[] {
  const fuse = createFuse(
    existingGames.map((game) => ({ name: normalizeString(game.game.title) }))
  );
  return steamGames.filter((steamGame) => {
    const normalizedSteamName = normalizeString(steamGame.name);
    const result = fuse.search(normalizedSteamName);

    if (result.length) {
      // Check for platform match (e.g., PC).
      const matchedGame = existingGames.find(
        (existingGame) =>
          normalizeString(existingGame.game.title) === result[0].item.name
      );

      if (matchedGame) {
        const hasPcPlatform = matchedGame.backlogItems.some(
          (item) => item.platform?.toLowerCase() === "pc"
        );
        return !hasPcPlatform;
      }
    }

    return true;
  });
}

/**
 * Filters out ignored games based on the ignoredGames list.
 */
function filterIgnoredGames(
  steamGames: SteamAppInfo[],
  ignoredGames: IgnoredImportedGames[]
): SteamAppInfo[] {
  const fuse = createFuse(
    ignoredGames.map((ignoredGame) => ({
      name: normalizeString(ignoredGame.name),
    }))
  );
  return steamGames.filter((steamGame) => {
    const normalizedSteamName = normalizeString(steamGame.name);
    return !fuse.search(normalizedSteamName).length;
  });
}

/**
 * Filters out games with undesired labels like "test", "demo", or "beta".
 */
function filterUndesiredLabels(steamGames: SteamAppInfo[]): SteamAppInfo[] {
  return steamGames.filter((steamGame) => {
    const lowerCasedName = steamGame.name.toLowerCase();
    return !(
      lowerCasedName.includes("test") ||
      lowerCasedName.includes("demo") ||
      lowerCasedName.includes("beta")
    );
  });
}

/**
 * Sorts and maps the games to include the backlog status based on playtime.
 * Games are sorted alphabetically after normalization.
 */
function sortAndMapGames(
  steamGames: SteamAppInfo[]
): Array<SteamAppInfo & { status: BacklogItemStatus }> {
  return steamGames
    .sort((a, b) =>
      normalizeTitle(a.name).localeCompare(normalizeTitle(b.name))
    )
    .map((game) => ({
      ...game,
      status:
        game.playtime_forever === 0
          ? BacklogItemStatus.TO_PLAY
          : BacklogItemStatus.PLAYED,
    }));
}

/**
 * Main hook to process imported games.
 */
function useImportedGames({
  games,
  existingGames,
  ignoredGames,
}: {
  games: SteamAppInfo[];
  existingGames: GameWithBacklogItems[];
  ignoredGames: IgnoredImportedGames[];
}) {
  const processedGames = useMemo(() => {
    if (!games.length) return [];

    const mergedGames = mergeSteamGames([...games]);
    const filteredByExisting = filterExistingGames(mergedGames, existingGames);
    const filteredByIgnored = filterIgnoredGames(
      filteredByExisting,
      ignoredGames
    );
    const filteredByLabels = filterUndesiredLabels(filteredByIgnored);
    return sortAndMapGames(filteredByLabels);
  }, [existingGames, games, ignoredGames]);

  return { processedGames };
}

export { useImportedGames };
