"use server";

import { prisma } from "@/shared/lib/db";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getSteamIntegrationConnectionState = authorizedActionClient
  .metadata({
    actionName: "getSteamIntegrationConnectionState",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        steamId64: true,
        steamConnectedAt: true,
        steamProfileURL: true,
      },
    });

    return {
      isConnected: !!user?.steamConnectedAt || !!user?.steamId64,
      steamProfileURL: user?.steamProfileURL,
    };
  });
