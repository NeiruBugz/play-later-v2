/**
 * RED integration test for getRelatedGames (Slice 14 — browse-related-games infinite scroll).
 *
 * This test is intentionally failing: `@/features/browse-related-games/api/get-related-games`
 * does not exist yet. The import fails at module-resolution — that is the canonical RED state.
 * Do not implement production code in this file.
 *
 * IGDB HTTP transport is fully mocked via vi.stubGlobal("fetch", ...) following the
 * pattern in get-game-details.integration.test.ts. Real Prisma against the isolated
 * test DB for all assertions.
 *
 * =============================================================================
 * CONTRACT
 *
 * Worker function (plain async, importable directly from tests and composed by the
 * server fn wrapper):
 *
 * export async function getRelatedGames(params: {
 *   collectionId: number;  // IGDB collection id
 *   page?: number;         // 1-based, default 1
 *   pageSize?: number;     // default 20, max 50
 * }): Promise<{
 *   games: RelatedGame[];  // page slice; field shape: { igdbId, slug, title, coverImageId }
 *   total: number;         // count AFTER applying game_type filter, BEFORE pagination
 *   page: number;          // echoed
 *   pageSize: number;      // echoed
 *   hasMore: boolean;      // page * pageSize < total
 * }>
 *
 * Server fn wrapper (createServerFn, no .server.ts suffix per CLAUDE.md foot-gun #1):
 *
 * export const getRelatedGamesFn = createServerFn({ method: "GET" })
 *   .inputValidator(z.object({
 *     collectionId: z.number().int().positive(),
 *     page: z.number().int().min(1).default(1),
 *     pageSize: z.number().int().min(1).max(50).default(20),
 *   }))
 *   .handler(async ({ data }) => getRelatedGames(data));
 *
 * The test imports the plain worker `getRelatedGames` directly — this is the
 * worker/server-fn split from CLAUDE.md foot-gun #8. The server fn returns
 * `undefined` when invoked programmatically in vitest (no Vite plugin), but
 * the worker returns the real shape. This is the same pattern used for
 * `getGameDetails` (entity worker imported directly, server fn wrapper tested
 * via the route test).
 *
 * FILE LAYOUT DECISION:
 *   src/features/browse-related-games/api/get-related-games.ts
 *     — `getRelatedGamesFn` (createServerFn wrapper, no .server suffix)
 *   src/features/browse-related-games/api/get-related-games.worker.ts
 *     — `getRelatedGames` (plain async worker, .worker suffix used here
 *        rather than .server to distinguish: this is NOT a server-only module
 *        per CLAUDE.md File naming, but it IS server-only in practice because
 *        the server fn wrapper delegates to it. A plain .ts name would also work.)
 *
 *   ALTERNATIVE: colocate worker in the same file as the server fn and export
 *   both. Either approach is acceptable; the GREEN implementer should pick one
 *   and be consistent. The test imports from the worker path below — adjust if
 *   you colocate.
 *
 * IGDB ENDPOINT:
 *   POST /collections
 *   Query: fields id,name,games.id,games.name,games.slug,games.cover.image_id,games.game_type;
 *          where id = <collectionId>; limit 1;
 *   (mirrors `buildCollectionGamesQuery` in savepoint-app igdb-service.ts)
 *   IGDB does not natively paginate /collections games list — the full list is
 *   returned in one call and pagination is applied application-side. This is
 *   correct: collections are capped at a few hundred games in practice.
 *
 * GAME TYPE FILTERING:
 *   Apply ALLOWED_GAME_CATEGORIES filter (from @/shared/api/igdb/constants.ts)
 *   BEFORE computing total and before slicing for the page. Games with a
 *   game_type not in ALLOWED_GAME_CATEGORIES must be excluded from both the
 *   returned slice AND the total count. Games with game_type === undefined are
 *   treated as MAIN_GAME (allowed) — mirrors canonical IgdbService behavior.
 *
 * ORDERING:
 *   Games are returned in the order IGDB delivers them (the IGDB query sorts
 *   by games.first_release_date asc per the canonical buildCollectionGamesQuery).
 *   The contract does NOT re-sort application-side. Ordering stability across
 *   pages is guaranteed because the full list is fetched once and sliced
 *   application-side. Tests verify that page1 + page2 concatenated equals the
 *   natural full-list order from the IGDB fixture.
 *
 * NO DB UPSERT AT THIS LAYER:
 *   getRelatedGames does NOT upsert games into the local Game table. It returns
 *   read-through IGDB-shaped data: { igdbId, slug, title, coverImageId }.
 *   Rationale: pagination over a collection is a browsing operation; DB upsert
 *   happens later when the user clicks a specific game (add-game flow). Upserting
 *   all games in a potentially large collection on each page load would be wasteful
 *   and would bloat the Game table with games the user never interacts with.
 *   Consequence: the DB cleanup in beforeEach does NOT need to clear the Game table
 *   for these tests (no writes expected).
 *
 * ERROR CONTRACTS:
 *   - collectionId <= 0: throws ValidationError (Zod validation; the inputValidator
 *     catches it on cross-network calls, the worker re-validates and throws directly)
 *   - IGDB returns empty array for the collection: throws NotFoundError
 *   - pageSize > 50: throws ValidationError
 *   - page < 1: throws ValidationError
 *
 * RelatedGame shape (local, not a Prisma model):
 *   { igdbId: number; slug: string; title: string; coverImageId: string | null }
 *
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

// RED import — this module does not exist until the GREEN step (task 2 of Slice 14).
// The import path targets the plain async worker, which delegates from the
// createServerFn wrapper. Module-not-found IS the expected failure mode.
import { getRelatedGames } from "@/features/browse-related-games/api/get-related-games.worker";
import { __resetTokenCacheForTests } from "@/shared/api/igdb/token";
import { NotFoundError, ValidationError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// ---------------------------------------------------------------------------
// Isolated DB
// ---------------------------------------------------------------------------

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-related-games");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  // No DB upsert in this flow, but we still need users if we ever add
  // viewer-scoped assertions. Minimal cleanup for isolation.
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * A collection of 12 games with known igdbIds, slugs, and game_types.
 * Game indices 0–9: allowed (MAIN_GAME = 0 or DLC_ADDON = 1).
 * Game index 10: disallowed game_type = 3 (Bundle — not in ALLOWED_GAME_CATEGORIES).
 * Game index 11: disallowed game_type = 5 (Episode — not in ALLOWED_GAME_CATEGORIES).
 * After filtering: 10 games remain (indices 0–9). Total = 10.
 */
