import { getSteamAppIdFromUrl } from "@/shared/lib/get-steam-app-id-from-url";
import { type FullGameInfoResponse } from "@/shared/types";

export function findSteamAppId(
  external_games: FullGameInfoResponse["external_games"] | undefined
) {
  if (!external_games || external_games.length === 0) {
    return null;
  }

  const externalGameWithSteamUrl = external_games.find((external) => {
    if (external.url !== undefined) {
      return external.url.includes("steampowered.com");
    }

    return false;
  });

  if (!externalGameWithSteamUrl) {
    return null;
  }

  const steamAppId = getSteamAppIdFromUrl(externalGameWithSteamUrl.url);

  if (steamAppId === undefined) {
    return null;
  }

  return steamAppId;
}
