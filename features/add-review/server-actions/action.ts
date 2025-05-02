"use server";

import { getServerUserId } from "@/auth";
import { ReviewService } from "@/domain/review/service";
import { CreateReviewSchema } from "@/domain/review/types";
import { RevalidationService } from "@/shared/ui/revalidation";

export async function createReviewAction(
  prevState: { message: string; type: "error" | "success" },
  rating: number,
  input: FormData
) {
  // Authentication happens at this level
  const userId = await getServerUserId();
  if (!userId) {
    return {
      message: "User not authenticated",
      type: "error" as const,
    };
  }

  const gameId = input.get("gameId") as string;

  try {
    const result = await ReviewService.create(
      {
        gameId,
        userId, // This is still needed in the input, even though we also pass it as a separate param
        rating,
        content: input.get("content") as string,
        completedOn: input.get("completedOn") as string,
      },
      userId
    );

    if (result.isFailure) {
      return {
        message: result.error.message || "Failed to create review",
        type: "error" as const,
      };
    }

    // UI-specific revalidation, separated from domain logic
    RevalidationService.revalidateGame(gameId);

    return {
      message: "Review created successfully",
      type: "success" as const,
    };
  } catch (error) {
    console.error("Error creating review:", error);
    return {
      message: "An unexpected error occurred",
      type: "error" as const,
    };
  }
}
