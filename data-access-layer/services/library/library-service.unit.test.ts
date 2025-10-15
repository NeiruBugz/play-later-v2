import {
  createLibraryItem,
  deleteLibraryItem,
  getLibraryCount,
  getManyLibraryItems,
  updateLibraryItem,
} from "@/data-access-layer/repository/library/library-repository";
import { LibraryItemStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceErrorCode } from "../types";
import { LibraryService } from "./library-service";

// Mock the repository functions
vi.mock("@/data-access-layer/repository/library/library-repository", () => ({
  createLibraryItem: vi.fn(),
  deleteLibraryItem: vi.fn(),
  getLibraryCount: vi.fn(),
  getManyLibraryItems: vi.fn(),
  updateLibraryItem: vi.fn(),
}));

describe("LibraryService", () => {
  let service: LibraryService;
  let mockCreateLibraryItem: ReturnType<typeof vi.fn>;
  let mockDeleteLibraryItem: ReturnType<typeof vi.fn>;
  let mockGetLibraryCount: ReturnType<typeof vi.fn>;
  let mockGetManyLibraryItems: ReturnType<typeof vi.fn>;
  let mockUpdateLibraryItem: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LibraryService();
    mockCreateLibraryItem = vi.mocked(createLibraryItem);
    mockDeleteLibraryItem = vi.mocked(deleteLibraryItem);
    mockGetLibraryCount = vi.mocked(getLibraryCount);
    mockGetManyLibraryItems = vi.mocked(getManyLibraryItems);
    mockUpdateLibraryItem = vi.mocked(updateLibraryItem);
  });

  describe("getLibraryItems", () => {
    it("should return all items for a user and game", async () => {
      const mockItems = [
        {
          id: 1,
          userId: "user-123",
          gameId: "game-456",
          status: LibraryItemStatus.CURIOUS_ABOUT,
          platform: "PC",
          acquisitionType: "DIGITAL" as const,
          startedAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: "user-123",
          gameId: "game-456",
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
          platform: "PlayStation 5",
          acquisitionType: "PHYSICAL" as const,
          startedAt: new Date(),
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGetManyLibraryItems.mockResolvedValue(mockItems);

      const result = await service.getLibraryItems({
        userId: "user-123",
        gameId: "game-456",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(2);
        expect(result.data.total).toBe(2);
        expect(result.data.items).toEqual(mockItems);
      }

      expect(mockGetManyLibraryItems).toHaveBeenCalledWith({
        userId: "user-123",
        gameId: "game-456",
      });
    });

    it("should filter by status", async () => {
      const mockItems = [
        {
          id: 1,
          userId: "user-123",
          gameId: "game-456",
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
          platform: "PC",
          acquisitionType: "DIGITAL" as const,
          startedAt: new Date(),
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: "user-123",
          gameId: "game-456",
          status: LibraryItemStatus.CURIOUS_ABOUT,
          platform: "PC",
          acquisitionType: "DIGITAL" as const,
          startedAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGetManyLibraryItems.mockResolvedValue(mockItems);

      const result = await service.getLibraryItems({
        userId: "user-123",
        gameId: "game-456",
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(1);
        expect(result.data.items[0].status).toBe(
          LibraryItemStatus.CURRENTLY_EXPLORING
        );
        expect(result.data.total).toBe(1);
      }
    });

    it("should filter by platform", async () => {
      const mockItems = [
        {
          id: 1,
          userId: "user-123",
          gameId: "game-456",
          status: LibraryItemStatus.CURIOUS_ABOUT,
          platform: "PC",
          acquisitionType: "DIGITAL" as const,
          startedAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: "user-123",
          gameId: "game-456",
          status: LibraryItemStatus.CURIOUS_ABOUT,
          platform: "PlayStation 5",
          acquisitionType: "DIGITAL" as const,
          startedAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGetManyLibraryItems.mockResolvedValue(mockItems);

      const result = await service.getLibraryItems({
        userId: "user-123",
        gameId: "game-456",
        platform: "PC",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(1);
        expect(result.data.items[0].platform).toBe("PC");
        expect(result.data.total).toBe(1);
      }
    });

    it("should return items for specified game", async () => {
      const mockItems = [
        {
          id: 1,
          userId: "user-123",
          gameId: "game-456",
          status: LibraryItemStatus.CURIOUS_ABOUT,
          platform: "PC",
          acquisitionType: "DIGITAL" as const,
          startedAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGetManyLibraryItems.mockResolvedValue(mockItems);

      const result = await service.getLibraryItems({
        userId: "user-123",
        gameId: "game-456",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(1);
        expect(result.data.items[0].gameId).toBe("game-456");
      }

      expect(mockGetManyLibraryItems).toHaveBeenCalledWith({
        userId: "user-123",
        gameId: "game-456",
      });
    });

    it("should return empty array when no items found", async () => {
      mockGetManyLibraryItems.mockResolvedValue([]);

      const result = await service.getLibraryItems({
        userId: "user-123",
        gameId: "game-456",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toEqual([]);
        expect(result.data.total).toBe(0);
      }
    });

    it("should handle repository errors", async () => {
      const repositoryError = new Error("Database connection failed");
      mockGetManyLibraryItems.mockRejectedValue(repositoryError);

      const result = await service.getLibraryItems({
        userId: "user-123",
        gameId: "game-456",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("createLibraryItem", () => {
    it("should create item with default status CURIOUS_ABOUT", async () => {
      const mockCreatedItem = {
        id: 1,
        userId: "user-123",
        gameId: "game-456",
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
        acquisitionType: "DIGITAL" as const,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCreateLibraryItem.mockResolvedValue(mockCreatedItem);

      const result = await service.createLibraryItem({
        userId: "user-123",
        gameId: "game-456",
        platform: "PC",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.item).toEqual(mockCreatedItem);
      }

      expect(mockCreateLibraryItem).toHaveBeenCalledWith({
        userId: "user-123",
        gameId: "game-456",
        libraryItem: {
          status: LibraryItemStatus.CURIOUS_ABOUT,
          acquisitionType: "DIGITAL",
          platform: "PC",
          startedAt: undefined,
          completedAt: undefined,
        },
      });
    });

    it("should create item with specified status", async () => {
      const mockCreatedItem = {
        id: 1,
        userId: "user-123",
        gameId: "game-456",
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
        platform: "PlayStation 5",
        acquisitionType: "PHYSICAL" as const,
        startedAt: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCreateLibraryItem.mockResolvedValue(mockCreatedItem);

      const startedAt = new Date();
      const result = await service.createLibraryItem({
        userId: "user-123",
        gameId: "game-456",
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
        platform: "PlayStation 5",
        acquisitionType: "PHYSICAL",
        startedAt,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.item.status).toBe(
          LibraryItemStatus.CURRENTLY_EXPLORING
        );
      }

      expect(mockCreateLibraryItem).toHaveBeenCalledWith({
        userId: "user-123",
        gameId: "game-456",
        libraryItem: {
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
          acquisitionType: "PHYSICAL",
          platform: "PlayStation 5",
          startedAt,
          completedAt: undefined,
        },
      });
    });

    it("should create item with all optional fields", async () => {
      const mockCreatedItem = {
        id: 1,
        userId: "user-123",
        gameId: "game-456",
        status: LibraryItemStatus.EXPERIENCED,
        platform: "PC",
        acquisitionType: "DIGITAL" as const,
        startedAt: new Date("2024-01-01"),
        completedAt: new Date("2024-02-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCreateLibraryItem.mockResolvedValue(mockCreatedItem);

      const startedAt = new Date("2024-01-01");
      const completedAt = new Date("2024-02-01");

      const result = await service.createLibraryItem({
        userId: "user-123",
        gameId: "game-456",
        status: LibraryItemStatus.EXPERIENCED,
        platform: "PC",
        acquisitionType: "DIGITAL",
        startedAt,
        completedAt,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.item.completedAt).toEqual(completedAt);
      }
    });

    it("should handle repository errors", async () => {
      const repositoryError = new Error("Unique constraint violation");
      mockCreateLibraryItem.mockRejectedValue(repositoryError);

      const result = await service.createLibraryItem({
        userId: "user-123",
        gameId: "game-456",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unique constraint violation");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("updateLibraryItem", () => {
    it("should update item status", async () => {
      const mockUpdatedItem = {
        id: 1,
        userId: "user-123",
        gameId: "game-456",
        status: LibraryItemStatus.EXPERIENCED,
        platform: "PC",
        acquisitionType: "DIGITAL" as const,
        startedAt: null,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUpdateLibraryItem.mockResolvedValue(mockUpdatedItem);

      const completedAt = new Date();
      const result = await service.updateLibraryItem({
        userId: "user-123",
        id: 1,
        status: LibraryItemStatus.EXPERIENCED,
        completedAt,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.item.status).toBe(LibraryItemStatus.EXPERIENCED);
      }

      expect(mockUpdateLibraryItem).toHaveBeenCalledWith({
        userId: "user-123",
        libraryItem: {
          id: 1,
          status: LibraryItemStatus.EXPERIENCED,
          completedAt,
        },
      });
    });

    it("should update platform with status", async () => {
      const mockUpdatedItem = {
        id: 1,
        userId: "user-123",
        gameId: "game-456",
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PlayStation 5",
        acquisitionType: "DIGITAL" as const,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUpdateLibraryItem.mockResolvedValue(mockUpdatedItem);

      const result = await service.updateLibraryItem({
        userId: "user-123",
        id: 1,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PlayStation 5",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.item.platform).toBe("PlayStation 5");
      }

      expect(mockUpdateLibraryItem).toHaveBeenCalledWith({
        userId: "user-123",
        libraryItem: {
          id: 1,
          status: LibraryItemStatus.CURIOUS_ABOUT,
          platform: "PlayStation 5",
          startedAt: undefined,
          completedAt: undefined,
        },
      });
    });

    it("should update multiple fields", async () => {
      const mockUpdatedItem = {
        id: 1,
        userId: "user-123",
        gameId: "game-456",
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
        platform: "PC",
        acquisitionType: "DIGITAL" as const,
        startedAt: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUpdateLibraryItem.mockResolvedValue(mockUpdatedItem);

      const startedAt = new Date();
      const result = await service.updateLibraryItem({
        userId: "user-123",
        id: 1,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
        platform: "PC",
        startedAt,
      });

      expect(result.success).toBe(true);

      expect(mockUpdateLibraryItem).toHaveBeenCalledWith({
        userId: "user-123",
        libraryItem: {
          id: 1,
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
          platform: "PC",
          startedAt,
        },
      });
    });

    it("should return NOT_FOUND error when item not found", async () => {
      const notFoundError = new Error("Library item not found");
      mockUpdateLibraryItem.mockRejectedValue(notFoundError);

      const result = await service.updateLibraryItem({
        userId: "user-123",
        id: 999,
        status: LibraryItemStatus.EXPERIENCED,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          "Library item not found or you do not have permission to update it"
        );
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
      }
    });

    it("should handle other repository errors", async () => {
      const repositoryError = new Error("Database connection failed");
      mockUpdateLibraryItem.mockRejectedValue(repositoryError);

      const result = await service.updateLibraryItem({
        userId: "user-123",
        id: 1,
        status: LibraryItemStatus.EXPERIENCED,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("deleteLibraryItem", () => {
    it("should delete item successfully", async () => {
      mockDeleteLibraryItem.mockResolvedValue({
        id: 1,
        userId: "user-123",
        gameId: "game-456",
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
        acquisitionType: "DIGITAL" as const,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.deleteLibraryItem({
        userId: "user-123",
        libraryItemId: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe("Library item deleted successfully");
      }

      expect(mockDeleteLibraryItem).toHaveBeenCalledWith({
        libraryItemId: 1,
        userId: "user-123",
      });
    });

    it("should return NOT_FOUND error when item not found", async () => {
      const notFoundError = new Error("Library item not found");
      mockDeleteLibraryItem.mockRejectedValue(notFoundError);

      const result = await service.deleteLibraryItem({
        userId: "user-123",
        libraryItemId: 999,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          "Library item not found or you do not have permission to delete it"
        );
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
      }
    });

    it("should handle other repository errors", async () => {
      const repositoryError = new Error("Database connection failed");
      mockDeleteLibraryItem.mockRejectedValue(repositoryError);

      const result = await service.deleteLibraryItem({
        userId: "user-123",
        libraryItemId: 1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("getLibraryItemCount", () => {
    it("should return count for all items", async () => {
      mockGetLibraryCount.mockResolvedValue(42);

      const count = await service.getLibraryItemCount({
        userId: "user-123",
      });

      expect(count).toBe(42);
      expect(mockGetLibraryCount).toHaveBeenCalledWith({
        userId: "user-123",
        status: undefined,
        gteClause: undefined,
      });
    });

    it("should return count filtered by status", async () => {
      mockGetLibraryCount.mockResolvedValue(10);

      const count = await service.getLibraryItemCount({
        userId: "user-123",
        status: LibraryItemStatus.EXPERIENCED,
      });

      expect(count).toBe(10);
      expect(mockGetLibraryCount).toHaveBeenCalledWith({
        userId: "user-123",
        status: LibraryItemStatus.EXPERIENCED,
        gteClause: undefined,
      });
    });

    it("should return count filtered by date", async () => {
      mockGetLibraryCount.mockResolvedValue(5);

      const createdAfter = new Date("2024-01-01");
      const count = await service.getLibraryItemCount({
        userId: "user-123",
        createdAfter,
      });

      expect(count).toBe(5);
      expect(mockGetLibraryCount).toHaveBeenCalledWith({
        userId: "user-123",
        status: undefined,
        gteClause: { createdAt: { gte: createdAfter } },
      });
    });

    it("should return 0 when repository throws error", async () => {
      const repositoryError = new Error("Database connection failed");
      mockGetLibraryCount.mockRejectedValue(repositoryError);

      const count = await service.getLibraryItemCount({
        userId: "user-123",
      });

      // Should return 0 gracefully even on error
      expect(count).toBe(0);
      // Logger is configured as silent in tests, so no need to spy
    });
  });
});
