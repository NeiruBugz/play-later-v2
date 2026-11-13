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
  upsertThinGameFromIgdbDetailsPayload,
} from "@/entities/game/api/upsert-game.server";
import releaseDatesFixture from "@/shared/api/igdb/__fixtures__/release-dates-live-2026-11-12.json";
import { __resetTokenCacheForTests } from "@/shared/api/igdb/token";

import { createGame } from "../factories/index.ts";
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

  describe("concurrent first upserts", () => {
    const payload = {
      id: 424242,
      name: "Race Game",
      slug: "race-game",
      first_release_date: 1645747200,
    };

    it("resolves both payload upserts to the same row without error", async () => {
      const results = await Promise.all([
        upsertGameFromIgdbPayload(payload),
        upsertGameFromIgdbPayload(payload),
        upsertGameFromIgdbPayload(payload),
      ]);

      expect(new Set(results.map((game) => game.id)).size).toBe(1);
      expect(
        await db.prisma.game.count({ where: { igdbId: payload.id } })
      ).toBe(1);
    });

    it("resolves both thin-details upserts to the same row without error", async () => {
      const results = await Promise.all([
        upsertThinGameFromIgdbDetailsPayload(payload as never),
        upsertThinGameFromIgdbDetailsPayload(payload as never),
        upsertThinGameFromIgdbDetailsPayload(payload as never),
      ]);

      expect(new Set(results.map((game) => game.id)).size).toBe(1);
      expect(
        await db.prisma.game.count({ where: { igdbId: payload.id } })
      ).toBe(1);
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

// ---------------------------------------------------------------------------
// Spec 029: release date and precision stored when a game is first added
// ---------------------------------------------------------------------------

type LiveReleaseGame =
  (typeof releaseDatesFixture.games)[keyof typeof releaseDatesFixture.games];

const utcMidnight = (isoDay: string) => new Date(`${isoDay}T00:00:00.000Z`);

function igdbPayloadFrom(liveGame: LiveReleaseGame) {
  return { ...liveGame, slug: `live-${liveGame.id}` };
}

function legacyDayPayload() {
  const { id, name, first_release_date } = releaseDatesFixture.games.day;
  return { id, name, slug: `live-${id}`, first_release_date };
}

type StoredGame = Awaited<ReturnType<typeof upsertGameFromIgdbPayload>>;

const SECONDS_IN_AN_HOUR = 3600;
const SECONDS_IN_A_DAY = 86_400;

describe("upsertGameFromIgdbPayload release date", () => {
  const { games } = releaseDatesFixture;

  describe.each([
    {
      case: "an exact day",
      liveGame: games.day,
      releaseDate: "2026-11-13",
      precision: "DAY",
    },
    {
      case: "a month",
      liveGame: games.month,
      releaseDate: "2026-12-01",
      precision: "MONTH",
    },
    {
      case: "a year",
      liveGame: games.year,
      releaseDate: "2026-01-01",
      precision: "YEAR",
    },
    {
      case: "the first quarter",
      liveGame: games.q1,
      releaseDate: "2027-01-01",
      precision: "QUARTER",
    },
    {
      case: "the fourth quarter",
      liveGame: games.q4,
      releaseDate: "2026-10-01",
      precision: "QUARTER",
    },
    {
      case: "a full release after earlier alpha and beta entries",
      liveGame: games.mixedStatuses,
      releaseDate: "2027-07-01",
      precision: "QUARTER",
    },
    {
      case: "an exact early date followed by vaguer later entries",
      liveGame: games.exactEarlyVagueLater,
      releaseDate: "2026-03-03",
      precision: "DAY",
    },
  ])("given IGDB knows the release as $case", (scenario) => {
    let before: Date;
    let game: StoredGame;

    beforeEach(async () => {
      before = new Date();
      game = await upsertGameFromIgdbPayload(
        igdbPayloadFrom(scenario.liveGame)
      );
    });

    it("stores the first day of the period at UTC midnight", () => {
      expect(game.releaseDate).toEqual(utcMidnight(scenario.releaseDate));
    });

    it("stores how precisely the date is known", () => {
      expect(game.releaseDatePrecision).toBe(scenario.precision);
    });

    it("stamps the moment the date was checked", () => {
      const checkedAt = game.releaseDateCheckedAt;
      expect(checkedAt?.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(checkedAt?.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("given IGDB lists the release as to be announced", () => {
    let game: StoredGame;

    beforeEach(async () => {
      game = await upsertGameFromIgdbPayload(igdbPayloadFrom(games.tbd));
    });

    it("stores no date", () => {
      expect(game.releaseDate).toBeNull();
    });

    it("stores the to-be-announced precision", () => {
      expect(game.releaseDatePrecision).toBe("TBA");
    });

    it("stamps the moment the date was checked", () => {
      expect(game.releaseDateCheckedAt).toBeInstanceOf(Date);
    });
  });

  describe("given IGDB has dated entries but no first release date", () => {
    let game: StoredGame;

    beforeEach(async () => {
      game = await upsertGameFromIgdbPayload(
        igdbPayloadFrom(games.noFirstReleaseDate)
      );
    });

    it("stores no date and no precision", () => {
      expect(game.releaseDate).toBeNull();
      expect(game.releaseDatePrecision).toBeNull();
    });

    it("still records that the catalogue was checked", () => {
      expect(game.releaseDateCheckedAt).toBeInstanceOf(Date);
    });
  });

  describe("given a payload without release dates", () => {
    let game: StoredGame;

    beforeEach(async () => {
      game = await upsertGameFromIgdbPayload(legacyDayPayload());
    });

    it("keeps the first release date", () => {
      expect(game.releaseDate).toEqual(utcMidnight("2026-11-13"));
    });

    it("leaves the precision unknown", () => {
      expect(game.releaseDatePrecision).toBeNull();
    });

    it("leaves the game unchecked", () => {
      expect(game.releaseDateCheckedAt).toBeNull();
    });
  });

  describe("given a payload without release dates whose first release date has a time of day", () => {
    let game: StoredGame;

    beforeEach(async () => {
      game = await upsertGameFromIgdbPayload({
        ...legacyDayPayload(),
        first_release_date: games.day.first_release_date + SECONDS_IN_AN_HOUR,
      });
    });

    it("adds the game with the same UTC day at midnight", () => {
      expect(game.releaseDate).toEqual(utcMidnight("2026-11-13"));
    });

    it("leaves the game unchecked", () => {
      expect(game.releaseDateCheckedAt).toBeNull();
    });
  });

  describe("given release dates that cannot explain the first release date", () => {
    let game: StoredGame;

    beforeEach(async () => {
      game = await upsertGameFromIgdbPayload({
        ...igdbPayloadFrom(games.day),
        first_release_date: games.day.first_release_date + SECONDS_IN_A_DAY,
      });
    });

    it("keeps the first release date", () => {
      expect(game.releaseDate).toEqual(utcMidnight("2026-11-14"));
    });

    it("leaves the precision unknown and the game unchecked", () => {
      expect(game.releaseDatePrecision).toBeNull();
      expect(game.releaseDateCheckedAt).toBeNull();
    });
  });

  describe("given release dates that cannot explain a first release date with a time of day", () => {
    let game: StoredGame;

    beforeEach(async () => {
      game = await upsertGameFromIgdbPayload({
        ...igdbPayloadFrom(games.day),
        first_release_date: games.day.first_release_date + SECONDS_IN_AN_HOUR,
      });
    });

    it("adds the game with the same UTC day at midnight", () => {
      expect(game.releaseDate).toEqual(utcMidnight("2026-11-13"));
    });

    it("leaves the precision unknown and the game unchecked", () => {
      expect(game.releaseDatePrecision).toBeNull();
      expect(game.releaseDateCheckedAt).toBeNull();
    });
  });

  describe("given a release date in a format IGDB has not documented", () => {
    let game: StoredGame;

    beforeEach(async () => {
      game = await upsertGameFromIgdbPayload({
        ...igdbPayloadFrom(games.day),
        release_dates: [{ ...games.day.release_dates[0], date_format: 99 }],
      });
    });

    it("keeps the first release date", () => {
      expect(game.releaseDate).toEqual(utcMidnight("2026-11-13"));
    });

    it("leaves the precision unknown and the game unchecked", () => {
      expect(game.releaseDatePrecision).toBeNull();
      expect(game.releaseDateCheckedAt).toBeNull();
    });
  });

  describe("given the game is already stored with a checked date", () => {
    const storedReleaseDate = utcMidnight("2027-03-14");
    const storedCheckedAt = new Date("2026-11-01T08:00:00.000Z");
    let game: StoredGame;

    beforeEach(async () => {
      await createGame(db.prisma, {
        igdbId: games.year.id,
        slug: "already-stored",
        releaseDate: storedReleaseDate,
        releaseDatePrecision: "DAY",
        releaseDateCheckedAt: storedCheckedAt,
      });

      game = await upsertGameFromIgdbPayload(igdbPayloadFrom(games.year));
    });

    it("returns the stored release fields untouched", () => {
      expect(game).toMatchObject({
        releaseDate: storedReleaseDate,
        releaseDatePrecision: "DAY",
        releaseDateCheckedAt: storedCheckedAt,
      });
    });

    it("leaves the stored row as it was", async () => {
      const row = await db.prisma.game.findUniqueOrThrow({
        where: { igdbId: games.year.id },
      });

      expect(row).toMatchObject({
        releaseDate: storedReleaseDate,
        releaseDatePrecision: "DAY",
        releaseDateCheckedAt: storedCheckedAt,
      });
    });
  });
});

describe("upsertGameFromIgdb release date", () => {
  describe("given IGDB answers the lookup with an exact upcoming day", () => {
    let game: Awaited<ReturnType<typeof upsertGameFromIgdb>>;

    beforeEach(async () => {
      vi.stubGlobal(
        "fetch",
        makeFetchMock({
          igdbResponse: {
            body: [igdbPayloadFrom(releaseDatesFixture.games.day)],
          },
        })
      );

      game = await upsertGameFromIgdb(releaseDatesFixture.games.day.id);
    });

    it("stores the day and its precision", () => {
      expect(game).toMatchObject({
        releaseDate: utcMidnight("2026-11-13"),
        releaseDatePrecision: "DAY",
      });
    });

    it("stamps the moment the date was checked", () => {
      expect(game.releaseDateCheckedAt).toBeInstanceOf(Date);
    });
  });
});
