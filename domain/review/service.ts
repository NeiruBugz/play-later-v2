import { prisma } from "@/shared/lib/db";

import { DatabaseError } from "../shared/errors";
import { failure, Result, wrapWithResult } from "../shared/result";
import { validateWithZod } from "../shared/validation";
import { CreateReviewInput, CreateReviewSchema } from "./types";

export const ReviewService = {
  getAll: async (gameId: string): Promise<Result<any[], DatabaseError>> => {
    if (!gameId) {
      return failure(new DatabaseError("Game ID is required"));
    }

    return wrapWithResult(async () => {
      const reviews = await prisma.review.findMany({
        where: { gameId },
        include: { User: true },
        orderBy: { createdAt: "desc" },
      });

      return reviews;
    }, "Failed to fetch reviews");
  },

  create: async (
    input: CreateReviewInput,
    userId: string
  ): Promise<Result<void, Error>> => {
    // Validate input
    const validationResult = validateWithZod(CreateReviewSchema, input);
    if (validationResult.isFailure) {
      return validationResult;
    }

    const payload = validationResult.value;

    return wrapWithResult(async () => {
      await prisma.review.create({
        data: {
          rating: payload.rating,
          content: payload.content,
          completedOn: payload.completedOn,
          User: {
            connect: {
              id: userId,
            },
          },
          Game: {
            connect: {
              id: payload.gameId,
            },
          },
        },
      });

      // Return void as we don't need to return any data
      return;
    }, "Failed to create review");
  },
};
