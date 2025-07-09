"use server";

import { z } from "zod";

import { getAllReviewsForGame } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getReviews = authorizedActionClient
  .metadata({
    actionName: "getReviews",
    requiresAuth: true,
  })
  .inputSchema(
    z.object({
      gameId: z.string(),
    })
  )
  .action(async ({ parsedInput }) => {
    return await getAllReviewsForGame({ gameId: parsedInput.gameId });
  });
