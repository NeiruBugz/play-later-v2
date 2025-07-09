"use server";

import { getUniquePlatforms as getUniquePlatformsCommand } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getUserUniquePlatforms = authorizedActionClient
  .metadata({
    actionName: "get-user-unique-platforms",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    const platforms = await getUniquePlatformsCommand({ userId });
    return platforms.map((item) => item.platform).filter(Boolean);
  });
