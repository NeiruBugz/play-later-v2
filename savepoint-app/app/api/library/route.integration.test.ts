import { setupDatabase } from "@/test/setup/database";
import {
  createGame,
  createLibraryItem,
  createUser,
} from "@/test/setup/db-factories";
import { LibraryItemStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { GET } from "./route";

// Mock authentication
vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

describe("GET /api/library - Integration Tests", () => {
  let testUserId: string;
  let otherUserId: string;

  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    // Create test users
    const user = await createUser({
      email: "test@example.com",
      username: "testuser",
    });
    testUserId = user.id;

    const otherUser = await createUser({
      email: "other@example.com",
      username: "otheruser",
    });
    otherUserId = otherUser.id;

    // Mock getServerUserId to return test user by default
    const { getServerUserId } = await import("@/auth");
    vi.mocked(getServerUserId).mockResolvedValue(testUserId);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 when not authenticated", async () => {
      // Arrange
      const { getServerUserId } = await import("@/auth");
      vi.mocked(getServerUserId).mockResolvedValue(undefined);

      const url = "http://localhost:6060/api/library";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Authentication required");
    });

    it("should return 200 when authenticated", async () => {
      // Arrange
      const url = "http://localhost:6060/api/library";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it("should return empty array when authenticated user has no library items", async () => {
      // Arrange
      const url = "http://localhost:6060/api/library";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });
  });

  describe("Query Parameter Handling", () => {
    it("should parse status query param correctly", async () => {
      // Arrange
      const game = await createGame({ title: "Test Game" });
      await createLibraryItem({
        userId: testUserId,
        gameId: game.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });
      await createLibraryItem({
        userId: testUserId,
        gameId: (await createGame({ title: "Another Game" })).id,
        status: LibraryItemStatus.WISHLIST,
      });

      const url = "http://localhost:6060/api/library?status=CURIOUS_ABOUT";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe("CURIOUS_ABOUT");
      expect(data.data[0].game.title).toBe("Test Game");
    });

    it("should parse platform query param correctly", async () => {
      // Arrange
      const game1 = await createGame({ title: "PC Game" });
      const game2 = await createGame({ title: "PS5 Game" });

      await createLibraryItem({
        userId: testUserId,
        gameId: game1.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
      });
      await createLibraryItem({
        userId: testUserId,
        gameId: game2.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PlayStation 5",
      });

      const url = "http://localhost:6060/api/library?platform=PlayStation%205";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].platform).toBe("PlayStation 5");
      expect(data.data[0].game.title).toBe("PS5 Game");
    });

    it("should parse search query param correctly", async () => {
      // Arrange
      const game1 = await createGame({ title: "The Legend of Zelda" });
      const game2 = await createGame({ title: "Final Fantasy VII" });
      const game3 = await createGame({ title: "Zelda: Breath of the Wild" });

      await createLibraryItem({
        userId: testUserId,
        gameId: game1.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });
      await createLibraryItem({
        userId: testUserId,
        gameId: game2.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });
      await createLibraryItem({
        userId: testUserId,
        gameId: game3.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const url = "http://localhost:6060/api/library?search=zelda";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(
        data.data.every((item: any) =>
          item.game.title.toLowerCase().includes("zelda")
        )
      ).toBe(true);
    });

    it("should parse sortBy and sortOrder params correctly", async () => {
      // Arrange
      const game1 = await createGame({
        title: "Old Game",
        releaseDate: new Date("2020-01-01"),
      });
      const game2 = await createGame({
        title: "New Game",
        releaseDate: new Date("2024-01-01"),
      });
      const game3 = await createGame({
        title: "Mid Game",
        releaseDate: new Date("2022-01-01"),
      });

      await createLibraryItem({
        userId: testUserId,
        gameId: game1.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });
      await createLibraryItem({
        userId: testUserId,
        gameId: game2.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });
      await createLibraryItem({
        userId: testUserId,
        gameId: game3.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const url =
        "http://localhost:6060/api/library?sortBy=releaseDate&sortOrder=asc";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(3);
      expect(data.data[0].game.title).toBe("Old Game");
      expect(data.data[1].game.title).toBe("Mid Game");
      expect(data.data[2].game.title).toBe("New Game");
    });

    it("should handle missing/undefined params (only userId provided)", async () => {
      // Arrange
      const game = await createGame({ title: "Test Game" });
      await createLibraryItem({
        userId: testUserId,
        gameId: game.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const url = "http://localhost:6060/api/library";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
    });

    it("should handle multiple filters simultaneously", async () => {
      // Arrange
      const game1 = await createGame({ title: "Zelda on Switch" });
      const game2 = await createGame({ title: "Zelda on PC" });
      const game3 = await createGame({ title: "Mario on Switch" });

      await createLibraryItem({
        userId: testUserId,
        gameId: game1.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "Nintendo Switch",
      });
      await createLibraryItem({
        userId: testUserId,
        gameId: game2.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
      });
      await createLibraryItem({
        userId: testUserId,
        gameId: game3.id,
        status: LibraryItemStatus.WISHLIST,
        platform: "Nintendo Switch",
      });

      const url =
        "http://localhost:6060/api/library?status=CURIOUS_ABOUT&platform=Nintendo%20Switch&search=zelda";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].game.title).toBe("Zelda on Switch");
      expect(data.data[0].status).toBe("CURIOUS_ABOUT");
      expect(data.data[0].platform).toBe("Nintendo Switch");
    });
  });

  describe("Response Format", () => {
    it("should return JSON with success: true, data: [] on success", async () => {
      // Arrange
      const url = "http://localhost:6060/api/library";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toHaveProperty("success", true);
      expect(data).toHaveProperty("data");
      expect(Array.isArray(data.data)).toBe(true);
    });

    it("should return JSON with success: false, error: string on auth error", async () => {
      // Arrange
      const { getServerUserId } = await import("@/auth");
      vi.mocked(getServerUserId).mockResolvedValue(undefined);

      const url = "http://localhost:6060/api/library";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("error");
      expect(typeof data.error).toBe("string");
    });

    it("should return 400 Bad Request on validation error", async () => {
      // Arrange
      // Mock getServerUserId to return invalid userId (not CUID format)
      const { getServerUserId } = await import("@/auth");
      vi.mocked(getServerUserId).mockResolvedValue("invalid-user-id");

      const url = "http://localhost:6060/api/library";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
    });

    it("should include security headers in response", async () => {
      // Arrange
      const url = "http://localhost:6060/api/library";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);

      // Assert
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
      expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
    });
  });

  describe("Data Integrity", () => {
    it("should return only the authenticated user's library items (row-level security)", async () => {
      // Arrange
      const game = await createGame({ title: "Shared Game" });

      // Create library items for both users
      await createLibraryItem({
        userId: testUserId,
        gameId: game.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
      });
      await createLibraryItem({
        userId: otherUserId,
        gameId: game.id,
        status: LibraryItemStatus.WISHLIST,
        platform: "PlayStation 5",
      });

      const url = "http://localhost:6060/api/library";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].userId).toBe(testUserId);
      expect(data.data[0].platform).toBe("PC");
    });

    it("should return library items with correct game data and _count", async () => {
      // Arrange
      const game = await createGame({
        title: "Test Game",
        coverImage: "https://example.com/cover.jpg",
        releaseDate: new Date("2024-01-15"),
      });

      // Create library item for test user
      await createLibraryItem({
        userId: testUserId,
        gameId: game.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const url = "http://localhost:6060/api/library";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);

      const libraryItem = data.data[0];
      expect(libraryItem).toHaveProperty("id");
      expect(libraryItem).toHaveProperty("userId", testUserId);
      expect(libraryItem).toHaveProperty("gameId");
      expect(libraryItem).toHaveProperty("status");
      expect(libraryItem).toHaveProperty("platform");
      expect(libraryItem).toHaveProperty("game");

      // Verify game data structure
      expect(libraryItem.game).toHaveProperty("id");
      expect(libraryItem.game).toHaveProperty("title", "Test Game");
      expect(libraryItem.game).toHaveProperty(
        "coverImage",
        "https://example.com/cover.jpg"
      );
      expect(libraryItem.game).toHaveProperty("slug");
      expect(libraryItem.game).toHaveProperty("releaseDate");
      expect(libraryItem.game).toHaveProperty("_count");

      // Verify _count shows total library items for this game across the database
      // Note: API uses distinctByGame: true, so we only get one item per game in response
      expect(libraryItem.game._count.libraryItems).toBeGreaterThanOrEqual(1);
    });

    it("should handle user with multiple library items across different games", async () => {
      // Arrange
      const game1 = await createGame({ title: "Game 1" });
      const game2 = await createGame({ title: "Game 2" });
      const game3 = await createGame({ title: "Game 3" });

      await createLibraryItem({
        userId: testUserId,
        gameId: game1.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });
      await createLibraryItem({
        userId: testUserId,
        gameId: game2.id,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });
      await createLibraryItem({
        userId: testUserId,
        gameId: game3.id,
        status: LibraryItemStatus.EXPERIENCED,
      });

      const url = "http://localhost:6060/api/library";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(3);
      expect(data.data.every((item: any) => item.userId === testUserId)).toBe(
        true
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid status enum gracefully", async () => {
      // Arrange
      const url = "http://localhost:6060/api/library?status=INVALID_STATUS";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
    });

    it("should handle case-sensitive search correctly", async () => {
      // Arrange
      const game1 = await createGame({ title: "ZELDA" });
      const game2 = await createGame({ title: "zelda" });
      const game3 = await createGame({ title: "Zelda" });

      await createLibraryItem({
        userId: testUserId,
        gameId: game1.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });
      await createLibraryItem({
        userId: testUserId,
        gameId: game2.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });
      await createLibraryItem({
        userId: testUserId,
        gameId: game3.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const url = "http://localhost:6060/api/library?search=zelda";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // All three should match (case-insensitive search)
      expect(data.data).toHaveLength(3);
    });

    it("should return empty array when search matches no games", async () => {
      // Arrange
      const game = await createGame({ title: "Final Fantasy" });
      await createLibraryItem({
        userId: testUserId,
        gameId: game.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const url = "http://localhost:6060/api/library?search=zelda";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it("should handle descending sort order correctly", async () => {
      // Arrange
      const game1 = await createGame({
        title: "A Game",
        releaseDate: new Date("2020-01-01"),
      });
      const game2 = await createGame({
        title: "B Game",
        releaseDate: new Date("2024-01-01"),
      });

      await createLibraryItem({
        userId: testUserId,
        gameId: game1.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });
      await createLibraryItem({
        userId: testUserId,
        gameId: game2.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const url =
        "http://localhost:6060/api/library?sortBy=releaseDate&sortOrder=desc";
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].game.title).toBe("B Game"); // Newest first
      expect(data.data[1].game.title).toBe("A Game");
    });
  });
});
