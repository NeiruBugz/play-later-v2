import { getServerUserId } from "@/auth";
import { ProfileService } from "@/data-access-layer/services/profile/profile-service";
import { revalidatePath } from "next/cache";

import type { UpdateProfileFormState } from "@/shared/types/profile";

import { updateProfile, updateProfileFormAction } from "./update-profile";

vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

vi.mock("@/data-access-layer/services/profile/profile-service", () => ({
  ProfileService: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockGetServerUserId = vi.mocked(getServerUserId);
const mockRevalidatePath = vi.mocked(revalidatePath);
const MockProfileService = vi.mocked(ProfileService);

describe("updateProfile server action", () => {
  let mockUpdateProfile: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUpdateProfile = vi.fn();
    MockProfileService.mockImplementation(function () {
      return {
        updateProfile: mockUpdateProfile,
      } as any;
    });

    mockGetServerUserId.mockResolvedValue("user-123");
  });

  describe("updateProfile", () => {
    it("should return error when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await updateProfile({
        username: "newusername",
      });

      expect(result).toEqual({
        success: false,
        error: "Unauthorized",
      });
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("should trim username and update profile successfully", async () => {
      mockUpdateProfile.mockResolvedValue({
        success: true,
        data: { username: "newusername", image: null },
      });

      const result = await updateProfile({
        username: "  newusername  ",
        avatarUrl: "https://example.com/avatar.jpg",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          username: "newusername",
          image: null,
        });
      }

      expect(mockUpdateProfile).toHaveBeenCalledWith({
        userId: "user-123",
        username: "newusername",
        avatarUrl: "https://example.com/avatar.jpg",
      });
    });

    it("should handle profile service error", async () => {
      mockUpdateProfile.mockResolvedValue({
        success: false,
        error: "Username already exists",
      });

      const result = await updateProfile({
        username: "takenusername",
      });

      expect(result).toEqual({
        success: false,
        error: "Username already exists",
      });
    });

    it("should handle validation error from Zod schema", async () => {
      const result = await updateProfile({
        username: "ab",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain(">=3 characters");
      }
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("should handle validation error for too long username", async () => {
      const result = await updateProfile({
        username: "a".repeat(26),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("<=25 characters");
      }
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("should handle avatarUrl being omitted", async () => {
      mockUpdateProfile.mockResolvedValue({
        success: true,
        data: { username: "newusername", image: null },
      });

      const result = await updateProfile({
        username: "newusername",
      });

      expect(result.success).toBe(true);
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        userId: "user-123",
        username: "newusername",
        avatarUrl: undefined,
      });
    });

    it("should handle unexpected errors gracefully", async () => {
      mockUpdateProfile.mockRejectedValue(
        new Error("Database connection lost")
      );

      const result = await updateProfile({
        username: "testuser",
      });

      expect(result).toEqual({
        success: false,
        error: "An unexpected error occurred",
      });
    });
  });

  describe("updateProfileFormAction", () => {
    const prevState: UpdateProfileFormState = {
      status: "idle",
    };

    it("should return error when username field is missing", async () => {
      const formData = new FormData();

      const result = await updateProfileFormAction(prevState, formData);

      expect(result).toEqual({
        status: "error",
        message: "Username is required",
        submittedUsername: undefined,
      });
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("should return error when username is not a string", async () => {
      const formData = new FormData();
      formData.append("username", new Blob(["test"]), "test.txt");

      const result = await updateProfileFormAction(prevState, formData);

      expect(result).toEqual({
        status: "error",
        message: "Username is required",
        submittedUsername: undefined,
      });
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("should return error when username is empty after trimming", async () => {
      const formData = new FormData();
      formData.append("username", "   ");

      const result = await updateProfileFormAction(prevState, formData);

      expect(result).toEqual({
        status: "error",
        message: "Username is required",
        submittedUsername: undefined,
      });
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("should successfully update profile and revalidate path", async () => {
      mockUpdateProfile.mockResolvedValue({
        success: true,
        data: { username: "newusername", image: null },
      });

      const formData = new FormData();
      formData.append("username", "  newusername  ");
      formData.append("avatarUrl", "https://example.com/avatar.jpg");

      const result = await updateProfileFormAction(prevState, formData);

      expect(result).toEqual({
        status: "success",
        message: "Profile updated successfully!",
        submittedUsername: "newusername",
      });

      expect(mockUpdateProfile).toHaveBeenCalledWith({
        userId: "user-123",
        username: "newusername",
        avatarUrl: "https://example.com/avatar.jpg",
      });

      expect(mockRevalidatePath).toHaveBeenCalledWith("/profile");
    });

    it("should handle empty avatarUrl as undefined", async () => {
      mockUpdateProfile.mockResolvedValue({
        success: true,
        data: { username: "newusername", image: null },
      });

      const formData = new FormData();
      formData.append("username", "newusername");
      formData.append("avatarUrl", "   ");

      const result = await updateProfileFormAction(prevState, formData);

      expect(result.status).toBe("success");
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        userId: "user-123",
        username: "newusername",
        avatarUrl: undefined,
      });
    });

    it("should return error when profile update fails", async () => {
      mockUpdateProfile.mockResolvedValue({
        success: false,
        error: "Username already exists",
      });

      const formData = new FormData();
      formData.append("username", "takenusername");

      const result = await updateProfileFormAction(prevState, formData);

      expect(result).toEqual({
        status: "error",
        message: "Username already exists",
        submittedUsername: "takenusername",
      });

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("should handle validation errors from Zod schema", async () => {
      const formData = new FormData();
      formData.append("username", "ab");

      const result = await updateProfileFormAction(prevState, formData);

      expect(result.status).toBe("error");
      expect(result.message).toContain(">=3 characters");
      expect(result.submittedUsername).toBe("ab");
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("should handle unauthorized user", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const formData = new FormData();
      formData.append("username", "newusername");

      const result = await updateProfileFormAction(prevState, formData);

      expect(result).toEqual({
        status: "error",
        message: "Unauthorized",
        submittedUsername: "newusername",
      });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors", async () => {
      mockUpdateProfile.mockRejectedValue(new Error("Network error"));

      const formData = new FormData();
      formData.append("username", "testuser");

      const result = await updateProfileFormAction(prevState, formData);

      expect(result).toEqual({
        status: "error",
        message: "An unexpected error occurred",
        submittedUsername: "testuser",
      });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });
});
