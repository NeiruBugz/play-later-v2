import { resetTestDatabase, setupDatabase } from "@/test/setup/database";

import { upsertGenre } from "../genre/genre-repository";
import { upsertPlatform } from "../platform/platform-repository";
import {
  createGameWithRelations,
  findGameByIgdbId,
  findGameBySlug,
  gameExistsByIgdbId,
} from "./game-repository";

describe("Game Repository Integration Tests", () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });
  let testGenreId: string;
  let testPlatformId: string;

  beforeEach(async () => {
    const genreResult = await upsertGenre({
      id: 999,
      name: "Test Genre",
      slug: "test-genre",
    });
    const platformResult = await upsertPlatform({
      id: 999,
      name: "Test Platform",
      slug: "test-platform",
    });

    if (!genreResult.success || !platformResult.success) {
      throw new Error("Failed to set up test data");
    }

    testGenreId = genreResult.data.id;
    testPlatformId = platformResult.data.id;
  });

  it("should create a game with genres and platforms", async () => {
    const igdbGame = {
      id: 12345,
      name: "Test Game",
      slug: "test-game",
      summary: "A test game",
      cover: { image_id: "abc123" },
      first_release_date: 1609459200,
    };

    const result = await createGameWithRelations({
      igdbGame,
      genreIds: [testGenreId],
      platformIds: [testPlatformId],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Test Game");
      expect(result.data.slug).toBe("test-game");
      expect(result.data.igdbId).toBe(12345);
    }
  });

  it("should find game by slug", async () => {
    const igdbGame = {
      id: 12345,
      name: "Test Game",
      slug: "test-game",
    };

    await createGameWithRelations({
      igdbGame,
      genreIds: [testGenreId],
      platformIds: [testPlatformId],
    });

    const result = await findGameBySlug("test-game");

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.title).toBe("Test Game");
      expect(result.data.genres).toHaveLength(1);
      expect(result.data.platforms).toHaveLength(1);
    }
  });

  it("should find game by IGDB ID", async () => {
    const igdbGame = {
      id: 12345,
      name: "Test Game",
      slug: "test-game",
    };

    await createGameWithRelations({
      igdbGame,
      genreIds: [testGenreId],
      platformIds: [testPlatformId],
    });

    const result = await findGameByIgdbId(12345);

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.igdbId).toBe(12345);
    }
  });

  it("should check if game exists by IGDB ID", async () => {
    const igdbGame = {
      id: 12345,
      name: "Test Game",
      slug: "test-game",
    };

    await createGameWithRelations({
      igdbGame,
      genreIds: [testGenreId],
      platformIds: [testPlatformId],
    });

    const existsResult = await gameExistsByIgdbId(12345);
    const notExistsResult = await gameExistsByIgdbId(99999);

    expect(existsResult.success).toBe(true);
    if (existsResult.success) {
      expect(existsResult.data).toBe(true);
    }

    expect(notExistsResult.success).toBe(true);
    if (notExistsResult.success) {
      expect(notExistsResult.data).toBe(false);
    }
  });

  it("should handle duplicate game creation", async () => {
    const igdbGame = {
      id: 12345,
      name: "Test Game",
      slug: "test-game",
    };

    const result1 = await createGameWithRelations({
      igdbGame,
      genreIds: [testGenreId],
      platformIds: [testPlatformId],
    });

    const result2 = await createGameWithRelations({
      igdbGame,
      genreIds: [testGenreId],
      platformIds: [testPlatformId],
    });

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(false);
    if (!result2.success) {
      expect(result2.error.code).toBe("DUPLICATE");
    }
  });

  it("should return null when game slug is not found", async () => {
    const result = await findGameBySlug("non-existent-slug");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it("should return null when game IGDB ID is not found", async () => {
    const result = await findGameByIgdbId(99999);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it("should create game without genres and platforms", async () => {
    const igdbGame = {
      id: 11111,
      name: "Game Without Relations",
      slug: "game-without-relations",
    };

    const result = await createGameWithRelations({
      igdbGame,
      genreIds: [],
      platformIds: [],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Game Without Relations");

      const gameWithRelations = await findGameByIgdbId(11111);
      if (gameWithRelations.success && gameWithRelations.data) {
        expect(gameWithRelations.data.genres).toHaveLength(0);
        expect(gameWithRelations.data.platforms).toHaveLength(0);
      }
    }
  });
});
