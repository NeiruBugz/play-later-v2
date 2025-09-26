import { getServerUserId } from "@/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { disconnectSteam } from "./actions/disconnect-steam";
import { getSteamUserData } from "./actions/get-steam-user-data";
import { getUserInfo } from "./actions/get-user-info";
import { updateUserProfile } from "./actions/update-user-profile";
import type { SteamUserData, UpdateUserProfileParams, UserInfo } from "./types";
import { UserService } from "./user-service";

// Mock the auth module
vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

// Mock the server actions
vi.mock("./actions/get-user-info", () => ({
  getUserInfo: vi.fn(),
}));

vi.mock("./actions/update-user-profile", () => ({
  updateUserProfile: vi.fn(),
}));

vi.mock("./actions/get-steam-user-data", () => ({
  getSteamUserData: vi.fn(),
}));

vi.mock("./actions/disconnect-steam", () => ({
  disconnectSteam: vi.fn(),
}));

// Mock Next.js cache revalidation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("UserService", () => {
  let service: UserService;
  let mockGetServerUserId: ReturnType<typeof vi.mocked<typeof getServerUserId>>;
  let mockGetUserInfo: ReturnType<typeof vi.fn>;
  let mockUpdateUserProfile: ReturnType<typeof vi.fn>;
  let mockGetSteamUserData: ReturnType<typeof vi.fn>;
  let mockDisconnectSteam: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService();
    mockGetServerUserId = vi.mocked(getServerUserId);
    mockGetUserInfo = vi.mocked(getUserInfo);
    mockUpdateUserProfile = vi.mocked(updateUserProfile);
    mockGetSteamUserData = vi.mocked(getSteamUserData);
    mockDisconnectSteam = vi.mocked(disconnectSteam);
  });

  describe("getUserInfo", () => {
    const mockUserData: UserInfo = {
      id: "test-user-id",
      name: "Test User",
      username: "testuser",
      steamProfileURL: "https://steamcommunity.com/id/testuser",
      steamConnectedAt: new Date("2024-01-01T00:00:00Z"),
      email: "test@example.com",
    };

    it("should return error when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await service.getUserInfo();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch user information");
      expect(result.cause).toBe("Authentication required");
      expect(mockGetUserInfo).not.toHaveBeenCalled();
    });

    it("should successfully get user info", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockGetUserInfo.mockResolvedValue({ data: mockUserData });

      const result = await service.getUserInfo();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUserData);
      expect(mockGetUserInfo).toHaveBeenCalledWith();
      expect(mockGetServerUserId).toHaveBeenCalledOnce();
    });

    it("should handle server action throwing error", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockGetUserInfo.mockRejectedValue(new Error("No user with this id"));

      const result = await service.getUserInfo();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch user information");
      expect(result.cause).toBe("No user with this id");
    });

    it("should handle server action throwing non-Error object", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockGetUserInfo.mockRejectedValue("Database connection error");

      const result = await service.getUserInfo();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch user information");
      expect(result.cause).toBe("Database connection error");
    });
  });

  describe("updateUserProfile", () => {
    const validParams: UpdateUserProfileParams = {
      username: "newusername",
      steamProfileUrl: "https://steamcommunity.com/id/newuser",
    };

    it("should return error when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await service.updateUserProfile(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to update user profile");
      expect(result.cause).toBe("Authentication required");
      expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    });

    it("should return validation error for empty username", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");

      const result = await service.updateUserProfile({
        username: "",
        steamProfileUrl: validParams.steamProfileUrl,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Username is required");
      expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    });

    it("should return validation error for whitespace-only username", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");

      const result = await service.updateUserProfile({
        username: "   ",
        steamProfileUrl: validParams.steamProfileUrl,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Username is required");
      expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    });

    it("should successfully update user profile", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockUpdateUserProfile.mockResolvedValue({ data: undefined });

      const result = await service.updateUserProfile(validParams);

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        username: "newusername",
        steamProfileUrl: "https://steamcommunity.com/id/newuser",
      });
      expect(mockGetServerUserId).toHaveBeenCalledOnce();
    });

    it("should trim username before updating", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockUpdateUserProfile.mockResolvedValue({ data: undefined });

      const result = await service.updateUserProfile({
        username: "  trimmeduser  ",
        steamProfileUrl: validParams.steamProfileUrl,
      });

      expect(result.success).toBe(true);
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        username: "trimmeduser",
        steamProfileUrl: validParams.steamProfileUrl,
      });
    });

    it("should handle null steamProfileUrl", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockUpdateUserProfile.mockResolvedValue({ data: undefined });

      const result = await service.updateUserProfile({
        username: "testuser",
        steamProfileUrl: null,
      });

      expect(result.success).toBe(true);
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        username: "testuser",
        steamProfileUrl: null,
      });
    });

    it("should handle undefined steamProfileUrl", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockUpdateUserProfile.mockResolvedValue({ data: undefined });

      const result = await service.updateUserProfile({
        username: "testuser",
      });

      expect(result.success).toBe(true);
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        username: "testuser",
        steamProfileUrl: null,
      });
    });

    it("should handle server action throwing error", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockUpdateUserProfile.mockRejectedValue(new Error("Database error"));

      const result = await service.updateUserProfile(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to update user profile");
      expect(result.cause).toBe("Database error");
    });

    it("should handle server action throwing non-Error object", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockUpdateUserProfile.mockRejectedValue("Database connection failed");

      const result = await service.updateUserProfile(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to update user profile");
      expect(result.cause).toBe("Database connection failed");
    });
  });

  describe("getSteamUserData", () => {
    const mockSteamData: SteamUserData = {
      id: "test-user-id",
      steamId64: "76561198000000000",
      steamUsername: "TestSteamUser",
      steamProfileURL: "https://steamcommunity.com/id/testuser",
      steamAvatar: "https://avatars.steamstatic.com/test.jpg",
      steamConnectedAt: new Date("2024-01-01T00:00:00Z"),
    };

    it("should return error when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await service.getSteamUserData();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch Steam user data");
      expect(result.cause).toBe("Authentication required");
      expect(mockGetSteamUserData).not.toHaveBeenCalled();
    });

    it("should successfully get Steam user data", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockGetSteamUserData.mockResolvedValue({ data: mockSteamData });

      const result = await service.getSteamUserData();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSteamData);
      expect(mockGetSteamUserData).toHaveBeenCalledWith();
      expect(mockGetServerUserId).toHaveBeenCalledOnce();
    });

    it("should handle server action throwing error", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockGetSteamUserData.mockRejectedValue(new Error("User not found"));

      const result = await service.getSteamUserData();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch Steam user data");
      expect(result.cause).toBe("User not found");
    });

    it("should handle server action throwing non-Error object", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockGetSteamUserData.mockRejectedValue("Steam API error");

      const result = await service.getSteamUserData();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch Steam user data");
      expect(result.cause).toBe("Steam API error");
    });
  });

  describe("disconnectSteam", () => {
    const mockUpdatedUserData: SteamUserData = {
      id: "test-user-id",
      steamId64: null,
      steamUsername: null,
      steamProfileURL: null,
      steamAvatar: null,
      steamConnectedAt: null,
    };

    it("should return error when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await service.disconnectSteam();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to disconnect Steam account");
      expect(result.cause).toBe("Authentication required");
      expect(mockDisconnectSteam).not.toHaveBeenCalled();
    });

    it("should successfully disconnect Steam", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockDisconnectSteam.mockResolvedValue({ data: mockUpdatedUserData });

      const result = await service.disconnectSteam();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedUserData);
      expect(mockDisconnectSteam).toHaveBeenCalledWith();
      expect(mockGetServerUserId).toHaveBeenCalledOnce();
    });

    it("should handle server action throwing error", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockDisconnectSteam.mockRejectedValue(new Error("Failed to update user"));

      const result = await service.disconnectSteam();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to disconnect Steam account");
      expect(result.cause).toBe("Failed to update user");
    });

    it("should handle server action throwing non-Error object", async () => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
      mockDisconnectSteam.mockRejectedValue("Database update failed");

      const result = await service.disconnectSteam();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to disconnect Steam account");
      expect(result.cause).toBe("Database update failed");
    });
  });
});
