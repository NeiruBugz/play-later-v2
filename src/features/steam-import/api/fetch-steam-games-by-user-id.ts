import { steamUrlBuilder } from "@/slices/import/steam/lib";
import { resolveVanityUrl } from "@/src/features/steam-import/api/resolve-vanity-url";
import { SteamAppInfo } from "@/src/shared/types";

type SteamUserGamesResponse = {
  response: {
    game_count: number;
    games: Array<SteamAppInfo>;
  };
};

async function fetchSteamGamesByUserId({
  steamId,
  isCustom = true,
}: {
  steamId: string;
  isCustom?: boolean;
}): Promise<SteamUserGamesResponse> {
  try {
    const steam64Id = isCustom ? await resolveVanityUrl(steamId) : steamId;

    if (!steam64Id) {
      return {
        response: {
          game_count: 0,
          games: [],
        },
      };
    }
    const steamUrl = steamUrlBuilder(steam64Id.toString());
    const request = await fetch(steamUrl);
    return await request.json();
  } catch (error) {
    console.error(error);
    return {
      response: {
        game_count: 0,
        games: [],
      },
    };
  }
}

export { fetchSteamGamesByUserId };
