"use server";

import { z } from "zod";

import { prisma } from "@/shared/lib/db";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getUserInfo = authorizedActionClient
  .metadata({
    actionName: "getUserInfo",
    requiresAuth: true,
  })
  .inputSchema(z.object({ userId: z.string().optional() }).optional())
  .action(async ({ ctx: { userId: contextUserId }, parsedInput }) => {
    const userIdInUse = parsedInput?.userId ?? contextUserId;
    const user = await prisma.user.findUnique({
      where: { id: userIdInUse },
      select: {
        id: true,
        name: true,
        username: true,
        steamProfileURL: true,
        steamConnectedAt: true,
        email: true,
      },
    });

    if (!user) {
      throw new Error("No user with this id");
    }

    return user;
  });
