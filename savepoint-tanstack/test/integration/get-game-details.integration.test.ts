/**
 * RED integration test for getGameDetails (Slice 13 — game detail page).
 *
 * This test is intentionally failing: `@/entities/game/api/get-game-details.server`
 * does not exist yet. The import fails at module-resolution — that is the
 * canonical RED state. Do not implement production code in this file.
 *
 * IGDB HTTP transport is fully mocked via vi.stubGlobal("fetch", ...) following
 * the pattern in upsert-game-from-igdb.integration.test.ts. Real Prisma against
 * the isolated test DB for all assertions.
 *
 * =============================================================================
 * CONTRACT (proposed; impl agent in task 3 may refine):
 *
 * export async function getGameDetails(params: {
 *   slug: string;
 *   userId?: string;
 * }): Promise<{
 *   game: Game;                    // local Game row (cache-upserted from IGDB)
 *   relatedGames: Game[];          // best-effort; may be []; impl decides strategy
 *   libraryEntry: LibraryItem | null;
 *   journalTeaser: JournalEntry[]; // most recent N (e.g. 3); [] when anon or none
 * }>
 *
 * Throws NotFoundError when IGDB returns an empty array for the given slug.
 *
 * Notes for impl agent:
 *   - Slug → IGDB lookup: IGDB `/games` endpoint accepts `where slug = "<slug>"`.
 *     A new helper `getGameBySlug(slug: string)` (mirrors `getGameByIgdbId`) is
 *     the cleanest approach; alternatively re-use `igdbFetch` directly.
 *   - After resolving the IGDB game, call `upsertGameFromIgdb(igdbId)` for the
 *     DB cache step (or inline equivalent).
 *   - `libraryEntry`: when `userId` provided, return the most-recent LibraryItem
 *     for (userId, gameId) or null if none exists.
 *   - `journalTeaser`: when `userId` provided, return up to 3 JournalEntry rows
 *     for (userId, gameId) ordered by createdAt DESC; empty array otherwise.
 *   - `relatedGames`: by franchise or genre; may be [] on first pass; impl decides.
 *     Tests only assert the array shape (Array.isArray), not contents.
 *   - The fetch mock below intercepts both slug-lookup and (if needed) related-game
 *     calls at the `api.igdb.com` boundary. The mock returns the same MOCK_IGDB_GAME
 *     for all IGDB calls to keep setup simple.
 * =============================================================================
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

// RED import — this module does not exist until the GREEN step (task 3).
import { getGameDetails } from "@/entities/game/api/get-game-details.server";
import { __resetTokenCacheForTests } from "@/shared/api/igdb/token";
import { NotFoundError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// ---------------------------------------------------------------------------
// Isolated DB
// ---------------------------------------------------------------------------

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-game-details");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const IGDB_ID = 76340;
const GAME_SLUG = "elden-ring";

const FAKE_TOKEN_RESPONSE = {
  access_token: "tok",
  expires_in: 3600,
  token_type: "bearer",
};

const MOCK_IGDB_GAME = {
  id: IGDB_ID,
  name: "Elden Ring",
  slug: GAME_SLUG,
  // Slice 17B: `summary` populates `Game.description` so the row is treated as
  // fully-hydrated on subsequent reads. Without it the orchestrator's new
  // backfill check (description === null) would re-fetch IGDB on every call
  // and break the cache-hit assertion below.
  summary: "Elden Ring summary text from IGDB.",
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

function makeUser(suffix: string) {
  return {
    id: `ggd-user-${suffix}`,
    email: `ggd-${suffix}@example.com`,
    name: `GGD User ${suffix}`,
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

// ---------------------------------------------------------------------------
// IGDB fetch mock (mirrors upsert-game-from-igdb.integration.test.ts)
// ---------------------------------------------------------------------------

/**
 * Builds a fetch mock that handles Twitch token requests and any IGDB game
 * endpoint. All IGDB calls return the same game to keep test fixtures simple.
 */
