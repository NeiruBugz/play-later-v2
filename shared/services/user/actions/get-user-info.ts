"use server";

import { getUserInfo as getUserInfoCommand } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getUserInfo = authorizedActionClient
  .metadata({
    actionName: "getUserInfo",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    const user = await getUserInfoCommand({ userId });

    if (!user) {
      throw new Error("No user with this id");
    }

    return user;
  });
