import { ActivityFeedService } from "@/data-access-layer/services/activity-feed/activity-feed-service";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FeedCursor, FeedItem } from "@/features/social/types";

import type { RequestContext } from "../types";
import { activityFeedHandler } from "./activity-feed-handler";

vi.mock("@/data-access-layer/services/activity-feed/activity-feed-service");

const mockActivityFeedService = vi.mocked(ActivityFeedService);

const mockFeedItem: FeedItem = {
  id: "1",
  eventType: "LIBRARY_ADD",
  status: "WISHLIST",
  timestamp: new Date("2025-01-01T12:00:00.000Z"),
  user: {
    id: "user-1",
    name: "Test User",
    username: "testuser",
    image: null,
  },
  game: {
    id: "game-1",
    title: "Elden Ring",
    coverImage: "https://example.com/elden-ring.jpg",
    slug: "elden-ring",
  },
};

const mockNextCursor: FeedCursor = {
  timestamp: "2025-01-01T11:00:00.000Z",
  id: "2",
};

describe("activityFeedHandler", () => {
  const mockContext: RequestContext = {
    ip: "127.0.0.1",
    headers: new Headers(),
    url: new URL("http://localhost/api/social/feed"),
  };

  const validUserId = "user-abc-123";

  let mockGetFeedForUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetFeedForUser = vi.fn();

    mockActivityFeedService.mockImplementation(function () {
      return {
        getFeedForUser: mockGetFeedForUser,
      } as any;
    });
  });

  describe("Success Path", () => {
    it("should return feed items for authenticated user", async () => {
      mockGetFeedForUser.mockResolvedValue({
        success: true,
        data: { items: [mockFeedItem], nextCursor: null },
      });

      const result = await activityFeedHandler(
        { userId: validUserId },
        mockContext
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.status).toBe(200);
        expect(result.data.items).toHaveLength(1);
        expect(result.data.items[0]).toEqual(mockFeedItem);
        expect(result.data.nextCursor).toBeNull();
      }
    });

    it("should return nextCursor when there are more items", async () => {
      mockGetFeedForUser.mockResolvedValue({
        success: true,
        data: { items: [mockFeedItem], nextCursor: mockNextCursor },
      });

      const result = await activityFeedHandler(
        { userId: validUserId },
        mockContext
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nextCursor).toEqual(mockNextCursor);
      }
    });

    it("should return empty items array when feed is empty", async () => {
      mockGetFeedForUser.mockResolvedValue({
        success: true,
        data: { items: [], nextCursor: null },
      });

      const result = await activityFeedHandler(
        { userId: validUserId },
        mockContext
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.status).toBe(200);
        expect(result.data.items).toHaveLength(0);
        expect(result.data.nextCursor).toBeNull();
      }
    });
  });

  describe("Pagination", () => {
    it("should use default limit of 20 when limit is not provided", async () => {
      mockGetFeedForUser.mockResolvedValue({
        success: true,
        data: { items: [], nextCursor: null },
      });

      await activityFeedHandler({ userId: validUserId }, mockContext);

      expect(mockGetFeedForUser).toHaveBeenCalledWith(
        validUserId,
        undefined,
        20
      );
    });

    it("should pass parsed limit to service when limit is provided", async () => {
      mockGetFeedForUser.mockResolvedValue({
        success: true,
        data: { items: [], nextCursor: null },
      });

      await activityFeedHandler(
        { userId: validUserId, limit: "10" },
        mockContext
      );

      expect(mockGetFeedForUser).toHaveBeenCalledWith(
        validUserId,
        undefined,
        10
      );
    });

    it("should pass parsed cursor to service when cursor is provided", async () => {
      const cursorPayload = {
        timestamp: "2025-01-01T12:00:00.000Z",
        id: "42",
      };

      mockGetFeedForUser.mockResolvedValue({
        success: true,
        data: { items: [], nextCursor: null },
      });

      await activityFeedHandler(
        {
          userId: validUserId,
          cursor: JSON.stringify(cursorPayload),
        },
        mockContext
      );

      expect(mockGetFeedForUser).toHaveBeenCalledWith(
        validUserId,
        cursorPayload,
        20
      );
    });

    it("should pass both cursor and limit to service when both are provided", async () => {
      const cursorPayload = {
        timestamp: "2025-01-01T12:00:00.000Z",
        id: "99",
      };

      mockGetFeedForUser.mockResolvedValue({
        success: true,
        data: { items: [], nextCursor: null },
      });

      await activityFeedHandler(
        {
          userId: validUserId,
          cursor: JSON.stringify(cursorPayload),
          limit: "5",
        },
        mockContext
      );

      expect(mockGetFeedForUser).toHaveBeenCalledWith(
        validUserId,
        cursorPayload,
        5
      );
    });
  });

  describe("Cursor Validation", () => {
    it("should return 400 for invalid JSON cursor", async () => {
      const result = await activityFeedHandler(
        { userId: validUserId, cursor: "not-valid-json{{{" },
        mockContext
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error).toContain("cursor");
      }
      expect(mockGetFeedForUser).not.toHaveBeenCalled();
    });

    it("should return 400 for cursor missing required fields", async () => {
      const result = await activityFeedHandler(
        {
          userId: validUserId,
          cursor: JSON.stringify({ timestamp: "2025-01-01T12:00:00.000Z" }),
        },
        mockContext
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
      }
      expect(mockGetFeedForUser).not.toHaveBeenCalled();
    });

    it("should return 400 for cursor with invalid timestamp format", async () => {
      const result = await activityFeedHandler(
        {
          userId: validUserId,
          cursor: JSON.stringify({ timestamp: "not-a-date", id: "1" }),
        },
        mockContext
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
      }
      expect(mockGetFeedForUser).not.toHaveBeenCalled();
    });

    it("should return 400 for cursor with empty id", async () => {
      const result = await activityFeedHandler(
        {
          userId: validUserId,
          cursor: JSON.stringify({
            timestamp: "2025-01-01T12:00:00.000Z",
            id: "",
          }),
        },
        mockContext
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
      }
      expect(mockGetFeedForUser).not.toHaveBeenCalled();
    });
  });

  describe("Limit Validation", () => {
    it("should return 400 when limit is 0", async () => {
      const result = await activityFeedHandler(
        { userId: validUserId, limit: "0" },
        mockContext
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
      }
      expect(mockGetFeedForUser).not.toHaveBeenCalled();
    });

    it("should return 400 when limit is negative", async () => {
      const result = await activityFeedHandler(
        { userId: validUserId, limit: "-5" },
        mockContext
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
      }
      expect(mockGetFeedForUser).not.toHaveBeenCalled();
    });

    it("should return 400 when limit exceeds maximum of 50", async () => {
      const result = await activityFeedHandler(
        { userId: validUserId, limit: "51" },
        mockContext
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
      }
      expect(mockGetFeedForUser).not.toHaveBeenCalled();
    });

    it("should accept limit at maximum boundary of 50", async () => {
      mockGetFeedForUser.mockResolvedValue({
        success: true,
        data: { items: [], nextCursor: null },
      });

      const result = await activityFeedHandler(
        { userId: validUserId, limit: "50" },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(mockGetFeedForUser).toHaveBeenCalledWith(
        validUserId,
        undefined,
        50
      );
    });

    it("should accept limit at minimum boundary of 1", async () => {
      mockGetFeedForUser.mockResolvedValue({
        success: true,
        data: { items: [], nextCursor: null },
      });

      const result = await activityFeedHandler(
        { userId: validUserId, limit: "1" },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(mockGetFeedForUser).toHaveBeenCalledWith(
        validUserId,
        undefined,
        1
      );
    });
  });

  describe("Error Handling", () => {
    it("should return 500 when ActivityFeedService fails", async () => {
      mockGetFeedForUser.mockResolvedValue({
        success: false,
        error: "Database connection failed",
      });

      const result = await activityFeedHandler(
        { userId: validUserId },
        mockContext
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(500);
        expect(result.error).toBe("Database connection failed");
      }
    });

    it("should propagate the service error message", async () => {
      mockGetFeedForUser.mockResolvedValue({
        success: false,
        error: "Failed to fetch user feed",
      });

      const result = await activityFeedHandler(
        { userId: validUserId },
        mockContext
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to fetch user feed");
      }
    });
  });
});
