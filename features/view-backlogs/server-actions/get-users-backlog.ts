"use server";

import { z } from "zod";

import { getBacklogByUsername } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getUsersBacklog = authorizedActionClient
  .metadata({
    actionName: "getUsersBacklog",
    requiresAuth: true,
  })
  .inputSchema(z.object({ username: z.string() }))
  .action(async ({ ctx: { userId }, parsedInput }) => {
    if (!userId) {
      throw new Error("User not authenticated");
    }
    return await getBacklogByUsername({ username: parsedInput.username });
  });
