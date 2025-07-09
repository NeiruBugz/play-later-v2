"use server";

import { getImportedGamesCount as getImportedGamesCountCommand } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getImportedGamesCount = authorizedActionClient
  .metadata({
    actionName: "getImportedGamesCount",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    return await getImportedGamesCountCommand({ userId });
  });
