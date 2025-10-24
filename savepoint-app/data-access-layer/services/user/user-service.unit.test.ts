import {
  disconnectSteam,
  getUserInfo,
  getUserSteamData,
  updateUserData,
} from "@/data-access-layer/repository/user/user-repository";
import { ServiceErrorCode } from "../types";
import { UserService } from "./user-service";

vi.mock("@/data-access-layer/repository/user/user-repository", () => ({
  getUserInfo: vi.fn(),
  updateUserData: vi.fn(),
  getUserSteamData: vi.fn(),
  disconnectSteam: vi.fn(),
}));

describe("UserService", () => {
  let service: UserService;
  let mockGetUserInfo: ReturnType<typeof vi.fn>;
  let mockUpdateUserData: ReturnType<typeof vi.fn>;
  let mockGetUserSteamData: ReturnType<typeof vi.fn>;
  let mockDisconnectSteam: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService();
    mockGetUserInfo = vi.mocked(getUserInfo);
    mockUpdateUserData = vi.mocked(updateUserData);
    mockGetUserSteamData = vi.mocked(getUserSteamData);
    mockDisconnectSteam = vi.mocked(disconnectSteam);
  });

  describe("getUser", () => {
    it("should return user data", async () => {
      const mockUser = {
        id: "user-123",
        name: "John Doe",
        username: "johndoe",
        email: "john@example.com",
        steamProfileURL: "https://steamcommunity.com/id/johndoe",
        steamConnectedAt: new Date("2024-01-15"),
      };

      mockGetUserInfo.mockResolvedValue(mockUser);

      const result = await service.getUser({
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user).toEqual(mockUser);
      }

      expect(mockGetUserInfo).toHaveBeenCalledWith({
        userId: "user-123",
      });
    });

    it("should return error when user not found", async () => {
      mockGetUserInfo.mockResolvedValue(null);

      const result = await service.getUser({
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
      }
    });

    it("should handle repository errors", async () => {
      mockGetUserInfo.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.getUser({
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("updateUser", () => {
    it("should update username", async () => {
      const mockUpdatedUser = {
        id: "user-123",
        username: "newusername",
        steamProfileURL: null,
      };

      mockUpdateUserData.mockResolvedValue(mockUpdatedUser);

      const result = await service.updateUser({
        userId: "user-123",
        username: "newusername",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.username).toBe("newusername");
        expect(result.data.message).toBe("User profile updated successfully");
      }

      expect(mockUpdateUserData).toHaveBeenCalledWith({
        userId: "user-123",
        username: "newusername",
        steamProfileUrl: null,
      });
    });

    it("should update steam profile URL", async () => {
      const mockUpdatedUser = {
        id: "user-123",
        username: "johndoe",
        steamProfileURL: "https://steamcommunity.com/id/newprofile",
      };

      mockUpdateUserData.mockResolvedValue(mockUpdatedUser);

      const result = await service.updateUser({
        userId: "user-123",
        steamProfileUrl: "https://steamcommunity.com/id/newprofile",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.steamProfileURL).toBe(
          "https://steamcommunity.com/id/newprofile"
        );
      }
    });

    it("should update both username and steam profile URL", async () => {
      const mockUpdatedUser = {
        id: "user-123",
        username: "newusername",
        steamProfileURL: "https://steamcommunity.com/id/newprofile",
      };

      mockUpdateUserData.mockResolvedValue(mockUpdatedUser);

      const result = await service.updateUser({
        userId: "user-123",
        username: "newusername",
        steamProfileUrl: "https://steamcommunity.com/id/newprofile",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.username).toBe("newusername");
        expect(result.data.user.steamProfileURL).toBe(
          "https://steamcommunity.com/id/newprofile"
        );
      }
    });

    it("should return error when no fields provided", async () => {
      const result = await service.updateUser({
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          "At least one field must be provided for update"
        );
        expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
      }

      expect(mockUpdateUserData).not.toHaveBeenCalled();
    });

    it("should handle username conflict", async () => {
      mockUpdateUserData.mockRejectedValue(
        new Error("Unique constraint violation")
      );

      const result = await service.updateUser({
        userId: "user-123",
        username: "existingusername",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Username is already taken");
        expect(result.code).toBe(ServiceErrorCode.CONFLICT);
      }
    });

    it("should handle user not found", async () => {
      mockUpdateUserData.mockRejectedValue(new Error("User not found"));

      const result = await service.updateUser({
        userId: "user-123",
        username: "newusername",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
      }
    });

    it("should handle repository errors", async () => {
      mockUpdateUserData.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.updateUser({
        userId: "user-123",
        username: "newusername",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("getSteamIntegrationStatus", () => {
    it("should return connected Steam integration", async () => {
      const mockSteamData = {
        steamId64: "76561198012345678",
        steamUsername: "steamuser",
        steamProfileURL: "https://steamcommunity.com/id/steamuser",
        steamConnectedAt: new Date("2024-01-15"),
      };

      mockGetUserSteamData.mockResolvedValue(mockSteamData);

      const result = await service.getSteamIntegrationStatus({
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.integration.isConnected).toBe(true);
        expect(result.data.integration.steamId64).toBe("76561198012345678");
        expect(result.data.integration.steamUsername).toBe("steamuser");
        expect(result.data.integration.steamProfileURL).toBe(
          "https://steamcommunity.com/id/steamuser"
        );
        expect(result.data.integration.steamConnectedAt).toEqual(
          new Date("2024-01-15")
        );
      }

      expect(mockGetUserSteamData).toHaveBeenCalledWith({
        userId: "user-123",
      });
    });

    it("should return disconnected Steam integration", async () => {
      const mockSteamData = {
        steamId64: null,
        steamUsername: null,
        steamProfileURL: null,
        steamConnectedAt: null,
      };

      mockGetUserSteamData.mockResolvedValue(mockSteamData);

      const result = await service.getSteamIntegrationStatus({
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.integration.isConnected).toBe(false);
        expect(result.data.integration.steamId64).toBeNull();
        expect(result.data.integration.steamUsername).toBeNull();
        expect(result.data.integration.steamProfileURL).toBeNull();
        expect(result.data.integration.steamConnectedAt).toBeNull();
      }
    });

    it("should return error when user not found", async () => {
      mockGetUserSteamData.mockResolvedValue(null);

      const result = await service.getSteamIntegrationStatus({
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
      }
    });

    it("should handle repository errors", async () => {
      mockGetUserSteamData.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.getSteamIntegrationStatus({
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("disconnectSteam", () => {
    it("should disconnect Steam account successfully", async () => {
      mockDisconnectSteam.mockResolvedValue({
        id: "user-123",
        steamId64: null,
        steamUsername: null,
        steamProfileURL: null,
        steamAvatar: null,
        steamConnectedAt: null,
      });

      const result = await service.disconnectSteam({
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe(
          "Steam account disconnected successfully"
        );
      }

      expect(mockDisconnectSteam).toHaveBeenCalledWith({
        userId: "user-123",
      });
    });

    it("should handle repository errors", async () => {
      mockDisconnectSteam.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.disconnectSteam({
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });
});
