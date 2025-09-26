import { getServerUserId } from "@/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildCollectionFilter,
  findGamesWithBacklogItemsPaginated,
} from "@/shared/lib/repository";

import { CollectionService } from "./collection-service";

// Mock the repository functions
vi.mock("@/shared/lib/repository", () => ({
  buildCollectionFilter: vi.fn(),
  findGamesWithBacklogItemsPaginated: vi.fn(),
}));

describe("CollectionService", () => {
  let service: CollectionService;
  let mockGetServerUserId: ReturnType<typeof vi.mocked<typeof getServerUserId>>;
  let mockBuildCollectionFilter: ReturnType<typeof vi.fn>;
  let mockFindGamesWithBacklogItemsPaginated: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CollectionService();
    mockGetServerUserId = vi.mocked(getServerUserId);
    mockBuildCollectionFilter = vi.mocked(buildCollectionFilter);
    mockFindGamesWithBacklogItemsPaginated = vi.mocked(
      findGamesWithBacklogItemsPaginated
    );
  });

  describe("getCollection", () => {
    it("should return error for missing userId", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);
      const result = await service.getCollection({
        platform: "",
        status: "",
        search: "",
        page: 1,
      });

      expect(result.success).toBe(false);
      console.log(result);
      expect(result.error).toBe("Failed to fetch user game collection");
      expect(mockBuildCollectionFilter).not.toHaveBeenCalled();
      expect(mockFindGamesWithBacklogItemsPaginated).not.toHaveBeenCalled();
    });

    it("should return empty collection when no games found", async () => {
      const mockGameFilter = { userId: "test-user-id" };
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockBuildCollectionFilter.mockReturnValue({ gameFilter: mockGameFilter });
      mockFindGamesWithBacklogItemsPaginated.mockResolvedValue([[], 0]);

      const result = await service.getCollection({
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
      expect(mockFindGamesWithBacklogItemsPaginated).toHaveBeenCalledWith({
        where: mockGameFilter,
        page: 1,
        itemsPerPage: 24,
      });
    });

    it("should return collection with games and correct count", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
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
          backlogItems: [
            {
              id: 1,
              userId: "test-user-id",
              status: "PLAYING" as const,
              platform: "PC",
              gameId: "1",
              acquisitionType: "PURCHASED" as const,
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
          backlogItems: [
            {
              id: 2,
              userId: "test-user-id",
              status: "BACKLOG" as const,
              platform: "PlayStation 4",
              gameId: "2",
              acquisitionType: "PURCHASED" as const,
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
      mockFindGamesWithBacklogItemsPaginated.mockResolvedValue([mockGames, 2]);

      const result = await service.getCollection({
        platform: "",
        status: "",
        search: "",
        page: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data?.collection).toHaveLength(2);
      expect(result.data?.collection[0].game).toEqual(mockGames[0]);
      expect(result.data?.collection[0].backlogItems).toEqual(
        mockGames[0].backlogItems
      );
      expect(result.data?.count).toBe(2);
    });

    it("should apply platform filter correctly", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      const mockGameFilter = { userId: "test-user-id", platform: "PC" };
      mockBuildCollectionFilter.mockReturnValue({ gameFilter: mockGameFilter });
      mockFindGamesWithBacklogItemsPaginated.mockResolvedValue([[], 0]);

      await service.getCollection({
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
      mockGetServerUserId.mockResolvedValue("test-user-id");
      const mockGameFilter = { userId: "test-user-id", status: "PLAYING" };
      mockBuildCollectionFilter.mockReturnValue({ gameFilter: mockGameFilter });
      mockFindGamesWithBacklogItemsPaginated.mockResolvedValue([[], 0]);

      await service.getCollection({
        platform: "",
        status: "PLAYING",
        search: "",
        page: 1,
      });

      expect(mockBuildCollectionFilter).toHaveBeenCalledWith({
        userId: "test-user-id",
        platform: "",
        status: "PLAYING",
        search: "",
      });
    });

    it("should apply search filter correctly", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      const mockGameFilter = { userId: "test-user-id", search: "cyberpunk" };
      mockBuildCollectionFilter.mockReturnValue({ gameFilter: mockGameFilter });
      mockFindGamesWithBacklogItemsPaginated.mockResolvedValue([[], 0]);

      await service.getCollection({
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
      mockGetServerUserId.mockResolvedValue("test-user-id");
      const mockGameFilter = { userId: "test-user-id" };
      mockBuildCollectionFilter.mockReturnValue({ gameFilter: mockGameFilter });
      mockFindGamesWithBacklogItemsPaginated.mockResolvedValue([[], 0]);

      await service.getCollection({
        platform: "",
        status: "",
        search: "",
        // page not provided
      });

      expect(mockFindGamesWithBacklogItemsPaginated).toHaveBeenCalledWith({
        where: mockGameFilter,
        page: 1, // default page
        itemsPerPage: 24,
      });
    });

    it("should handle pagination correctly", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      const mockGameFilter = { userId: "test-user-id" };
      mockBuildCollectionFilter.mockReturnValue({ gameFilter: mockGameFilter });
      mockFindGamesWithBacklogItemsPaginated.mockResolvedValue([[], 0]);

      await service.getCollection({
        platform: "",
        status: "",
        search: "",
        page: 3,
      });

      expect(mockFindGamesWithBacklogItemsPaginated).toHaveBeenCalledWith({
        where: mockGameFilter,
        page: 3,
        itemsPerPage: 24,
      });
    });

    it("should handle repository errors", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      const repositoryError = new Error("Database connection failed");
      mockBuildCollectionFilter.mockImplementation(() => {
        throw repositoryError;
      });

      const result = await service.getCollection({
        platform: "",
        status: "",
        search: "",
        page: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch user game collection");
    });

    it("should handle findGamesWithBacklogItemsPaginated errors", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      const mockGameFilter = { userId: "test-user-id" };
      mockBuildCollectionFilter.mockReturnValue({ gameFilter: mockGameFilter });

      const repositoryError = new Error("Query execution failed");
      mockFindGamesWithBacklogItemsPaginated.mockRejectedValue(repositoryError);

      const result = await service.getCollection({
        platform: "",
        status: "",
        search: "",
        page: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch user game collection");
    });

    it("should handle non-Error exceptions", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockBuildCollectionFilter.mockImplementation(() => {
        throw "String error";
      });

      const result = await service.getCollection({
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
