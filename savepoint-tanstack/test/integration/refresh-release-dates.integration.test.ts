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

import { getLibrary } from "@/entities/library-item/api/get-library.server";
import { refreshReleaseDatesWorker } from "@/features/release-dates/api/refresh-release-dates.worker";
import releaseDatesFixture from "@/shared/api/igdb/__fixtures__/release-dates-live-2026-11-12.json";
import { IgdbHttpError } from "@/shared/api/igdb/errors";
import { igdbFetch } from "@/shared/api/igdb/fetch";
import { UnauthorizedError } from "@/shared/lib/errors";

import {
  createGame,
  createLibraryItem,
  createUser,
} from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

const igdbFetchMock = igdbFetch as ReturnType<typeof vi.fn>;

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("refresh-release-dates");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const NOW = new Date("2026-11-12T12:00:00Z");

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  igdbFetchMock.mockReset();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

afterEach(() => {
  vi.useRealTimers();
});

const utcMidnight = (day: string) => new Date(`${day}T00:00:00Z`);
const daysBefore = (days: number) =>
  new Date(NOW.getTime() - days * 24 * 3_600_000);

const liveGames = releaseDatesFixture.games;

const toBeAnnouncedInIgdb = (igdbId: number) => ({
  id: igdbId,
  release_dates: [{ date_format: 7 }],
});

function igdbAnswers(gamesById: Record<number, unknown>) {
  igdbFetchMock.mockImplementation((_resource: string, query: string) => {
    const askedIds = (/where id = \(([^)]*)\)/.exec(query)?.[1] ?? "")
      .split(",")
      .map((id) => Number(id.trim()));
    return Promise.resolve(
      askedIds.flatMap((id) => (id in gamesById ? [gamesById[id]] : []))
    );
  });
}

const askedIgdbIds = () =>
  igdbFetchMock.mock.calls.flatMap(([, query]: unknown[]) =>
    (/where id = \(([^)]*)\)/.exec(String(query))?.[1] ?? "")
      .split(",")
      .map((id) => Number(id.trim()))
  );

const readGame = (id: string) =>
  db.prisma.game.findUniqueOrThrow({ where: { id } });

const stateOfStoredDay = (day: string, checkedDaysAgo: number | null) => ({
  releaseDate: utcMidnight(day),
  releaseDatePrecision: "DAY" as const,
  releaseDateCheckedAt:
    checkedDaysAgo === null ? null : daysBefore(checkedDaysAgo),
});

const addToLibrary = async (
  userId: string,
  overrides: Parameters<typeof createGame>[1]
) => {
  const game = await createGame(db.prisma, overrides);
  await createLibraryItem(db.prisma, { userId, gameId: game.id });
  return game;
};

