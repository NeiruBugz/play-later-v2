import { DuplicateError } from "@/data-access-layer/repository";
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
    const genre = await upsertGenre({
      id: 999,
      name: "Test Genre",
      slug: "test-genre",
    });
    const platform = await upsertPlatform({
      id: 999,
      name: "Test Platform",
      slug: "test-platform",
    });

    testGenreId = genre.id;
    testPlatformId = platform.id;
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

    expect(result.title).toBe("Test Game");
    expect(result.slug).toBe("test-game");
    expect(result.igdbId).toBe(12345);
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

    expect(result).not.toBeNull();
    expect(result?.title).toBe("Test Game");
    expect(result?.genres).toHaveLength(1);
    expect(result?.platforms).toHaveLength(1);
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

    expect(result).not.toBeNull();
    expect(result?.igdbId).toBe(12345);
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

    const exists = await gameExistsByIgdbId(12345);
    const notExists = await gameExistsByIgdbId(99999);

    expect(exists).toBe(true);
    expect(notExists).toBe(false);
  });

  it("should handle duplicate game creation", async () => {
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

    await expect(
      createGameWithRelations({
        igdbGame,
        genreIds: [testGenreId],
        platformIds: [testPlatformId],
      })
    ).rejects.toThrow(DuplicateError);
  });

  it("should return null when game slug is not found", async () => {
    const result = await findGameBySlug("non-existent-slug");

    expect(result).toBeNull();
  });

  it("should return null when game IGDB ID is not found", async () => {
    const result = await findGameByIgdbId(99999);

    expect(result).toBeNull();
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

    expect(result.title).toBe("Game Without Relations");

    const gameWithRelations = await findGameByIgdbId(11111);
    expect(gameWithRelations?.genres).toHaveLength(0);
    expect(gameWithRelations?.platforms).toHaveLength(0);
  });
});
