import {
  findUserById,
  findUserByNormalizedUsername,
  getLibraryStatsByUserId,
} from "@/data-access-layer/repository";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceErrorCode } from "../types";
import { ProfileService } from "./profile-service";

vi.mock("@/data-access-layer/repository", () => ({
  findUserById: vi.fn(),
  findUserByNormalizedUsername: vi.fn(),
  getLibraryStatsByUserId: vi.fn(),
}));

describe("ProfileService", () => {
  let service: ProfileService;
  let mockFindUserById: ReturnType<typeof vi.fn>;
  let mockFindUserByNormalizedUsername: ReturnType<typeof vi.fn>;
  let mockGetLibraryStatsByUserId: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProfileService();
    mockFindUserById = vi.mocked(findUserById);
    mockFindUserByNormalizedUsername = vi.mocked(findUserByNormalizedUsername);
    mockGetLibraryStatsByUserId = vi.mocked(getLibraryStatsByUserId);
  });

  describe("getProfile", () => {
    it("should return basic profile data for a user", async () => {
      const mockUser = {
        username: "testuser",
        image: "https://example.com/avatar.jpg",
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date("2024-01-15"),
      };

      mockFindUserById.mockResolvedValue(mockUser);

      const result = await service.getProfile({
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profile).toEqual({
          username: "testuser",
          image: "https://example.com/avatar.jpg",
          email: "test@example.com",
          name: "Test User",
          createdAt: new Date("2024-01-15"),
        });
      }

      expect(mockFindUserById).toHaveBeenCalledWith("user-123", {
        select: {
          username: true,
          image: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });
    });

    it("should return profile with null values for missing fields", async () => {
      const mockUser = {
        username: null,
        image: null,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date("2024-01-15"),
      };

      mockFindUserById.mockResolvedValue(mockUser);

      const result = await service.getProfile({
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profile.username).toBeNull();
        expect(result.data.profile.image).toBeNull();
        expect(result.data.profile.email).toBe("test@example.com");
      }
    });

    it("should return error when user is not found", async () => {
      mockFindUserById.mockResolvedValue(null);

      const result = await service.getProfile({
        userId: "nonexistent-user",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
      }
    });

    it("should handle unexpected errors", async () => {
      mockFindUserById.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.getProfile({
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("getProfileWithStats", () => {
    it("should return profile data with library statistics", async () => {
      const mockUser = {
        username: "testuser",
        image: "https://example.com/avatar.jpg",
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date("2024-01-15"),
      };

      const mockStats = {
        ok: true as const,
        data: {
          statusCounts: {
            CURIOUS_ABOUT: 5,
            CURRENTLY_EXPLORING: 2,
            EXPERIENCED: 10,
          },
          recentGames: [
            {
              gameId: "game-1",
              title: "Test Game 1",
              coverImage: "https://example.com/cover1.jpg",
              lastPlayed: new Date("2024-03-01"),
            },
            {
              gameId: "game-2",
              title: "Test Game 2",
              coverImage: null,
              lastPlayed: new Date("2024-02-28"),
            },
          ],
        },
      };

      mockFindUserById.mockResolvedValue(mockUser);
      mockGetLibraryStatsByUserId.mockResolvedValue(mockStats);

      const result = await service.getProfileWithStats({
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profile.username).toBe("testuser");
        expect(result.data.profile.email).toBe("test@example.com");
        expect(result.data.profile.stats.statusCounts).toEqual({
          CURIOUS_ABOUT: 5,
          CURRENTLY_EXPLORING: 2,
          EXPERIENCED: 10,
        });
        expect(result.data.profile.stats.recentGames).toHaveLength(2);
        expect(result.data.profile.stats.recentGames[0].title).toBe(
          "Test Game 1"
        );
      }

      expect(mockFindUserById).toHaveBeenCalledWith("user-123", {
        select: {
          username: true,
          image: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });
      expect(mockGetLibraryStatsByUserId).toHaveBeenCalledWith("user-123");
    });

    it("should return profile with empty stats for user with no library items", async () => {
      const mockUser = {
        username: "newuser",
        image: null,
        email: "new@example.com",
        name: "New User",
        createdAt: new Date("2024-03-01"),
      };

      const mockStats = {
        ok: true as const,
        data: {
          statusCounts: {},
          recentGames: [],
        },
      };

      mockFindUserById.mockResolvedValue(mockUser);
      mockGetLibraryStatsByUserId.mockResolvedValue(mockStats);

      const result = await service.getProfileWithStats({
        userId: "user-456",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profile.stats.statusCounts).toEqual({});
        expect(result.data.profile.stats.recentGames).toHaveLength(0);
      }
    });

    it("should return error when user is not found", async () => {
      mockFindUserById.mockResolvedValue(null);

      const result = await service.getProfileWithStats({
        userId: "nonexistent-user",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
      }
    });

    it("should return error when library stats fetch fails", async () => {
      const mockUser = {
        username: "testuser",
        image: null,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date("2024-01-15"),
      };

      const mockStats = {
        ok: false as const,
        error: {
          code: "STATS_FETCH_FAILED",
          message: "Failed to fetch library stats",
        },
      };

      mockFindUserById.mockResolvedValue(mockUser);
      mockGetLibraryStatsByUserId.mockResolvedValue(mockStats);

      const result = await service.getProfileWithStats({
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to load library stats");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });

    it("should handle unexpected errors during stats fetch", async () => {
      const mockUser = {
        username: "testuser",
        image: null,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date("2024-01-15"),
      };

      mockFindUserById.mockResolvedValue(mockUser);
      mockGetLibraryStatsByUserId.mockRejectedValue(
        new Error("Connection timeout")
      );

      const result = await service.getProfileWithStats({
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Connection timeout");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("checkUsernameAvailability", () => {
    it("should return available: true when username is not taken", async () => {
      mockFindUserByNormalizedUsername.mockResolvedValue(null);

      const result = await service.checkUsernameAvailability({
        username: "newuser123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.available).toBe(true);
      }

      expect(mockFindUserByNormalizedUsername).toHaveBeenCalledWith(
        "newuser123"
      );
    });

    it("should return available: false when username is already taken", async () => {
      mockFindUserByNormalizedUsername.mockResolvedValue({ id: "user-123" });

      const result = await service.checkUsernameAvailability({
        username: "existinguser",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.available).toBe(false);
      }

      expect(mockFindUserByNormalizedUsername).toHaveBeenCalledWith(
        "existinguser"
      );
    });

    it("should check username case-insensitively", async () => {
      mockFindUserByNormalizedUsername.mockResolvedValue({ id: "user-123" });

      const result = await service.checkUsernameAvailability({
        username: "ExistingUser",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.available).toBe(false);
      }

      expect(mockFindUserByNormalizedUsername).toHaveBeenCalledWith(
        "existinguser"
      );
    });

    it("should handle database errors gracefully", async () => {
      mockFindUserByNormalizedUsername.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.checkUsernameAvailability({
        username: "testuser",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });
});
