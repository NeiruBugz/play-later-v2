"use server";

import { ReviewService } from "@/domain/review/service";
import {
  CreateReviewFormSchema,
  CreateReviewSchema,
} from "@/domain/review/types";
import { revalidatePath } from "next/cache";

import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const createReviewForm = authorizedActionClient
  .metadata({
    actionName: "createReviewForm",
    requiresAuth: true,
  })
  .inputSchema(CreateReviewFormSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    await ReviewService.create(parsedInput, userId);
    revalidatePath(`/game/${parsedInput.gameId}`);
  });

export const createReview = authorizedActionClient
  .metadata({
    actionName: "createReview",
    requiresAuth: true,
  })
  .inputSchema(CreateReviewSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    await ReviewService.create(parsedInput, userId);
    revalidatePath(`/game/${parsedInput.gameId}`);
  });
