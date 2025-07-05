"use server";

import { z } from "zod";

import { prisma } from "@/shared/lib/db";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getSteamIdForUser = authorizedActionClient
  .metadata({
    actionName: "getSteamIdForUser",
    requiresAuth: true,
  })
  .inputSchema(
    z.object({
      steamUsername: z.string(),
    })
  )
  .action(async ({ parsedInput: { steamUsername }, ctx: { userId } }) => {
    const steamId = await prisma.user.findUnique({
      where: { steamUsername, id: userId },
      select: { steamId64: true },
    });

    return steamId?.steamId64;
  });
