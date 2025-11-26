import { LibraryItemStatus } from "@/data-access-layer/domain/library";
import {
  deleteLibraryItem,
  findLibraryItemById,
  findLibraryItemsWithFilters,
  updateLibraryItem,
} from "@/data-access-layer/repository";
import {
  repositoryError,
  RepositoryErrorCode,
  repositorySuccess,
} from "@/data-access-layer/repository/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LibraryService } from "./library-service";

vi.mock("@/data-access-layer/repository", () => ({
  findLibraryItemsWithFilters: vi.fn(),
  findLibraryItemById: vi.fn(),
  deleteLibraryItem: vi.fn(),
  updateLibraryItem: vi.fn(),

  createLibraryItem: vi.fn(),
  findAllLibraryItemsByGameId: vi.fn(),
  findGameByIgdbId: vi.fn(),
  findMostRecentLibraryItemByGameId: vi.fn(),
  findUserById: vi.fn(),
}));

describe("LibraryService", () => {
  let service: LibraryService;
  let mockFindLibraryItemsWithFilters: ReturnType<typeof vi.fn>;
  let mockFindLibraryItemById: ReturnType<typeof vi.fn>;
  let mockDeleteLibraryItem: ReturnType<typeof vi.fn>;
  let mockUpdateLibraryItem: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LibraryService();
    mockFindLibraryItemsWithFilters = vi.mocked(findLibraryItemsWithFilters);
    mockFindLibraryItemById = vi.mocked(findLibraryItemById);
    mockDeleteLibraryItem = vi.mocked(deleteLibraryItem);
    mockUpdateLibraryItem = vi.mocked(updateLibraryItem);
  });

  describe("getLibraryItems", () => {
    const validUserId = "clx123abc456def";
    const mockLibraryItems = [
      {
        id: 1,
        userId: validUserId,
        gameId: "clx456def789ghi",
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PlayStation 5",
        acquisitionType: "DIGITAL",
        startedAt: null,
        completedAt: null,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
        game: {
          id: "clx456def789ghi",
          title: "Test Game 1",
          coverImage: "https://example.com/cover1.jpg",
          slug: "test-game-1",
          releaseDate: new Date("2024-01-01"),
          _count: {
            libraryItems: 1,
          },
        },
      },
      {
        id: 2,
        userId: validUserId,
        gameId: "clx789ghi012jkl",
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
        platform: "PC",
        acquisitionType: "DIGITAL",
        startedAt: new Date("2025-01-05"),
        completedAt: null,
        createdAt: new Date("2025-01-02"),
        updatedAt: new Date("2025-01-05"),
        game: {
          id: "clx789ghi012jkl",
          title: "Test Game 2",
          coverImage: "https://example.com/cover2.jpg",
          slug: "test-game-2",
          releaseDate: new Date("2023-06-15"),
          _count: {
            libraryItems: 1,
          },
        },
      },
    ];

    describe("success scenarios", () => {
      it("should return success result when repository succeeds", async () => {
        mockFindLibraryItemsWithFilters.mockResolvedValue(
          repositorySuccess(mockLibraryItems)
        );

        const result = await service.getLibraryItems({
          userId: validUserId,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toHaveLength(2);
          expect(result.data[0]?.game.entryCount).toBe(1);
          expect(result.data[0]?.game).not.toHaveProperty("_count");
          expect(result.data[1]?.game.entryCount).toBe(1);
          expect(result.data[1]?.game).not.toHaveProperty("_count");
        }

        expect(mockFindLibraryItemsWithFilters).toHaveBeenCalledWith({
          userId: validUserId,
        });
      });

      it("should call repository with correct parameters including filters", async () => {
        mockFindLibraryItemsWithFilters.mockResolvedValue(
          repositorySuccess([mockLibraryItems[0]])
        );

        const params = {
          userId: validUserId,
          status: LibraryItemStatus.CURIOUS_ABOUT,
          platform: "PlayStation 5",
          search: "Test",
          sortBy: "createdAt" as const,
          sortOrder: "desc" as const,
        };

        await service.getLibraryItems(params);

        expect(mockFindLibraryItemsWithFilters).toHaveBeenCalledWith(params);
      });

      it("should return empty array when no library items found", async () => {
        mockFindLibraryItemsWithFilters.mockResolvedValue(
          repositorySuccess([])
        );

        const result = await service.getLibraryItems({
          userId: validUserId,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual([]);
          expect(result.data).toHaveLength(0);
        }
      });
    });

    describe("validation scenarios", () => {
      it("should return validation error for invalid input", async () => {
        const result = await service.getLibraryItems({
          userId: "invalid-id",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("cuid");
        }

        expect(mockFindLibraryItemsWithFilters).not.toHaveBeenCalled();
      });
    });

    describe("error scenarios", () => {
      it("should return error result when repository fails", async () => {
        mockFindLibraryItemsWithFilters.mockResolvedValue(
          repositoryError(
            RepositoryErrorCode.DATABASE_ERROR,
            "Database connection failed"
          )
        );

        const result = await service.getLibraryItems({
          userId: validUserId,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Failed to fetch library items");
        }

        expect(mockFindLibraryItemsWithFilters).toHaveBeenCalledWith({
          userId: validUserId,
        });
      });

      it("should handle unexpected errors gracefully", async () => {
        mockFindLibraryItemsWithFilters.mockRejectedValue(
          new Error("Connection timeout")
        );

        const result = await service.getLibraryItems({
          userId: validUserId,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Connection timeout");
        }
      });
    });
  });

  describe("deleteLibraryItem", () => {
    const validUserId = "clx123abc456def";
    const validLibraryItemId = 1;

    describe("success scenarios", () => {
      it("should successfully delete when authorized", async () => {
        mockDeleteLibraryItem.mockResolvedValue(repositorySuccess(undefined));

        const result = await service.deleteLibraryItem({
          libraryItemId: validLibraryItemId,
          userId: validUserId,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeUndefined();
        }

        expect(mockDeleteLibraryItem).toHaveBeenCalledWith({
          libraryItemId: validLibraryItemId,
          userId: validUserId,
        });
      });
    });

    describe("validation scenarios", () => {
      it("should return validation error for invalid input", async () => {
        const result = await service.deleteLibraryItem({
          libraryItemId: -1,
          userId: validUserId,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeTruthy();
        }

        expect(mockDeleteLibraryItem).not.toHaveBeenCalled();
      });
    });

    describe("error scenarios", () => {
      it("should return error when library item not found", async () => {
        mockDeleteLibraryItem.mockResolvedValue(
          repositoryError(
            RepositoryErrorCode.NOT_FOUND,
            "Library item not found"
          )
        );

        const result = await service.deleteLibraryItem({
          libraryItemId: validLibraryItemId,
          userId: validUserId,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("not found");
          expect(result.error).toContain("permission");
        }

        expect(mockDeleteLibraryItem).toHaveBeenCalledWith({
          libraryItemId: validLibraryItemId,
          userId: validUserId,
        });
      });

      it("should handle database errors during deletion", async () => {
        mockDeleteLibraryItem.mockResolvedValue(
          repositoryError(
            RepositoryErrorCode.DATABASE_ERROR,
            "Database connection failed"
          )
        );

        const result = await service.deleteLibraryItem({
          libraryItemId: validLibraryItemId,
          userId: validUserId,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Failed to delete library item");
        }
      });

      it("should handle unexpected errors gracefully", async () => {
        mockDeleteLibraryItem.mockRejectedValue(
          new Error("Connection timeout")
        );

        const result = await service.deleteLibraryItem({
          libraryItemId: validLibraryItemId,
          userId: validUserId,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Connection timeout");
        }
      });
    });
  });

  describe("updateLibraryItem - Status Transition Validation", () => {
    const validUserId = "clx123abc456def";
    const libraryItemId = 1;

    const createMockLibraryItem = (status: LibraryItemStatus) => ({
      id: libraryItemId,
      userId: validUserId,
      gameId: "clx456def789ghi",
      status,
      platform: "PlayStation 5",
      acquisitionType: "DIGITAL",
      startedAt: null,
      completedAt: null,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    });

    describe("valid status transitions", () => {
      it("should allow forward progression (CURIOUS_ABOUT → CURRENTLY_EXPLORING)", async () => {
        mockFindLibraryItemById.mockResolvedValue(
          repositorySuccess(
            createMockLibraryItem(LibraryItemStatus.CURIOUS_ABOUT)
          )
        );

        mockUpdateLibraryItem.mockResolvedValue(
          repositorySuccess({
            ...createMockLibraryItem(LibraryItemStatus.CURRENTLY_EXPLORING),
            updatedAt: new Date("2025-01-02"),
          })
        );

        const result = await service.updateLibraryItem({
          userId: validUserId,
          libraryItem: {
            id: libraryItemId,
            status: LibraryItemStatus.CURRENTLY_EXPLORING,
          },
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(
            LibraryItemStatus.CURRENTLY_EXPLORING
          );
        }

        expect(mockUpdateLibraryItem).toHaveBeenCalled();
      });

      it("should allow forward progression (CURRENTLY_EXPLORING → EXPERIENCED)", async () => {
        mockFindLibraryItemById.mockResolvedValue(
          repositorySuccess(
            createMockLibraryItem(LibraryItemStatus.CURRENTLY_EXPLORING)
          )
        );

        mockUpdateLibraryItem.mockResolvedValue(
          repositorySuccess({
            ...createMockLibraryItem(LibraryItemStatus.EXPERIENCED),
            updatedAt: new Date("2025-01-03"),
          })
        );

        const result = await service.updateLibraryItem({
          userId: validUserId,
          libraryItem: {
            id: libraryItemId,
            status: LibraryItemStatus.EXPERIENCED,
          },
        });

        expect(result.success).toBe(true);
        expect(mockUpdateLibraryItem).toHaveBeenCalled();
      });

      it("should allow skipping steps (WISHLIST → EXPERIENCED)", async () => {
        mockFindLibraryItemById.mockResolvedValue(
          repositorySuccess(createMockLibraryItem(LibraryItemStatus.WISHLIST))
        );

        mockUpdateLibraryItem.mockResolvedValue(
          repositorySuccess({
            ...createMockLibraryItem(LibraryItemStatus.EXPERIENCED),
            updatedAt: new Date("2025-01-04"),
          })
        );

        const result = await service.updateLibraryItem({
          userId: validUserId,
          libraryItem: {
            id: libraryItemId,
            status: LibraryItemStatus.EXPERIENCED,
          },
        });

        expect(result.success).toBe(true);
        expect(mockUpdateLibraryItem).toHaveBeenCalled();
      });

      it("should allow transition FROM Wishlist to any other status", async () => {
        mockFindLibraryItemById.mockResolvedValue(
          repositorySuccess(createMockLibraryItem(LibraryItemStatus.WISHLIST))
        );

        mockUpdateLibraryItem.mockResolvedValue(
          repositorySuccess({
            ...createMockLibraryItem(LibraryItemStatus.CURIOUS_ABOUT),
            updatedAt: new Date("2025-01-06"),
          })
        );

        const result = await service.updateLibraryItem({
          userId: validUserId,
          libraryItem: {
            id: libraryItemId,
            status: LibraryItemStatus.CURIOUS_ABOUT,
          },
        });

        expect(result.success).toBe(true);
        expect(mockUpdateLibraryItem).toHaveBeenCalled();
      });
    });

    describe("invalid status transitions", () => {
      it("should block transition TO Wishlist from CURIOUS_ABOUT", async () => {
        mockFindLibraryItemById.mockResolvedValue(
          repositorySuccess(
            createMockLibraryItem(LibraryItemStatus.CURIOUS_ABOUT)
          )
        );

        const result = await service.updateLibraryItem({
          userId: validUserId,
          libraryItem: {
            id: libraryItemId,
            status: LibraryItemStatus.WISHLIST,
          },
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("Wishlist");
          expect(result.error).toContain("new library item");
        }

        expect(mockUpdateLibraryItem).not.toHaveBeenCalled();
      });

      it("should block transition TO Wishlist from CURRENTLY_EXPLORING", async () => {
        mockFindLibraryItemById.mockResolvedValue(
          repositorySuccess(
            createMockLibraryItem(LibraryItemStatus.CURRENTLY_EXPLORING)
          )
        );

        const result = await service.updateLibraryItem({
          userId: validUserId,
          libraryItem: {
            id: libraryItemId,
            status: LibraryItemStatus.WISHLIST,
          },
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("Wishlist");
        }

        expect(mockUpdateLibraryItem).not.toHaveBeenCalled();
      });

      it("should block transition TO Wishlist from EXPERIENCED", async () => {
        mockFindLibraryItemById.mockResolvedValue(
          repositorySuccess(
            createMockLibraryItem(LibraryItemStatus.EXPERIENCED)
          )
        );

        const result = await service.updateLibraryItem({
          userId: validUserId,
          libraryItem: {
            id: libraryItemId,
            status: LibraryItemStatus.WISHLIST,
          },
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("Wishlist");
        }

        expect(mockUpdateLibraryItem).not.toHaveBeenCalled();
      });
    });

    describe("error scenarios", () => {
      it("should return error when library item not found", async () => {
        mockFindLibraryItemById.mockResolvedValue(
          repositoryError(
            RepositoryErrorCode.NOT_FOUND,
            "Library item not found"
          )
        );

        const result = await service.updateLibraryItem({
          userId: validUserId,
          libraryItem: {
            id: libraryItemId,
            status: LibraryItemStatus.CURRENTLY_EXPLORING,
          },
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Library item not found");
        }

        expect(mockUpdateLibraryItem).not.toHaveBeenCalled();
      });

      it("should return error when repository update fails", async () => {
        mockFindLibraryItemById.mockResolvedValue(
          repositorySuccess(
            createMockLibraryItem(LibraryItemStatus.CURIOUS_ABOUT)
          )
        );

        mockUpdateLibraryItem.mockResolvedValue(
          repositoryError(
            RepositoryErrorCode.DATABASE_ERROR,
            "Database update failed"
          )
        );

        const result = await service.updateLibraryItem({
          userId: validUserId,
          libraryItem: {
            id: libraryItemId,
            status: LibraryItemStatus.CURRENTLY_EXPLORING,
          },
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Failed to update library item");
        }
      });

      it("should handle unexpected errors during status fetch", async () => {
        mockFindLibraryItemById.mockRejectedValue(
          new Error("Connection timeout")
        );

        const result = await service.updateLibraryItem({
          userId: validUserId,
          libraryItem: {
            id: libraryItemId,
            status: LibraryItemStatus.CURRENTLY_EXPLORING,
          },
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Connection timeout");
        }
      });

      it("should handle unexpected errors during update", async () => {
        mockFindLibraryItemById.mockResolvedValue(
          repositorySuccess(
            createMockLibraryItem(LibraryItemStatus.CURIOUS_ABOUT)
          )
        );

        mockUpdateLibraryItem.mockRejectedValue(
          new Error("Database connection lost")
        );

        const result = await service.updateLibraryItem({
          userId: validUserId,
          libraryItem: {
            id: libraryItemId,
            status: LibraryItemStatus.CURRENTLY_EXPLORING,
          },
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Database connection lost");
        }
      });
    });
  });
});
