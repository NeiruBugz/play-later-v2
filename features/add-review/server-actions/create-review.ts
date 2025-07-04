"use server";

import { ReviewService } from "@/domain/review/service";
import { CreateReviewSchema } from "@/domain/review/types";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { revalidatePath } from "next/cache";

export const createReview = authorizedActionClient
  .metadata({
    actionName: "createReview",
  })
  .inputSchema(CreateReviewSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    await ReviewService.create(parsedInput, userId);
    revalidatePath(`/game/${parsedInput.gameId}`);
  });
