"use server";

import { getUserSteamData } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getSteamUserData = authorizedActionClient
  .metadata({
    actionName: "getSteamUserData",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    const user = await getUserSteamData({ userId });

    return user;
  });
