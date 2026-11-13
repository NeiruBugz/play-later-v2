import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getGamesDueReleaseCheck } from "@/entities/game/api/get-games-due-release-check.server";

import {
  createGame,
  createLibraryItem,
  createUser,
} from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-games-due-release-check");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

const NOW = new Date("2026-11-12T12:00:00Z");

const utcMidnight = (day: string) => new Date(`${day}T00:00:00Z`);
const hoursBefore = (hours: number) =>
  new Date(NOW.getTime() - hours * 3_600_000);
const daysBefore = (days: number) => hoursBefore(days * 24);

type ReleaseState = {
  releaseDate: Date | null;
  releaseDatePrecision: "DAY" | "MONTH" | "QUARTER" | "YEAR" | "TBA" | null;
  releaseDateCheckedAt: Date | null;
};

const libraryGameOf = async (userId: string, state: ReleaseState) => {
  const game = await createGame(db.prisma, state);
  await createLibraryItem(db.prisma, { userId, gameId: game.id });
  return game;
};

const dueIdsFor = async (userId: string) =>
  (await getGamesDueReleaseCheck(userId, NOW)).map((game) => game.id).sort();

describe("getGamesDueReleaseCheck", () => {
  describe("given a library mixing games that are due and games that are not", () => {
    let userId: string;
    let expectedDueIds: string[];

    beforeEach(async () => {
      userId = (await createUser(db.prisma)).id;

      const dueGames = await Promise.all([
        libraryGameOf(userId, {
          releaseDate: utcMidnight("2027-03-14"),
          releaseDatePrecision: "DAY",
          releaseDateCheckedAt: null,
        }),
        libraryGameOf(userId, {
          releaseDate: utcMidnight("2026-11-17"),
          releaseDatePrecision: "DAY",
          releaseDateCheckedAt: daysBefore(2),
        }),
        libraryGameOf(userId, {
          releaseDate: utcMidnight("2027-04-01"),
          releaseDatePrecision: "QUARTER",
          releaseDateCheckedAt: daysBefore(8),
        }),
        libraryGameOf(userId, {
          releaseDate: null,
          releaseDatePrecision: "TBA",
          releaseDateCheckedAt: daysBefore(8),
        }),
        libraryGameOf(userId, {
          releaseDate: null,
          releaseDatePrecision: null,
          releaseDateCheckedAt: daysBefore(8),
        }),
        libraryGameOf(userId, {
          releaseDate: utcMidnight("2026-03-01"),
          releaseDatePrecision: null,
          releaseDateCheckedAt: null,
        }),
      ]);
      expectedDueIds = dueGames.map((game) => game.id).sort();

      await Promise.all([
        libraryGameOf(userId, {
          releaseDate: utcMidnight("2026-11-17"),
          releaseDatePrecision: "DAY",
          releaseDateCheckedAt: hoursBefore(1),
        }),
        libraryGameOf(userId, {
          releaseDate: utcMidnight("2027-01-01"),
          releaseDatePrecision: "YEAR",
          releaseDateCheckedAt: daysBefore(2),
        }),
        libraryGameOf(userId, {
          releaseDate: utcMidnight("2026-05-01"),
          releaseDatePrecision: "DAY",
          releaseDateCheckedAt: daysBefore(30),
        }),
        libraryGameOf(userId, {
          releaseDate: utcMidnight("2026-09-01"),
          releaseDatePrecision: "MONTH",
          releaseDateCheckedAt: null,
        }),
        libraryGameOf(userId, {
          releaseDate: utcMidnight("2026-03-01"),
          releaseDatePrecision: null,
          releaseDateCheckedAt: daysBefore(30),
        }),
      ]);
    });

    it("returns exactly the never-checked, stale-daily, stale-weekly, TBA, undated and once-legacy games", async () => {
      expect(await dueIdsFor(userId)).toEqual(expectedDueIds);
    });
  });

  describe("given one due game", () => {
    let userId: string;
    let dueGame: Awaited<ReturnType<typeof libraryGameOf>>;

    beforeEach(async () => {
      userId = (await createUser(db.prisma)).id;
      dueGame = await libraryGameOf(userId, {
        releaseDate: utcMidnight("2027-03-14"),
        releaseDatePrecision: "DAY",
        releaseDateCheckedAt: daysBefore(9),
      });
    });

    it("returns the id, IGDB id and stored release state of that game", async () => {
      expect(await getGamesDueReleaseCheck(userId, NOW)).toEqual([
        {
          id: dueGame.id,
          igdbId: dueGame.igdbId,
          releaseDate: utcMidnight("2027-03-14"),
          releaseDatePrecision: "DAY",
          releaseDateCheckedAt: daysBefore(9),
        },
      ]);
    });
  });

  describe("given games that belong to someone else or to nobody", () => {
    let userId: string;
    let ownDueGameId: string;

    beforeEach(async () => {
      const otherUserId = (await createUser(db.prisma)).id;
      userId = (await createUser(db.prisma)).id;
      const neverChecked: ReleaseState = {
        releaseDate: null,
        releaseDatePrecision: null,
        releaseDateCheckedAt: null,
      };

      ownDueGameId = (await libraryGameOf(userId, neverChecked)).id;
      await libraryGameOf(otherUserId, neverChecked);
      await createGame(db.prisma, neverChecked);
    });

    it("returns only the games in that user's library", async () => {
      expect(await dueIdsFor(userId)).toEqual([ownDueGameId]);
    });
  });

  describe("given a user whose library holds a game that two people have", () => {
    let firstUserId: string;
    let secondUserId: string;
    let sharedGameId: string;

    beforeEach(async () => {
      firstUserId = (await createUser(db.prisma)).id;
      secondUserId = (await createUser(db.prisma)).id;
      sharedGameId = (
        await libraryGameOf(firstUserId, {
          releaseDate: null,
          releaseDatePrecision: null,
          releaseDateCheckedAt: null,
        })
      ).id;
      await createLibraryItem(db.prisma, {
        userId: secondUserId,
        gameId: sharedGameId,
      });
    });

    it("is due for each of the two users, as a single row each", async () => {
      expect(await dueIdsFor(firstUserId)).toEqual([sharedGameId]);
      expect(await dueIdsFor(secondUserId)).toEqual([sharedGameId]);
    });
  });

  describe("given games last checked at different times", () => {
    let userId: string;
    let neverCheckedId: string;
    let checkedLongAgoId: string;
    let checkedLessLongAgoId: string;

    beforeEach(async () => {
      userId = (await createUser(db.prisma)).id;
      const upcomingYear: Omit<ReleaseState, "releaseDateCheckedAt"> = {
        releaseDate: utcMidnight("2027-01-01"),
        releaseDatePrecision: "YEAR",
      };

      checkedLessLongAgoId = (
        await libraryGameOf(userId, {
          ...upcomingYear,
          releaseDateCheckedAt: daysBefore(10),
        })
      ).id;
      neverCheckedId = (
        await libraryGameOf(userId, {
          ...upcomingYear,
          releaseDateCheckedAt: null,
        })
      ).id;
      checkedLongAgoId = (
        await libraryGameOf(userId, {
          ...upcomingYear,
          releaseDateCheckedAt: daysBefore(20),
        })
      ).id;
    });

    it("lists the never-checked game first, then the oldest check", async () => {
      const due = await getGamesDueReleaseCheck(userId, NOW);

      expect(due.map((game) => game.id)).toEqual([
        neverCheckedId,
        checkedLongAgoId,
        checkedLessLongAgoId,
      ]);
    });
  });

  describe("given more than 100 due games", () => {
    let userId: string;

    beforeEach(async () => {
      userId = (await createUser(db.prisma)).id;
      const staleGames = Array.from({ length: 101 }, (_unused, index) => ({
        id: `stale-game-${index}`,
        igdbId: 900_000 + index,
        title: `Stale Game ${index}`,
        slug: `stale-game-${index}`,
        releaseDate: utcMidnight("2027-01-01"),
        releaseDatePrecision: "YEAR" as const,
        releaseDateCheckedAt: daysBefore(8 + index),
      }));
      await db.prisma.game.createMany({ data: staleGames });
      await db.prisma.libraryItem.createMany({
        data: staleGames.map((game) => ({
          userId,
          gameId: game.id,
          status: "WANT" as const,
          isOwned: true,
        })),
      });
    });

    it("returns at most 100 games", async () => {
      expect(await getGamesDueReleaseCheck(userId, NOW)).toHaveLength(100);
    });

    it("keeps the game that has waited longest and drops the least overdue one", async () => {
      const dueIds = await dueIdsFor(userId);

      expect(dueIds).toContain("stale-game-100");
      expect(dueIds).not.toContain("stale-game-0");
    });
  });

  describe("given a never-checked game and more than 100 stale ones", () => {
    let userId: string;
    let neverCheckedId: string;

    beforeEach(async () => {
      userId = (await createUser(db.prisma)).id;
      const staleGames = Array.from({ length: 100 }, (_unused, index) => ({
        id: `stale-game-${index}`,
        igdbId: 900_000 + index,
        title: `Stale Game ${index}`,
        slug: `stale-game-${index}`,
        releaseDate: utcMidnight("2027-01-01"),
        releaseDatePrecision: "YEAR" as const,
        releaseDateCheckedAt: daysBefore(40),
      }));
      await db.prisma.game.createMany({ data: staleGames });
      await db.prisma.libraryItem.createMany({
        data: staleGames.map((game) => ({
          userId,
          gameId: game.id,
          status: "WANT" as const,
          isOwned: true,
        })),
      });
      neverCheckedId = (
        await libraryGameOf(userId, {
          releaseDate: null,
          releaseDatePrecision: null,
          releaseDateCheckedAt: null,
        })
      ).id;
    });

    it("still includes the never-checked game within the cap", async () => {
      expect(await dueIdsFor(userId)).toContain(neverCheckedId);
    });
  });

  describe("given a user with an empty library", () => {
    it("returns nothing", async () => {
      const userId = (await createUser(db.prisma)).id;

      expect(await getGamesDueReleaseCheck(userId, NOW)).toEqual([]);
    });
  });
});
