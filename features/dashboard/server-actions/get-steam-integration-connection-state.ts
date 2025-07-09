"use server";

import { getUserSteamData } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getSteamIntegrationConnectionState = authorizedActionClient
  .metadata({
    actionName: "getSteamIntegrationConnectionState",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    const user = await getUserSteamData({ userId });

    return {
      isConnected: !!user?.steamConnectedAt || !!user?.steamId64,
      steamProfileURL: user?.steamProfileURL,
    };
  });
