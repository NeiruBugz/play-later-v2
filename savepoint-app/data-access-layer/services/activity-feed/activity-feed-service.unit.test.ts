import {
  findFeedForUser,
  findPopularFeed,
} from "@/data-access-layer/repository";

import { ServiceErrorCode } from "../types";
import { ActivityFeedService } from "./activity-feed-service";

vi.mock("@/data-access-layer/repository", () => ({
  findFeedForUser: vi.fn(),
  findPopularFeed: vi.fn(),
}));

const buildFeedItemRow = (
  overrides: {
    statusChangedAt?: Date | null;
    activityTimestamp?: Date;
  } = {}
) => ({
  id: 1,
  status: "PLAYING",
  createdAt: new Date("2024-01-01T10:00:00Z"),
  statusChangedAt:
    overrides.statusChangedAt !== undefined ? overrides.statusChangedAt : null,
  activityTimestamp:
    overrides.activityTimestamp ?? new Date("2024-01-15T12:00:00Z"),
  userId: "user-123",
  gameId: "game-456",
  userName: "Test User",
  userUsername: "testuser",
  userImage: "https://example.com/avatar.jpg",
  gameTitle: "Test Game",
  gameCoverImage: "https://example.com/cover.jpg",
  gameSlug: "test-game",
});

describe("ActivityFeedService", () => {
  let service: ActivityFeedService;
  let mockFindFeedForUser: ReturnType<typeof vi.fn>;
  let mockFindPopularFeed: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ActivityFeedService();
    mockFindFeedForUser = vi.mocked(findFeedForUser);
    mockFindPopularFeed = vi.mocked(findPopularFeed);
  });

  describe("getFeedForUser", () => {
    describe("event type detection", () => {
      it("should map statusChangedAt: null to eventType LIBRARY_ADD", async () => {
        const row = buildFeedItemRow({ statusChangedAt: null });
        mockFindFeedForUser.mockResolvedValue({
          items: [row],
          nextCursor: null,
        });

        const result = await service.getFeedForUser("user-123");

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.items[0].eventType).toBe("LIBRARY_ADD");
        }
      });

      it("should map statusChangedAt: [date] to eventType STATUS_CHANGE", async () => {
        const row = buildFeedItemRow({
          statusChangedAt: new Date("2024-01-10T08:00:00Z"),
        });
        mockFindFeedForUser.mockResolvedValue({
          items: [row],
          nextCursor: null,
        });

        const result = await service.getFeedForUser("user-123");

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.items[0].eventType).toBe("STATUS_CHANGE");
        }
      });

      it("should use activityTimestamp as the item timestamp", async () => {
        const activityTimestamp = new Date("2024-03-20T09:30:00Z");
        const row = buildFeedItemRow({ activityTimestamp });
        mockFindFeedForUser.mockResolvedValue({
          items: [row],
          nextCursor: null,
        });

        const result = await service.getFeedForUser("user-123");

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.items[0].timestamp).toEqual(activityTimestamp);
        }
      });

      it("should map all row fields onto the feed item correctly", async () => {
        const row = buildFeedItemRow({
          statusChangedAt: new Date("2024-01-10T08:00:00Z"),
        });
        mockFindFeedForUser.mockResolvedValue({
          items: [row],
          nextCursor: null,
        });

        const result = await service.getFeedForUser("user-123");

        expect(result.success).toBe(true);
        if (result.success) {
          const item = result.data.items[0];
          expect(item.id).toBe(String(row.id));
          expect(item.status).toBe(row.status);
          expect(item.user).toEqual({
            id: row.userId,
            name: row.userName,
            username: row.userUsername,
            image: row.userImage,
          });
          expect(item.game).toEqual({
            id: row.gameId,
            title: row.gameTitle,
            coverImage: row.gameCoverImage,
            slug: row.gameSlug,
          });
        }
      });
    });

    describe("repository call forwarding", () => {
      it("should pass userId, cursor, and limit to the repository", async () => {
        mockFindFeedForUser.mockResolvedValue({ items: [], nextCursor: null });

        const cursor = {
          timestamp: "2024-02-01T00:00:00.000Z",
          id: "42",
        };

        await service.getFeedForUser("user-abc", cursor, 10);

        expect(mockFindFeedForUser).toHaveBeenCalledWith(
          "user-abc",
          { timestamp: new Date("2024-02-01T00:00:00.000Z"), id: 42 },
          10
        );
      });

      it("should use default limit of 20 when no limit is provided", async () => {
        mockFindFeedForUser.mockResolvedValue({ items: [], nextCursor: null });

        await service.getFeedForUser("user-abc");

        expect(mockFindFeedForUser).toHaveBeenCalledWith(
          "user-abc",
          undefined,
          20
        );
      });

      it("should pass undefined cursor to repository when no cursor is provided", async () => {
        mockFindFeedForUser.mockResolvedValue({ items: [], nextCursor: null });

        await service.getFeedForUser("user-abc");

        expect(mockFindFeedForUser).toHaveBeenCalledWith(
          "user-abc",
          undefined,
          20
        );
      });
    });

    describe("nextCursor mapping", () => {
      it("should convert Date timestamp and number id in nextCursor to strings", async () => {
        const cursorDate = new Date("2024-06-15T18:00:00.000Z");
        mockFindFeedForUser.mockResolvedValue({
          items: [],
          nextCursor: { timestamp: cursorDate, id: 99 },
        });

        const result = await service.getFeedForUser("user-123");

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.nextCursor).toEqual({
            timestamp: cursorDate.toISOString(),
            id: "99",
          });
        }
      });

      it("should return null nextCursor when repository returns null cursor", async () => {
        mockFindFeedForUser.mockResolvedValue({ items: [], nextCursor: null });

        const result = await service.getFeedForUser("user-123");

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.nextCursor).toBeNull();
        }
      });
    });

    describe("error handling", () => {
      it("should return INTERNAL_ERROR when repository throws", async () => {
        mockFindFeedForUser.mockRejectedValue(new Error("DB unavailable"));

        const result = await service.getFeedForUser("user-123");

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("DB unavailable");
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });
    });
  });

  describe("getPopularFeed", () => {
    describe("event type detection", () => {
      it("should map statusChangedAt: null to eventType LIBRARY_ADD", async () => {
        const row = buildFeedItemRow({ statusChangedAt: null });
        mockFindPopularFeed.mockResolvedValue({
          items: [row],
          nextCursor: null,
        });

        const result = await service.getPopularFeed();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.items[0].eventType).toBe("LIBRARY_ADD");
        }
      });

      it("should map statusChangedAt: [date] to eventType STATUS_CHANGE", async () => {
        const row = buildFeedItemRow({
          statusChangedAt: new Date("2024-01-10T08:00:00Z"),
        });
        mockFindPopularFeed.mockResolvedValue({
          items: [row],
          nextCursor: null,
        });

        const result = await service.getPopularFeed();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.items[0].eventType).toBe("STATUS_CHANGE");
        }
      });
    });

    describe("nextCursor mapping", () => {
      it("should convert Date timestamp and number id in nextCursor to strings", async () => {
        const cursorDate = new Date("2024-07-01T00:00:00.000Z");
        mockFindPopularFeed.mockResolvedValue({
          items: [],
          nextCursor: { timestamp: cursorDate, id: 7 },
        });

        const result = await service.getPopularFeed();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.nextCursor).toEqual({
            timestamp: cursorDate.toISOString(),
            id: "7",
          });
        }
      });
    });

    describe("repository call forwarding", () => {
      it("should pass cursor and limit to the repository", async () => {
        mockFindPopularFeed.mockResolvedValue({ items: [], nextCursor: null });

        const cursor = { timestamp: "2024-05-01T00:00:00.000Z", id: "5" };
        await service.getPopularFeed("user-1", cursor, 15);

        expect(mockFindPopularFeed).toHaveBeenCalledWith(
          "user-1",
          { timestamp: new Date("2024-05-01T00:00:00.000Z"), id: 5 },
          15
        );
      });
    });

    describe("error handling", () => {
      it("should return INTERNAL_ERROR when repository throws", async () => {
        mockFindPopularFeed.mockRejectedValue(new Error("Network failure"));

        const result = await service.getPopularFeed();

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Network failure");
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });
    });
  });
});
