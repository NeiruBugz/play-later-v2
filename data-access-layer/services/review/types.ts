/**
 * ReviewService Types
 *
 * Type definitions for the review service layer.
 * Input validation is handled at the server action layer via Zod.
 * These types focus on service layer inputs and outputs.
 *
 * @module shared/services/review/types
 */

import type { ServiceResult } from "../types";

// ============================================================================
// Input Types
// ============================================================================

/**
 * Input for creating a new review.
 */
export type CreateReviewInput = {
  userId: string;
  gameId: string;
  rating: number;
  content?: string;
  completedOn?: string;
};

/**
 * Input for updating an existing review.
 */
export type UpdateReviewInput = {
  userId: string;
  id: string;
  rating?: number;
  content?: string;
  completedOn?: string;
};

/**
 * Input for getting reviews for a game.
 */
export type GetReviewsInput = {
  gameId: string;
  userId?: string;
};

/**
 * Input for deleting a review.
 */
export type DeleteReviewInput = {
  id: string;
  userId: string;
};

/**
 * Input for getting aggregated rating for a game.
 */
export type GetAggregatedRatingInput = {
  gameId: string;
};

// ============================================================================
// Output Types
// ============================================================================

/**
 * Review data structure returned by service methods.
 */
export type ReviewData = {
  id: number;
  userId: string;
  gameId: string;
  rating: number;
  content: string | null;
  completedOn: string | null;
  createdAt: Date;
  updatedAt: Date;
  User?: {
    name: string | null;
    image: string | null;
    username: string | null;
  };
};

/**
 * Result type for creating a review.
 */
export type CreateReviewResult = ServiceResult<{
  review: ReviewData;
  message?: string;
}>;

/**
 * Result type for updating a review.
 */
export type UpdateReviewResult = ServiceResult<{
  review: ReviewData;
  message?: string;
}>;

/**
 * Result type for getting reviews.
 */
export type GetReviewsResult = ServiceResult<{
  reviews: ReviewData[];
  total: number;
}>;

/**
 * Result type for deleting a review.
 */
export type DeleteReviewResult = ServiceResult<{
  message: string;
}>;

/**
 * Result type for getting aggregated rating.
 */
export type GetAggregatedRatingResult = ServiceResult<{
  averageRating: number | null;
  count: number;
}>;
