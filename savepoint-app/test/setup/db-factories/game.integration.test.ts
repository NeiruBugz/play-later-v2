import { setupDatabase } from "../database";
import { createGame } from "./game";

describe("Game Factory", () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  describe("createGame", () => {
    it("should create multiple games with unique slugs when called in parallel", async () => {
      // This is the exact pattern that was failing in library-repository tests
      const games = await Promise.all([
        createGame({ title: "Game 1" }),
        createGame({ title: "Game 2" }),
        createGame({ title: "Game 3" }),
        createGame({ title: "Game 4" }),
        createGame({ title: "Game 5" }),
      ]);

      // Extract all slugs
      const slugs = games.map((game) => game.slug);

      // All slugs should be unique
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);

      // All games should be created successfully
      expect(games).toHaveLength(5);
      games.forEach((game, index) => {
        expect(game.title).toBe(`Game ${index + 1}`);
        expect(game.slug).toBeTruthy();
      });
    });

    it("should create games with unique igdbIds when called in parallel", async () => {
      const games = await Promise.all([
        createGame(),
        createGame(),
        createGame(),
      ]);

      const igdbIds = games.map((game) => game.igdbId);
      const uniqueIds = new Set(igdbIds);
      expect(uniqueIds.size).toBe(igdbIds.length);
    });

    it("should respect custom slug when provided", async () => {
      const customSlug = "my-custom-slug";
      const game = await createGame({ slug: customSlug });
      expect(game.slug).toBe(customSlug);
    });

    it("should respect custom igdbId when provided", async () => {
      const customIgdbId = 999999;
      const game = await createGame({ igdbId: customIgdbId });
      expect(game.igdbId).toBe(customIgdbId);
    });
  });
});
