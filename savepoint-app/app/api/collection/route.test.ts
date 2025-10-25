import * as authModule from "@/auth";
import { CollectionService } from "@/data-access-layer/services";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

vi.mock("@/data-access-layer/services", () => ({
  CollectionService: vi.fn(),
}));

vi.mock("@/shared/lib/app/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe("GET /api/collection", () => {
  let mockGetServerUserId: ReturnType<typeof vi.fn>;
  let mockGetCollection: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerUserId = vi.mocked(authModule.getServerUserId);
    mockGetCollection = vi.fn();

    vi.mocked(CollectionService).mockImplementation(
      () =>
        ({
          getCollection: mockGetCollection,
        }) as unknown as CollectionService
    );
  });

  const createRequest = (params: Record<string, string> | null) => {
    const baseUrl = "http://localhost:3000/api/collection";
    if (!params || Object.keys(params).length === 0) {
      return new Request(baseUrl);
    }

    const searchParams = new URLSearchParams(params);
    return new Request(`${baseUrl}?${searchParams.toString()}`);
  };

  describe("given user is not authenticated", () => {
    it("should return 401 Unauthorized", async () => {
      mockGetServerUserId.mockResolvedValue(null);

      const request = createRequest({ search: "zelda" });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should not call collection service", async () => {
      mockGetServerUserId.mockResolvedValue(null);

      const request = createRequest({ search: "zelda" });
      await GET(request);

      expect(mockGetCollection).not.toHaveBeenCalled();
    });
  });

  describe("given request has no query parameters", () => {
    it("should accept empty filters", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest(null);
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should call service with userId only", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest(null);
      await GET(request);

      expect(mockGetCollection).toHaveBeenCalledWith({
        userId: "user-123",
        platform: "",
        status: undefined,
        search: "",
        page: 1,
      });
    });
  });

  describe("given request includes search parameter", () => {
    it("should parse search query parameter", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest({ search: "zelda" });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should pass search to collection service", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest({ search: "zelda" });
      await GET(request);

      expect(mockGetCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          search: "zelda",
        })
      );
    });
  });

  describe("given request includes status parameter", () => {
    it("should parse status parameter", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest({ status: "CURRENTLY_EXPLORING" });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should pass status to collection service", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest({ status: "CURRENTLY_EXPLORING" });
      await GET(request);

      expect(mockGetCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          status: "CURRENTLY_EXPLORING",
        })
      );
    });
  });

  describe("given request includes platform parameter", () => {
    it("should parse platform parameter", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest({ platform: "PC" });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should pass platform to collection service", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest({ platform: "PC" });
      await GET(request);

      expect(mockGetCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          platform: "PC",
        })
      );
    });
  });

  describe("given request includes page parameter", () => {
    it("should parse page parameter", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest({ page: "2" });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should pass page to collection service", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest({ page: "2" });
      await GET(request);

      expect(mockGetCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          page: 2,
        })
      );
    });
  });

  describe("given request has invalid query parameters", () => {
    it("should return 400 Bad Request", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");

      const request = createRequest({ page: "invalid" });
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it("should return error message about invalid parameters", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");

      const request = createRequest({ page: "invalid" });
      const response = await GET(request);
      const data = await response.json();

      expect(data.error).toBe("Invalid query parameters");
    });

    it("should not call collection service", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");

      const request = createRequest({ page: "invalid" });
      await GET(request);

      expect(mockGetCollection).not.toHaveBeenCalled();
    });
  });

  describe("given collection service returns success", () => {
    it("should return 200 OK", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest(null);
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should return collection array in response", async () => {
      const mockCollection = [
        {
          game: {
            id: "1",
            title: "Game 1",
            coverImage: null,
            releaseDate: null,
          },
          libraryItems: [],
        },
      ];

      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: mockCollection, count: 1 },
      });

      const request = createRequest(null);
      const response = await GET(request);
      const data = await response.json();

      expect(data.collection).toEqual(mockCollection);
    });

    it("should return count in response", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 42 },
      });

      const request = createRequest(null);
      const response = await GET(request);
      const data = await response.json();

      expect(data.count).toBe(42);
    });
  });

  describe("given collection service returns failure", () => {
    it("should return 500 Internal Server Error", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const request = createRequest(null);
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it("should return error message from service", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: false,
        error: "Failed to fetch collection",
      });

      const request = createRequest(null);
      const response = await GET(request);
      const data = await response.json();

      expect(data.error).toBe("Failed to fetch collection");
    });
  });

  describe("given request with special characters in search", () => {
    it("should handle URL-encoded parameters correctly", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest({ search: "Pokémon: Let's Go!" });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "Pokémon: Let's Go!",
        })
      );
    });
  });

  describe("given multiple filters are provided", () => {
    it("should pass all filters to service simultaneously", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest({
        search: "zelda",
        status: "CURIOUS_ABOUT",
        platform: "Nintendo Switch",
        page: "1",
      });
      await GET(request);

      expect(mockGetCollection).toHaveBeenCalledWith({
        userId: "user-123",
        search: "zelda",
        status: "CURIOUS_ABOUT",
        platform: "Nintendo Switch",
        page: 1,
      });
    });
  });

  describe("given page number exceeds maximum", () => {
    it("should return error when service validates pagination", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: false,
        error: "Page number exceeds maximum allowed value",
      });

      const request = createRequest({ page: "9999" });
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe("given empty query parameters", () => {
    it("should use default values for empty strings", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest({
        search: "",
        status: "",
        platform: "",
      });
      await GET(request);

      expect(mockGetCollection).toHaveBeenCalledWith({
        userId: "user-123",
        platform: "",
        status: "",
        search: "",
        page: 1,
      });
    });
  });

  describe("given status with invalid enum value", () => {
    it("should still pass to service for validation", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest({ status: "INVALID_STATUS" });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "INVALID_STATUS",
        })
      );
    });
  });

  describe("given request with case-sensitive filters", () => {
    it("should preserve case for search query", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest({ search: "Zelda" });
      await GET(request);

      expect(mockGetCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "Zelda",
        })
      );
    });

    it("should preserve case for platform", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest({ platform: "PlayStation 5" });
      await GET(request);

      expect(mockGetCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: "PlayStation 5",
        })
      );
    });
  });

  describe("given page number is zero", () => {
    it("should pass zero to service for validation", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest({ page: "0" });
      await GET(request);

      expect(mockGetCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 0,
        })
      );
    });
  });

  describe("given page number is negative", () => {
    it("should pass negative number to service for validation", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: { collection: [], count: 0 },
      });

      const request = createRequest({ page: "-5" });
      await GET(request);

      expect(mockGetCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          page: -5,
        })
      );
    });
  });

  describe("given collection data is undefined", () => {
    it("should handle undefined collection gracefully", async () => {
      mockGetServerUserId.mockResolvedValue("user-123");
      mockGetCollection.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const request = createRequest(null);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.collection).toBeUndefined();
      expect(data.count).toBeUndefined();
    });
  });
});
