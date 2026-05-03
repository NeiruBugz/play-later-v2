import type { SteamService } from "@/data-access-layer/services";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { disconnectSteam } from "../disconnect-steam";

vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

vi.mock("@/data-access-layer/services", () => ({
  SteamService: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("@/shared/lib", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/shared/lib")>();
  return {
    ...original,
    createLogger: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  };
});

const { getServerUserId } = await import("@/auth");
const { SteamService: MockSteamService } =
  await import("@/data-access-layer/services");
const { revalidatePath, updateTag } = await import("next/cache");
const { userTags } = await import("@/shared/lib");

const mockGetServerUserId = getServerUserId as Mock;
const mockRevalidatePath = revalidatePath as Mock;
const mockUpdateTag = updateTag as Mock;

describe("disconnectSteam server action", () => {
  let mockDisconnectSteam: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDisconnectSteam = vi.fn();
    vi.mocked(MockSteamService).mockImplementation(function () {
      return {
        disconnectSteam: mockDisconnectSteam,
      } as unknown as SteamService;
    });
  });

  describe("when user is authenticated", () => {
    beforeEach(() => {
      mockGetServerUserId.mockResolvedValue("user-123");
    });

    it("should successfully disconnect Steam account", async () => {
      mockDisconnectSteam.mockResolvedValue(undefined);

      const result = await disconnectSteam({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
      expect(mockDisconnectSteam).toHaveBeenCalledWith({
        userId: "user-123",
      });
    });

    it("should revalidate settings and profile paths on success", async () => {
      mockDisconnectSteam.mockResolvedValue(undefined);

      await disconnectSteam({});

      expect(mockRevalidatePath).toHaveBeenCalledWith("/settings");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/profile");
    });

    it("should not revalidate paths when service throws", async () => {
      mockDisconnectSteam.mockRejectedValue(new Error("Database error"));

      await disconnectSteam({});

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("when user is not authenticated", () => {
    beforeEach(() => {
      mockGetServerUserId.mockResolvedValue(undefined);
    });

    it("should return authentication error", async () => {
      const result = await disconnectSteam({});

      expect(result).toEqual({
        success: false,
        error: "You must be logged in to perform this action",
      });
      expect(mockDisconnectSteam).not.toHaveBeenCalled();
    });

    it("should not call SteamService when unauthenticated", async () => {
      await disconnectSteam({});

      expect(mockDisconnectSteam).not.toHaveBeenCalled();
    });

    it("should not revalidate paths when unauthenticated", async () => {
      await disconnectSteam({});

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      mockGetServerUserId.mockResolvedValue("user-123");
    });

    it("should handle unexpected errors gracefully", async () => {
      mockDisconnectSteam.mockRejectedValue(new Error("Unexpected error"));

      const result = await disconnectSteam({});

      expect(result).toEqual({
        success: false,
        error: "Unexpected error",
      });
    });

    it("should handle non-Error exceptions", async () => {
      mockDisconnectSteam.mockRejectedValue("String error");

      const result = await disconnectSteam({});

      expect(result).toEqual({
        success: false,
        error: "An unexpected error occurred",
      });
    });
  });

  describe("input validation", () => {
    beforeEach(() => {
      mockGetServerUserId.mockResolvedValue("user-123");
    });

    it("should accept empty input object", async () => {
      mockDisconnectSteam.mockResolvedValue(undefined);

      const result = await disconnectSteam({});

      expect(result.success).toBe(true);
      expect(mockDisconnectSteam).toHaveBeenCalledWith({
        userId: "user-123",
      });
    });
  });

  describe("cache revalidation", () => {
    beforeEach(() => {
      mockGetServerUserId.mockResolvedValue("user-123");
    });

    it("should revalidate both paths on successful disconnect", async () => {
      mockDisconnectSteam.mockResolvedValue(undefined);

      await disconnectSteam({});

      expect(mockRevalidatePath).toHaveBeenCalledTimes(2);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/settings");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/profile");
    });

    it("should call updateTag with steamConnection on success", async () => {
      mockDisconnectSteam.mockResolvedValue(undefined);

      await disconnectSteam({});

      expect(mockUpdateTag).toHaveBeenCalledWith(
        userTags("user-123").steamConnection
      );
    });

    it("should NOT call updateTag when service throws", async () => {
      mockDisconnectSteam.mockRejectedValue(new Error("Database error"));

      await disconnectSteam({});

      expect(mockUpdateTag).not.toHaveBeenCalled();
    });

    it("should call revalidate after handler completes", async () => {
      let handlerCompleted = false;
      mockDisconnectSteam.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        handlerCompleted = true;
      });

      await disconnectSteam({});

      expect(handlerCompleted).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });
  });
});
