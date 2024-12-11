"use server";

import { fetchSteamGamesByUserId } from "@/src/features/steam-import/api/fetch-steam-games-by-user-id";
import { z } from "zod";

const FetchSteamProfileSchema = z.object({
  steamProfileUrl: z.string(),
});

async function fetchSteamProfile(
  prevState: { message: string; gameList: any[]; gameCount: number },
  payload: FormData
) {
  const parsedPayload = FetchSteamProfileSchema.safeParse({
    steamProfileUrl: payload.get("steamProfileUrl"),
  });

  if (!parsedPayload.success) {
    return {
      message: "Invalid profile URL",
      gameList: [],
      gameCount: 0,
    };
  }

  try {
    const [path, userNamePath] = new URL(parsedPayload.data.steamProfileUrl).pathname.split('/').filter(Boolean);

    const steamUserGamesResponse = await fetchSteamGamesByUserId({
      steamId: userNamePath,
      isCustom: path === 'id',
    });
    if (steamUserGamesResponse.response.game_count === 0) {
      return {
        message:
          "We couldn't find any game games with the same profile url or your profile is private",
        gameList: [],
        gameCount: 0,
      };
    }
    const { games, game_count } = steamUserGamesResponse.response;
    return {
      gameList: games,
      gameCount: game_count,
      message: "Success",
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Failed to fetch Steam profile",
      gameList: [],
      gameCount: 0,
    };
  }
}

export { fetchSteamProfile };
