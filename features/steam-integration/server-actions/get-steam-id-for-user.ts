"use server";

import { z } from "zod";

import { getUserSteamId } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getSteamIdForUser = authorizedActionClient
  .metadata({
    actionName: "getSteamIdForUser",
    requiresAuth: true,
  })
  .inputSchema(
    z.object({
      steamUsername: z.string(),
    })
  )
  .action(async ({ parsedInput: { steamUsername }, ctx: { userId } }) => {
    const steamId = await getUserSteamId({ steamUsername, userId });

    return steamId?.steamId64;
  });