function makeFetchMock({
  igdbBody = [MOCK_IGDB_GAME] as unknown,
  igdbOk = true,
  igdbStatus = 200,
}: {
  igdbBody?: unknown;
  igdbOk?: boolean;
  igdbStatus?: number;
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
      return Promise.resolve({
        ok: igdbOk,
        status: igdbStatus,
        statusText: igdbOk ? "OK" : "Internal Server Error",
        json: async () => igdbBody,
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

describe("getGameDetails", () => {
  // -------------------------------------------------------------------------
  // Anonymous access (no userId)
  // -------------------------------------------------------------------------

  describe("anonymous — no userId provided", () => {
    it("returns game, relatedGames array, null libraryEntry, and empty journalTeaser", async () => {
      const result = await getGameDetails({ slug: GAME_SLUG });

      expect(result.game).toBeDefined();
      expect(result.game.slug).toBe(GAME_SLUG);
      expect(result.game.igdbId).toBe(IGDB_ID);
      expect(result.game.title).toBe(MOCK_IGDB_GAME.name);

      expect(Array.isArray(result.relatedGames)).toBe(true);
      expect(result.libraryEntry).toBeNull();
      expect(result.journalTeaser).toEqual([]);
    });

    it("inserts a Game row on cache miss", async () => {
      const before = await db.prisma.game.findUnique({
        where: { slug: GAME_SLUG },
      });
      expect(before).toBeNull();

      await getGameDetails({ slug: GAME_SLUG });

      const row = await db.prisma.game.findUnique({
        where: { slug: GAME_SLUG },
      });
      expect(row).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Signed-in — no library entry
  // -------------------------------------------------------------------------

  describe("signed-in with no library entry", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("alice") });
    });

    it("returns null libraryEntry and empty journalTeaser", async () => {
      const result = await getGameDetails({
        slug: GAME_SLUG,
        userId: "ggd-user-alice",
      });

      expect(result.game.slug).toBe(GAME_SLUG);
      expect(result.libraryEntry).toBeNull();
      expect(result.journalTeaser).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Signed-in — with library entry
  // -------------------------------------------------------------------------

  describe("signed-in with a library entry", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("bob") });
      // Pre-seed the Game row so the cache-hit path is exercised here.
      await db.prisma.game.create({
        data: {
          igdbId: IGDB_ID,
          title: MOCK_IGDB_GAME.name,
          slug: GAME_SLUG,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });
      const game = await db.prisma.game.findUnique({
        where: { slug: GAME_SLUG },
      });
      await db.prisma.libraryItem.create({
        data: {
          userId: "ggd-user-bob",
          gameId: game!.id,
          status: "PLAYING",
          acquisitionType: "DIGITAL",
        },
      });
    });

    it("returns the user's LibraryItem for the game", async () => {
      const result = await getGameDetails({
        slug: GAME_SLUG,
        userId: "ggd-user-bob",
      });

      expect(result.libraryEntry).not.toBeNull();
      expect(result.libraryEntry!.userId).toBe("ggd-user-bob");
      expect(result.libraryEntry!.status).toBe("PLAYING");
    });
  });

  // -------------------------------------------------------------------------
  // Signed-in — with journal entries
  // -------------------------------------------------------------------------

  describe("signed-in with journal entries", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("carol") });
      await db.prisma.game.create({
        data: {
          igdbId: IGDB_ID,
          title: MOCK_IGDB_GAME.name,
          slug: GAME_SLUG,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });
      const game = await db.prisma.game.findUnique({
        where: { slug: GAME_SLUG },
      });
      // Create 4 entries — teaser should return at most 3, ordered desc by createdAt.
      for (let i = 1; i <= 4; i++) {
        await db.prisma.journalEntry.create({
          data: {
            userId: "ggd-user-carol",
            gameId: game!.id,
            content: `Journal entry ${i}`,
            kind: "QUICK",
            createdAt: new Date(`2024-01-0${i}T00:00:00.000Z`),
            updatedAt: new Date(`2024-01-0${i}T00:00:00.000Z`),
          },
        });
      }
    });

    it("returns up to 3 most-recent journal entries ordered desc by createdAt", async () => {
      const result = await getGameDetails({
        slug: GAME_SLUG,
        userId: "ggd-user-carol",
      });

      expect(result.journalTeaser.length).toBeLessThanOrEqual(3);
      expect(result.journalTeaser.length).toBeGreaterThan(0);

      // Verify descending createdAt order.
      for (let i = 0; i < result.journalTeaser.length - 1; i++) {
        expect(
          new Date(result.journalTeaser[i]!.createdAt).getTime()
        ).toBeGreaterThanOrEqual(
          new Date(result.journalTeaser[i + 1]!.createdAt).getTime()
        );
      }

      // Most recent entry (index 4) has content "Journal entry 4".
      expect(result.journalTeaser[0]!.content).toBe("Journal entry 4");
    });
  });

  // -------------------------------------------------------------------------
  // Cross-user isolation
  // -------------------------------------------------------------------------

  describe("cross-user isolation", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("userA") });
      await db.prisma.user.create({ data: makeUser("userB") });
      await db.prisma.game.create({
        data: {
          igdbId: IGDB_ID,
          title: MOCK_IGDB_GAME.name,
          slug: GAME_SLUG,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });
      const game = await db.prisma.game.findUnique({
        where: { slug: GAME_SLUG },
      });

      // userA has a library entry and a journal entry.
      await db.prisma.libraryItem.create({
        data: {
          userId: "ggd-user-userA",
          gameId: game!.id,
          status: "PLAYED",
          acquisitionType: "DIGITAL",
        },
      });
      await db.prisma.journalEntry.create({
        data: {
          userId: "ggd-user-userA",
          gameId: game!.id,
          content: "User A's journal",
          kind: "QUICK",
        },
      });
    });

    it("does not return user A's libraryEntry when queried as user B", async () => {
      const result = await getGameDetails({
        slug: GAME_SLUG,
        userId: "ggd-user-userB",
      });

      expect(result.libraryEntry).toBeNull();
    });

    it("does not return user A's journalTeaser when queried as user B", async () => {
      const result = await getGameDetails({
        slug: GAME_SLUG,
        userId: "ggd-user-userB",
      });

      expect(result.journalTeaser).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Missing slug — IGDB returns empty array
  // -------------------------------------------------------------------------

  describe("missing slug", () => {
    it("throws NotFoundError when IGDB returns an empty array for the slug", async () => {
      vi.stubGlobal("fetch", makeFetchMock({ igdbBody: [] }));

      await expect(
        getGameDetails({ slug: "nonexistent-slug-xyz" })
      ).rejects.toThrow(NotFoundError);
    });
  });

  // -------------------------------------------------------------------------
  // Cache shape — second call still hits IGDB (caching lives at route loader,
  // not at the entity layer). Mirrors canonical's "use cache" pattern.
  // -------------------------------------------------------------------------

  describe("repeat reads", () => {
    it("hits IGDB again on the second request — entity does not cache", async () => {
      // First call — IGDB called.
      await getGameDetails({ slug: GAME_SLUG });

      // Same mock keeps responding; second call must still go through.
      const result = await getGameDetails({ slug: GAME_SLUG });

      expect(result.game.slug).toBe(GAME_SLUG);
    });

    it("does NOT create a duplicate Game row on the second request", async () => {
      await getGameDetails({ slug: GAME_SLUG });
      await getGameDetails({ slug: GAME_SLUG });

      const rows = await db.prisma.game.findMany({
        where: { slug: GAME_SLUG },
      });
      expect(rows).toHaveLength(1);
    });
  });
});
