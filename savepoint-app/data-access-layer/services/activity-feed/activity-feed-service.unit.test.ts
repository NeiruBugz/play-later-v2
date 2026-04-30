import {
  findActivityByUserId,
  findFeedForUser,
  findPopularFeed,
} from "@/data-access-layer/repository";

import { ActivityFeedService } from "./activity-feed-service";

vi.mock("@/data-access-layer/repository", () => ({
  findActivityByUserId: vi.fn(),
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
  let mockFindActivityByUserId: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new ActivityFeedService();
    mockFindFeedForUser = vi.mocked(findFeedForUser);
    mockFindPopularFeed = vi.mocked(findPopularFeed);
    mockFindActivityByUserId = vi.mocked(findActivityByUserId);
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

        expect(result.items[0].eventType).toBe("LIBRARY_ADD");
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

        expect(result.items[0].eventType).toBe("STATUS_CHANGE");
      });

      it("should use activityTimestamp as the item timestamp", async () => {
        const activityTimestamp = new Date("2024-03-20T09:30:00Z");
        const row = buildFeedItemRow({ activityTimestamp });
        mockFindFeedForUser.mockResolvedValue({
          items: [row],
          nextCursor: null,
        });

        const result = await service.getFeedForUser("user-123");

        expect(result.items[0].timestamp).toEqual(activityTimestamp);
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

        const item = result.items[0];
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

        expect(result.nextCursor).toEqual({
          timestamp: cursorDate.toISOString(),
          id: "99",
        });
      });

      it("should return null nextCursor when repository returns null cursor", async () => {
        mockFindFeedForUser.mockResolvedValue({ items: [], nextCursor: null });

        const result = await service.getFeedForUser("user-123");

        expect(result.nextCursor).toBeNull();
      });
    });

    describe("error handling", () => {
      it("should propagate errors thrown by the repository", async () => {
        mockFindFeedForUser.mockRejectedValue(new Error("DB unavailable"));

        await expect(service.getFeedForUser("user-123")).rejects.toThrow(
          "DB unavailable"
        );
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

        expect(result.items[0].eventType).toBe("LIBRARY_ADD");
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

        expect(result.items[0].eventType).toBe("STATUS_CHANGE");
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

        expect(result.nextCursor).toEqual({
          timestamp: cursorDate.toISOString(),
          id: "7",
        });
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
      it("should propagate errors thrown by the repository", async () => {
        mockFindPopularFeed.mockRejectedValue(new Error("Network failure"));

        await expect(service.getPopularFeed()).rejects.toThrow(
          "Network failure"
        );
      });
    });
  });

  describe("getUserActivity", () => {
    const userId = "user-999";

    describe("success path", () => {
      it("should return mapped paginated feed when repository resolves", async () => {
        const row = buildFeedItemRow({ statusChangedAt: null });
        mockFindActivityByUserId.mockResolvedValue({
          items: [row],
          nextCursor: null,
        });

        const result = await service.getUserActivity(userId);

        expect(result.items).toHaveLength(1);
        expect(result.nextCursor).toBeNull();
      });

      it("should pass userId, parsed cursor, and limit to findActivityByUserId", async () => {
        mockFindActivityByUserId.mockResolvedValue({
          items: [],
          nextCursor: null,
        });

        const cursor = { timestamp: "2024-03-01T00:00:00.000Z", id: "77" };
        await service.getUserActivity(userId, cursor, 10);

        expect(mockFindActivityByUserId).toHaveBeenCalledWith(
          userId,
          { timestamp: new Date("2024-03-01T00:00:00.000Z"), id: 77 },
          10
        );
      });

      it("should use default limit of 20 when no limit argument is provided", async () => {
        mockFindActivityByUserId.mockResolvedValue({
          items: [],
          nextCursor: null,
        });

        await service.getUserActivity(userId);

        expect(mockFindActivityByUserId).toHaveBeenCalledWith(
          userId,
          undefined,
          20
        );
      });

      it("should pass undefined cursor to repository when no cursor is provided", async () => {
        mockFindActivityByUserId.mockResolvedValue({
          items: [],
          nextCursor: null,
        });

        await service.getUserActivity(userId);

        expect(mockFindActivityByUserId).toHaveBeenCalledWith(
          userId,
          undefined,
          20
        );
      });

      it("should convert nextCursor Date timestamp and number id to strings", async () => {
        const cursorDate = new Date("2025-01-10T08:00:00.000Z");
        mockFindActivityByUserId.mockResolvedValue({
          items: [],
          nextCursor: { timestamp: cursorDate, id: 55 },
        });

        const result = await service.getUserActivity(userId);

        expect(result.nextCursor).toEqual({
          timestamp: cursorDate.toISOString(),
          id: "55",
        });
      });

      it("should return null nextCursor when repository returns null", async () => {
        mockFindActivityByUserId.mockResolvedValue({
          items: [],
          nextCursor: null,
        });

        const result = await service.getUserActivity(userId);

        expect(result.nextCursor).toBeNull();
      });
    });

    describe("error handling", () => {
      it("should propagate errors thrown by the repository", async () => {
        mockFindActivityByUserId.mockRejectedValue(new Error("DB timeout"));

        await expect(service.getUserActivity(userId)).rejects.toThrow(
          "DB timeout"
        );
      });
    });
  });
});
