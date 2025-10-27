import {
  findUserById,
  findUserByNormalizedUsername,
  getLibraryStatsByUserId,
  updateUserProfile,
} from "@/data-access-layer/repository";

import { validateUsername } from "@/features/profile/lib/validation";

import { ServiceErrorCode } from "../types";
import { ProfileService } from "./profile-service";

vi.mock("@/data-access-layer/repository", () => ({
  findUserById: vi.fn(),
  findUserByNormalizedUsername: vi.fn(),
  getLibraryStatsByUserId: vi.fn(),
  updateUserProfile: vi.fn(),
}));

vi.mock("@/features/profile/lib/validation", () => ({
  validateUsername: vi.fn(),
}));

describe("ProfileService", () => {
  let service: ProfileService;
  let mockFindUserById: ReturnType<typeof vi.fn>;
  let mockFindUserByNormalizedUsername: ReturnType<typeof vi.fn>;
  let mockGetLibraryStatsByUserId: ReturnType<typeof vi.fn>;
  let mockUpdateUserProfile: ReturnType<typeof vi.fn>;
  let mockValidateUsername: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProfileService();
    mockFindUserById = vi.mocked(findUserById);
    mockFindUserByNormalizedUsername = vi.mocked(findUserByNormalizedUsername);
    mockGetLibraryStatsByUserId = vi.mocked(getLibraryStatsByUserId);
    mockUpdateUserProfile = vi.mocked(updateUserProfile);
    mockValidateUsername = vi.mocked(validateUsername);
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

  describe("updateProfile", () => {
    describe("success scenarios", () => {
      it("should update profile with unchanged username without checking availability", async () => {
        const userId = "user-123";
        const username = "existinguser";

        mockValidateUsername.mockReturnValue({ valid: true });
        mockFindUserById.mockResolvedValue({ username: "existinguser" });
        mockUpdateUserProfile.mockResolvedValue({
          id: userId,
          username: "existinguser",
          usernameNormalized: "existinguser",
          image: null,
        });

        const result = await service.updateProfile({
          userId,
          username,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.username).toBe("existinguser");
          expect(result.data.image).toBeNull();
        }

        expect(mockValidateUsername).toHaveBeenCalledWith("existinguser");
        expect(mockFindUserById).toHaveBeenCalledWith(userId, {
          select: { username: true },
        });
        expect(mockFindUserByNormalizedUsername).not.toHaveBeenCalled();
        expect(mockUpdateUserProfile).toHaveBeenCalledWith(userId, {
          username: "existinguser",
          usernameNormalized: "existinguser",
          image: undefined,
        });
      });

      it("should update profile with new valid username after checking availability", async () => {
        const userId = "user-123";
        const newUsername = "newuser123";

        mockValidateUsername.mockReturnValue({ valid: true });
        mockFindUserById.mockResolvedValue({ username: "olduser" });
        mockFindUserByNormalizedUsername.mockResolvedValue(null);
        mockUpdateUserProfile.mockResolvedValue({
          id: userId,
          username: "newuser123",
          usernameNormalized: "newuser123",
          image: null,
        });

        const result = await service.updateProfile({
          userId,
          username: newUsername,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.username).toBe("newuser123");
        }

        expect(mockValidateUsername).toHaveBeenCalledWith("newuser123");
        expect(mockFindUserById).toHaveBeenCalledWith(userId, {
          select: { username: true },
        });
        expect(mockFindUserByNormalizedUsername).toHaveBeenCalledWith(
          "newuser123"
        );
        expect(mockUpdateUserProfile).toHaveBeenCalledWith(userId, {
          username: "newuser123",
          usernameNormalized: "newuser123",
          image: undefined,
        });
      });

      it("should update profile with both username and avatar URL", async () => {
        const userId = "user-123";
        const username = "testuser";
        const avatarUrl = "https://example.com/avatar.jpg";

        mockValidateUsername.mockReturnValue({ valid: true });
        mockFindUserById.mockResolvedValue({ username: "testuser" });
        mockUpdateUserProfile.mockResolvedValue({
          id: userId,
          username: "testuser",
          usernameNormalized: "testuser",
          image: avatarUrl,
        });

        const result = await service.updateProfile({
          userId,
          username,
          avatarUrl,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.username).toBe("testuser");
          expect(result.data.image).toBe(avatarUrl);
        }

        expect(mockUpdateUserProfile).toHaveBeenCalledWith(userId, {
          username: "testuser",
          usernameNormalized: "testuser",
          image: avatarUrl,
        });
      });
    });

    describe("validation error scenarios", () => {
      it("should return error when username is too short", async () => {
        const userId = "user-123";
        const username = "ab";

        mockValidateUsername.mockReturnValue({
          valid: false,
          error: "Username must be 3-25 characters",
        });

        const result = await service.updateProfile({
          userId,
          username,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Username must be 3-25 characters");
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
        }

        expect(mockValidateUsername).toHaveBeenCalledWith("ab");
        expect(mockFindUserById).not.toHaveBeenCalled();
        expect(mockUpdateUserProfile).not.toHaveBeenCalled();
      });

      it("should return error when username is too long", async () => {
        const userId = "user-123";
        const username = "a".repeat(26);

        mockValidateUsername.mockReturnValue({
          valid: false,
          error: "Username must be 3-25 characters",
        });

        const result = await service.updateProfile({
          userId,
          username,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Username must be 3-25 characters");
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
        }

        expect(mockValidateUsername).toHaveBeenCalledWith(username);
        expect(mockFindUserById).not.toHaveBeenCalled();
      });

      it("should return error when username contains invalid characters", async () => {
        const userId = "user-123";
        const username = "user@name!";

        mockValidateUsername.mockReturnValue({
          valid: false,
          error: "Username can only contain letters, numbers, _, -, and .",
        });

        const result = await service.updateProfile({
          userId,
          username,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe(
            "Username can only contain letters, numbers, _, -, and ."
          );
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
        }

        expect(mockValidateUsername).toHaveBeenCalledWith("user@name!");
        expect(mockFindUserById).not.toHaveBeenCalled();
      });

      it("should return error when username is reserved", async () => {
        const userId = "user-123";
        const username = "admin";

        mockValidateUsername.mockReturnValue({
          valid: false,
          error: "Username is not allowed",
        });

        const result = await service.updateProfile({
          userId,
          username,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Username is not allowed");
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
        }

        expect(mockValidateUsername).toHaveBeenCalledWith("admin");
        expect(mockFindUserById).not.toHaveBeenCalled();
      });

      it("should return error when username contains profanity", async () => {
        const userId = "user-123";
        const username = "badword123";

        mockValidateUsername.mockReturnValue({
          valid: false,
          error: "Username is not allowed",
        });

        const result = await service.updateProfile({
          userId,
          username,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Username is not allowed");
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
        }

        expect(mockValidateUsername).toHaveBeenCalledWith("badword123");
        expect(mockFindUserById).not.toHaveBeenCalled();
      });
    });

    describe("conflict scenarios", () => {
      it("should return error when username is already taken (case-insensitive)", async () => {
        const userId = "user-123";
        const username = "NewUser";

        mockValidateUsername.mockReturnValue({ valid: true });
        mockFindUserById.mockResolvedValue({ username: "olduser" });
        mockFindUserByNormalizedUsername.mockResolvedValue({ id: "user-456" });

        const result = await service.updateProfile({
          userId,
          username,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Username already exists");
          expect(result.code).toBe(ServiceErrorCode.CONFLICT);
        }

        expect(mockValidateUsername).toHaveBeenCalledWith("NewUser");
        expect(mockFindUserById).toHaveBeenCalledWith(userId, {
          select: { username: true },
        });
        expect(mockFindUserByNormalizedUsername).toHaveBeenCalledWith(
          "newuser"
        );
        expect(mockUpdateUserProfile).not.toHaveBeenCalled();
      });

      it("should check availability case-insensitively for changed username", async () => {
        const userId = "user-123";
        const username = "NEWUSER";

        mockValidateUsername.mockReturnValue({ valid: true });
        mockFindUserById.mockResolvedValue({ username: "olduser" });
        mockFindUserByNormalizedUsername.mockResolvedValue({ id: "user-456" });

        const result = await service.updateProfile({
          userId,
          username,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.CONFLICT);
        }

        expect(mockFindUserByNormalizedUsername).toHaveBeenCalledWith(
          "newuser"
        );
      });
    });

    describe("not found scenarios", () => {
      it("should return error when user is not found", async () => {
        const userId = "nonexistent-user";
        const username = "validuser";

        mockValidateUsername.mockReturnValue({ valid: true });
        mockFindUserById.mockResolvedValue(null);

        const result = await service.updateProfile({
          userId,
          username,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("User not found");
          expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
        }

        expect(mockValidateUsername).toHaveBeenCalledWith("validuser");
        expect(mockFindUserById).toHaveBeenCalledWith(userId, {
          select: { username: true },
        });
        expect(mockUpdateUserProfile).not.toHaveBeenCalled();
      });
    });

    describe("error handling", () => {
      it("should handle repository errors during update", async () => {
        const userId = "user-123";
        const username = "validuser";

        mockValidateUsername.mockReturnValue({ valid: true });
        mockFindUserById.mockResolvedValue({ username: "olduser" });
        mockFindUserByNormalizedUsername.mockResolvedValue(null);
        mockUpdateUserProfile.mockRejectedValue(
          new Error("Database connection failed")
        );

        const result = await service.updateProfile({
          userId,
          username,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Database connection failed");
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });

      it("should handle errors during user lookup", async () => {
        const userId = "user-123";
        const username = "validuser";

        mockValidateUsername.mockReturnValue({ valid: true });
        mockFindUserById.mockRejectedValue(
          new Error("Database connection timeout")
        );

        const result = await service.updateProfile({
          userId,
          username,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Database connection timeout");
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });

      it("should handle errors during availability check", async () => {
        const userId = "user-123";
        const username = "newuser";

        mockValidateUsername.mockReturnValue({ valid: true });
        mockFindUserById.mockResolvedValue({ username: "olduser" });
        mockFindUserByNormalizedUsername.mockRejectedValue(
          new Error("Database query failed")
        );

        const result = await service.updateProfile({
          userId,
          username,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          // When checkUsernameAvailability fails, it returns success: false
          // which is treated as username taken (CONFLICT) by updateProfile
          expect(result.error).toBe("Username already exists");
          expect(result.code).toBe(ServiceErrorCode.CONFLICT);
        }
      });
    });
  });
});
