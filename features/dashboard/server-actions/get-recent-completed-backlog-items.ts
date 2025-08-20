"use server";

import { getRecentlyCompletedBacklogItems as getRecentlyCompletedBacklogItemsCommand } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getRecentCompletedBacklogItems = authorizedActionClient
  .metadata({
    actionName: "get-recent-completed-backlog-items",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    return getRecentlyCompletedBacklogItemsCommand({ userId });
  });
