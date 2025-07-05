"use server";

import { enrichWithIGDBSchema } from "@/features/view-imported-games/validation/enrich-with-igdb.schema";
import igdbApi from "@/shared/lib/igdb";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const enrichWithIGDBData = authorizedActionClient
  .metadata({
    actionName: "enrichWithIGDBData",
    requiresAuth: true,
  })
  .inputSchema(enrichWithIGDBSchema)
  .action(async ({ parsedInput: { steamAppId } }) => {
    const game = await igdbApi.getGameBySteamAppId(steamAppId);

    if (!game) {
      throw new Error("Game not found");
    }

    return game;
  });
