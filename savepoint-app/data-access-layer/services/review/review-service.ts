/**
 * ReviewService - Business logic layer for review operations
 *
 * This service handles all business logic for review management.
 * Input validation is handled at the server action layer via Zod.
 * This service focuses on:
 * - Business rule enforcement (e.g., ownership validation)
 * - Data transformation
 * - Repository orchestration
 * - Error handling
 *
 * @module shared/services/review/review-service
 */

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

/**
 * ReviewService class
 *
 * Provides business logic operations for managing reviews.
 * All methods return ServiceResult discriminated unions for type-safe error handling.
 *
 * @example
 * ```typescript
 * const service = new ReviewService();
 *
 * // Create a review
 * const result = await service.createReview({
 *   userId: "user-123",
 *   gameId: "game-456",
 *   rating: 5,
 *   content: "Amazing game!"
 * });
 *
 * if (result.success) {
 *   console.log(result.data.review); // TypeScript knows review exists
 * } else {
 *   console.error(result.error); // TypeScript knows error exists
 * }
 * ```
 */
export class ReviewService extends BaseService {
  private logger = createLogger({ service: "ReviewService" });
  /**
   * Get reviews for a specific game.
   *
   * Fetches all reviews for a game, optionally filtered by user.
   * Reviews include basic user information (name, image, username).
   *
   * @param input - Filter parameters (gameId required, userId optional)
   * @returns ServiceResult with reviews array and total count
   *
   * @example
   * ```typescript
   * // Get all reviews for a game
   * const result = await service.getReviews({
   *   gameId: "game-456"
   * });
   *
   * // Get specific user's review for a game
   * const result = await service.getReviews({
   *   gameId: "game-456",
   *   userId: "user-123"
   * });
   *
   * if (result.success) {
   *   console.log(result.data.reviews);
   *   console.log(result.data.total);
   * }
   * ```
   */
  async getReviews(input: GetReviewsInput): Promise<GetReviewsResult> {
    try {
      const reviews = await getAllReviewsForGame({ gameId: input.gameId });

      // Filter by userId if provided
      const filteredReviews = input.userId
        ? reviews.filter((review) => review.userId === input.userId)
        : reviews;

      return this.success({
        reviews: filteredReviews,
        total: filteredReviews.length,
      });
    } catch (error) {
      return this.handleError(error, "Failed to fetch reviews");
    }
  }

  /**
   * Create a new review.
   *
   * Business rules:
   * - Rating must be between 1 and 5 (validated by Zod at action layer)
   * - User can only have one review per game (not enforced here, handled by unique constraint)
   * - Content and completedOn are optional
   *
   * @param input - Creation parameters
   * @returns ServiceResult with the created review
   *
   * @example
   * ```typescript
   * // Create review with rating only
   * const result = await service.createReview({
   *   userId: "user-123",
   *   gameId: "game-456",
   *   rating: 5
   * });
   *
   * // Create review with all fields
   * const result = await service.createReview({
   *   userId: "user-123",
   *   gameId: "game-456",
   *   rating: 4,
   *   content: "Great game with minor issues",
   *   completedOn: "2024-03-15"
   * });
   *
   * if (result.success) {
   *   console.log(result.data.review);
   * }
   * ```
   */
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
      // Check for unique constraint violation (user already reviewed this game)
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

  /**
   * Update an existing review.
   *
   * Business rules:
   * - Only the review owner (userId) can update
   * - At least one field must be provided for update
   *
   * Note: The review repository doesn't have an update function yet.
   * This method is a placeholder for future implementation.
   *
   * @param input - Update parameters
   * @returns ServiceResult with the updated review
   *
   * @example
   * ```typescript
   * // Update rating
   * const result = await service.updateReview({
   *   userId: "user-123",
   *   id: "review-789",
   *   rating: 4
   * });
   *
   * // Update content
   * const result = await service.updateReview({
   *   userId: "user-123",
   *   id: "review-789",
   *   content: "Updated my thoughts after finishing the game"
   * });
   * ```
   */
  async updateReview(): Promise<UpdateReviewResult> {
    // TODO: Implement when review repository has update function
    return this.error(
      "Update review functionality not yet implemented",
      ServiceErrorCode.INTERNAL_ERROR
    );
  }

  /**
   * Delete a review.
   *
   * Business rules:
   * - Only the review owner (userId) can delete
   *
   * Note: The review repository doesn't have a delete function yet.
   * This method is a placeholder for future implementation.
   *
   * @param input - Delete parameters
   * @returns ServiceResult with success message
   *
   * @example
   * ```typescript
   * const result = await service.deleteReview({
   *   id: "review-789",
   *   userId: "user-123"
   * });
   *
   * if (result.success) {
   *   console.log(result.data.message);
   * }
   * ```
   */
  async deleteReview(): Promise<DeleteReviewResult> {
    // TODO: Implement when review repository has delete function
    return this.error(
      "Delete review functionality not yet implemented",
      ServiceErrorCode.INTERNAL_ERROR
    );
  }

  /**
   * Get aggregated rating for a game.
   *
   * Calculates the average rating across all reviews for a game.
   * Returns null if no reviews exist.
   *
   * Note: Currently uses aggregateReviewsRatingsForUser which aggregates by user.
   * This should be updated to aggregate by game when that repository function exists.
   *
   * @param input - Game ID
   * @returns ServiceResult with average rating and count
   *
   * @example
   * ```typescript
   * const result = await service.getAggregatedRating({
   *   gameId: "game-456"
   * });
   *
   * if (result.success) {
   *   console.log(result.data.averageRating); // 4.2
   *   console.log(result.data.count); // 15 reviews
   * }
   * ```
   */
  async getAggregatedRating(
    input: GetAggregatedRatingInput
  ): Promise<GetAggregatedRatingResult> {
    try {
      // Get all reviews for the game to calculate aggregate
      const reviews = await getAllReviewsForGame({ gameId: input.gameId });

      if (reviews.length === 0) {
        return this.success({
          averageRating: null,
          count: 0,
        });
      }

      // Calculate average rating
      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating = totalRating / reviews.length;

      return this.success({
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        count: reviews.length,
      });
    } catch (error) {
      return this.handleError(error, "Failed to get aggregated rating");
    }
  }

  /**
   * Get aggregated review ratings for a user (dashboard use-case).
   */
  async getAggregatedRatingsForUser(userId: string) {
    try {
      // Reuse repository function until a more specific service type is defined
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
