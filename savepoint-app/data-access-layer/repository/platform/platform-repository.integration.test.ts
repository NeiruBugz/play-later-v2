import {
  cleanupDatabase,
  resetTestDatabase,
  setupDatabase,
} from "@/test/setup/database";
import { createGame } from "@/test/setup/db-factories";

import { isRepositorySuccess } from "../types";
import {
  findPlatformByIgdbId,
  findPlatformsForGame,
  upsertPlatform,
  upsertPlatforms,
} from "./platform-repository";

vi.mock("@/shared/lib/app/db", async () => {
  const { getTestDatabase } = await import("@/test/setup/database");

  return {
    get prisma() {
      return getTestDatabase();
    },
  };
});

describe("PlatformRepository - Integration Tests", () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe("upsertPlatform", () => {
    it("should create a new platform from IGDB data", async () => {
      const igdbPlatform = {
        id: 48,
        name: "PlayStation 5",
        slug: "ps5",
        abbreviation: "PS5",
        alternative_name: "PS5",
        generation: 9,
        platform_family: 1,
        platform_logo: 1234,
        checksum: "abc123",
      };

      const result = await upsertPlatform(igdbPlatform);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.igdbId).toBe(48);
        expect(result.data.name).toBe("PlayStation 5");
        expect(result.data.slug).toBe("ps5");
        expect(result.data.abbreviation).toBe("PS5");
        expect(result.data.alternativeName).toBe("PS5");
        expect(result.data.generation).toBe(9);
        expect(result.data.platformFamily).toBe(1);
        expect(result.data.checksum).toBe("abc123");
      }
    });

    it("should update existing platform on second upsert", async () => {
      const igdbPlatform = {
        id: 48,
        name: "PlayStation 5",
        slug: "ps5",
        abbreviation: "PS5",
      };
      await upsertPlatform(igdbPlatform);

      const updated = {
        id: 48,
        name: "PlayStation 5 Pro",
        slug: "ps5-pro",
        abbreviation: "PS5P",
        checksum: "updated123",
      };
      const result = await upsertPlatform(updated);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.name).toBe("PlayStation 5 Pro");
        expect(result.data.slug).toBe("ps5-pro");
        expect(result.data.abbreviation).toBe("PS5P");
        expect(result.data.checksum).toBe("updated123");
      }

      const findResult = await findPlatformByIgdbId(48);
      expect(findResult.ok).toBe(true);
      if (findResult.ok) {
        expect(findResult.data?.name).toBe("PlayStation 5 Pro");
      }
    });

    it("should handle platform with missing optional fields", async () => {
      const igdbPlatform = { id: 6 };

      const result = await upsertPlatform(igdbPlatform);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.igdbId).toBe(6);
        expect(result.data.name).toBe("Unknown Platform");
        expect(result.data.slug).toBe("platform-6");
        expect(result.data.abbreviation).toBeNull();
        expect(result.data.alternativeName).toBeNull();
        expect(result.data.generation).toBeNull();
        expect(result.data.checksum).toBeNull();
      }
    });
  });

  describe("upsertPlatforms", () => {
    it("should bulk upsert multiple platforms", async () => {
      const platforms = [
        { id: 48, name: "PlayStation 5", slug: "ps5", abbreviation: "PS5" },
        { id: 169, name: "Xbox Series X|S", slug: "xsx", abbreviation: "XSX" },
        {
          id: 6,
          name: "PC (Microsoft Windows)",
          slug: "win",
          abbreviation: "PC",
        },
      ];

      const result = await upsertPlatforms(platforms);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).toHaveLength(3);
        expect(result.data.map((p) => p.name)).toEqual([
          "PlayStation 5",
          "Xbox Series X|S",
          "PC (Microsoft Windows)",
        ]);
      }
    });

    it("should handle empty array", async () => {
      const result = await upsertPlatforms([]);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).toHaveLength(0);
      }
    });

    it("should update existing and create new platforms in bulk operation", async () => {
      await upsertPlatform({
        id: 48,
        name: "PlayStation 5",
        slug: "ps5",
        abbreviation: "PS5",
      });

      const platforms = [
        {
          id: 48,
          name: "PlayStation 5 Updated",
          slug: "ps5-updated",
          abbreviation: "PS5U",
        },
        { id: 169, name: "Xbox Series X|S", slug: "xsx", abbreviation: "XSX" },
      ];

      const result = await upsertPlatforms(platforms);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).toHaveLength(2);

        const ps5 = result.data.find((p) => p.igdbId === 48);
        expect(ps5?.name).toBe("PlayStation 5 Updated");

        const xbox = result.data.find((p) => p.igdbId === 169);
        expect(xbox?.name).toBe("Xbox Series X|S");
      }
    });
  });

  describe("findPlatformByIgdbId", () => {
    it("should find an existing platform by IGDB ID", async () => {
      await upsertPlatform({
        id: 48,
        name: "PlayStation 5",
        slug: "ps5",
        abbreviation: "PS5",
      });

      const result = await findPlatformByIgdbId(48);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).not.toBeNull();
        expect(result.data?.igdbId).toBe(48);
        expect(result.data?.name).toBe("PlayStation 5");
      }
    });

    it("should return null for non-existent platform", async () => {
      const result = await findPlatformByIgdbId(9999);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).toBeNull();
      }
    });

    it("should find platform after upsert", async () => {
      const igdbPlatform = {
        id: 130,
        name: "Nintendo Switch",
        slug: "switch",
        abbreviation: "NSW",
        generation: 8,
        checksum: "xyz789",
      };
      await upsertPlatform(igdbPlatform);

      const result = await findPlatformByIgdbId(130);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data?.name).toBe("Nintendo Switch");
        expect(result.data?.abbreviation).toBe("NSW");
        expect(result.data?.generation).toBe(8);
        expect(result.data?.checksum).toBe("xyz789");
      }
    });
  });

  describe("findPlatformsForGame", () => {
    it("should return platforms grouped into supported and other for a game", async () => {
      await upsertPlatforms([
        { id: 48, name: "PlayStation 5", slug: "ps5", abbreviation: "PS5" },
        { id: 169, name: "Xbox Series X|S", slug: "xsx", abbreviation: "XSX" },
        {
          id: 6,
          name: "PC (Microsoft Windows)",
          slug: "win",
          abbreviation: "PC",
        },
        {
          id: 49,
          name: "PlayStation 4",
          slug: "ps4",
          abbreviation: "PS4",
        },
      ]);

      const game = await createGame({ title: "Test Game", igdbId: 12345 });

      const ps5Result = await findPlatformByIgdbId(48);
      const xsxResult = await findPlatformByIgdbId(169);

      if (!isRepositorySuccess(ps5Result) || !isRepositorySuccess(xsxResult)) {
        throw new Error("Failed to find platforms");
      }

      const ps5Id = ps5Result.data!.id;
      const xsxId = xsxResult.data!.id;

      const { prisma } = await import("@/shared/lib/app/db");
      await prisma.gamePlatform.createMany({
        data: [
          { gameId: game.id, platformId: ps5Id },
          { gameId: game.id, platformId: xsxId },
        ],
      });

      const result = await findPlatformsForGame(game.id);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.supportedPlatforms).toHaveLength(2);
        expect(result.data.otherPlatforms).toHaveLength(2);

        const supportedNames = result.data.supportedPlatforms.map(
          (p) => p.name
        );
        expect(supportedNames).toContain("PlayStation 5");
        expect(supportedNames).toContain("Xbox Series X|S");

        const otherNames = result.data.otherPlatforms.map((p) => p.name);
        expect(otherNames).toContain("PC (Microsoft Windows)");
        expect(otherNames).toContain("PlayStation 4");
      }
    });

    it("should return all platforms as 'other' when game has no linked platforms", async () => {
      await upsertPlatforms([
        { id: 48, name: "PlayStation 5", slug: "ps5", abbreviation: "PS5" },
        { id: 169, name: "Xbox Series X|S", slug: "xsx", abbreviation: "XSX" },
      ]);

      const game = await createGame({
        title: "Game Without Platforms",
        igdbId: 67890,
      });

      const result = await findPlatformsForGame(game.id);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.supportedPlatforms).toHaveLength(0);
        expect(result.data.otherPlatforms).toHaveLength(2);

        const otherNames = result.data.otherPlatforms.map((p) => p.name);
        expect(otherNames).toContain("PlayStation 5");
        expect(otherNames).toContain("Xbox Series X|S");
      }
    });

    it("should return empty arrays when no platforms exist in database", async () => {
      const game = await createGame({
        title: "Game In Empty DB",
        igdbId: 11111,
      });

      const result = await findPlatformsForGame(game.id);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.supportedPlatforms).toHaveLength(0);
        expect(result.data.otherPlatforms).toHaveLength(0);
      }
    });

    it("should sort platforms alphabetically by name", async () => {
      await upsertPlatforms([
        {
          id: 130,
          name: "Nintendo Switch",
          slug: "switch",
          abbreviation: "NSW",
        },
        { id: 48, name: "PlayStation 5", slug: "ps5", abbreviation: "PS5" },
        { id: 169, name: "Xbox Series X|S", slug: "xsx", abbreviation: "XSX" },
        {
          id: 6,
          name: "PC (Microsoft Windows)",
          slug: "win",
          abbreviation: "PC",
        },
      ]);

      const game = await createGame({ title: "Sorting Test", igdbId: 22222 });

      const result = await findPlatformsForGame(game.id);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.otherPlatforms).toHaveLength(4);

        const names = result.data.otherPlatforms.map((p) => p.name);

        expect(names).toEqual([
          "Nintendo Switch",
          "PC (Microsoft Windows)",
          "PlayStation 5",
          "Xbox Series X|S",
        ]);
      }
    });

    it("should handle game with all platforms supported (none in other)", async () => {
      await upsertPlatforms([
        { id: 48, name: "PlayStation 5", slug: "ps5", abbreviation: "PS5" },
        { id: 169, name: "Xbox Series X|S", slug: "xsx", abbreviation: "XSX" },
      ]);

      const game = await createGame({
        title: "All Platforms Game",
        igdbId: 33333,
      });

      const ps5Result = await findPlatformByIgdbId(48);
      const xsxResult = await findPlatformByIgdbId(169);

      if (!isRepositorySuccess(ps5Result) || !isRepositorySuccess(xsxResult)) {
        throw new Error("Failed to find platforms");
      }

      const { prisma } = await import("@/shared/lib/app/db");
      await prisma.gamePlatform.createMany({
        data: [
          { gameId: game.id, platformId: ps5Result.data!.id },
          { gameId: game.id, platformId: xsxResult.data!.id },
        ],
      });

      const result = await findPlatformsForGame(game.id);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.supportedPlatforms).toHaveLength(2);
        expect(result.data.otherPlatforms).toHaveLength(0);
      }
    });

    it("should return empty arrays for non-existent game ID", async () => {
      await upsertPlatforms([
        { id: 48, name: "PlayStation 5", slug: "ps5", abbreviation: "PS5" },
      ]);

      const result = await findPlatformsForGame("clx999nonexistent");

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.supportedPlatforms).toHaveLength(0);
        expect(result.data.otherPlatforms).toHaveLength(1);
      }
    });

    it("should correctly group platforms when multiple games exist", async () => {
      await upsertPlatforms([
        { id: 48, name: "PlayStation 5", slug: "ps5", abbreviation: "PS5" },
        { id: 169, name: "Xbox Series X|S", slug: "xsx", abbreviation: "XSX" },
        {
          id: 6,
          name: "PC (Microsoft Windows)",
          slug: "win",
          abbreviation: "PC",
        },
      ]);

      const game1 = await createGame({ title: "Game 1", igdbId: 44444 });
      const game2 = await createGame({ title: "Game 2", igdbId: 55555 });

      const ps5Result = await findPlatformByIgdbId(48);

      const xsxResult = await findPlatformByIgdbId(169);

      if (!isRepositorySuccess(ps5Result) || !isRepositorySuccess(xsxResult)) {
        throw new Error("Failed to find platforms");
      }

      const { prisma } = await import("@/shared/lib/app/db");
      await prisma.gamePlatform.create({
        data: { gameId: game1.id, platformId: ps5Result.data!.id },
      });
      await prisma.gamePlatform.create({
        data: { gameId: game2.id, platformId: xsxResult.data!.id },
      });

      const result1 = await findPlatformsForGame(game1.id);
      expect(isRepositorySuccess(result1)).toBe(true);
      if (isRepositorySuccess(result1)) {
        expect(result1.data.supportedPlatforms).toHaveLength(1);
        expect(result1.data.supportedPlatforms[0].name).toBe("PlayStation 5");
        expect(result1.data.otherPlatforms).toHaveLength(2);
      }

      const result2 = await findPlatformsForGame(game2.id);
      expect(isRepositorySuccess(result2)).toBe(true);
      if (isRepositorySuccess(result2)) {
        expect(result2.data.supportedPlatforms).toHaveLength(1);
        expect(result2.data.supportedPlatforms[0].name).toBe("Xbox Series X|S");
        expect(result2.data.otherPlatforms).toHaveLength(2);
      }
    });
  });
});
