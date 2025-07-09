import { getServerUserId } from "@/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/shared/lib/db";

import { createReview, createReviewForm } from "./create-review";

const mockGetServerUserId = vi.mocked(getServerUserId);

describe("createReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when user is not authenticated", () => {
    it("should throw authentication error", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);
      const result = await createReview({
        gameId: "1",
        rating: 0,
        content: "This is a test review",
      });

      expect(result.serverError).toBe(
        "Authentication required. Please sign in to continue."
      );
    });
  });

  describe("when user is authenticated", () => {
    beforeEach(() => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
    });

    describe("when review input is invalid", () => {
      it("should throw validation error", async () => {
        const result = await createReview({
          gameId: "1",
          // @ts-expect-error - we want to test the validation error
          rating: "1",
          content: "This is a test review",
        });

        expect(result.serverError).toBeUndefined();
        expect(result.validationErrors?.fieldErrors).toBeDefined();
        expect(result.validationErrors?.fieldErrors?.rating).toBeDefined();
        expect(result.validationErrors?.fieldErrors?.rating).toEqual([
          "Expected number, received string",
        ]);
      });

      it("should create review", async () => {
        vi.mocked(prisma.review.create).mockResolvedValue({
          id: 1,
          rating: 5,
          content: "This is a test review",
          createdAt: new Date(),
          updatedAt: new Date(),
          completedOn: null,
          userId: "test-user-id",
          gameId: "1",
        });
        const result = await createReview({
          gameId: "1",
          rating: 5,
          content: "This is a test review",
        });

        expect(result.serverError).toBeUndefined();
        expect(result.validationErrors?.fieldErrors).toBeUndefined();
      });
    });
  });
});

describe("createReviewForm", () => {
  let reviewFormData: FormData;

  beforeEach(() => {
    vi.clearAllMocks();
    reviewFormData = new FormData();
    reviewFormData.append("gameId", "1");
    reviewFormData.append("rating", "5");
    reviewFormData.append("content", "This is a test review");
  });

  describe("when user is not authenticated", () => {
    it("should throw authentication error", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);
      const result = await createReviewForm(reviewFormData);

      expect(result.serverError).toBe(
        "Authentication required. Please sign in to continue."
      );
    });
  });

  describe("when user is authenticated", () => {
    beforeEach(() => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
    });

    it("should create review", async () => {
      vi.mocked(prisma.review.create).mockResolvedValue({
        id: 1,
        rating: 5,
        content: "This is a test review",
        createdAt: new Date(),
        updatedAt: new Date(),
        completedOn: null,
        userId: "test-user-id",
        gameId: "1",
      });

      const result = await createReviewForm(reviewFormData);

      expect(result.serverError).toBeUndefined();
      expect(result.validationErrors?.fieldErrors).toBeUndefined();
    });
  });
});
