"use server";

import { LibraryItemStatus } from "@prisma/client";
import { z } from "zod";

import { getLibraryCount } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getLibraryItemsCount = authorizedActionClient
  .metadata({
    actionName: "getLibraryItemsCount",
    requiresAuth: true,
  })
  .inputSchema(
    z
      .object({
        status: z.nativeEnum(LibraryItemStatus).optional(),
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
      return getLibraryCount({ userId });
    }

    if (!parsedInput.gteClause?.createdAt) {
      return getLibraryCount({
        userId,
        status: parsedInput.status,
        gteClause: {
          createdAt: parsedInput.gteClause?.createdAt,
        },
      });
    }

    return getLibraryCount({ userId, status: parsedInput.status });
  });
