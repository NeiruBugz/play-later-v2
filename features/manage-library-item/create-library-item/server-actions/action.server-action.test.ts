import { getServerUserId } from "@/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createLibraryItem as createLibraryItemRepository } from "@/shared/lib/repository";
import { RevalidationService } from "@/shared/ui/revalidation";

import { createLibraryItem } from "./action";

describe("createLibraryItem", () => {
  let mockGetServerUserId: ReturnType<typeof vi.mocked<typeof getServerUserId>>;
  let formData: FormData;

  beforeEach(() => {
    vi.clearAllMocks();
    formData = new FormData();
    formData.append("gameId", "game-123");
    formData.append("platform", "PC");
    formData.append("status", "CURIOUS_ABOUT");
    mockGetServerUserId = vi.mocked(getServerUserId);
  });

  describe("when user is not authenticated", () => {
    it("should throw authentication error", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await createLibraryItem(formData);

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
      it("should throw validation error for missing gameId", async () => {
        const invalidFormData = new FormData();
        invalidFormData.append("platform", "PC");
        invalidFormData.append("status", "CURIOUS_ABOUT");

        const result = await createLibraryItem(invalidFormData);

        expect(result.serverError).toBeUndefined();
        expect(result.validationErrors?.fieldErrors).toBeDefined();
        expect(result.validationErrors?.fieldErrors?.gameId).toBeDefined();
      });

      it("should throw validation error for missing platform", async () => {
        const invalidFormData = new FormData();
        invalidFormData.append("gameId", "game-123");
        invalidFormData.append("status", "CURIOUS_ABOUT");

        const result = await createLibraryItem(invalidFormData);

        expect(result.serverError).toBeUndefined();
        expect(result.validationErrors?.fieldErrors).toBeDefined();
        expect(result.validationErrors?.fieldErrors?.platform).toBeDefined();
      });

      it("should throw validation error for missing status", async () => {
        const invalidFormData = new FormData();
        invalidFormData.append("gameId", "game-123");
        invalidFormData.append("platform", "PC");

        const result = await createLibraryItem(invalidFormData);

        expect(result.serverError).toBeUndefined();
        expect(result.validationErrors?.fieldErrors).toBeDefined();
        expect(result.validationErrors?.fieldErrors?.status).toBeDefined();
      });
    });

    describe("when input is valid", () => {
      it("should create backlog item successfully", async () => {
        vi.mocked(createLibraryItemRepository).mockResolvedValue({
          id: 1,
          status: "CURIOUS_ABOUT",
          createdAt: new Date(),
          updatedAt: new Date(),
          platform: "PC",
          acquisitionType: "PHYSICAL",
          gameId: "game-123",
          startedAt: null,
          completedAt: null,
          userId: "test-user-id",
        });
        const revalidateCollectionSpy = vi.spyOn(
          RevalidationService,
          "revalidateCollection"
        );
        const result = await createLibraryItem(formData);

        expect(result.serverError).toBeUndefined();
        expect(result.validationErrors).toBeUndefined();

        expect(revalidateCollectionSpy).toHaveBeenCalled();
      });

      it("should create backlog item with dates", async () => {
        const revalidateCollectionSpy = vi.spyOn(
          RevalidationService,
          "revalidateCollection"
        );
        formData.append("startedAt", "2025-01-01");
        formData.append("completedAt", "2025-01-31");

        const result = await createLibraryItem(formData);

        expect(result.serverError).toBeUndefined();
        expect(result.validationErrors).toBeUndefined();

        expect(revalidateCollectionSpy).toHaveBeenCalled();
      });
    });
  });
});
