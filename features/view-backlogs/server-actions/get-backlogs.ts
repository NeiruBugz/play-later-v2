"use server";

import { getOtherUsersBacklogs } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getBacklogs = authorizedActionClient
  .metadata({
    actionName: "getBacklogs",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    return getOtherUsersBacklogs({ userId });
  });
