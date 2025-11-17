import {
  cleanupDatabase,
  getTestDatabase,
  resetTestDatabase,
  setupDatabase,
} from "@/test/setup/database";

import { findGameByIgdbId } from "../../repository/game/game-repository";
import { populateGameInDatabase } from "./game-detail-service";

vi.mock("@/shared/lib", async () => {
  const actual =
    await vi.importActual<typeof import("@/shared/lib")>("@/shared/lib");
  const { getTestDatabase } = await import("@/test/setup/database");

  return {
    ...actual,
    get prisma() {
      return getTestDatabase();
    },
  };
});

describe("GameDetailService Integration Tests", () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
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
      genres: [
        { id: 888, name: "Service Genre 1", slug: "service-genre-1" },
        { id: 889, name: "Service Genre 2", slug: "service-genre-2" },
      ],
      platforms: [
        { id: 888, name: "Service Platform 1", slug: "service-platform-1" },
        { id: 889, name: "Service Platform 2", slug: "service-platform-2" },
      ],
    };

    await populateGameInDatabase(igdbGame);

    await new Promise((resolve) => setTimeout(resolve, 200));

    const result = await findGameByIgdbId(54321);

    expect(result.ok).toBe(true);
    if (result.ok && result.data) {
      expect(result.data.title).toBe("Service Test Game");
      expect(result.data.genres).toHaveLength(2);
      expect(result.data.platforms).toHaveLength(2);
    }
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
    };

    await populateGameInDatabase(igdbGame);
    await new Promise((resolve) => setTimeout(resolve, 200));

    await populateGameInDatabase(igdbGame);
    await new Promise((resolve) => setTimeout(resolve, 200));

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
    };

    await populateGameInDatabase(igdbGame);
    await new Promise((resolve) => setTimeout(resolve, 200));

    const result = await findGameByIgdbId(11111);

    expect(result.ok).toBe(true);
    if (result.ok && result.data) {
      expect(result.data.title).toBe("Game Without Metadata");
      expect(result.data.genres).toHaveLength(0);
      expect(result.data.platforms).toHaveLength(0);
    }
  });
});
