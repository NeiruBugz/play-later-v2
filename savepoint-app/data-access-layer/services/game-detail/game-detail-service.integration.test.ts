import {
  getTestDatabase,
  resetTestDatabase,
  setupDatabase,
} from "@/test/setup/database";

import { findGameByIgdbId } from "../../repository/game/game-repository";
import { GameDetailService } from "./game-detail-service";

async function waitForGameInDatabase(
  igdbId: number,
  { timeout = 2000, interval = 50 } = {}
) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const result = await findGameByIgdbId(igdbId);
    if (result.success && result.data) {
      return result.data;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  const finalResult = await findGameByIgdbId(igdbId);
  if (!finalResult.success || !finalResult.data) {
    throw new Error(
      `Game with igdbId ${igdbId} not found in database after ${timeout}ms`
    );
  }
  return finalResult.data;
}

describe("GameDetailService Integration Tests", () => {
  let gameDetailService: GameDetailService;

  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
    gameDetailService = new GameDetailService();
  });

  it("should populate game with genres and platforms in database", async () => {
    const igdbGame = {
      id: 54321,
      name: "Service Test Game",
      slug: "service-test-game",
      summary: "A game for testing the service",
      cover: { image_id: "test-cover", id: 1 },
      aggregated_rating: 85,
      external_games: [],
      game_engines: [],
      game_modes: [],
      involved_companies: [],
      player_perspectives: [],
      release_dates: [],
      screenshots: [],
      similar_games: [],
      themes: [],
      websites: [],
      franchises: [],
      game_type: 0,
      collections: [],
      genres: [
        { id: 888, name: "Service Genre 1", slug: "service-genre-1" },
        { id: 889, name: "Service Genre 2", slug: "service-genre-2" },
      ],
      platforms: [
        { id: 888, name: "Service Platform 1", slug: "service-platform-1" },
        { id: 889, name: "Service Platform 2", slug: "service-platform-2" },
      ],
    };

    const result = await gameDetailService.populateGameInDatabase(igdbGame);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe("Service Test Game");
    }

    const game = await waitForGameInDatabase(54321);

    expect(game).toBeDefined();
    expect(game.title).toBe("Service Test Game");
    expect(game.genres).toHaveLength(2);
    expect(game.platforms).toHaveLength(2);
  });

  it("should skip population if game already exists", async () => {
    const igdbGame = {
      id: 11111,
      name: "Existing Game",
      slug: "existing-game",
      summary: "Test summary",
      cover: { image_id: "test-cover", id: 1 },
      aggregated_rating: 85,
      external_games: [],
      game_engines: [],
      game_modes: [],
      genres: [],
      involved_companies: [],
      platforms: [],
      player_perspectives: [],
      release_dates: [],
      screenshots: [],
      similar_games: [],
      themes: [],
      websites: [],
      franchises: [],
      game_type: 0,
      collections: [],
    };

    const firstResult =
      await gameDetailService.populateGameInDatabase(igdbGame);
    expect(firstResult.success).toBe(true);

    await waitForGameInDatabase(11111);

    const secondResult =
      await gameDetailService.populateGameInDatabase(igdbGame);
    expect(secondResult.success).toBe(true);
    if (secondResult.success) {
      expect(secondResult.data).toBeNull();
    }

    const prisma = getTestDatabase();
    const count = await prisma.game.count({ where: { igdbId: 11111 } });
    expect(count).toBe(1);
  });

  it("should handle games with no genres or platforms", async () => {
    const igdbGame = {
      id: 11111,
      name: "Game Without Metadata",
      slug: "game-without-metadata",
      summary: "A game without genres or platforms",
      cover: { image_id: "test-cover", id: 1 },
      aggregated_rating: 85,
      external_games: [],
      game_engines: [],
      game_modes: [],
      genres: [],
      involved_companies: [],
      platforms: [],
      player_perspectives: [],
      release_dates: [],
      screenshots: [],
      similar_games: [],
      themes: [],
      websites: [],
      franchises: [],
      game_type: 0,
      collections: [],
    };

    const result = await gameDetailService.populateGameInDatabase(igdbGame);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe("Game Without Metadata");
    }

    const game = await waitForGameInDatabase(11111);

    expect(game).toBeDefined();
    expect(game.title).toBe("Game Without Metadata");
    expect(game.genres).toHaveLength(0);
    expect(game.platforms).toHaveLength(0);
  });

  it("should handle game with minimal required fields (optional fields undefined)", async () => {
    const igdbGame = {
      id: 99999,
      name: "Minimal Data Game",
      slug: "minimal-data-game",
      cover: { image_id: "co_minimal" },
      game_type: 0,
    };

    const result = await gameDetailService.populateGameInDatabase(igdbGame);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe("Minimal Data Game");
      expect(result.data?.slug).toBe("minimal-data-game");
    }

    const game = await waitForGameInDatabase(99999);

    expect(game).toBeDefined();
    expect(game.title).toBe("Minimal Data Game");
    expect(game.slug).toBe("minimal-data-game");
    expect(game.genres).toHaveLength(0);
    expect(game.platforms).toHaveLength(0);
  });

  it("should handle game with sparse data (some optional fields present)", async () => {
    const igdbGame = {
      id: 88888,
      name: "Sparse Data Game",
      slug: "sparse-data-game",
      summary: "A game with some missing optional fields",
      cover: { image_id: "co_sparse" },
      game_type: 0,
      genres: [{ id: 12, name: "Action" }],
      platforms: [{ id: 6, name: "PC (Microsoft Windows)" }],
    };

    const result = await gameDetailService.populateGameInDatabase(igdbGame);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe("Sparse Data Game");
    }

    const game = await waitForGameInDatabase(88888);

    expect(game).toBeDefined();
    expect(game.title).toBe("Sparse Data Game");
    expect(game.genres).toHaveLength(1);
    expect(game.platforms).toHaveLength(1);
  });

  it("should handle game with missing aggregated_rating", async () => {
    const igdbGame = {
      id: 77777,
      name: "No Rating Game",
      slug: "no-rating-game",
      cover: { image_id: "co_norating" },
      game_type: 0,
      genres: [{ id: 5, name: "RPG" }],
    };

    const result = await gameDetailService.populateGameInDatabase(igdbGame);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe("No Rating Game");
    }

    const game = await waitForGameInDatabase(77777);

    expect(game).toBeDefined();
    expect(game.title).toBe("No Rating Game");
    expect(game.genres).toHaveLength(1);
  });
});
