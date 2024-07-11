"use server";

import { createReview } from "@/src/entities/review/model/create-review";
import { z } from "zod";

const CreateReviewSchema = z.object({
  gameId: z.string(),
  userId: z.string(),
  rating: z.number().min(1).max(10),
  content: z.string().optional(),
  completedOn: z.string().optional(),
});

export async function createReviewAction(
  prevState: { message: string; type: "error" | "success" },
  rating: number,
  input: FormData
) {
  const parsedInput = CreateReviewSchema.safeParse({
    gameId: input.get("gameId"),
    userId: input.get("userId"),
    rating: rating,
    content: input.get("content"),
    completedOn: input.get("completedOn"),
  });

  if (!parsedInput.success) {
    console.log(parsedInput.error.errors);
    return { message: "Invalid input", type: "error" };
  }

  await createReview(parsedInput.data);

  return {
    message: "Review created successfully",
  };
}