const COLLECTION_ID = 42;
const TOTAL_ALLOWED = 10; // games 0–9 pass the filter
const TOTAL_RAW = 12; // raw IGDB games including 2 disallowed types

function makeIgdbGame(index: number, overrides: { game_type?: number } = {}) {
  const gameType = overrides.game_type ?? (index % 2 === 0 ? 0 : 1); // alternate MAIN/DLC
  return {
    id: 10000 + index,
    name: `Related Game ${index + 1}`,
    slug: `related-game-${index + 1}`,
    cover: { image_id: `cover_${index + 1}` },
    game_type: gameType,
  };
}

// 10 allowed + 2 disallowed (indices 10 and 11 have disallowed game_type)
const ALLOWED_GAMES = Array.from({ length: 10 }, (_, i) => makeIgdbGame(i));
const DISALLOWED_GAME_BUNDLE = makeIgdbGame(10, { game_type: 3 });
const DISALLOWED_GAME_EPISODE = makeIgdbGame(11, { game_type: 5 });
const ALL_IGDB_GAMES = [...ALLOWED_GAMES, DISALLOWED_GAME_BUNDLE, DISALLOWED_GAME_EPISODE];

const FAKE_TOKEN_RESPONSE = {
  access_token: "tok",
  expires_in: 3600,
  token_type: "bearer",
};

function makeIgdbCollectionResponse(games = ALL_IGDB_GAMES) {
  return [
    {
      id: COLLECTION_ID,
      name: "Test Collection",
      games,
    },
  ];
}

// ---------------------------------------------------------------------------
// IGDB fetch mock (mirrors get-game-details.integration.test.ts pattern)
// ---------------------------------------------------------------------------