describe("refreshReleaseDatesWorker", () => {
  describe("given nobody is signed in", () => {
    it("throws an unauthorized error", async () => {
      await expect(refreshReleaseDatesWorker(undefined)).rejects.toBeInstanceOf(
        UnauthorizedError
      );
    });
  });

  describe("given nothing in the library is due for a check", () => {
    let result: Awaited<ReturnType<typeof refreshReleaseDatesWorker>>;

    beforeEach(async () => {
      const userId = (await createUser(db.prisma)).id;
      await addToLibrary(userId, stateOfStoredDay("2026-11-25", 0));
      result = await refreshReleaseDatesWorker(userId);
    });

    it("reports nothing checked and nothing updated", () => {
      expect(result).toEqual({ checked: 0, updated: 0 });
    });

    it("does not ask IGDB anything", () => {
      expect(igdbFetchMock).not.toHaveBeenCalled();
    });
  });

  describe("given an upcoming game whose exact date moved in IGDB, owned by two people", () => {
    let firstUserId: string;
    let secondUserId: string;
    let gameId: string;
    let result: Awaited<ReturnType<typeof refreshReleaseDatesWorker>>;

    beforeEach(async () => {
      firstUserId = (await createUser(db.prisma)).id;
      secondUserId = (await createUser(db.prisma)).id;
      const game = await addToLibrary(firstUserId, {
        igdbId: liveGames.day.id,
        ...stateOfStoredDay("2026-11-20", 3),
      });
      gameId = game.id;
      await createLibraryItem(db.prisma, { userId: secondUserId, gameId });
      igdbAnswers({ [liveGames.day.id]: liveGames.day });

      result = await refreshReleaseDatesWorker(firstUserId);
    });

    it("reports one game checked and one updated", () => {
      expect(result).toEqual({ checked: 1, updated: 1 });
    });

    it("writes the corrected date with the moved marker and the check time", async () => {
      expect(await readGame(gameId)).toMatchObject({
        releaseDate: utcMidnight("2026-11-13"),
        releaseDatePrecision: "DAY",
        releaseDateCheckedAt: NOW,
        releaseDateMovedFrom: utcMidnight("2026-11-20"),
        releaseDateMovedAt: NOW,
      });
    });

    it("shows the correction and the moved marker to the other person who has the game", async () => {
      const { items } = await getLibrary(secondUserId, {});

      expect(items[0]?.game).toMatchObject({
        releaseDate: utcMidnight("2026-11-13"),
        releaseDatePrecision: "DAY",
        releaseDateMovedFrom: utcMidnight("2026-11-20"),
        releaseDateMovedAt: NOW,
      });
    });
  });

  describe("given an exact date that IGDB now reports as a whole year", () => {
    let gameId: string;

    beforeEach(async () => {
      const userId = (await createUser(db.prisma)).id;
      gameId = (
        await addToLibrary(userId, {
          igdbId: liveGames.year.id,
          ...stateOfStoredDay("2026-11-25", 3),
        })
      ).id;
      igdbAnswers({ [liveGames.year.id]: liveGames.year });

      await refreshReleaseDatesWorker(userId);
    });

    it("stores the year from its first day and remembers the old exact date", async () => {
      expect(await readGame(gameId)).toMatchObject({
        releaseDate: utcMidnight("2026-01-01"),
        releaseDatePrecision: "YEAR",
        releaseDateMovedFrom: utcMidnight("2026-11-25"),
        releaseDateMovedAt: NOW,
      });
    });
  });

  describe("given an exact date that IGDB now reports as TBA", () => {
    let gameId: string;

    beforeEach(async () => {
      const userId = (await createUser(db.prisma)).id;
      gameId = (
        await addToLibrary(userId, {
          igdbId: liveGames.tbd.id,
          ...stateOfStoredDay("2026-11-25", 3),
        })
      ).id;
      igdbAnswers({
        [liveGames.tbd.id]: toBeAnnouncedInIgdb(liveGames.tbd.id),
      });

      await refreshReleaseDatesWorker(userId);
    });

    it("clears the date, stores TBA and remembers the old exact date", async () => {
      expect(await readGame(gameId)).toMatchObject({
        releaseDate: null,
        releaseDatePrecision: "TBA",
        releaseDateMovedFrom: utcMidnight("2026-11-25"),
        releaseDateMovedAt: NOW,
      });
    });
  });

  describe("given a legacy game whose placeholder date IGDB reports as a quarter", () => {
    let gameId: string;
    let result: Awaited<ReturnType<typeof refreshReleaseDatesWorker>>;

    beforeEach(async () => {
      const userId = (await createUser(db.prisma)).id;
      gameId = (
        await addToLibrary(userId, {
          igdbId: liveGames.q2.id,
          releaseDate: utcMidnight("2027-06-30"),
          releaseDatePrecision: null,
          releaseDateCheckedAt: null,
        })
      ).id;
      igdbAnswers({ [liveGames.q2.id]: liveGames.q2 });

      result = await refreshReleaseDatesWorker(userId);
    });

    it("repairs it to the first day of the quarter without a moved marker", async () => {
      expect(await readGame(gameId)).toMatchObject({
        releaseDate: utcMidnight("2027-04-01"),
        releaseDatePrecision: "QUARTER",
        releaseDateCheckedAt: NOW,
        releaseDateMovedFrom: null,
        releaseDateMovedAt: null,
      });
      expect(result).toEqual({ checked: 1, updated: 1 });
    });
  });

  describe("given IGDB announces an exact day for a game that was known as a year", () => {
    let gameId: string;

    beforeEach(async () => {
      const userId = (await createUser(db.prisma)).id;
      gameId = (
        await addToLibrary(userId, {
          igdbId: liveGames.day.id,
          releaseDate: utcMidnight("2026-01-01"),
          releaseDatePrecision: "YEAR",
          releaseDateCheckedAt: daysBefore(9),
        })
      ).id;
      igdbAnswers({ [liveGames.day.id]: liveGames.day });

      await refreshReleaseDatesWorker(userId);
    });

    it("writes the exact day as an announcement, with no moved marker", async () => {
      expect(await readGame(gameId)).toMatchObject({
        releaseDate: utcMidnight("2026-11-13"),
        releaseDatePrecision: "DAY",
        releaseDateMovedFrom: null,
        releaseDateMovedAt: null,
      });
    });
  });

  describe("given IGDB agrees with the stored date", () => {
    let gameId: string;
    let result: Awaited<ReturnType<typeof refreshReleaseDatesWorker>>;

    beforeEach(async () => {
      const userId = (await createUser(db.prisma)).id;
      gameId = (
        await addToLibrary(userId, {
          igdbId: liveGames.day.id,
          ...stateOfStoredDay("2026-11-13", 3),
        })
      ).id;
      igdbAnswers({ [liveGames.day.id]: liveGames.day });

      result = await refreshReleaseDatesWorker(userId);
    });

    it("stamps the check time and records no move", async () => {
      expect(await readGame(gameId)).toMatchObject({
        releaseDate: utcMidnight("2026-11-13"),
        releaseDateCheckedAt: NOW,
        releaseDateMovedFrom: null,
        releaseDateMovedAt: null,
      });
      expect(result).toEqual({ checked: 1, updated: 1 });
    });
  });

  describe("given IGDB has lost the date of a game", () => {
    let gameId: string;

    beforeEach(async () => {
      const userId = (await createUser(db.prisma)).id;
      gameId = (
        await addToLibrary(userId, {
          igdbId: 424_242,
          ...stateOfStoredDay("2026-11-25", 3),
        })
      ).id;
      igdbAnswers({ 424_242: { id: 424_242 } });

      await refreshReleaseDatesWorker(userId);
    });

    it("keeps the stored date and only stamps the check time", async () => {
      expect(await readGame(gameId)).toMatchObject({
        releaseDate: utcMidnight("2026-11-25"),
        releaseDatePrecision: "DAY",
        releaseDateCheckedAt: NOW,
        releaseDateMovedFrom: null,
        releaseDateMovedAt: null,
      });
    });
  });

  describe("given a due game that IGDB no longer returns at all", () => {
    const vanishedIgdbId = 777_001;
    let userId: string;
    let gameId: string;
    let firstResult: Awaited<ReturnType<typeof refreshReleaseDatesWorker>>;

    beforeEach(async () => {
      userId = (await createUser(db.prisma)).id;
      gameId = (
        await addToLibrary(userId, {
          igdbId: vanishedIgdbId,
          ...stateOfStoredDay("2026-11-25", 3),
        })
      ).id;
      igdbAnswers({});

      firstResult = await refreshReleaseDatesWorker(userId);
    });

    it("stamps the check time and keeps the stored date and precision", async () => {
      expect(await readGame(gameId)).toMatchObject({
        releaseDate: utcMidnight("2026-11-25"),
        releaseDatePrecision: "DAY",
        releaseDateCheckedAt: NOW,
        releaseDateMovedFrom: null,
        releaseDateMovedAt: null,
      });
    });

    it("counts it as checked and updated", () => {
      expect(firstResult).toEqual({ checked: 1, updated: 1 });
    });

    it("does not ask IGDB about it again on the next visit", async () => {
      igdbFetchMock.mockClear();

      const secondResult = await refreshReleaseDatesWorker(userId);

      expect(igdbFetchMock).not.toHaveBeenCalled();
      expect(secondResult).toEqual({ checked: 0, updated: 0 });
    });
  });

  describe("given a never-checked game without a date that IGDB no longer returns", () => {
    let userId: string;
    let gameId: string;

    beforeEach(async () => {
      userId = (await createUser(db.prisma)).id;
      gameId = (
        await addToLibrary(userId, {
          igdbId: 777_002,
          releaseDate: null,
          releaseDatePrecision: null,
          releaseDateCheckedAt: null,
        })
      ).id;
      igdbAnswers({});

      await refreshReleaseDatesWorker(userId);
    });

    it("stamps the check time and leaves the date unknown", async () => {
      expect(await readGame(gameId)).toMatchObject({
        releaseDate: null,
        releaseDatePrecision: null,
        releaseDateCheckedAt: NOW,
      });
    });

    it("does not ask IGDB about it again on the next visit", async () => {
      igdbFetchMock.mockClear();

      await refreshReleaseDatesWorker(userId);

      expect(igdbFetchMock).not.toHaveBeenCalled();
    });
  });

  describe("given one due game that IGDB answers and one that it omits", () => {
    let answeredGameId: string;
    let omittedGameId: string;
    let result: Awaited<ReturnType<typeof refreshReleaseDatesWorker>>;

    beforeEach(async () => {
      const userId = (await createUser(db.prisma)).id;
      answeredGameId = (
        await addToLibrary(userId, {
          igdbId: liveGames.day.id,
          ...stateOfStoredDay("2026-11-20", 3),
        })
      ).id;
      omittedGameId = (
        await addToLibrary(userId, {
          igdbId: 777_003,
          ...stateOfStoredDay("2026-11-25", 3),
        })
      ).id;
      igdbAnswers({ [liveGames.day.id]: liveGames.day });

      result = await refreshReleaseDatesWorker(userId);
    });

    it("writes the corrected date and move marker for the answered game", async () => {
      expect(await readGame(answeredGameId)).toMatchObject({
        releaseDate: utcMidnight("2026-11-13"),
        releaseDatePrecision: "DAY",
        releaseDateCheckedAt: NOW,
        releaseDateMovedFrom: utcMidnight("2026-11-20"),
        releaseDateMovedAt: NOW,
      });
    });

    it("only stamps the check time for the omitted game", async () => {
      expect(await readGame(omittedGameId)).toMatchObject({
        releaseDate: utcMidnight("2026-11-25"),
        releaseDatePrecision: "DAY",
        releaseDateCheckedAt: NOW,
        releaseDateMovedFrom: null,
        releaseDateMovedAt: null,
      });
    });

    it("counts both games as checked and updated", () => {
      expect(result).toEqual({ checked: 2, updated: 2 });
    });
  });

  describe("given a library with due games, fresh games, a released game and someone else's game", () => {
    let result: Awaited<ReturnType<typeof refreshReleaseDatesWorker>>;
    let dueIgdbIds: number[];
    let notDueIgdbIds: number[];

    beforeEach(async () => {
      const userId = (await createUser(db.prisma)).id;
      const otherUserId = (await createUser(db.prisma)).id;

      const dueGames = await Promise.all([
        addToLibrary(userId, {
          igdbId: liveGames.day.id,
          ...stateOfStoredDay("2026-11-20", 3),
        }),
        addToLibrary(userId, {
          igdbId: liveGames.month.id,
          releaseDate: utcMidnight("2026-12-01"),
          releaseDatePrecision: "MONTH",
          releaseDateCheckedAt: daysBefore(9),
        }),
        addToLibrary(userId, {
          igdbId: liveGames.q1.id,
          releaseDate: null,
          releaseDatePrecision: null,
          releaseDateCheckedAt: null,
        }),
      ]);
      const notDueGames = await Promise.all([
        addToLibrary(userId, {
          igdbId: 501_001,
          ...stateOfStoredDay("2026-12-20", 0),
        }),
        addToLibrary(userId, {
          igdbId: 501_002,
          ...stateOfStoredDay("2026-05-01", 30),
        }),
        addToLibrary(otherUserId, {
          igdbId: 501_003,
          releaseDate: null,
          releaseDatePrecision: null,
          releaseDateCheckedAt: null,
        }),
      ]);
      dueIgdbIds = dueGames.map((game) => game.igdbId);
      notDueIgdbIds = notDueGames.map((game) => game.igdbId);
      igdbAnswers({
        [liveGames.day.id]: liveGames.day,
        [liveGames.month.id]: liveGames.month,
        [liveGames.q1.id]: liveGames.q1,
      });

      result = await refreshReleaseDatesWorker(userId);
    });

    it("counts each due game as checked and updated", () => {
      expect(result).toEqual({ checked: 3, updated: 3 });
    });

    it("asks IGDB about the due games and nobody else's", () => {
      expect([...askedIgdbIds()].sort()).toEqual([...dueIgdbIds].sort());
      for (const igdbId of notDueIgdbIds) {
        expect(askedIgdbIds()).not.toContain(igdbId);
      }
    });
  });

  describe("given IGDB is rate-limited", () => {
    let userId: string;
    let gameIds: string[];
    let result: Awaited<ReturnType<typeof refreshReleaseDatesWorker>>;

    beforeEach(async () => {
      userId = (await createUser(db.prisma)).id;
      const games = await Promise.all([
        addToLibrary(userId, {
          igdbId: liveGames.day.id,
          ...stateOfStoredDay("2026-11-20", 3),
        }),
        addToLibrary(userId, {
          igdbId: liveGames.q1.id,
          releaseDate: null,
          releaseDatePrecision: null,
          releaseDateCheckedAt: null,
        }),
      ]);
      gameIds = games.map((game) => game.id);
      igdbFetchMock.mockRejectedValue(
        new IgdbHttpError("IGDB 429 Too Many Requests", {
          status: 429,
          statusText: "Too Many Requests",
          resource: "/games",
          query: "fields first_release_date; where id = (1); limit 100;",
          requestId: "request-1",
        })
      );

      result = await refreshReleaseDatesWorker(userId);
    });

    it("resolves with nothing checked and nothing updated instead of throwing", () => {
      expect(result).toEqual({ checked: 0, updated: 0 });
    });

    it("stamps no check time on any game", async () => {
      const games = await Promise.all(gameIds.map(readGame));

      expect(games.map((game) => game.releaseDateCheckedAt)).toEqual([
        daysBefore(3),
        null,
      ]);
    });

    it("leaves the stored dates and markers as they were", async () => {
      const [datedGame, undatedGame] = await Promise.all(gameIds.map(readGame));

      expect(datedGame).toMatchObject({
        releaseDate: utcMidnight("2026-11-20"),
        releaseDateMovedFrom: null,
        releaseDateMovedAt: null,
      });
      expect(undatedGame).toMatchObject({
        releaseDate: null,
        releaseDatePrecision: null,
      });
    });
  });

  describe("given two people open the app at the same moment and both read the stale date", () => {
    let firstUserId: string;
    let gameId: string;
    let results: Array<Awaited<ReturnType<typeof refreshReleaseDatesWorker>>>;

    beforeEach(async () => {
      firstUserId = (await createUser(db.prisma)).id;
      const secondUserId = (await createUser(db.prisma)).id;
      gameId = (
        await addToLibrary(firstUserId, {
          igdbId: liveGames.day.id,
          ...stateOfStoredDay("2026-11-20", 3),
        })
      ).id;
      await createLibraryItem(db.prisma, { userId: secondUserId, gameId });

      let visitsAskingIgdb = 0;
      let letBothAnswer: () => void = () => undefined;
      const bothVisitsAreWaiting = new Promise<void>((resolve) => {
        letBothAnswer = resolve;
      });
      igdbFetchMock.mockImplementation(async () => {
        visitsAskingIgdb += 1;
        if (visitsAskingIgdb === 2) letBothAnswer();
        await bothVisitsAreWaiting;
        return [liveGames.day];
      });

      results = await Promise.all([
        refreshReleaseDatesWorker(firstUserId),
        refreshReleaseDatesWorker(secondUserId),
      ]);
    });

    it("lets only one visit write the correction", () => {
      expect(results.map((result) => result.updated).sort()).toEqual([0, 1]);
    });

    it("records the move once, from the original date", async () => {
      expect(await readGame(gameId)).toMatchObject({
        releaseDate: utcMidnight("2026-11-13"),
        releaseDateMovedFrom: utcMidnight("2026-11-20"),
        releaseDateMovedAt: NOW,
      });
    });
  });
});
