"use server";

import { disconnectSteam } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const removeSteamDataFromUser = authorizedActionClient
  .metadata({
    actionName: "removeSteamDataFromUser",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    const user = await disconnectSteam({ userId });

    return user;
  });
