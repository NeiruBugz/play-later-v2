import type { ServiceResult } from "../types";

export type CreateReviewInput = {
  userId: string;
  gameId: string;
  rating: number;
  content?: string;
  completedOn?: string;
};
export type UpdateReviewInput = {
  userId: string;
  id: string;
  rating?: number;
  content?: string;
  completedOn?: string;
};

export type GetReviewsInput = {
  gameId: string;
  userId?: string;
};

export type DeleteReviewInput = {
  id: string;
  userId: string;
};
export type GetAggregatedRatingInput = {
  gameId: string;
};

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

export type CreateReviewResult = ServiceResult<{
  review: ReviewData;
  message?: string;
}>;

export type UpdateReviewResult = ServiceResult<{
  review: ReviewData;
  message?: string;
}>;

export type GetReviewsResult = ServiceResult<{
  reviews: ReviewData[];
  total: number;
}>;

export type DeleteReviewResult = ServiceResult<{
  message: string;
}>;

export type GetAggregatedRatingResult = ServiceResult<{
  averageRating: number | null;
  count: number;
}>;
