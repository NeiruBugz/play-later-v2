import { resetTestDatabase, setupDatabase } from "@/test/setup/database";

import {
  findGenreByIgdbId,
  upsertGenre,
  upsertGenres,
} from "./genre-repository";

describe("GenreRepository - Integration Tests", () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe("upsertGenre", () => {
    it("should create a new genre from IGDB data", async () => {
      const igdbGenre = {
        id: 1,
        name: "Action",
        slug: "action",
        checksum: "abc123",
      };

      const result = await upsertGenre(igdbGenre);

      expect(result.igdbId).toBe(1);
      expect(result.name).toBe("Action");
      expect(result.slug).toBe("action");
      expect(result.checksum).toBe("abc123");
    });

    it("should update existing genre on second upsert", async () => {
      const igdbGenre = { id: 1, name: "Action", slug: "action" };
      await upsertGenre(igdbGenre);

      const updated = {
        id: 1,
        name: "Action-Adventure",
        slug: "action-adventure",
        checksum: "updated123",
      };
      const result = await upsertGenre(updated);

      expect(result.name).toBe("Action-Adventure");
      expect(result.slug).toBe("action-adventure");
      expect(result.checksum).toBe("updated123");

      const findResult = await findGenreByIgdbId(1);
      expect(findResult?.name).toBe("Action-Adventure");
    });

    it("should handle genre with missing optional fields", async () => {
      const igdbGenre = { id: 2 };

      const result = await upsertGenre(igdbGenre);

      expect(result.igdbId).toBe(2);
      expect(result.name).toBe("Unknown Genre");
      expect(result.slug).toBe("genre-2");
      expect(result.checksum).toBeNull();
    });
  });

  describe("upsertGenres", () => {
    it("should bulk upsert multiple genres", async () => {
      const genres = [
        { id: 1, name: "Action", slug: "action" },
        { id: 2, name: "RPG", slug: "rpg" },
        { id: 3, name: "Strategy", slug: "strategy" },
      ];

      const result = await upsertGenres(genres);

      expect(result).toHaveLength(3);
      expect(result.map((g) => g.name)).toEqual(["Action", "RPG", "Strategy"]);
    });

    it("should handle empty array", async () => {
      const result = await upsertGenres([]);

      expect(result).toHaveLength(0);
    });

    it("should update existing and create new genres in bulk operation", async () => {
      await upsertGenre({ id: 1, name: "Action", slug: "action" });

      const genres = [
        { id: 1, name: "Action-Updated", slug: "action-updated" },
        { id: 2, name: "RPG", slug: "rpg" },
      ];

      const result = await upsertGenres(genres);

      expect(result).toHaveLength(2);

      const actionGenre = result.find((g) => g.igdbId === 1);
      expect(actionGenre?.name).toBe("Action-Updated");

      const rpgGenre = result.find((g) => g.igdbId === 2);
      expect(rpgGenre?.name).toBe("RPG");
    });
  });

  describe("findGenreByIgdbId", () => {
    it("should find an existing genre by IGDB ID", async () => {
      await upsertGenre({ id: 1, name: "Action", slug: "action" });

      const result = await findGenreByIgdbId(1);

      expect(result).not.toBeNull();
      expect(result?.igdbId).toBe(1);
      expect(result?.name).toBe("Action");
    });

    it("should return null for non-existent genre", async () => {
      const result = await findGenreByIgdbId(999);

      expect(result).toBeNull();
    });

    it("should find genre after upsert", async () => {
      const igdbGenre = {
        id: 5,
        name: "Platformer",
        slug: "platformer",
        checksum: "xyz789",
      };
      await upsertGenre(igdbGenre);

      const result = await findGenreByIgdbId(5);

      expect(result?.name).toBe("Platformer");
      expect(result?.checksum).toBe("xyz789");
    });
  });
});
