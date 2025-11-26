import { LibraryService } from "@/data-access-layer/services/library/library-service";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LibraryItemStatus } from "@/shared/types";

import type { RequestContext } from "../types";
import { getLibraryHandler } from "./get-library-handler";
import type { LibraryItemWithGameDomain } from "./types";

vi.mock("@/data-access-layer/services/library/library-service");

const mockLibraryService = vi.mocked(LibraryService);

describe("getLibraryHandler", () => {
  const mockContext: RequestContext = {
    ip: "192.168.1.1",
    headers: new Headers(),
    url: new URL("http://localhost/api/library"),
  };

  let mockGetLibraryItems: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetLibraryItems = vi.fn();

    mockLibraryService.mockImplementation(
      () =>
        ({
          getLibraryItems: mockGetLibraryItems,
        }) as any
    );
  });

  describe("Input Validation", () => {
    it("should reject invalid userId (not a CUID)", async () => {
      const params = { userId: "invalid-id" };

      const result = await getLibraryHandler(params, mockContext);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error).toContain("Invalid");
      }
      expect(mockGetLibraryItems).not.toHaveBeenCalled();
    });

    it("should reject invalid status (not in LibraryItemStatus enum)", async () => {
      const params = {
        userId: "clx123abc456def789ghi",
        status: "INVALID_STATUS" as any,
      };

      const result = await getLibraryHandler(params, mockContext);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error).toContain("Invalid");
      }
      expect(mockGetLibraryItems).not.toHaveBeenCalled();
    });

    it("should reject invalid sortBy (not in allowed values)", async () => {
      const params = {
        userId: "clx123abc456def789ghi",
        sortBy: "invalidSort" as any,
      };

      const result = await getLibraryHandler(params, mockContext);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error).toContain("Invalid");
      }
      expect(mockGetLibraryItems).not.toHaveBeenCalled();
    });

    it("should reject invalid sortOrder (not asc or desc)", async () => {
      const params = {
        userId: "clx123abc456def789ghi",
        sortOrder: "random" as any,
      };

      const result = await getLibraryHandler(params, mockContext);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error).toContain("Invalid");
      }
      expect(mockGetLibraryItems).not.toHaveBeenCalled();
    });

    it("should accept all valid input combinations", async () => {
      mockGetLibraryItems.mockResolvedValue({
        success: true,
        data: [],
      });

      const params = {
        userId: "clx123abc456def789ghi",
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PlayStation 5",
        search: "zelda",
        sortBy: "createdAt" as const,
        sortOrder: "desc" as const,
      };

      const result = await getLibraryHandler(params, mockContext);

      expect(result.success).toBe(true);
      expect(mockGetLibraryItems).toHaveBeenCalled();
    });

    it("should handle optional parameters correctly (only userId provided)", async () => {
      mockGetLibraryItems.mockResolvedValue({
        success: true,
        data: [],
      });

      const params = {
        userId: "clx123abc456def789ghi",
      };

      const result = await getLibraryHandler(params, mockContext);

      expect(result.success).toBe(true);
      expect(mockGetLibraryItems).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "clx123abc456def789ghi",
          distinctByGame: true,
        })
      );
    });
  });

  describe("Orchestration", () => {
    it("should call LibraryService.getLibraryItems with correct parameters", async () => {
      mockGetLibraryItems.mockResolvedValue({
        success: true,
        data: [],
      });

      const params = {
        userId: "clx123abc456def789ghi",
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PlayStation 5",
        search: "zelda",
        sortBy: "createdAt" as const,
        sortOrder: "desc" as const,
      };

      await getLibraryHandler(params, mockContext);

      expect(mockGetLibraryItems).toHaveBeenCalledWith({
        userId: "clx123abc456def789ghi",
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PlayStation 5",
        search: "zelda",
        sortBy: "createdAt",
        sortOrder: "desc",
        distinctByGame: true,
      });
    });

    it("should pass distinctByGame: true to service (library view requirement)", async () => {
      mockGetLibraryItems.mockResolvedValue({
        success: true,
        data: [],
      });

      const params = {
        userId: "clx123abc456def789ghi",
      };

      await getLibraryHandler(params, mockContext);

      expect(mockGetLibraryItems).toHaveBeenCalledWith(
        expect.objectContaining({
          distinctByGame: true,
        })
      );
    });
  });

  describe("Success Path", () => {
    it("should return HandlerResult with data on success", async () => {
      const mockData: LibraryItemWithGameDomain[] = [
        {
          id: 1,
          userId: "clx123abc456def789ghi",
          gameId: "clx456def789ghi123jkl",
          status: LibraryItemStatus.CURIOUS_ABOUT,
          platform: "PlayStation 5",
          acquisitionType: null,
          startedAt: null,
          completedAt: null,
          createdAt: new Date("2025-01-01"),
          updatedAt: new Date("2025-01-01"),
          game: {
            id: "clx456def789ghi123jkl",
            title: "The Legend of Zelda: Breath of the Wild",
            coverImage: "https://example.com/cover.jpg",
            slug: "the-legend-of-zelda-breath-of-the-wild",
            releaseDate: new Date("2017-03-03"),
            entryCount: 1,
          },
        },
      ];

      mockGetLibraryItems.mockResolvedValue({
        success: true,
        data: mockData,
      });

      const params = {
        userId: "clx123abc456def789ghi",
      };

      const result = await getLibraryHandler(params, mockContext);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.status).toBe(200);
        expect(result.data).toEqual(mockData);
        expect(result.data).toHaveLength(1);
        expect(result.data[0]?.game.title).toBe(
          "The Legend of Zelda: Breath of the Wild"
        );
      }
    });

    it("should return empty array when no library items found", async () => {
      mockGetLibraryItems.mockResolvedValue({
        success: true,
        data: [],
      });

      const params = {
        userId: "clx123abc456def789ghi",
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      };

      const result = await getLibraryHandler(params, mockContext);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.status).toBe(200);
        expect(result.data).toEqual([]);
        expect(result.data).toHaveLength(0);
      }
    });

    it("should support filtering by status", async () => {
      const mockData: LibraryItemWithGameDomain[] = [
        {
          id: 2,
          userId: "clx123abc456def789ghi",
          gameId: "clx789ghi123jkl456mno",
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
          platform: "PC",
          acquisitionType: null,
          startedAt: new Date("2025-01-15"),
          completedAt: null,
          createdAt: new Date("2025-01-10"),
          updatedAt: new Date("2025-01-15"),
          game: {
            id: "clx789ghi123jkl456mno",
            title: "Elden Ring",
            coverImage: "https://example.com/elden-ring.jpg",
            slug: "elden-ring",
            releaseDate: new Date("2022-02-25"),
            entryCount: 1,
          },
        },
      ];

      mockGetLibraryItems.mockResolvedValue({
        success: true,
        data: mockData,
      });

      const params = {
        userId: "clx123abc456def789ghi",
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      };

      const result = await getLibraryHandler(params, mockContext);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]?.status).toBe(
          LibraryItemStatus.CURRENTLY_EXPLORING
        );
      }
    });

    it("should support filtering by platform", async () => {
      mockGetLibraryItems.mockResolvedValue({
        success: true,
        data: [],
      });

      const params = {
        userId: "clx123abc456def789ghi",
        platform: "Nintendo Switch",
      };

      await getLibraryHandler(params, mockContext);

      expect(mockGetLibraryItems).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: "Nintendo Switch",
        })
      );
    });

    it("should support search filtering", async () => {
      mockGetLibraryItems.mockResolvedValue({
        success: true,
        data: [],
      });

      const params = {
        userId: "clx123abc456def789ghi",
        search: "mario",
      };

      await getLibraryHandler(params, mockContext);

      expect(mockGetLibraryItems).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "mario",
        })
      );
    });

    it("should support sorting by different fields", async () => {
      mockGetLibraryItems.mockResolvedValue({
        success: true,
        data: [],
      });

      const params = {
        userId: "clx123abc456def789ghi",
        sortBy: "releaseDate" as const,
        sortOrder: "asc" as const,
      };

      await getLibraryHandler(params, mockContext);

      expect(mockGetLibraryItems).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: "releaseDate",
          sortOrder: "asc",
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should return HandlerResult with error on service failure", async () => {
      mockGetLibraryItems.mockResolvedValue({
        success: false,
        error: "Database connection failed",
      });

      const params = {
        userId: "clx123abc456def789ghi",
      };

      const result = await getLibraryHandler(params, mockContext);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(500);
        expect(result.error).toBe("Database connection failed");
      }
    });

    it("should propagate service error messages", async () => {
      mockGetLibraryItems.mockResolvedValue({
        success: false,
        error: "Failed to fetch library items",
      });

      const params = {
        userId: "clx123abc456def789ghi",
      };

      const result = await getLibraryHandler(params, mockContext);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(500);
        expect(result.error).toBe("Failed to fetch library items");
      }
    });

    it("should handle empty service error strings", async () => {
      mockGetLibraryItems.mockResolvedValue({
        success: false,
        error: "",
      });

      const params = {
        userId: "clx123abc456def789ghi",
      };

      const result = await getLibraryHandler(params, mockContext);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(500);

        expect(result.error).toBe("");
      }
    });
  });

  describe("Multiple Library Items Per Game", () => {
    it("should return multiple library items with correct game counts", async () => {
      const mockData: LibraryItemWithGameDomain[] = [
        {
          id: 1,
          userId: "clx123abc456def789ghi",
          gameId: "clx456def789ghi123jkl",
          status: LibraryItemStatus.CURIOUS_ABOUT,
          platform: "PlayStation 5",
          acquisitionType: null,
          startedAt: null,
          completedAt: null,
          createdAt: new Date("2025-01-01"),
          updatedAt: new Date("2025-01-01"),
          game: {
            id: "clx456def789ghi123jkl",
            title: "The Legend of Zelda: Breath of the Wild",
            coverImage: "https://example.com/cover.jpg",
            slug: "the-legend-of-zelda-breath-of-the-wild",
            releaseDate: new Date("2017-03-03"),
            entryCount: 2,
          },
        },
        {
          id: 2,
          userId: "clx123abc456def789ghi",
          gameId: "clx789ghi123jkl456mno",
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
          platform: "PC",
          acquisitionType: null,
          startedAt: new Date("2025-01-15"),
          completedAt: null,
          createdAt: new Date("2025-01-10"),
          updatedAt: new Date("2025-01-15"),
          game: {
            id: "clx789ghi123jkl456mno",
            title: "Elden Ring",
            coverImage: "https://example.com/elden-ring.jpg",
            slug: "elden-ring",
            releaseDate: new Date("2022-02-25"),
            entryCount: 1,
          },
        },
      ];

      mockGetLibraryItems.mockResolvedValue({
        success: true,
        data: mockData,
      });

      const params = {
        userId: "clx123abc456def789ghi",
      };

      const result = await getLibraryHandler(params, mockContext);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]?.game.entryCount).toBe(2);
        expect(result.data[1]?.game.entryCount).toBe(1);
      }
    });
  });
});
