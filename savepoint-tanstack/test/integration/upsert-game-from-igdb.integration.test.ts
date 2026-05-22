/**
 * RED integration test for upsertGameFromIgdb (Slice 10 — game + library write layer).
 *
 * This test is intentionally failing: `@/entities/game/api/upsert-game.server`
 * does not exist yet. The import fails at module-resolution — that is the
 * canonical RED state. Do not implement production code in this file.
 *
 * IGDB HTTP transport is fully mocked via vi.stubGlobal("fetch", ...), following
 * the same pattern established in search-games.integration.test.ts (Slice 8).
 */

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// RED import — this module does not exist until the GREEN step.
import {
  upsertGameFromIgdb,
  upsertGameFromIgdbPayload,
} from "@/entities/game/api/upsert-game.server";
import { __resetTokenCacheForTests } from "@/shared/api/igdb/token";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// ---------------------------------------------------------------------------
// Isolated DB
// ---------------------------------------------------------------------------

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("upsert-game-from-igdb");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

// ---------------------------------------------------------------------------
// IGDB fetch mock
// ---------------------------------------------------------------------------

const FAKE_TOKEN_RESPONSE = {
  access_token: "tok",
  expires_in: 3600,
  token_type: "bearer",
};

const MOCK_IGDB_GAME = {
  id: 76340,
  name: "Elden Ring",
  slug: "elden-ring",
  cover: {
    id: 264551,
    image_id: "co5s5v",
    url: "//images.igdb.com/igdb/image/upload/t_cover_big/co5s5v.jpg",
  },
  first_release_date: 1645747200,
  platforms: [
    { id: 6, name: "PC (Microsoft Windows)" },
    { id: 167, name: "PlayStation 5" },
  ],
};

/**
 * Builds a fetch mock that handles Twitch token requests and IGDB game-detail
 * requests. Mirrors the pattern in search-games.integration.test.ts.
 */
function makeFetchMock({
  igdbResponse = {
    ok: true as boolean | undefined,
    status: 200,
    body: [MOCK_IGDB_GAME] as unknown,
  },
  igdbReject = undefined as Error | undefined,
}: {
  igdbResponse?: {
    ok?: boolean;
    status?: number;
    statusText?: string;
    body?: unknown;
  };
  igdbReject?: Error;
} = {}) {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes("id.twitch.tv")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => FAKE_TOKEN_RESPONSE,
      } as Response);
    }

    if (url.includes("api.igdb.com")) {
      if (igdbReject) {
        return Promise.reject(igdbReject);
      }
      return Promise.resolve({
        ok: igdbResponse.ok ?? true,
        status: igdbResponse.status ?? 200,
        statusText: igdbResponse.statusText ?? "OK",
        json: async () => igdbResponse.body,
      } as Response);
    }

    return Promise.reject(new Error(`Unexpected fetch URL in test: ${url}`));
  });
}

beforeEach(() => {
  __resetTokenCacheForTests();
  vi.stubGlobal("fetch", makeFetchMock());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("upsertGameFromIgdb", () => {
  describe("cache miss — game does not exist in DB", () => {
    it("fetches game from IGDB and inserts a new Game row", async () => {
      const before = await db.prisma.game.findUnique({
        where: { igdbId: MOCK_IGDB_GAME.id },
      });
      expect(before).toBeNull();

      const game = await upsertGameFromIgdb(MOCK_IGDB_GAME.id);

      const dbRow = await db.prisma.game.findUnique({
        where: { igdbId: MOCK_IGDB_GAME.id },
      });
      expect(dbRow).not.toBeNull();
      expect(game.igdbId).toBe(MOCK_IGDB_GAME.id);
      expect(game.slug).toBe(MOCK_IGDB_GAME.slug);
      expect(game.title).toBe(MOCK_IGDB_GAME.name);
      expect(game.id).toBe(dbRow?.id);
    });

    it("returns the newly inserted Game with all expected fields", async () => {
      const game = await upsertGameFromIgdb(MOCK_IGDB_GAME.id);

      expect(typeof game.id).toBe("string");
      expect(game.igdbId).toBe(MOCK_IGDB_GAME.id);
      expect(game.title).toBe(MOCK_IGDB_GAME.name);
      expect(game.slug).toBe(MOCK_IGDB_GAME.slug);
      // Release date is derived from first_release_date unix epoch.
      expect(game.releaseDate).toBeInstanceOf(Date);
    });

    it("stores a cover image URL derived from IGDB image_id", async () => {
      const game = await upsertGameFromIgdb(MOCK_IGDB_GAME.id);

      expect(typeof game.coverImage).toBe("string");
      expect(game.coverImage).toContain(MOCK_IGDB_GAME.cover.image_id);
    });
  });

  describe("cache hit — game already exists in DB", () => {
    beforeEach(async () => {
      // Seed an existing Game row with the same igdbId.
      await db.prisma.game.create({
        data: {
          igdbId: MOCK_IGDB_GAME.id,
          title: "Elden Ring (cached)",
          slug: "elden-ring-cached",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });
    });

    it("returns the existing Game without calling IGDB", async () => {
      const mockFetch = vi.fn();
      vi.stubGlobal("fetch", mockFetch);

      const game = await upsertGameFromIgdb(MOCK_IGDB_GAME.id);

      // IGDB (and Twitch token endpoint) must NOT have been called.
      expect(mockFetch).not.toHaveBeenCalled();

      expect(game.igdbId).toBe(MOCK_IGDB_GAME.id);
      expect(game.title).toBe("Elden Ring (cached)");
      expect(game.slug).toBe("elden-ring-cached");
    });

    it("does not create a duplicate Game row on repeated calls", async () => {
      await upsertGameFromIgdb(MOCK_IGDB_GAME.id);
      await upsertGameFromIgdb(MOCK_IGDB_GAME.id);

      const count = await db.prisma.game.count({
        where: { igdbId: MOCK_IGDB_GAME.id },
      });
      expect(count).toBe(1);
    });
  });

  describe("upsertGameFromIgdbPayload — cache hit path", () => {
    const existingIgdbId = 99999;

    beforeEach(async () => {
      await db.prisma.game.create({
        data: {
          igdbId: existingIgdbId,
          title: "Cached Game",
          slug: "cached-game",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });
    });

    it("returns the existing game when igdbId already exists (covers return existing branch)", async () => {
      const payload = {
        id: existingIgdbId,
        name: "Cached Game New Name",
        slug: "cached-game-new",
        first_release_date: 1645747200,
      };

      const result = await upsertGameFromIgdbPayload(payload);

      expect(result.igdbId).toBe(existingIgdbId);
      // Returns the existing row, not the payload's new name
      expect(result.title).toBe("Cached Game");
      expect(result.slug).toBe("cached-game");
    });
  });

  describe("upstream errors", () => {
    it("throws when IGDB returns a non-2xx response and game is not cached", async () => {
      vi.stubGlobal(
        "fetch",
        makeFetchMock({
          igdbResponse: {
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            body: null,
          },
        })
      );

      await expect(upsertGameFromIgdb(MOCK_IGDB_GAME.id)).rejects.toThrow();
    });

    it("throws when IGDB returns an empty array (game not found) and game is not cached", async () => {
      vi.stubGlobal(
        "fetch",
        makeFetchMock({ igdbResponse: { ok: true, status: 200, body: [] } })
      );

      await expect(upsertGameFromIgdb(MOCK_IGDB_GAME.id)).rejects.toThrow();
    });
  });
});
