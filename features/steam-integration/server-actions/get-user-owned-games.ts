"use server";

import { z } from "zod";

import { SteamWebAPI } from "@/features/steam-integration/lib/steam-web-api";
import { getSteamIdForUser } from "@/features/steam-integration/server-actions/get-steam-id-for-user";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getUserOwnedGames = authorizedActionClient
  .metadata({
    actionName: "getUserOwnedGames",
    requiresAuth: true,
  })
  .inputSchema(
    z.object({
      steamUsername: z.string(),
    })
  )
  .action(async ({ parsedInput: { steamUsername } }) => {
    const { data: steamId } = await getSteamIdForUser({
      steamUsername,
    });

    if (!steamId) {
      throw new Error("Steam ID not found");
    }

    const steamApi = new SteamWebAPI();
    const ownedGames = await steamApi.getUserOwnedGames(steamId);

    const mappedToDomain = ownedGames?.response.games.map((game) => ({
      name: game.name,
      storefrontGameId: game.appid.toString(),
      playtime: game.playtime_forever,
      img_icon_url: game.img_icon_url,
      img_logo_url: game.img_logo_url,
    }));

    console.log(mappedToDomain);

    return mappedToDomain;
  });
