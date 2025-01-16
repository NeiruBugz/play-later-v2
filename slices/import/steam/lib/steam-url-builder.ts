import { env } from "@/env.mjs";

const STEAM_API_URL =
  "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001";

function steamUrlBuilder(steamId: string) {
  const requestUrl = new URL(STEAM_API_URL);
  requestUrl.searchParams.set("steamid", steamId);
  requestUrl.searchParams.set("key", env.STEAM_API_KEY);
  requestUrl.searchParams.set("format", "json");
  requestUrl.searchParams.set("include_appinfo", "true");

  return requestUrl;
}

export { steamUrlBuilder };
