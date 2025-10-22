import "server-only";

import {
  createReview as createReviewRepo,
  getAllReviewsForGame,
} from "@/data-access-layer/repository/review/review-repository";

import { createLogger } from "@/shared/lib";

import { BaseService, ServiceErrorCode } from "../types";
import type {
  CreateReviewInput,
  CreateReviewResult,
  DeleteReviewResult,
  GetAggregatedRatingInput,
  GetAggregatedRatingResult,
  GetReviewsInput,
  GetReviewsResult,
  UpdateReviewResult,
} from "./types";

export class ReviewService extends BaseService {
  async getReviews(input: GetReviewsInput): Promise<GetReviewsResult> {
    try {
      const reviews = await getAllReviewsForGame({
        gameId: input.gameId,
        userId: input.userId,
      });

      return this.success({
        reviews,
        total: reviews.length,
      });
    } catch (error) {
      return this.handleError(error, "Failed to fetch reviews");
    }
  }

  async createReview(input: CreateReviewInput): Promise<CreateReviewResult> {
    try {
      const review = await createReviewRepo({
        userId: input.userId,
        gameId: input.gameId,
        review: {
          rating: input.rating,
          content: input.content,
          completedOn: input.completedOn,
        },
      });

      return this.success({
        review,
        message: "Review created successfully",
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint")
      ) {
        return this.error(
          "You have already reviewed this game",
          ServiceErrorCode.CONFLICT
        );
      }

      return this.handleError(error, "Failed to create review");
    }
  }

  async updateReview(): Promise<UpdateReviewResult> {
    return this.error(
      "Update review functionality not yet implemented",
      ServiceErrorCode.INTERNAL_ERROR
    );
  }

  async deleteReview(): Promise<DeleteReviewResult> {
    return this.error(
      "Delete review functionality not yet implemented",
      ServiceErrorCode.INTERNAL_ERROR
    );
  }

  async getAggregatedRating(
    input: GetAggregatedRatingInput
  ): Promise<GetAggregatedRatingResult> {
    try {
      const reviews = await getAllReviewsForGame({ gameId: input.gameId });

      if (reviews.length === 0) {
        return this.success({
          averageRating: null,
          count: 0,
        });
      }

      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating = totalRating / reviews.length;

      return this.success({
        averageRating: Math.round(averageRating * 10) / 10,
        count: reviews.length,
      });
    } catch (error) {
      return this.handleError(error, "Failed to get aggregated rating");
    }
  }

  async getAggregatedRatingsForUser(userId: string) {
    try {
      const { aggregateReviewsRatingsForUser } = await import(
        "@/data-access-layer/repository/review/review-repository"
      );
      const data = await aggregateReviewsRatingsForUser({ userId });
      return this.success(data);
    } catch (error) {
      return this.handleError(
        error,
        "Failed to get aggregated ratings for user"
      );
    }
  }
}
