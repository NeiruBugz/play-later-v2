"use server";

import { z } from "zod";

import { getOtherUsersLibrariesPaginated } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getBacklogs = authorizedActionClient
  .metadata({
    actionName: "getBacklogs",
    requiresAuth: true,
  })
  .inputSchema(
    z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(24),
      search: z.string().optional(),
    })
  )
  .action(async ({ ctx: { userId }, parsedInput: { page, limit, search } }) => {
    return getOtherUsersLibrariesPaginated({
      userId,
      page,
      itemsPerPage: limit,
      search,
    });
  });
