import { getServerUserId } from "@/auth";
import { LibraryService } from "@/data-access-layer/services";
import { revalidatePath, revalidateTag } from "next/cache";

import { deleteLibraryItemAction } from "./delete-library-item";

vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

vi.mock("@/data-access-layer/services", () => ({
  LibraryService: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/shared/lib", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/shared/lib")>();
  return {
    ...original,
    createLogger: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  };
});

const mockGetServerUserId = vi.mocked(getServerUserId);
const mockRevalidatePath = vi.mocked(revalidatePath);
const mockRevalidateTag = vi.mocked(revalidateTag);
const MockLibraryService = vi.mocked(LibraryService);

describe("deleteLibraryItemAction server action", () => {
  let mockDeleteLibraryItem: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();

    mockDeleteLibraryItem = vi.fn();
    MockLibraryService.mockImplementation(function () {
      return {
        deleteLibraryItem: mockDeleteLibraryItem,
      } as any;
    });

    mockGetServerUserId.mockResolvedValue("user-123");
  });

  describe("Success Path", () => {
    it("should delete library item and return success", async () => {
      mockDeleteLibraryItem.mockResolvedValue(undefined);

      const result = await deleteLibraryItemAction({
        libraryItemId: 42,
      });

      expect(result).toEqual({
        success: true,
      });

      expect(mockDeleteLibraryItem).toHaveBeenCalledWith({
        libraryItemId: 42,
        userId: "user-123",
      });
    });

    it("should revalidate library page after successful deletion", async () => {
      mockDeleteLibraryItem.mockResolvedValue(undefined);

      await deleteLibraryItemAction({
        libraryItemId: 42,
      });

      expect(mockRevalidatePath).toHaveBeenCalledWith("/library");
    });

    it("should revalidate game detail pages after successful deletion", async () => {
      mockDeleteLibraryItem.mockResolvedValue(undefined);

      await deleteLibraryItemAction({
        libraryItemId: 42,
      });

      expect(mockRevalidatePath).toHaveBeenCalledWith("/games/[slug]", "page");
    });

    it("should call revalidatePath exactly twice on success", async () => {
      mockDeleteLibraryItem.mockResolvedValue(undefined);

      await deleteLibraryItemAction({
        libraryItemId: 42,
      });

      expect(mockRevalidatePath).toHaveBeenCalledTimes(2);
    });
  });

  describe("Authentication Errors", () => {
    it("should return error when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await deleteLibraryItemAction({
        libraryItemId: 42,
      });

      expect(result).toEqual({
        success: false,
        error: "You must be logged in to perform this action",
      });

      expect(mockDeleteLibraryItem).not.toHaveBeenCalled();
    });

    it("should not revalidate paths when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      await deleteLibraryItemAction({
        libraryItemId: 42,
      });

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("Validation Errors", () => {
    it("should return error for invalid library item ID (negative)", async () => {
      const result = await deleteLibraryItemAction({
        libraryItemId: -1,
      });

      expect(result).toEqual({
        success: false,
        error: "Invalid input data",
      });

      expect(mockDeleteLibraryItem).not.toHaveBeenCalled();
    });

    it("should return error for invalid library item ID (zero)", async () => {
      const result = await deleteLibraryItemAction({
        libraryItemId: 0,
      });

      expect(result).toEqual({
        success: false,
        error: "Invalid input data",
      });

      expect(mockDeleteLibraryItem).not.toHaveBeenCalled();
    });

    it("should return error for invalid library item ID (non-integer)", async () => {
      const result = await deleteLibraryItemAction({
        libraryItemId: 42.5,
      });

      expect(result).toEqual({
        success: false,
        error: "Invalid input data",
      });

      expect(mockDeleteLibraryItem).not.toHaveBeenCalled();
    });

    it("should not revalidate paths when validation fails", async () => {
      await deleteLibraryItemAction({
        libraryItemId: -1,
      });

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("Service Errors", () => {
    it("should return error when service throws for missing item", async () => {
      mockDeleteLibraryItem.mockRejectedValue(
        new Error("Library item not found")
      );

      const result = await deleteLibraryItemAction({
        libraryItemId: 999,
      });

      expect(result).toEqual({
        success: false,
        error: "Library item not found",
      });
    });

    it("should not revalidate paths when service throws", async () => {
      mockDeleteLibraryItem.mockRejectedValue(
        new Error("Library item not found")
      );

      await deleteLibraryItemAction({
        libraryItemId: 999,
      });

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("should return error when service throws authorization error", async () => {
      mockDeleteLibraryItem.mockRejectedValue(
        new Error("Not authorized to delete this library item")
      );

      const result = await deleteLibraryItemAction({
        libraryItemId: 42,
      });

      expect(result).toEqual({
        success: false,
        error: "Not authorized to delete this library item",
      });

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("Unexpected Errors", () => {
    it("should handle unexpected errors gracefully", async () => {
      mockDeleteLibraryItem.mockRejectedValue(
        new Error("Database connection lost")
      );

      const result = await deleteLibraryItemAction({
        libraryItemId: 42,
      });

      expect(result).toEqual({
        success: false,
        error: "Database connection lost",
      });
    });

    it("should handle non-Error exceptions", async () => {
      mockDeleteLibraryItem.mockRejectedValue("Unknown error");

      const result = await deleteLibraryItemAction({
        libraryItemId: 42,
      });

      expect(result).toEqual({
        success: false,
        error: "An unexpected error occurred",
      });
    });

    it("should not revalidate paths when unexpected error occurs", async () => {
      mockDeleteLibraryItem.mockRejectedValue(new Error("Network error"));

      await deleteLibraryItemAction({
        libraryItemId: 42,
      });

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle maximum safe integer ID", async () => {
      mockDeleteLibraryItem.mockResolvedValue(undefined);

      const result = await deleteLibraryItemAction({
        libraryItemId: Number.MAX_SAFE_INTEGER,
      });

      expect(result.success).toBe(true);
      expect(mockDeleteLibraryItem).toHaveBeenCalledWith({
        libraryItemId: Number.MAX_SAFE_INTEGER,
        userId: "user-123",
      });
    });

    it("should handle ID value of 1", async () => {
      mockDeleteLibraryItem.mockResolvedValue(undefined);

      const result = await deleteLibraryItemAction({
        libraryItemId: 1,
      });

      expect(result.success).toBe(true);
      expect(mockDeleteLibraryItem).toHaveBeenCalledWith({
        libraryItemId: 1,
        userId: "user-123",
      });
    });
  });

  describe("revalidateTag wiring", () => {
    it("should call revalidateTag with libraryCounts and profileStats on success", async () => {
      mockDeleteLibraryItem.mockResolvedValue(undefined);

      await deleteLibraryItemAction({ libraryItemId: 42 });

      expect(mockRevalidateTag).toHaveBeenCalledWith(
        "user:user-123:library:counts",
        "max"
      );
      expect(mockRevalidateTag).toHaveBeenCalledWith(
        "user:user-123:profile-stats",
        "max"
      );
    });

    it("should NOT call revalidateTag when service throws", async () => {
      mockDeleteLibraryItem.mockRejectedValue(
        new Error("Library item not found")
      );

      await deleteLibraryItemAction({ libraryItemId: 999 });

      expect(mockRevalidateTag).not.toHaveBeenCalled();
    });

    it("should NOT call revalidateTag on validation error", async () => {
      await deleteLibraryItemAction({ libraryItemId: -1 });

      expect(mockRevalidateTag).not.toHaveBeenCalled();
    });

    it("should NOT call revalidateTag when unauthenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      await deleteLibraryItemAction({ libraryItemId: 42 });

      expect(mockRevalidateTag).not.toHaveBeenCalled();
    });
  });

  describe("Service Integration", () => {
    it("should instantiate LibraryService correctly", async () => {
      mockDeleteLibraryItem.mockResolvedValue(undefined);

      await deleteLibraryItemAction({
        libraryItemId: 42,
      });

      expect(MockLibraryService).toHaveBeenCalledTimes(1);
    });

    it("should call deleteLibraryItem with both libraryItemId and userId", async () => {
      mockDeleteLibraryItem.mockResolvedValue(undefined);

      mockGetServerUserId.mockResolvedValue("custom-user-id");

      await deleteLibraryItemAction({
        libraryItemId: 123,
      });

      expect(mockDeleteLibraryItem).toHaveBeenCalledWith({
        libraryItemId: 123,
        userId: "custom-user-id",
      });
    });
  });
});
