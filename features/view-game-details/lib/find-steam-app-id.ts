import { type ExternalGame, type Game } from "igdb-api-types";

import { getSteamAppIdFromUrl } from "@/shared/lib/get-steam-app-id-from-url";

const isExternalGame = (
  external: number | ExternalGame
): external is ExternalGame => typeof external === "object";

export function findSteamAppId(
  external_games: Game["external_games"] | undefined
) {
  if (!external_games || external_games.length === 0) {
    return null;
  }

  try {
    const externalGameWithSteamUrl = external_games
      .filter(isExternalGame)
      .find((external) => external.url?.includes("steampowered.com") ?? false);

    if (!externalGameWithSteamUrl) {
      throw new Error("No Steam URL found");
    }

    const steamAppId = getSteamAppIdFromUrl(externalGameWithSteamUrl.url);

    if (steamAppId === undefined) {
      throw new Error("Could not extract app ID from URL");
    }

    return steamAppId;
  } catch (error) {
    throw new Error("Could not extract app id from Steam URL", {
      cause: error,
    });
  }
}
