"use server";

import { revalidatePath } from "next/cache";

import { createReview as createReviewCommand } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

import { CreateReviewFormSchema, CreateReviewSchema } from "../lib/validation";

export const createReviewForm = authorizedActionClient
  .metadata({
    actionName: "createReviewForm",
    requiresAuth: true,
  })
  .inputSchema(CreateReviewFormSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    await createReviewCommand({
      userId,
      gameId: parsedInput.gameId,
      review: {
        rating: parsedInput.rating,
        content: parsedInput.content,
        completedOn: parsedInput.completedOn
          ? new Date(parsedInput.completedOn)
          : undefined,
      },
    });
    revalidatePath(`/game/${parsedInput.gameId}`);
  });

export const createReview = authorizedActionClient
  .metadata({
    actionName: "createReview",
    requiresAuth: true,
  })
  .inputSchema(CreateReviewSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    await createReviewCommand({
      userId,
      gameId: parsedInput.gameId,
      review: {
        rating: parsedInput.rating,
        content: parsedInput.content || "",
        completedOn: parsedInput.completedOn
          ? new Date(parsedInput.completedOn)
          : undefined,
      },
    });
    revalidatePath(`/game/${parsedInput.gameId}`);
  });
