import {
  cleanupDatabase,
  resetTestDatabase,
  setupDatabase,
} from "@/test/setup/database";

import { isRepositorySuccess } from "../types";
import {
  findPlatformByIgdbId,
  upsertPlatform,
  upsertPlatforms,
} from "./platform-repository";

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
        expect(result.data.platformType).toBe(1234);
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
});
