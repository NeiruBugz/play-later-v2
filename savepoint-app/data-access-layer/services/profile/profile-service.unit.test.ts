import {
  countLibraryItemsByUserId,
  findLibraryPreview,
  findUserById,
  findUserByNormalizedUsername,
  findUserByUsername,
  getLibraryStatsByUserId,
  getRatingHistogram,
  updateUserProfile,
} from "@/data-access-layer/repository";
import {
  basicUserProfileFixture,
  existingUserForRedirectFixture,
  existingUserWithTakenUsernameFixture,
  libraryStatsSuccessFixture,
  newUserForRedirectFixture,
  userAtExactBoundaryFixture,
  userForNewUsernameFixture,
  userForUnchangedUsernameFixture,
  userJustUnderBoundaryFixture,
  userWithAvatarUpdateFixture,
  userWithLongNameFixture,
  userWithNoUsernameFixture,
  userWithNullNameFixture,
  userWithoutUsernameRecentCreationFixture,
  userWithSpecialCharactersNameFixture,
  userWithUsernameAndRecentCreationFixture,
  userWithUsernameNotRecentFixture,
} from "@/test/fixtures/service/profile";

import { validateUsername } from "@/features/profile/lib";
import { ConflictError, NotFoundError } from "@/shared/lib/errors";

import { ProfileService } from "./profile-service";

vi.mock("@/data-access-layer/repository", () => ({
  countLibraryItemsByUserId: vi.fn(),
  findLibraryPreview: vi.fn(),
  findUserById: vi.fn(),
  findUserByNormalizedUsername: vi.fn(),
  findUserByUsername: vi.fn(),
  getLibraryStatsByUserId: vi.fn(),
  getRatingHistogram: vi.fn(),
  updateUserProfile: vi.fn(),
}));

vi.mock("@/features/profile/lib", () => ({
  validateUsername: vi.fn(),
}));

