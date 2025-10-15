import {
  buildCollectionFilter,
  findGamesWithLibraryItemsPaginated,
} from "@/data-access-layer/repository";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CollectionService } from "./collection-service";

// Mock the repository functions
vi.mock("@/data-access-layer/repository", () => ({
  buildCollectionFilter: vi.fn(),
  findGamesWithLibraryItemsPaginated: vi.fn(),
}));

describe("CollectionService", () => {
  let service: CollectionService;
  let mockBuildCollectionFilter: ReturnType<typeof vi.fn>;
  let mockFindGamesWithLibraryItemsPaginated: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CollectionService();
    mockBuildCollectionFilter = vi.mocked(buildCollectionFilter);
    mockFindGamesWithLibraryItemsPaginated = vi.mocked(
      findGamesWithLibraryItemsPaginated
    );
  });

  describe("getCollection", () => {
    it("should return error for missing userId", async () => {
      const result = await service.getCollection({
        userId: "",
        platform: "",
        status: "",
        search: "",
        page: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("User ID is required");
      expect(mockBuildCollectionFilter).not.toHaveBeenCalled();
      expect(mockFindGamesWithLibraryItemsPaginated).not.toHaveBeenCalled();
    });

    it("should return empty collection when no games found", async () => {
      const mockGameFilter = { userId: "test-user-id" };
      mockBuildCollectionFilter.mockReturnValue({ gameFilter: mockGameFilter });
      mockFindGamesWithLibraryItemsPaginated.mockResolvedValue([[], 0]);

      const result = await service.getCollection({
        userId: "test-user-id",
        platform: "",
        status: "",
        search: "",
        page: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data?.collection).toEqual([]);
      expect(result.data?.count).toBe(0);
      expect(mockBuildCollectionFilter).toHaveBeenCalledWith({
        userId: "test-user-id",
        platform: "",
        status: "",
        search: "",
      });
      expect(mockFindGamesWithLibraryItemsPaginated).toHaveBeenCalledWith({
        where: mockGameFilter,
        page: 1,
        itemsPerPage: 24,
      });
    });

    it("should return collection with games and correct count", async () => {
      const mockGames = [
        {
          id: 1,
          igdbId: 123,
          title: "Test Game 1",
          coverImage: "cover123",
          hltbId: null,
          mainExtra: null,
          mainStory: null,
          completionist: null,
          releaseDate: new Date(),
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          libraryItems: [
            {
              id: 1,
              userId: "test-user-id",
              status: "CURRENTLY_EXPLORING" as const,
              platform: "PC",
              gameId: "1",
              acquisitionType: "DIGITAL" as const,
              startedAt: null,
              completedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
        {
          id: 2,
          igdbId: 456,
          title: "Test Game 2",
          coverImage: "cover456",
          hltbId: null,
          mainExtra: null,
          mainStory: null,
          completionist: null,
          releaseDate: new Date(),
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          libraryItems: [
            {
              id: 2,
              userId: "test-user-id",
              status: "CURIOUS_ABOUT" as const,
              platform: "PlayStation 4",
              gameId: "2",
              acquisitionType: "PHYSICAL" as const,
              startedAt: null,
              completedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ];

      const mockGameFilter = { userId: "test-user-id" };
      mockBuildCollectionFilter.mockReturnValue({ gameFilter: mockGameFilter });
      mockFindGamesWithLibraryItemsPaginated.mockResolvedValue([mockGames, 2]);

      const result = await service.getCollection({
        userId: "test-user-id",
        platform: "",
        status: "",
        search: "",
        page: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data?.collection).toHaveLength(2);
      expect(result.data?.collection[0].game).toEqual(mockGames[0]);
      expect(result.data?.collection[0].libraryItems).toEqual(
        mockGames[0].libraryItems
      );
      expect(result.data?.count).toBe(2);
    });

    it("should apply platform filter correctly", async () => {
      const mockGameFilter = { userId: "test-user-id", platform: "PC" };
      mockBuildCollectionFilter.mockReturnValue({ gameFilter: mockGameFilter });
      mockFindGamesWithLibraryItemsPaginated.mockResolvedValue([[], 0]);

      await service.getCollection({
        userId: "test-user-id",
        platform: "PC",
        status: "",
        search: "",
        page: 1,
      });

      expect(mockBuildCollectionFilter).toHaveBeenCalledWith({
        userId: "test-user-id",
        platform: "PC",
        status: "",
        search: "",
      });
    });

    it("should apply status filter correctly", async () => {
      const mockGameFilter = {
        userId: "test-user-id",
        status: "CURRENTLY_EXPLORING",
      };
      mockBuildCollectionFilter.mockReturnValue({ gameFilter: mockGameFilter });
      mockFindGamesWithLibraryItemsPaginated.mockResolvedValue([[], 0]);

      await service.getCollection({
        userId: "test-user-id",
        platform: "",
        status: "CURRENTLY_EXPLORING",
        search: "",
        page: 1,
      });

      expect(mockBuildCollectionFilter).toHaveBeenCalledWith({
        userId: "test-user-id",
        platform: "",
        status: "CURRENTLY_EXPLORING",
        search: "",
      });
    });

    it("should apply search filter correctly", async () => {
      const mockGameFilter = { userId: "test-user-id", search: "cyberpunk" };
      mockBuildCollectionFilter.mockReturnValue({ gameFilter: mockGameFilter });
      mockFindGamesWithLibraryItemsPaginated.mockResolvedValue([[], 0]);

      await service.getCollection({
        userId: "test-user-id",
        platform: "",
        status: "",
        search: "cyberpunk",
        page: 1,
      });

      expect(mockBuildCollectionFilter).toHaveBeenCalledWith({
        userId: "test-user-id",
        platform: "",
        status: "",
        search: "cyberpunk",
      });
    });

    it("should use default page when page is not provided", async () => {
      const mockGameFilter = { userId: "test-user-id" };
      mockBuildCollectionFilter.mockReturnValue({ gameFilter: mockGameFilter });
      mockFindGamesWithLibraryItemsPaginated.mockResolvedValue([[], 0]);

      await service.getCollection({
        userId: "test-user-id",
        platform: "",
        status: "",
        search: "",
        // page not provided
      });

      expect(mockFindGamesWithLibraryItemsPaginated).toHaveBeenCalledWith({
        where: mockGameFilter,
        page: 1, // default page
        itemsPerPage: 24,
      });
    });

    it("should handle pagination correctly", async () => {
      const mockGameFilter = { userId: "test-user-id" };
      mockBuildCollectionFilter.mockReturnValue({ gameFilter: mockGameFilter });
      mockFindGamesWithLibraryItemsPaginated.mockResolvedValue([[], 0]);

      await service.getCollection({
        userId: "test-user-id",
        platform: "",
        status: "",
        search: "",
        page: 3,
      });

      expect(mockFindGamesWithLibraryItemsPaginated).toHaveBeenCalledWith({
        where: mockGameFilter,
        page: 3,
        itemsPerPage: 24,
      });
    });

    it("should handle repository errors", async () => {
      const repositoryError = new Error("Database connection failed");
      mockBuildCollectionFilter.mockImplementation(() => {
        throw repositoryError;
      });

      const result = await service.getCollection({
        userId: "test-user-id",
        platform: "",
        status: "",
        search: "",
        page: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database connection failed");
    });

    it("should handle findGamesWithLibraryItemsPaginated errors", async () => {
      const mockGameFilter = { userId: "test-user-id" };
      mockBuildCollectionFilter.mockReturnValue({ gameFilter: mockGameFilter });

      const repositoryError = new Error("Query execution failed");
      mockFindGamesWithLibraryItemsPaginated.mockRejectedValue(repositoryError);

      const result = await service.getCollection({
        userId: "test-user-id",
        platform: "",
        status: "",
        search: "",
        page: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Query execution failed");
    });

    it("should handle non-Error exceptions", async () => {
      mockBuildCollectionFilter.mockImplementation(() => {
        throw "String error";
      });

      const result = await service.getCollection({
        userId: "test-user-id",
        platform: "",
        status: "",
        search: "",
        page: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch user game collection");
    });
  });
});
