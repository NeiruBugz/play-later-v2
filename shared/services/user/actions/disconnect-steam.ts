"use server";

import { disconnectSteam as disconnectSteamRepo } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const disconnectSteam = authorizedActionClient
  .metadata({
    actionName: "removeSteamDataFromUser",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    const user = await disconnectSteamRepo({ userId });

    return user;
  });
