import {
  createReview,
  getAllReviewsForGame,
} from "@/data-access-layer/repository/review/review-repository";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceErrorCode } from "../types";
import { ReviewService } from "./review-service";

vi.mock("@/data-access-layer/repository/review/review-repository", () => ({
  createReview: vi.fn(),
  getAllReviewsForGame: vi.fn(),
  aggregateReviewsRatingsForUser: vi.fn(),
}));

describe("ReviewService", () => {
  let service: ReviewService;
  let mockCreateReview: ReturnType<typeof vi.fn>;
  let mockGetAllReviewsForGame: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ReviewService();
    mockCreateReview = vi.mocked(createReview);
    mockGetAllReviewsForGame = vi.mocked(getAllReviewsForGame);
  });

  describe("getReviews", () => {
    it("should return all reviews for a game", async () => {
      const mockReviews = [
        {
          id: "review-1",
          userId: "user-123",
          gameId: "game-456",
          rating: 5,
          content: "Amazing game!",
          completedOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          User: {
            name: "John Doe",
            image: "avatar.jpg",
            username: "johndoe",
          },
        },
        {
          id: "review-2",
          userId: "user-789",
          gameId: "game-456",
          rating: 4,
          content: "Great game",
          completedOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          User: {
            name: "Jane Smith",
            image: "avatar2.jpg",
            username: "janesmith",
          },
        },
      ];

      mockGetAllReviewsForGame.mockResolvedValue(mockReviews);

      const result = await service.getReviews({
        gameId: "game-456",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reviews).toHaveLength(2);
        expect(result.data.total).toBe(2);
        expect(result.data.reviews).toEqual(mockReviews);
      }

      expect(mockGetAllReviewsForGame).toHaveBeenCalledWith({
        gameId: "game-456",
      });
    });

    it("should filter reviews by userId", async () => {
      const mockReviews = [
        {
          id: "review-1",
          userId: "user-123",
          gameId: "game-456",
          rating: 5,
          content: "Amazing game!",
          completedOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          User: {
            name: "John Doe",
            image: "avatar.jpg",
            username: "johndoe",
          },
        },
        {
          id: "review-2",
          userId: "user-789",
          gameId: "game-456",
          rating: 4,
          content: "Great game",
          completedOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          User: {
            name: "Jane Smith",
            image: "avatar2.jpg",
            username: "janesmith",
          },
        },
      ];

      mockGetAllReviewsForGame.mockResolvedValue(mockReviews);

      const result = await service.getReviews({
        gameId: "game-456",
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reviews).toHaveLength(1);
        expect(result.data.reviews[0].userId).toBe("user-123");
        expect(result.data.total).toBe(1);
      }
    });

    it("should return empty array when no reviews found", async () => {
      mockGetAllReviewsForGame.mockResolvedValue([]);

      const result = await service.getReviews({
        gameId: "game-456",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reviews).toHaveLength(0);
        expect(result.data.total).toBe(0);
      }
    });

    it("should handle repository errors", async () => {
      mockGetAllReviewsForGame.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.getReviews({
        gameId: "game-456",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("createReview", () => {
    it("should create a review with all fields", async () => {
      const mockReview = {
        id: "review-1",
        userId: "user-123",
        gameId: "game-456",
        rating: 5,
        content: "Amazing game!",
        completedOn: "2024-03-15",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCreateReview.mockResolvedValue(mockReview);

      const result = await service.createReview({
        userId: "user-123",
        gameId: "game-456",
        rating: 5,
        content: "Amazing game!",
        completedOn: "2024-03-15",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.review).toEqual(mockReview);
        expect(result.data.message).toBe("Review created successfully");
      }

      expect(mockCreateReview).toHaveBeenCalledWith({
        userId: "user-123",
        gameId: "game-456",
        review: {
          rating: 5,
          content: "Amazing game!",
          completedOn: "2024-03-15",
        },
      });
    });

    it("should create a review with only rating", async () => {
      const mockReview = {
        id: "review-1",
        userId: "user-123",
        gameId: "game-456",
        rating: 4,
        content: null,
        completedOn: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCreateReview.mockResolvedValue(mockReview);

      const result = await service.createReview({
        userId: "user-123",
        gameId: "game-456",
        rating: 4,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.review).toEqual(mockReview);
      }

      expect(mockCreateReview).toHaveBeenCalledWith({
        userId: "user-123",
        gameId: "game-456",
        review: {
          rating: 4,
          content: undefined,
          completedOn: undefined,
        },
      });
    });

    it("should handle duplicate review conflict", async () => {
      mockCreateReview.mockRejectedValue(
        new Error("Unique constraint violation")
      );

      const result = await service.createReview({
        userId: "user-123",
        gameId: "game-456",
        rating: 5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("You have already reviewed this game");
        expect(result.code).toBe(ServiceErrorCode.CONFLICT);
      }
    });

    it("should handle repository errors", async () => {
      mockCreateReview.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.createReview({
        userId: "user-123",
        gameId: "game-456",
        rating: 5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("getAggregatedRating", () => {
    it("should calculate average rating for a game", async () => {
      const mockReviews = [
        {
          id: "review-1",
          userId: "user-123",
          gameId: "game-456",
          rating: 5,
          content: null,
          completedOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          User: {
            name: "User 1",
            image: null,
            username: "user1",
          },
        },
        {
          id: "review-2",
          userId: "user-789",
          gameId: "game-456",
          rating: 4,
          content: null,
          completedOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          User: {
            name: "User 2",
            image: null,
            username: "user2",
          },
        },
        {
          id: "review-3",
          userId: "user-101",
          gameId: "game-456",
          rating: 3,
          content: null,
          completedOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          User: {
            name: "User 3",
            image: null,
            username: "user3",
          },
        },
      ];

      mockGetAllReviewsForGame.mockResolvedValue(mockReviews);

      const result = await service.getAggregatedRating({
        gameId: "game-456",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.averageRating).toBe(4);
        expect(result.data.count).toBe(3);
      }
    });

    it("should return null for games with no reviews", async () => {
      mockGetAllReviewsForGame.mockResolvedValue([]);

      const result = await service.getAggregatedRating({
        gameId: "game-456",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.averageRating).toBeNull();
        expect(result.data.count).toBe(0);
      }
    });

    it("should round average rating to 1 decimal place", async () => {
      const mockReviews = [
        {
          id: "review-1",
          userId: "user-123",
          gameId: "game-456",
          rating: 5,
          content: null,
          completedOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          User: {
            name: "User 1",
            image: null,
            username: "user1",
          },
        },
        {
          id: "review-2",
          userId: "user-789",
          gameId: "game-456",
          rating: 4,
          content: null,
          completedOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          User: {
            name: "User 2",
            image: null,
            username: "user2",
          },
        },
      ];

      mockGetAllReviewsForGame.mockResolvedValue(mockReviews);

      const result = await service.getAggregatedRating({
        gameId: "game-456",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.averageRating).toBe(4.5);
        expect(result.data.count).toBe(2);
      }
    });

    it("should handle repository errors", async () => {
      mockGetAllReviewsForGame.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.getAggregatedRating({
        gameId: "game-456",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });
});
