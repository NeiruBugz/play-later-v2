"use server";

import { CollectionService } from "@/shared/services";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

import { FilterParamsSchema } from "../lib/validation";

const collectionService = new CollectionService();

export const getUserGamesWithGroupedBacklogPaginated = authorizedActionClient
  .metadata({
    actionName: "getUserGamesWithGroupedBacklogPaginated",
    requiresAuth: true,
  })
  .inputSchema(FilterParamsSchema)
  .action(async ({ ctx: { userId }, parsedInput }) => {
    const result = await collectionService.getCollection({
      userId,
      platform: parsedInput.platform,
      status: parsedInput.status,
      search: parsedInput.search,
      page: parsedInput.page,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch user game collection");
    }

    return result.data;
  });
