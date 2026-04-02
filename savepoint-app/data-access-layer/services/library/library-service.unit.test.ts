import {
  deleteLibraryItem,
  findLibraryItemById,
  findLibraryItemsWithFilters,
  NotFoundError,
  updateLibraryItem,
} from "@/data-access-layer/repository";
import { LibraryItemStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LibraryService } from "./library-service";

vi.mock("@/data-access-layer/repository", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/data-access-layer/repository")>();
  return {
    ...actual,
    findLibraryItemsWithFilters: vi.fn(),
    findLibraryItemById: vi.fn(),
    deleteLibraryItem: vi.fn(),
    updateLibraryItem: vi.fn(),
    createLibraryItem: vi.fn(),
    findAllLibraryItemsByGameId: vi.fn(),
    findGameByIgdbId: vi.fn(),
    findMostRecentLibraryItemByGameId: vi.fn(),
    findUserById: vi.fn(),
  };
});

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
        status: LibraryItemStatus.WISHLIST,
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
        status: LibraryItemStatus.PLAYING,
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
        mockFindLibraryItemsWithFilters.mockResolvedValue({
          items: mockLibraryItems,
          total: 2,
        });

        const result = await service.getLibraryItems({
          userId: validUserId,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.items).toHaveLength(2);
          expect(result.data.total).toBe(2);
          expect(result.data.hasMore).toBe(false);
          expect(result.data.items[0]?.game._count.libraryItems).toBe(1);
          expect(result.data.items[1]?.game._count.libraryItems).toBe(1);
        }

        expect(mockFindLibraryItemsWithFilters).toHaveBeenCalledWith({
          userId: validUserId,
        });
      });

      it("should call repository with correct parameters including filters", async () => {
        mockFindLibraryItemsWithFilters.mockResolvedValue({
          items: [mockLibraryItems[0]],
          total: 1,
        });

        const params = {
          userId: validUserId,
          status: LibraryItemStatus.WISHLIST,
          platform: "PlayStation 5",
          search: "Test",
          sortBy: "createdAt" as const,
          sortOrder: "desc" as const,
        };

        await service.getLibraryItems(params);

        expect(mockFindLibraryItemsWithFilters).toHaveBeenCalledWith(params);
      });

      it("should return empty array when no library items found", async () => {
        mockFindLibraryItemsWithFilters.mockResolvedValue({
          items: [],
          total: 0,
        });

        const result = await service.getLibraryItems({
          userId: validUserId,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.items).toEqual([]);
          expect(result.data.items).toHaveLength(0);
          expect(result.data.total).toBe(0);
          expect(result.data.hasMore).toBe(false);
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
        mockFindLibraryItemsWithFilters.mockRejectedValue(
          new Error("Database connection failed")
        );

        const result = await service.getLibraryItems({
          userId: validUserId,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Database connection failed");
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
        mockDeleteLibraryItem.mockResolvedValue(undefined);

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
        mockDeleteLibraryItem.mockRejectedValue(
          new NotFoundError("Library item not found")
        );

        const result = await service.deleteLibraryItem({
          libraryItemId: validLibraryItemId,
          userId: validUserId,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("not found");
        }

        expect(mockDeleteLibraryItem).toHaveBeenCalledWith({
          libraryItemId: validLibraryItemId,
          userId: validUserId,
        });
      });

      it("should handle database errors during deletion", async () => {
        mockDeleteLibraryItem.mockRejectedValue(
          new Error("Database connection failed")
        );

        const result = await service.deleteLibraryItem({
          libraryItemId: validLibraryItemId,
          userId: validUserId,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Database connection failed");
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

    describe("all status transitions are allowed", () => {
      const allStatuses = [
        LibraryItemStatus.WISHLIST,
        LibraryItemStatus.SHELF,
        LibraryItemStatus.PLAYING,
        LibraryItemStatus.PLAYED,
      ];

      const transitions = allStatuses.flatMap((from) =>
        allStatuses.filter((to) => to !== from).map((to) => ({ from, to }))
      );

      it.each(transitions)(
        "should allow transition from $from to $to",
        async ({ from, to }) => {
          mockFindLibraryItemById.mockResolvedValue(
            createMockLibraryItem(from)
          );

          mockUpdateLibraryItem.mockResolvedValue({
            ...createMockLibraryItem(to),
            updatedAt: new Date("2025-01-02"),
          });

          const result = await service.updateLibraryItem({
            userId: validUserId,
            libraryItem: {
              id: libraryItemId,
              status: to,
            },
          });

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.status).toBe(to);
          }

          expect(mockUpdateLibraryItem).toHaveBeenCalled();
        }
      );
    });

    describe("statusChangedAt propagation", () => {
      it("should pass statusChangedAt to repository when provided", async () => {
        const statusChangedAt = new Date("2025-06-01T12:00:00Z");
        mockFindLibraryItemById.mockResolvedValue(
          createMockLibraryItem(LibraryItemStatus.WISHLIST)
        );
        mockUpdateLibraryItem.mockResolvedValue(
          createMockLibraryItem(LibraryItemStatus.PLAYING)
        );

        await service.updateLibraryItem({
          userId: validUserId,
          libraryItem: {
            id: libraryItemId,
            status: LibraryItemStatus.PLAYING,
            statusChangedAt,
          },
        });

        expect(mockUpdateLibraryItem).toHaveBeenCalledWith(
          expect.objectContaining({
            libraryItem: expect.objectContaining({
              statusChangedAt,
            }),
          })
        );
      });

      it("should auto-set statusChangedAt when status changes and no explicit value provided", async () => {
        mockFindLibraryItemById.mockResolvedValue(
          createMockLibraryItem(LibraryItemStatus.WISHLIST)
        );
        mockUpdateLibraryItem.mockResolvedValue(
          createMockLibraryItem(LibraryItemStatus.PLAYING)
        );

        await service.updateLibraryItem({
          userId: validUserId,
          libraryItem: {
            id: libraryItemId,
            status: LibraryItemStatus.PLAYING,
          },
        });

        expect(mockUpdateLibraryItem).toHaveBeenCalledWith(
          expect.objectContaining({
            libraryItem: expect.objectContaining({
              statusChangedAt: expect.any(Date),
            }),
          })
        );
      });

      it("should not set statusChangedAt when status is unchanged", async () => {
        mockFindLibraryItemById.mockResolvedValue(
          createMockLibraryItem(LibraryItemStatus.PLAYING)
        );
        mockUpdateLibraryItem.mockResolvedValue(
          createMockLibraryItem(LibraryItemStatus.PLAYING)
        );

        await service.updateLibraryItem({
          userId: validUserId,
          libraryItem: {
            id: libraryItemId,
            status: LibraryItemStatus.PLAYING,
          },
        });

        expect(mockUpdateLibraryItem).toHaveBeenCalledWith(
          expect.objectContaining({
            libraryItem: expect.objectContaining({
              statusChangedAt: undefined,
            }),
          })
        );
      });
    });

    describe("error scenarios", () => {
      it("should return error when library item not found", async () => {
        mockFindLibraryItemById.mockRejectedValue(
          new NotFoundError("Library item not found")
        );

        const result = await service.updateLibraryItem({
          userId: validUserId,
          libraryItem: {
            id: libraryItemId,
            status: LibraryItemStatus.PLAYING,
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
          createMockLibraryItem(LibraryItemStatus.WISHLIST)
        );

        mockUpdateLibraryItem.mockRejectedValue(
          new Error("Database update failed")
        );

        const result = await service.updateLibraryItem({
          userId: validUserId,
          libraryItem: {
            id: libraryItemId,
            status: LibraryItemStatus.PLAYING,
          },
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Database update failed");
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
            status: LibraryItemStatus.PLAYING,
          },
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Connection timeout");
        }
      });

      it("should handle unexpected errors during update", async () => {
        mockFindLibraryItemById.mockResolvedValue(
          createMockLibraryItem(LibraryItemStatus.WISHLIST)
        );

        mockUpdateLibraryItem.mockRejectedValue(
          new Error("Database connection lost")
        );

        const result = await service.updateLibraryItem({
          userId: validUserId,
          libraryItem: {
            id: libraryItemId,
            status: LibraryItemStatus.PLAYING,
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
