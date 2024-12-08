import { env } from "@/env.mjs";

const STEAM_API_URL =
  "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/";
type ResolveVanityUrlResponse = {
    response: {
      steamid?: number;
      success: number;
    }
}
async function resolveVanityUrl(steamProfileUrl: string): Promise<number | undefined | null> {
  if (!steamProfileUrl) {
    return null;
  }

  try {
    const url = new URL(STEAM_API_URL);
    url.searchParams.set("key", env.STEAM_API_KEY);
    url.searchParams.set('vanityurl', steamProfileUrl);

    const request = await fetch(url);
    const response: ResolveVanityUrlResponse = await request.json();

    return response.response.steamid;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export { resolveVanityUrl };
