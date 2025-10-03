"use server";

import { getRecentlyCompletedLibraryItems } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getRecentCompletedLibraryItems = authorizedActionClient
  .metadata({
    actionName: "get-recent-completed-library-items",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    return getRecentlyCompletedLibraryItems({ userId });
  });
