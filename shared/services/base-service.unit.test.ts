import { getServerUserId } from "@/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BaseService } from "./types";

// Mock the auth module
vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

// Create a concrete implementation of BaseService for testing
class TestBaseService extends BaseService {
  // Expose protected methods for testing
  public async testGetCurrentUserId(): Promise<string> {
    return this.getCurrentUserId();
  }

  public async testGetCurrentUserIdOptional(): Promise<string | undefined> {
    return this.getCurrentUserIdOptional();
  }
}

describe("BaseService", () => {
  let service: TestBaseService;
  let mockGetServerUserId: ReturnType<typeof vi.mocked<typeof getServerUserId>>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TestBaseService();
    mockGetServerUserId = vi.mocked(getServerUserId);
  });

  describe("getCurrentUserId", () => {
    it("should return userId when user is authenticated", async () => {
      const expectedUserId = "test-user-id";
      mockGetServerUserId.mockResolvedValue(expectedUserId);

      const result = await service.testGetCurrentUserId();

      expect(result).toBe(expectedUserId);
      expect(mockGetServerUserId).toHaveBeenCalledOnce();
    });

    it("should throw error when user is not authenticated (undefined)", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      await expect(service.testGetCurrentUserId()).rejects.toThrow(
        "Authentication required"
      );
      expect(mockGetServerUserId).toHaveBeenCalledOnce();
    });

    it("should throw error when user is not authenticated (null)", async () => {
      mockGetServerUserId.mockResolvedValue(null as unknown as string);

      await expect(service.testGetCurrentUserId()).rejects.toThrow(
        "Authentication required"
      );
      expect(mockGetServerUserId).toHaveBeenCalledOnce();
    });

    it("should throw error when getServerUserId throws an error", async () => {
      const authError = new Error("Auth service unavailable");
      mockGetServerUserId.mockRejectedValue(authError);

      await expect(service.testGetCurrentUserId()).rejects.toThrow(
        "Auth service unavailable"
      );
      expect(mockGetServerUserId).toHaveBeenCalledOnce();
    });
  });

  describe("getCurrentUserIdOptional", () => {
    it("should return userId when user is authenticated", async () => {
      const expectedUserId = "test-user-id";
      mockGetServerUserId.mockResolvedValue(expectedUserId);

      const result = await service.testGetCurrentUserIdOptional();

      expect(result).toBe(expectedUserId);
      expect(mockGetServerUserId).toHaveBeenCalledOnce();
    });

    it("should return undefined when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await service.testGetCurrentUserIdOptional();

      expect(result).toBeUndefined();
      expect(mockGetServerUserId).toHaveBeenCalledOnce();
    });

    it("should return null when getServerUserId returns null", async () => {
      mockGetServerUserId.mockResolvedValue(null as unknown as string);

      const result = await service.testGetCurrentUserIdOptional();

      expect(result).toBeNull();
      expect(mockGetServerUserId).toHaveBeenCalledOnce();
    });

    it("should propagate errors from getServerUserId", async () => {
      const authError = new Error("Auth service unavailable");
      mockGetServerUserId.mockRejectedValue(authError);

      await expect(service.testGetCurrentUserIdOptional()).rejects.toThrow(
        "Auth service unavailable"
      );
      expect(mockGetServerUserId).toHaveBeenCalledOnce();
    });
  });

  describe("error handling methods", () => {
    it("should handle Error instances correctly", () => {
      const error = new Error("Test error");
      error.cause = "Test cause";

      const result = service["handleError"](error);

      expect(result).toEqual({
        message: "Test error",
        cause: "Test cause",
      });
    });

    it("should handle non-Error instances correctly", () => {
      const result = service["handleError"]("String error");

      expect(result).toEqual({
        message: "String error",
      });
    });

    it("should create success response correctly", () => {
      const testData = { id: 1, name: "Test" };

      const result = service["createSuccessResponse"](testData);

      expect(result).toEqual({
        data: testData,
        success: true,
      });
    });

    it("should create error response correctly", () => {
      const error = {
        message: "Test error",
        code: "TEST_ERROR",
        cause: "Test cause",
      };

      const result = service["createErrorResponse"](error);

      expect(result).toEqual({
        error: "Test error",
        success: false,
        cause: "Test cause",
      });
    });
  });
});
