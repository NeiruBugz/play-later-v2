"use server";

import { aggregateReviewsRatingsForUser } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getAggregatedReviewRatings = authorizedActionClient
  .metadata({
    actionName: "get-aggregated-review-ratings",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    return aggregateReviewsRatingsForUser({ userId });
  });
