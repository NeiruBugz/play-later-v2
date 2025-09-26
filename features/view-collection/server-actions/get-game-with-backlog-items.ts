"use server";

import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { CollectionService } from "@/shared/services";

import { FilterParamsSchema } from "../lib/validation";

const collectionService = new CollectionService();

export const getUserGamesWithGroupedBacklogPaginated = authorizedActionClient
  .metadata({
    actionName: "getUserGamesWithGroupedBacklogPaginated",
    requiresAuth: true,
  })
  .inputSchema(FilterParamsSchema)
  .action(async ({ parsedInput }) => {
    const result = await collectionService.getCollection({
      platform: parsedInput.platform,
      status: parsedInput.status,
      search: parsedInput.search,
      page: parsedInput.page,
    });

    if (!result.success) {
      throw new Error(result.error ?? "Failed to fetch user game collection");
    }

    return result.data;
  });