describe("ProfileService", () => {
  let service: ProfileService;
  let mockCountLibraryItemsByUserId: ReturnType<typeof vi.fn>;
  let mockFindLibraryPreview: ReturnType<typeof vi.fn>;
  let mockFindUserById: ReturnType<typeof vi.fn>;
  let mockFindUserByNormalizedUsername: ReturnType<typeof vi.fn>;
  let mockFindUserByUsername: ReturnType<typeof vi.fn>;
  let mockGetLibraryStatsByUserId: ReturnType<typeof vi.fn>;
  let mockGetRatingHistogram: ReturnType<typeof vi.fn>;
  let mockUpdateUserProfile: ReturnType<typeof vi.fn>;
  let mockValidateUsername: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new ProfileService();
    mockCountLibraryItemsByUserId = vi.mocked(countLibraryItemsByUserId);
    mockFindLibraryPreview = vi.mocked(findLibraryPreview);
    mockFindLibraryPreview.mockResolvedValue([]);
    mockFindUserById = vi.mocked(findUserById);
    mockFindUserByNormalizedUsername = vi.mocked(findUserByNormalizedUsername);
    mockFindUserByUsername = vi.mocked(findUserByUsername);
    mockGetLibraryStatsByUserId = vi.mocked(getLibraryStatsByUserId);
    mockGetRatingHistogram = vi.mocked(getRatingHistogram);
    mockGetRatingHistogram.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        rating: i + 1,
        count: 0,
      }))
    );
    mockUpdateUserProfile = vi.mocked(updateUserProfile);
    mockValidateUsername = vi.mocked(validateUsername);
  });

  describe("getProfile", () => {
    it("should return basic profile data for a user", async () => {
      mockFindUserById.mockResolvedValue(basicUserProfileFixture);

      const result = await service.getProfile({ userId: "user-123" });

      expect(result).toEqual(basicUserProfileFixture);
      expect(mockFindUserById).toHaveBeenCalledWith("user-123", {
        select: {
          username: true,
          image: true,
          email: true,
          name: true,
          createdAt: true,
          isPublicProfile: true,
        },
      });
    });

    it("should throw NotFoundError when user is not found", async () => {
      mockFindUserById.mockResolvedValue(null);

      await expect(
        service.getProfile({ userId: "nonexistent-user" })
      ).rejects.toThrow(NotFoundError);
    });

    it("should include userId in NotFoundError context", async () => {
      mockFindUserById.mockResolvedValue(null);

      await expect(
        service.getProfile({ userId: "nonexistent-user" })
      ).rejects.toMatchObject({ message: "User not found" });
    });

    it("should propagate unexpected errors", async () => {
      mockFindUserById.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(service.getProfile({ userId: "user-123" })).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("getProfileWithStats", () => {
    it("should return profile data with library statistics", async () => {
      mockFindUserById.mockResolvedValue(basicUserProfileFixture);
      mockGetLibraryStatsByUserId.mockResolvedValue(libraryStatsSuccessFixture);

      const result = await service.getProfileWithStats({ userId: "user-123" });

      expect(result.username).toBe("testuser");
      expect(result.email).toBe("test@example.com");
      expect(result.stats.statusCounts).toEqual({
        WISHLIST: 5,
        SHELF: 3,
        PLAYING: 2,
        PLAYED: 10,
      });
      expect(result.stats.recentGames).toHaveLength(2);
      expect(result.stats.recentGames[0].title).toBe("Test Game 1");
      expect(result.ratingHistogram).toHaveLength(10);
      expect(result.ratedCount).toBe(0);

      expect(mockFindUserById).toHaveBeenCalledWith("user-123", {
        select: {
          username: true,
          image: true,
          email: true,
          name: true,
          createdAt: true,
          isPublicProfile: true,
        },
      });
      expect(mockGetLibraryStatsByUserId).toHaveBeenCalledWith("user-123");
      expect(mockGetRatingHistogram).toHaveBeenCalledWith({
        userId: "user-123",
      });
    });

    it("should return correct ratingHistogram and ratedCount when games are rated", async () => {
      mockFindUserById.mockResolvedValue(basicUserProfileFixture);
      mockGetLibraryStatsByUserId.mockResolvedValue(libraryStatsSuccessFixture);
      const histogram = Array.from({ length: 10 }, (_, i) => ({
        rating: i + 1,
        count: i < 3 ? 0 : i === 4 ? 7 : i === 7 ? 3 : 0,
      }));
      mockGetRatingHistogram.mockResolvedValue(histogram);

      const result = await service.getProfileWithStats({ userId: "user-123" });

      expect(result.ratingHistogram).toEqual(histogram);
      expect(result.ratedCount).toBe(10);
    });

    it("should throw NotFoundError when user is not found", async () => {
      mockFindUserById.mockResolvedValue(null);

      await expect(
        service.getProfileWithStats({ userId: "nonexistent-user" })
      ).rejects.toThrow(NotFoundError);
    });

    it("should propagate errors from library stats fetch", async () => {
      mockFindUserById.mockResolvedValue(basicUserProfileFixture);
      mockGetLibraryStatsByUserId.mockRejectedValue(
        new Error("Failed to fetch library stats")
      );

      await expect(
        service.getProfileWithStats({ userId: "user-123" })
      ).rejects.toThrow("Failed to fetch library stats");
    });

    it("should propagate unexpected errors during stats fetch", async () => {
      mockFindUserById.mockResolvedValue(basicUserProfileFixture);
      mockGetLibraryStatsByUserId.mockRejectedValue(
        new Error("Connection timeout")
      );

      await expect(
        service.getProfileWithStats({ userId: "user-123" })
      ).rejects.toThrow("Connection timeout");
    });
  });

  describe("getPublicProfile", () => {
    const publicUserFixture = {
      id: "user-public-123",
      name: "Public User",
      username: "publicuser",
      image: "https://example.com/avatar.jpg",
      isPublicProfile: true,
      createdAt: new Date("2024-01-15"),
    };

    const privateUserFixture = {
      id: "user-private-456",
      name: "Private User",
      username: "privateuser",
      image: null,
      isPublicProfile: false,
      createdAt: new Date("2024-01-15"),
    };

    it("should return profile data for a public user", async () => {
      mockFindUserByUsername.mockResolvedValue(publicUserFixture);
      mockCountLibraryItemsByUserId.mockResolvedValue(42);

      const result = await service.getPublicProfile("publicuser");

      expect(result).toMatchObject({
        id: "user-public-123",
        name: "Public User",
        username: "publicuser",
        image: "https://example.com/avatar.jpg",
        gameCount: 42,
        libraryPreview: [],
        isPublicProfile: true,
      });
      expect(mockFindUserByUsername).toHaveBeenCalledWith("publicuser");
    });

    it("should fetch game count in the happy path", async () => {
      mockFindUserByUsername.mockResolvedValue(publicUserFixture);
      mockCountLibraryItemsByUserId.mockResolvedValue(15);

      await service.getPublicProfile("publicuser");

      expect(mockCountLibraryItemsByUserId).toHaveBeenCalledWith(
        "user-public-123"
      );
    });

    it("should return a minimal profile with isPublicProfile=false for a private user", async () => {
      mockFindUserByUsername.mockResolvedValue(privateUserFixture);

      const result = await service.getPublicProfile("privateuser");

      expect(result).toMatchObject({
        id: "user-private-456",
        username: "privateuser",
        isPublicProfile: false,
        gameCount: 0,
        libraryPreview: [],
      });
      expect(mockCountLibraryItemsByUserId).not.toHaveBeenCalled();
    });

    it("should return null for a non-existent username", async () => {
      mockFindUserByUsername.mockResolvedValue(null);

      const result = await service.getPublicProfile("unknownuser");

      expect(result).toBeNull();
      expect(mockCountLibraryItemsByUserId).not.toHaveBeenCalled();
    });

    it("should propagate unexpected errors", async () => {
      mockFindUserByUsername.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(service.getPublicProfile("publicuser")).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("checkUsernameAvailability", () => {
    it("should return true when username is not taken", async () => {
      mockFindUserByNormalizedUsername.mockResolvedValue(null);

      const result = await service.checkUsernameAvailability({
        username: "newuser123",
      });

      expect(result).toBe(true);
      expect(mockFindUserByNormalizedUsername).toHaveBeenCalledWith(
        "newuser123"
      );
    });

    it("should return false when username is already taken", async () => {
      mockFindUserByNormalizedUsername.mockResolvedValue({ id: "user-123" });

      const result = await service.checkUsernameAvailability({
        username: "existinguser",
      });

      expect(result).toBe(false);
      expect(mockFindUserByNormalizedUsername).toHaveBeenCalledWith(
        "existinguser"
      );
    });

    it("should check username case-insensitively", async () => {
      mockFindUserByNormalizedUsername.mockResolvedValue({ id: "user-123" });

      const result = await service.checkUsernameAvailability({
        username: "ExistingUser",
      });

      expect(result).toBe(false);
      expect(mockFindUserByNormalizedUsername).toHaveBeenCalledWith(
        "existinguser"
      );
    });

    it("should propagate database errors", async () => {
      mockFindUserByNormalizedUsername.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        service.checkUsernameAvailability({ username: "testuser" })
      ).rejects.toThrow("Database connection failed");
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
          ...userForUnchangedUsernameFixture,
          steamProfileURL: null,
          profileSetupCompletedAt: null,
        });

        const result = await service.updateProfile({ userId, username });

        expect(result.username).toBe("existinguser");
        expect(result.image).toBeNull();
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
          ...userForNewUsernameFixture,
          steamProfileURL: null,
          profileSetupCompletedAt: null,
        });

        const result = await service.updateProfile({
          userId,
          username: newUsername,
        });

        expect(result.username).toBe("newuser123");
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
          ...userWithAvatarUpdateFixture,
          steamProfileURL: null,
          profileSetupCompletedAt: null,
        });

        const result = await service.updateProfile({
          userId,
          username,
          avatarUrl,
        });

        expect(result.username).toBe("testuser");
        expect(result.image).toBe(avatarUrl);
        expect(mockUpdateUserProfile).toHaveBeenCalledWith(userId, {
          username: "testuser",
          usernameNormalized: "testuser",
          image: avatarUrl,
        });
      });
    });

    describe("validation error scenarios", () => {
      it("should throw when username is too short", async () => {
        mockValidateUsername.mockReturnValue({
          valid: false,
          error: "Username must be 3-25 characters",
        });

        await expect(
          service.updateProfile({ userId: "user-123", username: "ab" })
        ).rejects.toThrow("Username must be 3-25 characters");

        expect(mockFindUserById).not.toHaveBeenCalled();
        expect(mockUpdateUserProfile).not.toHaveBeenCalled();
      });

      it("should throw when username is too long", async () => {
        const username = "a".repeat(26);
        mockValidateUsername.mockReturnValue({
          valid: false,
          error: "Username must be 3-25 characters",
        });

        await expect(
          service.updateProfile({ userId: "user-123", username })
        ).rejects.toThrow("Username must be 3-25 characters");

        expect(mockFindUserById).not.toHaveBeenCalled();
      });

      it("should throw when username contains invalid characters", async () => {
        mockValidateUsername.mockReturnValue({
          valid: false,
          error: "Username can only contain letters, numbers, _, -, and .",
        });

        await expect(
          service.updateProfile({ userId: "user-123", username: "user@name!" })
        ).rejects.toThrow(
          "Username can only contain letters, numbers, _, -, and ."
        );

        expect(mockFindUserById).not.toHaveBeenCalled();
      });

      it("should throw when username is reserved", async () => {
        mockValidateUsername.mockReturnValue({
          valid: false,
          error: "Username is not allowed",
        });

        await expect(
          service.updateProfile({ userId: "user-123", username: "admin" })
        ).rejects.toThrow("Username is not allowed");

        expect(mockFindUserById).not.toHaveBeenCalled();
      });
    });

    describe("conflict scenarios", () => {
      it("should throw ConflictError when username is already taken (case-insensitive)", async () => {
        mockValidateUsername.mockReturnValue({ valid: true });
        mockFindUserById.mockResolvedValue({ username: "olduser" });
        mockFindUserByNormalizedUsername.mockResolvedValue(
          existingUserWithTakenUsernameFixture
        );

        await expect(
          service.updateProfile({ userId: "user-123", username: "NewUser" })
        ).rejects.toThrow(ConflictError);

        expect(mockFindUserByNormalizedUsername).toHaveBeenCalledWith(
          "newuser"
        );
        expect(mockUpdateUserProfile).not.toHaveBeenCalled();
      });

      it("should throw ConflictError with correct message", async () => {
        mockValidateUsername.mockReturnValue({ valid: true });
        mockFindUserById.mockResolvedValue({ username: "olduser" });
        mockFindUserByNormalizedUsername.mockResolvedValue(
          existingUserWithTakenUsernameFixture
        );

        await expect(
          service.updateProfile({ userId: "user-123", username: "NEWUSER" })
        ).rejects.toMatchObject({ message: "Username already exists" });

        expect(mockFindUserByNormalizedUsername).toHaveBeenCalledWith(
          "newuser"
        );
      });
    });

    describe("not found scenarios", () => {
      it("should throw NotFoundError when user is not found", async () => {
        mockValidateUsername.mockReturnValue({ valid: true });
        mockFindUserById.mockResolvedValue(null);

        await expect(
          service.updateProfile({
            userId: "nonexistent-user",
            username: "validuser",
          })
        ).rejects.toThrow(NotFoundError);

        expect(mockUpdateUserProfile).not.toHaveBeenCalled();
      });
    });

    describe("error handling", () => {
      it("should propagate repository errors during update", async () => {
        mockValidateUsername.mockReturnValue({ valid: true });
        mockFindUserById.mockResolvedValue({ username: "olduser" });
        mockFindUserByNormalizedUsername.mockResolvedValue(null);
        mockUpdateUserProfile.mockRejectedValue(
          new Error("Database connection failed")
        );

        await expect(
          service.updateProfile({ userId: "user-123", username: "validuser" })
        ).rejects.toThrow("Database connection failed");
      });

      it("should propagate errors during user lookup", async () => {
        mockValidateUsername.mockReturnValue({ valid: true });
        mockFindUserById.mockRejectedValue(
          new Error("Database connection timeout")
        );

        await expect(
          service.updateProfile({ userId: "user-123", username: "validuser" })
        ).rejects.toThrow("Database connection timeout");
      });

      it("should propagate errors during availability check", async () => {
        mockValidateUsername.mockReturnValue({ valid: true });
        mockFindUserById.mockResolvedValue({ username: "olduser" });
        mockFindUserByNormalizedUsername.mockRejectedValue(
          new Error("Database query failed")
        );

        await expect(
          service.updateProfile({ userId: "user-123", username: "newuser" })
        ).rejects.toThrow("Database query failed");
      });
    });
  });

  describe("checkSetupStatus", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      const now = new Date("2025-01-20T12:00:00Z");
      vi.setSystemTime(now);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe("success scenarios", () => {
      it("should return needsSetup: true for user with no username", async () => {
        mockFindUserById.mockResolvedValue(userWithNoUsernameFixture);

        const result = await service.checkSetupStatus({ userId: "user-123" });

        expect(result.needsSetup).toBe(true);
        expect(result.suggestedUsername).toBe("johndoe");
        expect(mockFindUserById).toHaveBeenCalledWith("user-123", {
          select: {
            username: true,
            name: true,
            profileSetupCompletedAt: true,
            createdAt: true,
          },
        });
      });

      it("should return needsSetup: true for new user created within 5 minutes with username", async () => {
        mockFindUserById.mockResolvedValue(
          userWithUsernameAndRecentCreationFixture
        );

        const result = await service.checkSetupStatus({ userId: "user-123" });

        expect(result.needsSetup).toBe(true);
        expect(result.suggestedUsername).toBe("johndoe");
      });

      it("should return needsSetup: true for new user without username created within 5 minutes", async () => {
        mockFindUserById.mockResolvedValue(
          userWithoutUsernameRecentCreationFixture
        );

        const result = await service.checkSetupStatus({ userId: "user-456" });

        expect(result.needsSetup).toBe(true);
        expect(result.suggestedUsername).toBe("janesmith");
      });

      it("should return needsSetup: false for existing user with username created 10 minutes ago", async () => {
        mockFindUserById.mockResolvedValue(userWithUsernameNotRecentFixture);

        const result = await service.checkSetupStatus({ userId: "user-789" });

        expect(result.needsSetup).toBe(false);
        expect(result.suggestedUsername).toBeUndefined();
      });

      it("should return needsSetup: false for user at exact 5-minute boundary with username", async () => {
        mockFindUserById.mockResolvedValue(userAtExactBoundaryFixture);

        const result = await service.checkSetupStatus({
          userId: "user-boundary",
        });

        expect(result.needsSetup).toBe(false);
        expect(result.suggestedUsername).toBeUndefined();
      });

      it("should return needsSetup: true for user just under 5-minute boundary", async () => {
        mockFindUserById.mockResolvedValue(userJustUnderBoundaryFixture);

        const result = await service.checkSetupStatus({
          userId: "user-recent",
        });

        expect(result.needsSetup).toBe(true);
        expect(result.suggestedUsername).toBe("recentuser");
      });
    });

    describe("suggested username generation", () => {
      it("should generate suggested username from Google name", async () => {
        mockFindUserById.mockResolvedValue(userWithNoUsernameFixture);

        const result = await service.checkSetupStatus({ userId: "user-123" });

        expect(result.suggestedUsername).toBe("johndoe");
      });

      it("should remove special characters from suggested username", async () => {
        mockFindUserById.mockResolvedValue(
          userWithSpecialCharactersNameFixture
        );

        const result = await service.checkSetupStatus({ userId: "user-456" });

        expect(result.suggestedUsername).toBe("johnpaulobrien");
      });

      it("should truncate suggested username to 20 characters", async () => {
        mockFindUserById.mockResolvedValue(userWithLongNameFixture);

        const result = await service.checkSetupStatus({ userId: "user-long" });

        expect(result.suggestedUsername).toBe("christopheralexander");
        expect(result.suggestedUsername?.length).toBe(20);
      });

      it("should return undefined suggested username when setup not needed", async () => {
        mockFindUserById.mockResolvedValue(userWithUsernameNotRecentFixture);

        const result = await service.checkSetupStatus({
          userId: "user-existing",
        });

        expect(result.needsSetup).toBe(false);
        expect(result.suggestedUsername).toBeUndefined();
      });

      it("should return undefined suggested username when name is null", async () => {
        mockFindUserById.mockResolvedValue(userWithNullNameFixture);

        const result = await service.checkSetupStatus({
          userId: "user-noname",
        });

        expect(result.needsSetup).toBe(true);
        expect(result.suggestedUsername).toBeUndefined();
      });
    });

    describe("error scenarios", () => {
      it("should throw NotFoundError when user does not exist", async () => {
        mockFindUserById.mockResolvedValue(null);

        await expect(
          service.checkSetupStatus({ userId: "nonexistent-user" })
        ).rejects.toThrow(NotFoundError);

        expect(mockFindUserById).toHaveBeenCalledWith("nonexistent-user", {
          select: {
            username: true,
            name: true,
            profileSetupCompletedAt: true,
            createdAt: true,
          },
        });
      });

      it("should propagate unexpected database errors", async () => {
        mockFindUserById.mockRejectedValue(
          new Error("Database connection failed")
        );

        await expect(
          service.checkSetupStatus({ userId: "user-123" })
        ).rejects.toThrow("Database connection failed");
      });
    });
  });

  describe("getRedirectAfterAuth", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-20T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should redirect new users to /profile/setup", async () => {
      mockFindUserById.mockResolvedValue(newUserForRedirectFixture);

      const result = await service.getRedirectAfterAuth({ userId: "user-1" });

      expect(result.redirectTo).toBe("/profile/setup");
      expect(result.isNewUser).toBe(true);
    });

    it("should redirect existing users to /dashboard", async () => {
      mockFindUserById.mockResolvedValue(existingUserForRedirectFixture);

      const result = await service.getRedirectAfterAuth({ userId: "user-2" });

      expect(result.redirectTo).toBe("/dashboard");
      expect(result.isNewUser).toBe(false);
    });

    it("should fail-safe to /dashboard when status check fails", async () => {
      mockFindUserById.mockRejectedValue(new Error("db down"));

      const result = await service.getRedirectAfterAuth({ userId: "user-3" });

      expect(result.redirectTo).toBe("/dashboard");
      expect(result.isNewUser).toBe(false);
    });
  });
});
