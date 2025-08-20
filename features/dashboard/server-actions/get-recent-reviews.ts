"use server";

import { getRecentReviews as getRecentReviewsCommand } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getRecentReviews = authorizedActionClient
  .metadata({
    actionName: "get-recent-reviews",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    return getRecentReviewsCommand({ userId });
  });
