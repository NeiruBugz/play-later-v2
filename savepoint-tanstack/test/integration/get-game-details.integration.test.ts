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
 *   libraryEntry: LibraryItem | null;
 *   notes: JournalTimelineEntry[]; // the viewer's notes, newest first; [] when anon or none
 *   playtimeTotalMinutes: number;  // SUM(playedMinutes), null-safe → 0
 *   recentSessionMinutes: number[]; // recent non-null playedMinutes, oldest→newest, ~9
 * }>
 *
 * Throws NotFoundError when IGDB returns an empty array for the given slug.
 *
 * Notes for impl agent:
 *   - Slug → IGDB lookup: IGDB `/games` endpoint accepts `where slug = "<slug>"`
 *     (see `getGameDetailsFromIgdb`).
 *   - After resolving the IGDB game, call `upsertGameFromIgdb(igdbId)` for the
 *     DB cache step (or inline equivalent).
 *   - `libraryEntry`: when `userId` provided, return the most-recent LibraryItem
 *     for (userId, gameId) or null if none exists.
 *   - `notes`: when `userId` provided, return every note for (userId, gameId)
 *     ordered by createdAt DESC; empty array otherwise.
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
import { setLibraryItemStatus } from "@/entities/library-item/api/set-library-item-status.server";
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
  await db.prisma.playthrough.deleteMany();
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
    it("returns the resolved game, null libraryEntry, and empty notes", async () => {
      const result = await getGameDetails({ slug: GAME_SLUG });

      expect(result.game).toBeDefined();
      expect(result.game.slug).toBe(GAME_SLUG);
      expect(result.game.igdbId).toBe(IGDB_ID);
      expect(result.game.title).toBe(MOCK_IGDB_GAME.name);

      expect(result.libraryEntry).toBeNull();
      expect(result.notes).toEqual([]);
    });

    it("zeroes all personal aggregates for an anonymous viewer", async () => {
      const result = await getGameDetails({ slug: GAME_SLUG });

      expect(result.notes).toEqual([]);
      expect(result.playtimeTotalMinutes).toBe(0);
      expect(result.recentSessionMinutes).toEqual([]);
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

    it("returns null libraryEntry and empty notes", async () => {
      const result = await getGameDetails({
        slug: GAME_SLUG,
        userId: "ggd-user-alice",
      });

      expect(result.game.slug).toBe(GAME_SLUG);
      expect(result.libraryEntry).toBeNull();
      expect(result.notes).toEqual([]);
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
      // Create 4 entries — all are returned, newest first.
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

    it("returns every note exactly once, newest first by createdAt", async () => {
      const result = await getGameDetails({
        slug: GAME_SLUG,
        userId: "ggd-user-carol",
      });

      expect(result.notes.map((note) => note.content)).toEqual([
        "Journal entry 4",
        "Journal entry 3",
        "Journal entry 2",
        "Journal entry 1",
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // Personal aggregates — playtimeTotalMinutes, recentSessionMinutes
  // -------------------------------------------------------------------------

  describe("personal aggregates across many entries", () => {
    const USER_ID = "ggd-user-dave";
    // playedMinutes for 12 entries in createdAt order (entry 1 = oldest).
    // Some are null to exercise null-safety and the non-null series filter.
    const MINUTES_BY_INDEX: Array<number | null> = [
      30, // 1 (oldest)
      null, // 2
      45, // 3
      60, // 4
      null, // 5
      15, // 6
      90, // 7
      20, // 8
      25, // 9
      35, // 10
      40, // 11
      50, // 12 (newest)
    ];

    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("dave") });
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
      for (let i = 0; i < MINUTES_BY_INDEX.length; i++) {
        const day = String(i + 1).padStart(2, "0");
        await db.prisma.journalEntry.create({
          data: {
            userId: USER_ID,
            gameId: game!.id,
            content: `Journal entry ${i + 1}`,
            kind: "QUICK",
            playedMinutes: MINUTES_BY_INDEX[i],
            createdAt: new Date(`2024-01-${day}T00:00:00.000Z`),
            updatedAt: new Date(`2024-01-${day}T00:00:00.000Z`),
          },
        });
      }
    });

    it("returns all of the viewer's notes", async () => {
      const result = await getGameDetails({ slug: GAME_SLUG, userId: USER_ID });

      expect(result.notes).toHaveLength(MINUTES_BY_INDEX.length);
    });

    it("sums the notes' playedMinutes into playtimeTotalMinutes (no run or library entry needed)", async () => {
      const result = await getGameDetails({ slug: GAME_SLUG, userId: USER_ID });

      expect(result.playtimeTotalMinutes).toBe(410);
    });

    it("counts only entries with logged minutes, not every journal entry", async () => {
      const result = await getGameDetails({ slug: GAME_SLUG, userId: USER_ID });

      const expectedWithMinutes = MINUTES_BY_INDEX.filter(
        (m) => m !== null
      ).length;
      expect(result.playtimeSessionCount).toBe(expectedWithMinutes);
      // The null entries make this strictly smaller than the note count — the
      // gap is exactly what would dilute an "average session" computed off
      // every note.
      expect(result.playtimeSessionCount).toBeLessThan(result.notes.length);
    });

    it("returns the most-recent non-null playedMinutes series oldest→newest, bounded to ~9", async () => {
      const result = await getGameDetails({ slug: GAME_SLUG, userId: USER_ID });

      // Non-null minutes in createdAt order:
      // 30,45,60,15,90,20,25,35,40,50 (10 values). Bounded to the most recent 9
      // and presented oldest→newest for a left-to-right rhythm chart.
      expect(result.recentSessionMinutes).toEqual([
        45, 60, 15, 90, 20, 25, 35, 40, 50,
      ]);
      expect(result.recentSessionMinutes.length).toBeLessThanOrEqual(9);
    });
  });

  describe("personal aggregates with entries but no logged minutes", () => {
    const USER_ID = "ggd-user-erin";

    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("erin") });
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
      await db.prisma.journalEntry.create({
        data: {
          userId: USER_ID,
          gameId: game!.id,
          content: "No minutes logged",
          kind: "QUICK",
          playedMinutes: null,
        },
      });
    });

    it("reports zero total playtime and an empty session series when no minutes are logged", async () => {
      const result = await getGameDetails({ slug: GAME_SLUG, userId: USER_ID });

      expect(result.notes).toHaveLength(1);
      expect(result.playtimeTotalMinutes).toBe(0);
      expect(result.playtimeSessionCount).toBe(0);
      expect(result.recentSessionMinutes).toEqual([]);
    });
  });

  describe("signed-in with no entries at all", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("frank") });
    });

    it("zeroes notes, playtime, and the session series", async () => {
      const result = await getGameDetails({
        slug: GAME_SLUG,
        userId: "ggd-user-frank",
      });

      expect(result.notes).toEqual([]);
      expect(result.playtimeTotalMinutes).toBe(0);
      expect(result.recentSessionMinutes).toEqual([]);
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
          status: "DONE",
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

    it("does not return user A's notes when queried as user B", async () => {
      const result = await getGameDetails({
        slug: GAME_SLUG,
        userId: "ggd-user-userB",
      });

      expect(result.notes).toEqual([]);
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

  // -------------------------------------------------------------------------
  // Spec 016 — Per-Playthrough Logs
  // New fields: playthroughs.
  // playtimeTotalMinutes source changed to Σ playthroughs.playtimeMinutes.
  // -------------------------------------------------------------------------

  // Helper: seed a user + game + library entry; returns { gameId, libraryItemId }.
  async function seedUserAndLibrary(
    userSuffix: string,
    status: "WANT" | "PLAYING" | "DONE" = "WANT"
  ) {
    await db.prisma.user.create({ data: makeUser(userSuffix) });
    await db.prisma.game.create({
      data: {
        igdbId: IGDB_ID,
        title: MOCK_IGDB_GAME.name,
        slug: GAME_SLUG,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    });
    const game = await db.prisma.game.findUniqueOrThrow({
      where: { slug: GAME_SLUG },
    });
    const libraryItem = await db.prisma.libraryItem.create({
      data: {
        userId: `ggd-user-${userSuffix}`,
        gameId: game.id,
        status,
        acquisitionType: "DIGITAL",
      },
    });
    return { gameId: game.id, libraryItemId: libraryItem.id };
  }

  describe("Spec 016 — playthroughs and derived fields", () => {
    // Anonymous viewer
    describe("anonymous viewer", () => {
      it("returns empty history, zero playtimeTotalMinutes", async () => {
        const result = await getGameDetails({ slug: GAME_SLUG });

        expect(result.history).toEqual([]);
        expect(result.playtimeTotalMinutes).toBe(0);
      });

      it("still populates journal-derived fields from zero entries for anonymous viewer", async () => {
        const result = await getGameDetails({ slug: GAME_SLUG });

        expect(result.notes).toEqual([]);
        expect(result.playtimeSessionCount).toBe(0);
        expect(result.recentSessionMinutes).toEqual([]);
      });
    });

    // Authed — no library entry
    describe("authed viewer with no library entry", () => {
      beforeEach(async () => {
        await db.prisma.user.create({ data: makeUser("pt-noentry") });
        await db.prisma.game.create({
          data: {
            igdbId: IGDB_ID,
            title: MOCK_IGDB_GAME.name,
            slug: GAME_SLUG,
            createdAt: new Date("2024-01-01T00:00:00.000Z"),
            updatedAt: new Date("2024-01-01T00:00:00.000Z"),
          },
        });
      });

      it("returns empty history, zero playtime", async () => {
        const result = await getGameDetails({
          slug: GAME_SLUG,
          userId: "ggd-user-pt-noentry",
        });

        expect(result.history).toEqual([]);
        expect(result.playtimeTotalMinutes).toBe(0);
      });
    });

    // Authed — library entry exists but no runs
    describe("authed viewer with library entry and no plays", () => {
      it("returns empty history and zero playtime", async () => {
        await seedUserAndLibrary("pt-noruns", "WANT");

        const result = await getGameDetails({
          slug: GAME_SLUG,
          userId: "ggd-user-pt-noruns",
        });

        expect(result.history).toEqual([]);
        expect(result.playtimeTotalMinutes).toBe(0);
      });
    });

    // Authed — one PLAYING run
    describe("authed viewer with one PLAYING playthrough (90 min)", () => {
      it("returns one run; its playtime does not feed playtimeTotalMinutes", async () => {
        const { libraryItemId } = await seedUserAndLibrary(
          "pt-playing",
          "PLAYING"
        );
        await db.prisma.playthrough.create({
          data: {
            libraryItemId,
            ordinal: 1,
            status: "PLAYING",
            playtimeMinutes: 90,
          },
        });

        const result = await getGameDetails({
          slug: GAME_SLUG,
          userId: "ggd-user-pt-playing",
        });

        expect(result.history).toEqual([]);
        expect(result.playtimeTotalMinutes).toBe(0);
      });
    });

    // Authed — one FINISHED run
    describe("authed viewer with one FINISHED playthrough (600 min)", () => {
      it("returns one run; its playtime does not feed playtimeTotalMinutes", async () => {
        const { libraryItemId } = await seedUserAndLibrary(
          "pt-finished",
          "DONE"
        );
        await db.prisma.playthrough.create({
          data: {
            libraryItemId,
            ordinal: 1,
            status: "FINISHED",
            playtimeMinutes: 600,
            finishedAt: new Date("2024-03-01T00:00:00.000Z"),
          },
        });

        const result = await getGameDetails({
          slug: GAME_SLUG,
          userId: "ggd-user-pt-finished",
        });

        expect(result.history).toHaveLength(1);
        expect(result.playtimeTotalMinutes).toBe(0);
      });
    });

    // Authed — FINISHED + ABANDONED runs
    describe("authed viewer with FINISHED and ABANDONED playthroughs", () => {
      it("returns both runs without summing their playtime", async () => {
        const { libraryItemId } = await seedUserAndLibrary("pt-multi", "DONE");
        await db.prisma.playthrough.create({
          data: {
            libraryItemId,
            ordinal: 1,
            status: "FINISHED",
            playtimeMinutes: 400,
            finishedAt: new Date("2024-03-01T00:00:00.000Z"),
          },
        });
        await db.prisma.playthrough.create({
          data: {
            libraryItemId,
            ordinal: 2,
            status: "ABANDONED",
            playtimeMinutes: 150,
            finishedAt: new Date("2024-04-01T00:00:00.000Z"),
          },
        });

        const result = await getGameDetails({
          slug: GAME_SLUG,
          userId: "ggd-user-pt-multi",
        });

        expect(result.history).toHaveLength(2);
        expect(result.playtimeTotalMinutes).toBe(0);
      });
    });

    // -----------------------------------------------------------------------
    // REGRESSION: playtime-source change (decision #3)
    // The journal sum DIFFERS from the run sum — assert we read from runs.
    // -----------------------------------------------------------------------
    describe("playtime-source regression guard — notes sum vs run sum", () => {
      it("uses Σ notes playedMinutes, NOT Σ playthroughs.playtimeMinutes", async () => {
        const { libraryItemId, gameId } = await seedUserAndLibrary(
          "pt-source",
          "DONE"
        );

        // Create a playthrough with playtimeMinutes = 300.
        const playthrough = await db.prisma.playthrough.create({
          data: {
            libraryItemId,
            ordinal: 1,
            status: "FINISHED",
            playtimeMinutes: 300,
          },
        });

        // Journal entries attached to this run with a DIFFERENT total (50+50 = 100).
        // This difference is deliberate — the test verifies which source wins.
        await db.prisma.journalEntry.create({
          data: {
            userId: "ggd-user-pt-source",
            gameId,
            playthroughId: playthrough.id,
            content: "Session 1",
            kind: "QUICK",
            playedMinutes: 50,
          },
        });
        await db.prisma.journalEntry.create({
          data: {
            userId: "ggd-user-pt-source",
            gameId,
            playthroughId: playthrough.id,
            content: "Session 2",
            kind: "QUICK",
            playedMinutes: 50,
          },
        });

        const result = await getGameDetails({
          slug: GAME_SLUG,
          userId: "ggd-user-pt-source",
        });

        // Journal sum = 100; run sum = 300. Assert the notes win.
        expect(result.playtimeTotalMinutes).toBe(100);
        expect(result.playtimeSessionCount).toBe(2);
      });

      it("90 min + 30 min notes read as 120 minutes over 2 sessions, ignoring text-only notes", async () => {
        const { gameId } = await seedUserAndLibrary("pt-sum", "PLAYING");
        const userId = "ggd-user-pt-sum";
        await db.prisma.journalEntry.createMany({
          data: [
            { userId, gameId, content: "", playedMinutes: 90 },
            { userId, gameId, content: "", playedMinutes: 30 },
            { userId, gameId, content: "just a thought" },
          ],
        });

        const result = await getGameDetails({ slug: GAME_SLUG, userId });

        expect(result.playtimeTotalMinutes).toBe(120);
        expect(result.playtimeSessionCount).toBe(2);
      });
    });

    describe("history (ended plays)", () => {
      it("lists two ended plays newest first after Done, Play again, Done", async () => {
        const { libraryItemId } = await seedUserAndLibrary("pt-again", "WANT");
        const userId = "ggd-user-pt-again";

        vi.useFakeTimers({ toFake: ["Date"] });
        try {
          vi.setSystemTime(new Date("2024-03-03T10:00:00.000Z"));
          await setLibraryItemStatus(userId, libraryItemId, "PLAYING");
          vi.setSystemTime(new Date("2024-03-20T10:00:00.000Z"));
          await setLibraryItemStatus(userId, libraryItemId, "DONE");
          vi.setSystemTime(new Date("2024-05-01T10:00:00.000Z"));
          await setLibraryItemStatus(userId, libraryItemId, "PLAYING");
          vi.setSystemTime(new Date("2024-05-09T10:00:00.000Z"));
          await setLibraryItemStatus(userId, libraryItemId, "DONE");
        } finally {
          vi.useRealTimers();
        }

        const result = await getGameDetails({ slug: GAME_SLUG, userId });

        expect(
          result.history.map((play) => [
            play.startedAt?.toISOString(),
            play.finishedAt.toISOString(),
          ])
        ).toEqual([
          ["2024-05-01T10:00:00.000Z", "2024-05-09T10:00:00.000Z"],
          ["2024-03-03T10:00:00.000Z", "2024-03-20T10:00:00.000Z"],
        ]);
      });

      it("is empty for a never-played game", async () => {
        await seedUserAndLibrary("pt-never", "WANT");

        const result = await getGameDetails({
          slug: GAME_SLUG,
          userId: "ggd-user-pt-never",
        });

        expect(result.history).toEqual([]);
      });

      it("is empty for another viewer of the same game", async () => {
        const { libraryItemId } = await seedUserAndLibrary("pt-owner", "DONE");
        await db.prisma.playthrough.create({
          data: {
            libraryItemId,
            ordinal: 1,
            status: "FINISHED",
            finishedAt: new Date("2024-03-01T00:00:00.000Z"),
          },
        });
        await db.prisma.user.create({ data: makeUser("pt-other") });

        const result = await getGameDetails({
          slug: GAME_SLUG,
          userId: "ggd-user-pt-other",
        });

        expect(result.history).toEqual([]);
      });

      it("carries no playthroughs payload and a single rating", async () => {
        const { libraryItemId } = await seedUserAndLibrary("pt-shape", "DONE");
        await db.prisma.libraryItem.update({
          where: { id: libraryItemId },
          data: { rating: 7 },
        });
        await db.prisma.playthrough.create({
          data: {
            libraryItemId,
            ordinal: 1,
            status: "FINISHED",
            rating: 9,
            finishedAt: new Date("2024-03-01T00:00:00.000Z"),
          },
        });

        const result = await getGameDetails({
          slug: GAME_SLUG,
          userId: "ggd-user-pt-shape",
        });

        expect(result).not.toHaveProperty("playthroughs");
        expect(result.libraryEntry?.rating).toBe(7);
        expect(JSON.stringify(result.history)).not.toContain("rating");
        expect(JSON.stringify(result.history)).not.toContain("journalEntries");
      });
    });
  });
});
