import { getServerUserId } from "@/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteLibraryItem as deleteLibraryItemRepository } from "@/shared/lib/repository";
import { RevalidationService } from "@/shared/ui/revalidation";

import { deleteLibraryItemAction } from "./action";

const revalidateCollectionSpy = vi.spyOn(
  RevalidationService,
  "revalidateCollection"
);

describe("deleteLibraryItemAction", () => {
  let formData: FormData;
  let mockGetServerUserId: ReturnType<typeof vi.mocked<typeof getServerUserId>>;
  beforeEach(() => {
    vi.clearAllMocks();
    formData = new FormData();
    formData.append("id", "1");
    mockGetServerUserId = vi.mocked(getServerUserId);
  });

  describe("when user is not authenticated", () => {
    it("should throw authentication error", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await deleteLibraryItemAction(formData);

      expect(result.serverError).toBe(
        "Authentication required. Please sign in to continue."
      );
    });
  });

  describe("when user is authenticated", () => {
    beforeEach(() => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
    });

    describe("when input is invalid", () => {
      it("should throw validation error for missing id", async () => {
        const invalidFormData = new FormData();

        const result = await deleteLibraryItemAction(invalidFormData);

        expect(result.serverError).toBeUndefined();
        expect(result.validationErrors?.fieldErrors).toBeDefined();
        expect(result.validationErrors?.fieldErrors?.id).toBeDefined();
      });

      it("should throw validation error for non-numeric id", async () => {
        const invalidFormData = new FormData();
        invalidFormData.append("id", "not-a-number");

        const result = await deleteLibraryItemAction(invalidFormData);

        expect(result.serverError).toBeUndefined();
        expect(result.validationErrors?.fieldErrors).toBeDefined();
        expect(result.validationErrors?.fieldErrors?.id).toBeDefined();
      });
    });

    describe("when input is valid", () => {
      it("should delete backlog item successfully", async () => {
        vi.mocked(deleteLibraryItemRepository).mockResolvedValue({
          id: 1,
          userId: "test-user-id",
          gameId: "game-123",
          status: "CURIOUS_ABOUT",
          platform: "PC",
          acquisitionType: "DIGITAL",
          createdAt: new Date(),
          updatedAt: new Date(),
          startedAt: null,
          completedAt: null,
        });

        const result = await deleteLibraryItemAction(formData);

        expect(result.serverError).toBeUndefined();
        expect(result.validationErrors).toBeUndefined();

        expect(vi.mocked(deleteLibraryItemRepository)).toHaveBeenCalledWith({
          libraryItemId: 1,
          userId: "test-user-id",
        });

        expect(revalidateCollectionSpy).toHaveBeenCalled();
      });

      it("should handle backlog item not found error", async () => {
        vi.mocked(deleteLibraryItemRepository).mockRejectedValue(
          new Error("Library item not found")
        );

        const result = await deleteLibraryItemAction(formData);

        expect(result.serverError).toBe("Library item not found");
        expect(result.validationErrors).toBeUndefined();
        expect(result.data).toBeUndefined();

        expect(vi.mocked(deleteLibraryItemRepository)).toHaveBeenCalledWith({
          libraryItemId: 1,
          userId: "test-user-id",
        });

        expect(revalidateCollectionSpy).not.toHaveBeenCalled();
      });

      it("should handle general deletion errors", async () => {
        vi.mocked(deleteLibraryItemRepository).mockRejectedValue(
          new Error("Database connection failed")
        );

        const result = await deleteLibraryItemAction(formData);

        expect(result.serverError).toBe("Database connection failed");
        expect(result.validationErrors).toBeUndefined();
        expect(result.data).toBeUndefined();

        expect(revalidateCollectionSpy).not.toHaveBeenCalled();
      });
    });
  });
});
