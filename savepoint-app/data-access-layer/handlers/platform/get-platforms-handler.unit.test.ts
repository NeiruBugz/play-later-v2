import { PlatformService } from "@/data-access-layer/services/platform/platform-service";
import type { Platform } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RequestContext } from "../types";
import { getPlatformsHandler } from "./get-platforms-handler";

vi.mock("@/data-access-layer/services/platform/platform-service");

const mockPlatformService = vi.mocked(PlatformService);

describe("getPlatformsHandler", () => {
  const mockContext: RequestContext = {
    ip: "192.168.1.1",
    headers: new Headers(),
    url: new URL("http://localhost/api/games/12345/platforms"),
  };

  let mockGetPlatformsForGame: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetPlatformsForGame = vi.fn();

    mockPlatformService.mockImplementation(
      () =>
        ({
          getPlatformsForGame: mockGetPlatformsForGame,
        }) as any
    );
  });

  describe("Input Validation", () => {
    it("should reject invalid igdbId (negative number)", async () => {
      const params = { igdbId: -1 };

      const result = await getPlatformsHandler(params, mockContext);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error).toContain("positive integer");
      }
      expect(mockGetPlatformsForGame).not.toHaveBeenCalled();
    });

    it("should reject invalid igdbId (zero)", async () => {
      const params = { igdbId: 0 };

      const result = await getPlatformsHandler(params, mockContext);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error).toContain("positive integer");
      }
      expect(mockGetPlatformsForGame).not.toHaveBeenCalled();
    });

    it("should accept valid positive igdbId", async () => {
      const params = { igdbId: 12345 };
      const mockPlatforms: Platform[] = [
        {
          id: "plat1",
          igdbId: 167,
          name: "PlayStation 5",
          slug: "ps5",
          abbreviation: "PS5",
          alternativeName: null,
          generation: 9,
          platformFamily: null,
          platformType: null,
          checksum: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGetPlatformsForGame.mockResolvedValue({
        success: true,
        data: {
          supportedPlatforms: mockPlatforms,
          otherPlatforms: [],
        },
      });

      const result = await getPlatformsHandler(params, mockContext);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.status).toBe(200);
        expect(result.data.supportedPlatforms).toEqual(mockPlatforms);
        expect(result.data.otherPlatforms).toEqual([]);
      }
      expect(mockGetPlatformsForGame).toHaveBeenCalledWith(params.igdbId);
    });
  });

  describe("Service Integration", () => {
    const validIgdbId = 12345;

    it("should call PlatformService with correct parameters", async () => {
      mockGetPlatformsForGame.mockResolvedValue({
        success: true,
        data: {
          supportedPlatforms: [],
          otherPlatforms: [],
        },
      });

      await getPlatformsHandler({ igdbId: validIgdbId }, mockContext);

      expect(mockGetPlatformsForGame).toHaveBeenCalledWith(validIgdbId);
      expect(mockGetPlatformsForGame).toHaveBeenCalledTimes(1);
    });

    it("should return success when service succeeds", async () => {
      const mockSupportedPlatforms: Platform[] = [
        {
          id: "plat1",
          igdbId: 167,
          name: "PlayStation 5",
          slug: "ps5",
          abbreviation: "PS5",
          alternativeName: null,
          generation: 9,
          platformFamily: null,
          platformType: null,
          checksum: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockOtherPlatforms: Platform[] = [
        {
          id: "plat2",
          igdbId: 6,
          name: "PC",
          slug: "pc",
          abbreviation: "PC",
          alternativeName: null,
          generation: null,
          platformFamily: null,
          platformType: null,
          checksum: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGetPlatformsForGame.mockResolvedValue({
        success: true,
        data: {
          supportedPlatforms: mockSupportedPlatforms,
          otherPlatforms: mockOtherPlatforms,
        },
      });

      const result = await getPlatformsHandler(
        { igdbId: validIgdbId },
        mockContext
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.status).toBe(200);
        expect(result.data.supportedPlatforms).toEqual(mockSupportedPlatforms);
        expect(result.data.otherPlatforms).toEqual(mockOtherPlatforms);
      }
    });

    it("should return error when service fails", async () => {
      mockGetPlatformsForGame.mockResolvedValue({
        success: false,
        error: "Database connection failed",
      });

      const result = await getPlatformsHandler(
        { igdbId: validIgdbId },
        mockContext
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(500);
        expect(result.error).toBe("Database connection failed");
      }
    });

    it("should return 404 when game not found", async () => {
      mockGetPlatformsForGame.mockResolvedValue({
        success: false,
        error: "Game not found",
      });

      const result = await getPlatformsHandler(
        { igdbId: validIgdbId },
        mockContext
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(404);
        expect(result.error).toBe("Game not found");
      }
    });

    it("should handle empty platform lists", async () => {
      mockGetPlatformsForGame.mockResolvedValue({
        success: true,
        data: {
          supportedPlatforms: [],
          otherPlatforms: [],
        },
      });

      const result = await getPlatformsHandler(
        { igdbId: validIgdbId },
        mockContext
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.status).toBe(200);
        expect(result.data.supportedPlatforms).toEqual([]);
        expect(result.data.otherPlatforms).toEqual([]);
      }
    });
  });

  describe("Error Handling", () => {
    const validIgdbId = 12345;

    it("should return 500 when service returns generic error", async () => {
      mockGetPlatformsForGame.mockResolvedValue({
        success: false,
        error: "Failed to fetch platforms from database",
      });

      const result = await getPlatformsHandler(
        { igdbId: validIgdbId },
        mockContext
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(500);
        expect(result.error).toContain("Failed to fetch platforms");
      }
    });
  });

  describe("Response Structure", () => {
    const validIgdbId = 12345;

    it("should return correct structure for successful response", async () => {
      const mockData = {
        supportedPlatforms: [
          {
            id: "plat1",
            igdbId: 167,
            name: "PlayStation 5",
            slug: "ps5",
            abbreviation: "PS5",
            alternativeName: null,
            generation: 9,
            platformFamily: null,
            platformType: null,
            checksum: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        otherPlatforms: [],
      };

      mockGetPlatformsForGame.mockResolvedValue({
        success: true,
        data: mockData,
      });

      const result = await getPlatformsHandler(
        { igdbId: validIgdbId },
        mockContext
      );

      expect(result).toMatchObject({
        success: true,
        status: 200,
        data: mockData,
      });
    });

    it("should return correct structure for error response", async () => {
      mockGetPlatformsForGame.mockResolvedValue({
        success: false,
        error: "Service error",
      });

      const result = await getPlatformsHandler(
        { igdbId: validIgdbId },
        mockContext
      );

      expect(result).toMatchObject({
        success: false,
        status: 500,
        error: "Service error",
      });
    });
  });
});
