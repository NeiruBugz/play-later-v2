"use server";

import { ReviewService } from "@/domain/review/service";
import { CreateReviewInput, CreateReviewSchema } from "@/domain/review/types";
import { validateWithZod } from "@/domain/shared/validation";
import { revalidatePath } from "next/cache";
import { validateCreateReview } from "../lib/validation";

export async function createReview(input: CreateReviewInput) {
  try {
    const validatedInput = validateWithZod(CreateReviewSchema, input);
    if (!validatedInput.isSuccess) {
      throw new Error();
    }
    await ReviewService.create(
      validatedInput.value,
      validatedInput.value.userId
    );
    revalidatePath(`/game/${validatedInput.value.gameId}`);
  } catch (e) {
    console.log(e);
  }
}
