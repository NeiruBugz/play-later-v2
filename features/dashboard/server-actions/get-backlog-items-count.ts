"use server";

import { BacklogItemStatus } from "@prisma/client";
import { z } from "zod";

import { getBacklogCount } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getBacklogItemsCount = authorizedActionClient
  .metadata({
    actionName: "getBacklogItemsCount",
    requiresAuth: true,
  })
  .inputSchema(
    z
      .object({
        status: z.nativeEnum(BacklogItemStatus).optional(),
        gteClause: z
          .object({
            createdAt: z.date(),
          })
          .optional(),
      })
      .optional()
  )
  .action(async ({ parsedInput, ctx: { userId } }) => {
    if (!parsedInput?.status) {
      return getBacklogCount({ userId });
    }

    if (!parsedInput.gteClause?.createdAt) {
      return getBacklogCount({
        userId,
        status: parsedInput.status,
        gteClause: {
          createdAt: parsedInput.gteClause?.createdAt,
        },
      });
    }

    return getBacklogCount({ userId, status: parsedInput.status });
  });
