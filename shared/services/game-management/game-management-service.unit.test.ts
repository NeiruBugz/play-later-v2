import { getServerUserId } from "@/auth";
import type { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addGameToCollection } from "./actions/add-to-collection";
import { removeGameFromCollection } from "./actions/remove-from-collection";
import { GameManagementService } from "./service";
import type {
  AddToCollectionParams,
  RemoveFromCollectionParams,
} from "./types";

// Mock the auth module
vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

// Mock the server actions
vi.mock("./actions/add-to-collection", () => ({
  addGameToCollection: vi.fn(),
}));

vi.mock("./actions/remove-from-collection", () => ({
  removeGameFromCollection: vi.fn(),
}));

describe("GameManagementService", () => {
  let service: GameManagementService;
  let mockGetServerUserId: ReturnType<typeof vi.mocked<typeof getServerUserId>>;
  let mockAddGameToCollection: ReturnType<typeof vi.fn>;
  let mockRemoveGameFromCollection: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GameManagementService();
    mockGetServerUserId = vi.mocked(getServerUserId);
    mockAddGameToCollection = vi.mocked(addGameToCollection);
    mockRemoveGameFromCollection = vi.mocked(removeGameFromCollection);
  });

  describe("addGameToCollection", () => {
    const validParams: AddToCollectionParams = {
      game: {
        igdbId: 12345,
      },
      backlogItem: {
        backlogStatus: "TO_PLAY" as BacklogItemStatus,
        acquisitionType: "DIGITAL" as AcquisitionType,
        platform: "PC",
      },
    };

    it("should return error when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await service.addGameToCollection(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to add game to collection");
      expect(result.cause).toBe("Authentication required");
      expect(mockAddGameToCollection).not.toHaveBeenCalled();
    });

    it("should successfully add game to collection", async () => {
      const mockGameResult = {
        data: {
          id: "game-123",
          title: "Test Game",
          igdbId: 12345,
          coverImage: "https://example.com/cover.jpg",
        },
      };

      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockAddGameToCollection.mockResolvedValue(mockGameResult);

      const result = await service.addGameToCollection(validParams);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: "game-123",
        title: "Test Game",
        igdbId: 12345,
        coverUrl: "https://example.com/cover.jpg",
      });
      expect(mockAddGameToCollection).toHaveBeenCalledWith({
        game: validParams.game,
        backlogItem: validParams.backlogItem,
      });
    });

    it("should successfully add game to collection without cover image", async () => {
      const mockGameResult = {
        data: {
          id: "game-123",
          title: "Test Game",
          igdbId: 12345,
          coverImage: null,
        },
      };

      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockAddGameToCollection.mockResolvedValue(mockGameResult);

      const result = await service.addGameToCollection(validParams);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: "game-123",
        title: "Test Game",
        igdbId: 12345,
        coverUrl: undefined,
      });
    });

    it("should return error when server action returns no data", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockAddGameToCollection.mockResolvedValue({ data: null });

      const result = await service.addGameToCollection(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to add game to collection");
      expect(result.cause).toBeUndefined();
    });

    it("should handle server action throwing error", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockAddGameToCollection.mockRejectedValue(new Error("Database error"));

      const result = await service.addGameToCollection(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to add game to collection");
      expect(result.cause).toBe("Database error");
    });

    it("should handle server action throwing non-Error object", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockAddGameToCollection.mockRejectedValue("String error");

      const result = await service.addGameToCollection(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to add game to collection");
      expect(result.cause).toBe("String error");
    });

    it("should work with optional platform parameter", async () => {
      const paramsWithoutPlatform: AddToCollectionParams = {
        game: {
          igdbId: 12345,
        },
        backlogItem: {
          backlogStatus: "WISHLIST" as BacklogItemStatus,
          acquisitionType: "PHYSICAL" as AcquisitionType,
        },
      };

      const mockGameResult = {
        data: {
          id: "game-123",
          title: "Test Game",
          igdbId: 12345,
          coverImage: null,
        },
      };

      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockAddGameToCollection.mockResolvedValue(mockGameResult);

      const result = await service.addGameToCollection(paramsWithoutPlatform);

      expect(result.success).toBe(true);
      expect(mockAddGameToCollection).toHaveBeenCalledWith({
        game: paramsWithoutPlatform.game,
        backlogItem: paramsWithoutPlatform.backlogItem,
      });
    });
  });

  describe("removeGameFromCollection", () => {
    const validParams: RemoveFromCollectionParams = {
      backlogItemId: 123,
    };

    it("should return error when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await service.removeGameFromCollection(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to remove game from collection");
      expect(result.cause).toBe("Authentication required");
      expect(mockRemoveGameFromCollection).not.toHaveBeenCalled();
    });

    it("should successfully remove game from collection", async () => {
      const mockRemoveResult = {
        data: {
          success: true,
        },
      };

      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockRemoveGameFromCollection.mockResolvedValue(mockRemoveResult);

      const result = await service.removeGameFromCollection(validParams);

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
      expect(mockRemoveGameFromCollection).toHaveBeenCalledWith({
        backlogItemId: 123,
      });
    });

    it("should return error when server action returns unsuccessful result", async () => {
      const mockRemoveResult = {
        data: {
          success: false,
        },
      };

      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockRemoveGameFromCollection.mockResolvedValue(mockRemoveResult);

      const result = await service.removeGameFromCollection(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to remove game from collection");
      expect(result.cause).toBeUndefined();
    });

    it("should return error when server action returns no data", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockRemoveGameFromCollection.mockResolvedValue({ data: null });

      const result = await service.removeGameFromCollection(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to remove game from collection");
      expect(result.cause).toBeUndefined();
    });

    it("should handle server action throwing error", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockRemoveGameFromCollection.mockRejectedValue(
        new Error("Database error")
      );

      const result = await service.removeGameFromCollection(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to remove game from collection");
      expect(result.cause).toBe("Database error");
    });

    it("should handle server action throwing non-Error object", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockRemoveGameFromCollection.mockRejectedValue("String error");

      const result = await service.removeGameFromCollection(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to remove game from collection");
      expect(result.cause).toBe("String error");
    });
  });
});
