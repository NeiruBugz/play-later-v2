import { getServerUserId } from "@/auth";
import { LibraryService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";

import { deleteLibraryItemAction } from "./delete-library-item";

vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

vi.mock("@/data-access-layer/services", () => ({
  LibraryService: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockGetServerUserId = vi.mocked(getServerUserId);
const mockRevalidatePath = vi.mocked(revalidatePath);
const MockLibraryService = vi.mocked(LibraryService);

describe("deleteLibraryItemAction server action", () => {
  let mockDeleteLibraryItem: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDeleteLibraryItem = vi.fn();
    MockLibraryService.mockImplementation(
      () =>
        ({
          deleteLibraryItem: mockDeleteLibraryItem,
        }) as any
    );

    mockGetServerUserId.mockResolvedValue("user-123");
  });

  describe("Success Path", () => {
    it("should delete library item and return success", async () => {
      mockDeleteLibraryItem.mockResolvedValue({
        success: true,
      });

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
      mockDeleteLibraryItem.mockResolvedValue({
        success: true,
      });

      await deleteLibraryItemAction({
        libraryItemId: 42,
      });

      expect(mockRevalidatePath).toHaveBeenCalledWith("/library");
    });

    it("should revalidate game detail pages after successful deletion", async () => {
      mockDeleteLibraryItem.mockResolvedValue({
        success: true,
      });

      await deleteLibraryItemAction({
        libraryItemId: 42,
      });

      expect(mockRevalidatePath).toHaveBeenCalledWith("/games/[slug]", "page");
    });

    it("should call revalidatePath exactly twice on success", async () => {
      mockDeleteLibraryItem.mockResolvedValue({
        success: true,
      });

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
        error: "You must be logged in to delete library items",
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
    it("should return error when service fails to delete", async () => {
      mockDeleteLibraryItem.mockResolvedValue({
        success: false,
        error: "Library item not found",
      });

      const result = await deleteLibraryItemAction({
        libraryItemId: 999,
      });

      expect(result).toEqual({
        success: false,
        error: "Library item not found",
      });
    });

    it("should not revalidate paths when service fails", async () => {
      mockDeleteLibraryItem.mockResolvedValue({
        success: false,
        error: "Library item not found",
      });

      await deleteLibraryItemAction({
        libraryItemId: 999,
      });

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("should return error when user tries to delete another user's item", async () => {
      mockDeleteLibraryItem.mockResolvedValue({
        success: false,
        error: "Not authorized to delete this library item",
      });

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
      mockDeleteLibraryItem.mockResolvedValue({
        success: true,
      });

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
      mockDeleteLibraryItem.mockResolvedValue({
        success: true,
      });

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

  describe("Service Integration", () => {
    it("should instantiate LibraryService correctly", async () => {
      mockDeleteLibraryItem.mockResolvedValue({
        success: true,
      });

      await deleteLibraryItemAction({
        libraryItemId: 42,
      });

      expect(MockLibraryService).toHaveBeenCalledTimes(1);
    });

    it("should call deleteLibraryItem with both libraryItemId and userId", async () => {
      mockDeleteLibraryItem.mockResolvedValue({
        success: true,
      });

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