function makeFetchMock({
  igdbBody = makeIgdbCollectionResponse() as unknown,
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

describe("getRelatedGames", () => {
  // -------------------------------------------------------------------------
  // Page size
  // -------------------------------------------------------------------------

  describe("page size", () => {
    it("returns exactly pageSize games when the collection has more games than pageSize", async () => {
      // 10 allowed games, request 5 → get 5 back; total still 10; hasMore true
      const result = await getRelatedGames({
        collectionId: COLLECTION_ID,
        page: 1,
        pageSize: 5,
      });

      expect(result.games).toHaveLength(5);
      expect(result.total).toBe(TOTAL_ALLOWED);
      expect(result.hasMore).toBe(true);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(5);
    });

    it("returns remaining games on the last page (fewer than pageSize)", async () => {
      // 10 allowed games, pageSize 7 → page 2 has 3 games
      const result = await getRelatedGames({
        collectionId: COLLECTION_ID,
        page: 2,
        pageSize: 7,
      });

      expect(result.games).toHaveLength(3); // 10 - 7 = 3
      expect(result.total).toBe(TOTAL_ALLOWED);
      expect(result.hasMore).toBe(false);
    });

    it("returns all games when pageSize equals total", async () => {
      const result = await getRelatedGames({
        collectionId: COLLECTION_ID,
        page: 1,
        pageSize: TOTAL_ALLOWED,
      });

      expect(result.games).toHaveLength(TOTAL_ALLOWED);
      expect(result.hasMore).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Page numbering / offset — disjoint slices and stable order
  // -------------------------------------------------------------------------

  describe("page numbering", () => {
    it("returns disjoint slices on page 1 and page 2", async () => {
      const page1 = await getRelatedGames({
        collectionId: COLLECTION_ID,
        page: 1,
        pageSize: 4,
      });
      const page2 = await getRelatedGames({
        collectionId: COLLECTION_ID,
        page: 2,
        pageSize: 4,
      });

      // No igdbId overlap between pages
      const ids1 = new Set(page1.games.map((g) => g.igdbId));
      const ids2 = new Set(page2.games.map((g) => g.igdbId));
      for (const id of ids2) {
        expect(ids1.has(id)).toBe(false);
      }
    });

    it("page 1 + page 2 + page 3 concatenated equals the natural full list order", async () => {
      // pageSize 4 → pages: [0..3], [4..7], [8..9]
      const [p1, p2, p3] = await Promise.all([
        getRelatedGames({ collectionId: COLLECTION_ID, page: 1, pageSize: 4 }),
        getRelatedGames({ collectionId: COLLECTION_ID, page: 2, pageSize: 4 }),
        getRelatedGames({ collectionId: COLLECTION_ID, page: 3, pageSize: 4 }),
      ]);

      const combined = [...p1.games, ...p2.games, ...p3.games];
      expect(combined).toHaveLength(TOTAL_ALLOWED);

      // The expected order is the IGDB delivery order: ALLOWED_GAMES[0..9]
      const expectedIds = ALLOWED_GAMES.map((g) => g.id);
      const actualIds = combined.map((g) => g.igdbId);
      expect(actualIds).toEqual(expectedIds);
    });

    it("hasMore is false on the last page and true on all prior pages", async () => {
      // 10 games, pageSize 4 → pages 1 (4), 2 (4), 3 (2)
      const p1 = await getRelatedGames({ collectionId: COLLECTION_ID, page: 1, pageSize: 4 });
      const p2 = await getRelatedGames({ collectionId: COLLECTION_ID, page: 2, pageSize: 4 });
      const p3 = await getRelatedGames({ collectionId: COLLECTION_ID, page: 3, pageSize: 4 });

      expect(p1.hasMore).toBe(true);
      expect(p2.hasMore).toBe(true);
      expect(p3.hasMore).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Default page size
  // -------------------------------------------------------------------------

  describe("defaults", () => {
    it("uses page 1 and pageSize 20 when no params are provided", async () => {
      // Only 10 allowed games < 20 default page size → all returned, hasMore false
      const result = await getRelatedGames({ collectionId: COLLECTION_ID });

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.games).toHaveLength(TOTAL_ALLOWED);
      expect(result.hasMore).toBe(false);
    });

    it("uses page 1 when page is omitted", async () => {
      const result = await getRelatedGames({ collectionId: COLLECTION_ID, pageSize: 5 });

      expect(result.page).toBe(1);
      expect(result.games).toHaveLength(5);
    });

    it("uses pageSize 20 when pageSize is omitted", async () => {
      const result = await getRelatedGames({ collectionId: COLLECTION_ID, page: 1 });

      expect(result.pageSize).toBe(20);
    });
  });

  // -------------------------------------------------------------------------
  // Total count is the pre-pagination, post-filter count
  // -------------------------------------------------------------------------

  describe("total count", () => {
    it("total is constant across pages (always post-filter, pre-pagination count)", async () => {
      const [p1, p2] = await Promise.all([
        getRelatedGames({ collectionId: COLLECTION_ID, page: 1, pageSize: 3 }),
        getRelatedGames({ collectionId: COLLECTION_ID, page: 2, pageSize: 3 }),
      ]);

      expect(p1.total).toBe(TOTAL_ALLOWED);
      expect(p2.total).toBe(TOTAL_ALLOWED);
    });

    it("total does NOT include raw count — disallowed game_type games reduce total", async () => {
      // Raw fixture has 12 games, but 2 have disallowed types → total must be 10, not 12
      const result = await getRelatedGames({ collectionId: COLLECTION_ID, page: 1, pageSize: 20 });

      expect(result.total).toBe(TOTAL_ALLOWED);
      expect(result.total).not.toBe(TOTAL_RAW);
    });
  });

  // -------------------------------------------------------------------------
  // Game type filtering
  // -------------------------------------------------------------------------

  describe("game type filtering", () => {
    it("excludes games with disallowed game_type from returned games", async () => {
      const result = await getRelatedGames({ collectionId: COLLECTION_ID, page: 1, pageSize: 20 });

      const disallowedIgdbIds = [DISALLOWED_GAME_BUNDLE.id, DISALLOWED_GAME_EPISODE.id];
      for (const id of disallowedIgdbIds) {
        expect(result.games.some((g) => g.igdbId === id)).toBe(false);
      }
    });

    it("excludes games with disallowed game_type from the total count", async () => {
      // With all 12 raw games in the fixture, only 10 pass the filter
      const result = await getRelatedGames({ collectionId: COLLECTION_ID, page: 1, pageSize: 20 });

      expect(result.total).toBe(TOTAL_ALLOWED);
      expect(result.games.every((g) => g.igdbId !== DISALLOWED_GAME_BUNDLE.id)).toBe(true);
    });

    it("treats game_type === undefined as allowed (MAIN_GAME = 0 fallback)", async () => {
      // Override fixture: game without game_type field at all
      const gamesWithMissingType = [
        { id: 99001, name: "No Type Game", slug: "no-type-game", cover: { image_id: "c1" } },
        // explicitly no game_type key
      ];

      vi.stubGlobal(
        "fetch",
        makeFetchMock({
          igdbBody: [{ id: COLLECTION_ID, name: "Test Collection", games: gamesWithMissingType }],
        })
      );

      const result = await getRelatedGames({ collectionId: COLLECTION_ID, page: 1, pageSize: 5 });

      // Game without game_type should be included (treated as MAIN_GAME)
      expect(result.games).toHaveLength(1);
      expect(result.games[0]?.igdbId).toBe(99001);
      expect(result.total).toBe(1);
    });

    it("returns correct allowed games when all have disallowed type — 0 games, total 0, hasMore false", async () => {
      const allDisallowed = [
        makeIgdbGame(0, { game_type: 3 }), // Bundle — disallowed
        makeIgdbGame(1, { game_type: 5 }), // Episode — disallowed
      ];

      vi.stubGlobal(
        "fetch",
        makeFetchMock({
          igdbBody: [{ id: COLLECTION_ID, name: "Test Collection", games: allDisallowed }],
        })
      );

      const result = await getRelatedGames({ collectionId: COLLECTION_ID, page: 1, pageSize: 5 });

      expect(result.games).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Empty collection — NotFoundError
  // -------------------------------------------------------------------------

  describe("empty collection", () => {
    it("throws NotFoundError when IGDB returns an empty array for the collectionId", async () => {
      vi.stubGlobal("fetch", makeFetchMock({ igdbBody: [] }));

      await expect(
        getRelatedGames({ collectionId: COLLECTION_ID, page: 1, pageSize: 5 })
      ).rejects.toThrow(NotFoundError);
    });
  });

  // -------------------------------------------------------------------------
  // Ordering
  // -------------------------------------------------------------------------

  describe("ordering", () => {
    it("returns games in IGDB delivery order (stable across page boundaries)", async () => {
      const page1 = await getRelatedGames({ collectionId: COLLECTION_ID, page: 1, pageSize: 5 });
      const page2 = await getRelatedGames({ collectionId: COLLECTION_ID, page: 2, pageSize: 5 });

      // First page: games 0..4 (allowed only)
      expect(page1.games[0]?.igdbId).toBe(ALLOWED_GAMES[0]!.id);
      expect(page1.games[4]?.igdbId).toBe(ALLOWED_GAMES[4]!.id);

      // Second page: games 5..9 (allowed only)
      expect(page2.games[0]?.igdbId).toBe(ALLOWED_GAMES[5]!.id);
      expect(page2.games[4]?.igdbId).toBe(ALLOWED_GAMES[9]!.id);
    });

    it("page 1 last item igdbId is strictly different from page 2 first item igdbId", async () => {
      const [p1, p2] = await Promise.all([
        getRelatedGames({ collectionId: COLLECTION_ID, page: 1, pageSize: 3 }),
        getRelatedGames({ collectionId: COLLECTION_ID, page: 2, pageSize: 3 }),
      ]);

      const lastOfP1 = p1.games.at(-1)?.igdbId;
      const firstOfP2 = p2.games[0]?.igdbId;
      expect(lastOfP1).toBeDefined();
      expect(firstOfP2).toBeDefined();
      expect(lastOfP1).not.toBe(firstOfP2);
    });
  });

  // -------------------------------------------------------------------------
  // Returned game shape
  // -------------------------------------------------------------------------

  describe("returned game shape", () => {
    it("each game in the result has igdbId, slug, title, and coverImageId fields", async () => {
      const result = await getRelatedGames({
        collectionId: COLLECTION_ID,
        page: 1,
        pageSize: 3,
      });

      for (const game of result.games) {
        expect(typeof game.igdbId).toBe("number");
        expect(typeof game.slug).toBe("string");
        expect(typeof game.title).toBe("string");
        // coverImageId is string | null
        expect(game.coverImageId === null || typeof game.coverImageId === "string").toBe(true);
      }
    });

    it("coverImageId is null when IGDB game has no cover", async () => {
      const gamesNoCover = [
        { id: 88001, name: "No Cover Game", slug: "no-cover-game", game_type: 0 },
        // no cover field
      ];

      vi.stubGlobal(
        "fetch",
        makeFetchMock({
          igdbBody: [{ id: COLLECTION_ID, name: "Test Collection", games: gamesNoCover }],
        })
      );

      const result = await getRelatedGames({ collectionId: COLLECTION_ID, page: 1, pageSize: 5 });

      expect(result.games).toHaveLength(1);
      expect(result.games[0]?.coverImageId).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // No DB upsert — Game table remains empty after the call
  // -------------------------------------------------------------------------

  describe("no DB upsert", () => {
    it("does NOT insert any rows into the Game table (read-through IGDB only)", async () => {
      const before = await db.prisma.game.count();
      expect(before).toBe(0);

      await getRelatedGames({ collectionId: COLLECTION_ID, page: 1, pageSize: 5 });

      const after = await db.prisma.game.count();
      expect(after).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Validation errors
  // -------------------------------------------------------------------------

  describe("validation", () => {
    it("throws ValidationError when collectionId is 0", async () => {
      await expect(
        getRelatedGames({ collectionId: 0, page: 1, pageSize: 5 })
      ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when collectionId is negative", async () => {
      await expect(
        getRelatedGames({ collectionId: -1, page: 1, pageSize: 5 })
      ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when pageSize exceeds the max (50)", async () => {
      await expect(
        getRelatedGames({ collectionId: COLLECTION_ID, page: 1, pageSize: 51 })
      ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when page is 0 (must be >= 1)", async () => {
      await expect(
        getRelatedGames({ collectionId: COLLECTION_ID, page: 0, pageSize: 5 })
      ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when page is negative", async () => {
      await expect(
        getRelatedGames({ collectionId: COLLECTION_ID, page: -1, pageSize: 5 })
      ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when pageSize is 0 (must be >= 1)", async () => {
      await expect(
        getRelatedGames({ collectionId: COLLECTION_ID, page: 1, pageSize: 0 })
      ).rejects.toThrow(ValidationError);
    });

    it("accepts pageSize of exactly 50 (boundary: allowed)", async () => {
      // Should not throw — 10 allowed games < 50, so all returned
      const result = await getRelatedGames({ collectionId: COLLECTION_ID, page: 1, pageSize: 50 });
      expect(result.games).toHaveLength(TOTAL_ALLOWED);
    });

    it("accepts page 1 (boundary: allowed)", async () => {
      const result = await getRelatedGames({ collectionId: COLLECTION_ID, page: 1, pageSize: 5 });
      expect(result.page).toBe(1);
    });
  });
});
