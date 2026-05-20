/**
 * Integration test for `getGameDetails` Slice 17B canonical-aligned contract:
 *
 *   - Returns `{ game, igdbDetails, libraryEntry, journalTeaser, relatedGames }`.
 *   - `game` is a THIN Prisma row (title/slug/cover/releaseDate); NEVER stores
 *     summary/genres/platforms/screenshots/etc.
 *   - `igdbDetails` is the LIVE IGDB payload — the widget's source of truth
 *     for rich fields. Includes summary, genres, platforms, screenshots,
 *     involved_companies, themes, aggregated_rating, franchise.
 *   - Hits IGDB on EVERY call (no DB-side caching here; route loader + React
 *     cache() handle revalidation upstream — same as canonical Next 16
 *     "use cache" directive).
 *
 * Mirrors `savepoint-app/features/game-detail/use-cases/get-game-details.ts`.
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

import { getGameDetails } from "@/entities/game/api/get-game-details.server";
import { __resetTokenCacheForTests } from "@/shared/api/igdb/token";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-game-details-with-igdb-payload");
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

const IGDB_ID = 76340;
const GAME_SLUG = "elden-ring";

const FAKE_TOKEN_RESPONSE = {
  access_token: "tok",
  expires_in: 3600,
  token_type: "bearer",
};

const RICH_IGDB_PAYLOAD = {
  id: IGDB_ID,
  name: "Elden Ring",
  slug: GAME_SLUG,
  summary: "A new fantasy action-RPG developed by FromSoftware.",
  aggregated_rating: 96.5,
  first_release_date: 1645747200,
  cover: { image_id: "co5s5v" },
  genres: [
    { id: 12, name: "Role-playing (RPG)" },
    { id: 31, name: "Adventure" },
  ],
  platforms: [
    {
      id: 6,
      name: "PC (Microsoft Windows)",
      slug: "win",
      abbreviation: "PC",
    },
    { id: 167, name: "PlayStation 5", slug: "ps5", abbreviation: "PS5" },
  ],
  screenshots: [{ id: 1, image_id: "sc1" }],
  themes: [{ id: 17, name: "Fantasy" }],
  involved_companies: [
    {
      developer: true,
      publisher: false,
      company: { id: 100, name: "FromSoftware" },
    },
  ],
  franchise: 42,
};

let igdbHitCount = 0;

function makeFetchMock(body: unknown = [RICH_IGDB_PAYLOAD]) {
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
      igdbHitCount += 1;
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => body,
      } as Response);
    }
    return Promise.reject(new Error(`Unexpected fetch URL in test: ${url}`));
  });
}

beforeEach(() => {
  igdbHitCount = 0;
  __resetTokenCacheForTests();
  vi.stubGlobal("fetch", makeFetchMock());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getGameDetails — canonical dual-track contract", () => {
  describe("given a fresh DB", () => {
    let result: Awaited<ReturnType<typeof getGameDetails>>;

    beforeEach(async () => {
      result = await getGameDetails({ slug: GAME_SLUG });
    });

    it("returns the live IGDB payload as `igdbDetails`", () => {
      expect(result.igdbDetails.summary).toBe(RICH_IGDB_PAYLOAD.summary);
      expect(result.igdbDetails.aggregated_rating).toBe(96.5);
    });

    it("returns genres on `igdbDetails`", () => {
      const names = result.igdbDetails.genres?.map((g) => g.name).sort();
      expect(names).toStrictEqual(["Adventure", "Role-playing (RPG)"]);
    });

    it("returns platforms on `igdbDetails`", () => {
      const names = result.igdbDetails.platforms?.map((p) => p.name).sort();
      expect(names).toStrictEqual(["PC (Microsoft Windows)", "PlayStation 5"]);
    });

    it("returns screenshots on `igdbDetails`", () => {
      expect(result.igdbDetails.screenshots).toHaveLength(1);
      expect(result.igdbDetails.screenshots?.[0]?.image_id).toBe("sc1");
    });

    it("returns involved_companies on `igdbDetails`", () => {
      const developer = result.igdbDetails.involved_companies?.find(
        (c) => c.developer
      );
      expect(developer?.company.name).toBe("FromSoftware");
    });

    it("persists a THIN Game row — title/slug/cover/releaseDate only", async () => {
      const row = await db.prisma.game.findUnique({
        where: { slug: GAME_SLUG },
      });
      expect(row).not.toBeNull();
      expect(row?.title).toBe(RICH_IGDB_PAYLOAD.name);
      expect(row?.slug).toBe(GAME_SLUG);
      expect(row?.coverImage).toContain("co5s5v");
      // Rich fields MUST NOT be written to Prisma.
      expect(row?.description).toBeNull();
    });

    it("does NOT create Genre rows from the detail-page flow", async () => {
      const genres = await db.prisma.genre.findMany();
      expect(genres).toHaveLength(0);
    });

    it("does NOT create Platform rows from the detail-page flow", async () => {
      const platforms = await db.prisma.platform.findMany();
      expect(platforms).toHaveLength(0);
    });
  });

  describe("given a slug that IGDB does not know", () => {
    it("throws NotFoundError when IGDB returns an empty array", async () => {
      vi.stubGlobal("fetch", makeFetchMock([]));

      await expect(getGameDetails({ slug: "no-such-slug" })).rejects.toThrow(
        /Game not found/
      );
    });
  });

  describe("given a second call for the same slug", () => {
    beforeEach(async () => {
      await getGameDetails({ slug: GAME_SLUG });
      igdbHitCount = 0;
    });

    it("hits IGDB again (no entity-level cache; loader cache handles this upstream)", async () => {
      await getGameDetails({ slug: GAME_SLUG });

      expect(igdbHitCount).toBeGreaterThan(0);
    });

    it("does NOT create a duplicate Game row", async () => {
      await getGameDetails({ slug: GAME_SLUG });

      const games = await db.prisma.game.findMany({
        where: { slug: GAME_SLUG },
      });
      expect(games).toHaveLength(1);
    });
  });
});
