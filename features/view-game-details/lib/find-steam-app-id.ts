import { getSteamAppIdFromUrl } from "@/shared/lib/get-steam-app-id-from-url";
import { type FullGameInfoResponse } from "@/shared/types";

export function findSteamAppId(
  external_games: FullGameInfoResponse["external_games"] | undefined
) {
  if (!external_games || external_games.length === 0) {
    return null;
  }

  try {
    const externalGameWithSteamUrl = external_games.find((external) => {
      if (external.url !== undefined) {
        return external.url.includes("steampowered.com");
      }

      return false;
    });

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
