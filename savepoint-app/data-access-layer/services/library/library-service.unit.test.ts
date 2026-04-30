import {
  deleteLibraryItem,
  findLibraryItemById,
  findLibraryItemsWithFilters,
  setRating,
  updateLibraryItem,
} from "@/data-access-layer/repository";
import { LibraryItemStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/shared/lib/errors";

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
    setRating: vi.fn(),
  };
});

describe("LibraryService", () => {
  let service: LibraryService;
  let mockFindLibraryItemsWithFilters: ReturnType<typeof vi.fn>;
  let mockFindLibraryItemById: ReturnType<typeof vi.fn>;
  let mockDeleteLibraryItem: ReturnType<typeof vi.fn>;
  let mockUpdateLibraryItem: ReturnType<typeof vi.fn>;
  let mockSetRating: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new LibraryService();
    mockFindLibraryItemsWithFilters = vi.mocked(findLibraryItemsWithFilters);
    mockFindLibraryItemById = vi.mocked(findLibraryItemById);
    mockDeleteLibraryItem = vi.mocked(deleteLibraryItem);
    mockUpdateLibraryItem = vi.mocked(updateLibraryItem);
    mockSetRating = vi.mocked(setRating);
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
      it("should return items when repository succeeds", async () => {
        mockFindLibraryItemsWithFilters.mockResolvedValue({
          items: mockLibraryItems,
          total: 2,
        });

        const result = await service.getLibraryItems({
          userId: validUserId,
        });

        expect(result.items).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(result.hasMore).toBe(false);
        expect(result.items[0]?.game._count.libraryItems).toBe(1);
        expect(result.items[1]?.game._count.libraryItems).toBe(1);

        expect(mockFindLibraryItemsWithFilters).toHaveBeenCalledWith({
          userId: validUserId,
          skip: undefined,
          take: undefined,
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

        expect(mockFindLibraryItemsWithFilters).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: validUserId,
            status: LibraryItemStatus.WISHLIST,
            platform: "PlayStation 5",
            search: "Test",
            sortBy: "createdAt",
            sortOrder: "desc",
          })
        );
      });

      it("should forward minRating to repository", async () => {
        mockFindLibraryItemsWithFilters.mockResolvedValue({
          items: [mockLibraryItems[0]],
          total: 1,
        });

        await service.getLibraryItems({ userId: validUserId, minRating: 5 });

        expect(mockFindLibraryItemsWithFilters).toHaveBeenCalledWith(
          expect.objectContaining({ userId: validUserId, minRating: 5 })
        );
      });

      it("should forward unratedOnly to repository", async () => {
        mockFindLibraryItemsWithFilters.mockResolvedValue({
          items: mockLibraryItems,
          total: 2,
        });

        await service.getLibraryItems({
          userId: validUserId,
          unratedOnly: true,
        });

        expect(mockFindLibraryItemsWithFilters).toHaveBeenCalledWith(
          expect.objectContaining({ userId: validUserId, unratedOnly: true })
        );
      });

      it("should drop minRating when unratedOnly is true", async () => {
        mockFindLibraryItemsWithFilters.mockResolvedValue({
          items: mockLibraryItems,
          total: 2,
        });

        await service.getLibraryItems({
          userId: validUserId,
          unratedOnly: true,
          minRating: 7,
        });

        const callArgs = mockFindLibraryItemsWithFilters.mock
          .calls[0][0] as Record<string, unknown>;
        expect(callArgs.unratedOnly).toBe(true);
        expect(callArgs.minRating).toBeUndefined();
      });

      it("should forward sortBy rating-desc to repository", async () => {
        mockFindLibraryItemsWithFilters.mockResolvedValue({
          items: mockLibraryItems,
          total: 2,
        });

        await service.getLibraryItems({
          userId: validUserId,
          sortBy: "rating-desc",
        });

        expect(mockFindLibraryItemsWithFilters).toHaveBeenCalledWith(
          expect.objectContaining({ sortBy: "rating-desc" })
        );
      });

      it("should forward sortBy rating-asc to repository", async () => {
        mockFindLibraryItemsWithFilters.mockResolvedValue({
          items: mockLibraryItems,
          total: 2,
        });

        await service.getLibraryItems({
          userId: validUserId,
          sortBy: "rating-asc",
        });

        expect(mockFindLibraryItemsWithFilters).toHaveBeenCalledWith(
          expect.objectContaining({ sortBy: "rating-asc" })
        );
      });

      it("should return empty array when no library items found", async () => {
        mockFindLibraryItemsWithFilters.mockResolvedValue({
          items: [],
          total: 0,
        });

        const result = await service.getLibraryItems({
          userId: validUserId,
        });

        expect(result.items).toEqual([]);
        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(0);
        expect(result.hasMore).toBe(false);
      });
    });

    describe("error scenarios", () => {
      it("should throw when repository fails", async () => {
        mockFindLibraryItemsWithFilters.mockRejectedValue(
          new Error("Database connection failed")
        );

        await expect(
          service.getLibraryItems({ userId: validUserId })
        ).rejects.toThrow("Database connection failed");
      });

      it("should propagate unexpected errors", async () => {
        mockFindLibraryItemsWithFilters.mockRejectedValue(
          new Error("Connection timeout")
        );

        await expect(
          service.getLibraryItems({ userId: validUserId })
        ).rejects.toThrow("Connection timeout");
      });
    });
  });

  describe("deleteLibraryItem", () => {
    const validUserId = "clx123abc456def";
    const validLibraryItemId = 1;

    describe("success scenarios", () => {
      it("should successfully delete when authorized", async () => {
        mockDeleteLibraryItem.mockResolvedValue(undefined);

        await service.deleteLibraryItem({
          libraryItemId: validLibraryItemId,
          userId: validUserId,
        });

        expect(mockDeleteLibraryItem).toHaveBeenCalledWith({
          libraryItemId: validLibraryItemId,
          userId: validUserId,
        });
      });
    });

    describe("error scenarios", () => {
      it("should throw NotFoundError when library item not found", async () => {
        mockDeleteLibraryItem.mockRejectedValue(
          new NotFoundError("Library item not found")
        );

        await expect(
          service.deleteLibraryItem({
            libraryItemId: validLibraryItemId,
            userId: validUserId,
          })
        ).rejects.toThrow(NotFoundError);
      });

      it("should propagate database errors during deletion", async () => {
        mockDeleteLibraryItem.mockRejectedValue(
          new Error("Database connection failed")
        );

        await expect(
          service.deleteLibraryItem({
            libraryItemId: validLibraryItemId,
            userId: validUserId,
          })
        ).rejects.toThrow("Database connection failed");
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

          const updated = {
            ...createMockLibraryItem(to),
            updatedAt: new Date("2025-01-02"),
          };
          mockUpdateLibraryItem.mockResolvedValue(updated);

          const result = await service.updateLibraryItem({
            userId: validUserId,
            libraryItem: {
              id: libraryItemId,
              status: to,
            },
          });

          expect(result.status).toBe(to);
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
      it("should throw NotFoundError when library item not found", async () => {
        mockFindLibraryItemById.mockRejectedValue(
          new NotFoundError("Library item not found")
        );

        await expect(
          service.updateLibraryItem({
            userId: validUserId,
            libraryItem: {
              id: libraryItemId,
              status: LibraryItemStatus.PLAYING,
            },
          })
        ).rejects.toThrow(NotFoundError);

        expect(mockUpdateLibraryItem).not.toHaveBeenCalled();
      });

      it("should throw when repository update fails", async () => {
        mockFindLibraryItemById.mockResolvedValue(
          createMockLibraryItem(LibraryItemStatus.WISHLIST)
        );

        mockUpdateLibraryItem.mockRejectedValue(
          new Error("Database update failed")
        );

        await expect(
          service.updateLibraryItem({
            userId: validUserId,
            libraryItem: {
              id: libraryItemId,
              status: LibraryItemStatus.PLAYING,
            },
          })
        ).rejects.toThrow("Database update failed");
      });

      it("should propagate unexpected errors during status fetch", async () => {
        mockFindLibraryItemById.mockRejectedValue(
          new Error("Connection timeout")
        );

        await expect(
          service.updateLibraryItem({
            userId: validUserId,
            libraryItem: {
              id: libraryItemId,
              status: LibraryItemStatus.PLAYING,
            },
          })
        ).rejects.toThrow("Connection timeout");
      });
    });

    describe("platform contract", () => {
      it("forwards a non-empty platform string to the repository", async () => {
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
            platform: "PS5",
          },
        });

        expect(mockUpdateLibraryItem).toHaveBeenCalledWith(
          expect.objectContaining({
            libraryItem: expect.objectContaining({ platform: "PS5" }),
          })
        );
      });

      it("forwards null platform to the repository to clear the value", async () => {
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
            platform: null,
          },
        });

        expect(mockUpdateLibraryItem).toHaveBeenCalledWith(
          expect.objectContaining({
            libraryItem: expect.objectContaining({ platform: null }),
          })
        );
      });

      it("does not include platform key when omitted from input", async () => {
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

        const callArg = mockUpdateLibraryItem.mock.calls[0][0];
        expect("platform" in callArg.libraryItem).toBe(false);
      });
    });
  });

  describe("setRating", () => {
    const validUserId = "clx123abc456def";
    const validLibraryItemId = 42;

    describe("valid pass-through values", () => {
      it("should accept null to clear a rating", async () => {
        mockSetRating.mockResolvedValue(undefined);

        await service.setRating({
          libraryItemId: validLibraryItemId,
          userId: validUserId,
          rating: null,
        });

        expect(mockSetRating).toHaveBeenCalledWith({
          libraryItemId: validLibraryItemId,
          userId: validUserId,
          rating: null,
        });
      });

      it("should accept the minimum valid rating of 1", async () => {
        mockSetRating.mockResolvedValue(undefined);

        await service.setRating({
          libraryItemId: validLibraryItemId,
          userId: validUserId,
          rating: 1,
        });

        expect(mockSetRating).toHaveBeenCalledWith(
          expect.objectContaining({ rating: 1 })
        );
      });

      it("should accept the maximum valid rating of 10", async () => {
        mockSetRating.mockResolvedValue(undefined);

        await service.setRating({
          libraryItemId: validLibraryItemId,
          userId: validUserId,
          rating: 10,
        });

        expect(mockSetRating).toHaveBeenCalledWith(
          expect.objectContaining({ rating: 10 })
        );
      });

      it("should accept a mid-range rating of 5", async () => {
        mockSetRating.mockResolvedValue(undefined);

        await service.setRating({
          libraryItemId: validLibraryItemId,
          userId: validUserId,
          rating: 5,
        });

        expect(mockSetRating).toHaveBeenCalledWith(
          expect.objectContaining({ rating: 5 })
        );
      });
    });

    describe("repository failure propagation", () => {
      it("should throw NotFoundError when library item not found", async () => {
        mockSetRating.mockRejectedValue(
          new NotFoundError("Library item not found")
        );

        await expect(
          service.setRating({
            libraryItemId: validLibraryItemId,
            userId: validUserId,
            rating: 5,
          })
        ).rejects.toThrow(NotFoundError);
      });

      it("should propagate unexpected repository errors", async () => {
        mockSetRating.mockRejectedValue(new Error("Database connection lost"));

        await expect(
          service.setRating({
            libraryItemId: validLibraryItemId,
            userId: validUserId,
            rating: 5,
          })
        ).rejects.toThrow("Database connection lost");
      });
    });
  });
});
