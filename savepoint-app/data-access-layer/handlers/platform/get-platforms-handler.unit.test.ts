import type { Platform } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPlatformsForLibraryModal } from "@/features/manage-library-entry/use-cases";

import type { RequestContext } from "../types";
import { getPlatformsHandler } from "./get-platforms-handler";

vi.mock("@/features/manage-library-entry/use-cases");

const mockGetPlatformsForLibraryModal = vi.mocked(getPlatformsForLibraryModal);

describe("getPlatformsHandler", () => {
  const mockContext: RequestContext = {
    ip: "192.168.1.1",
    headers: new Headers(),
    url: new URL("http://localhost/api/games/12345/platforms"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
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
      expect(mockGetPlatformsForLibraryModal).not.toHaveBeenCalled();
    });

    it("should reject invalid igdbId (zero)", async () => {
      const params = { igdbId: 0 };

      const result = await getPlatformsHandler(params, mockContext);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error).toContain("positive integer");
      }
      expect(mockGetPlatformsForLibraryModal).not.toHaveBeenCalled();
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

      mockGetPlatformsForLibraryModal.mockResolvedValue({
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
      expect(mockGetPlatformsForLibraryModal).toHaveBeenCalledWith({
        igdbId: params.igdbId,
      });
    });
  });

  describe("Service Integration", () => {
    const validIgdbId = 12345;

    it("should call getPlatformsForLibraryModal with correct parameters", async () => {
      mockGetPlatformsForLibraryModal.mockResolvedValue({
        success: true,
        data: {
          supportedPlatforms: [],
          otherPlatforms: [],
        },
      });

      await getPlatformsHandler({ igdbId: validIgdbId }, mockContext);

      expect(mockGetPlatformsForLibraryModal).toHaveBeenCalledWith({
        igdbId: validIgdbId,
      });
      expect(mockGetPlatformsForLibraryModal).toHaveBeenCalledTimes(1);
    });

    it("should return success when use case succeeds", async () => {
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

      mockGetPlatformsForLibraryModal.mockResolvedValue({
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

    it("should return error when use case fails", async () => {
      mockGetPlatformsForLibraryModal.mockResolvedValue({
        success: false,
        error: "Use case error",
      });

      const result = await getPlatformsHandler(
        { igdbId: validIgdbId },
        mockContext
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(500);
        expect(result.error).toBe("Use case error");
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

      mockGetPlatformsForLibraryModal.mockResolvedValue({
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
      mockGetPlatformsForLibraryModal.mockResolvedValue({
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
