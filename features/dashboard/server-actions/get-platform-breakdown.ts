"use server";

import { getPlatformBreakdown as getPlatformBreakdownCommand } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getPlatformBreakdown = authorizedActionClient
  .metadata({
    actionName: "get-platform-breakdown",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    const result = await getPlatformBreakdownCommand({ userId });
    if (!result) {
      throw new Error("Failed to get platform breakdown");
    }

    const topPlatforms = result.filter((stat) => stat.platform !== null);

    return topPlatforms;
  });
