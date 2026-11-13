/**
 * Integration tests for getUpcomingReleasesWorker (spec 029).
 *
 * The worker owns the auth gate and reads the UTC day of now. The server-fn
 * wrapper is not exercised here (foot-gun #8).
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

import { getUpcomingReleasesWorker } from "@/features/upcoming-releases/api/get-upcoming-releases.worker";
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

const midnightUtc = (day: string) => new Date(`${day}T00:00:00.000Z`);

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-upcoming-releases-worker");
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

afterEach(() => {
  vi.useRealTimers();
});

const actions = {
  addExactDatedGame: async (userId: string, title: string, day: string) => {
    const game = await createGame(db.prisma, {
      title,
      slug: title.toLowerCase().replaceAll(" ", "-"),
      releaseDate: midnightUtc(day),
      releaseDatePrecision: "DAY",
    });
    return createLibraryItem(db.prisma, { userId, gameId: game.id });
  },
  setClock: (instant: string) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(instant));
  },
};

describe(getUpcomingReleasesWorker, () => {
  describe("given no signed-in user", () => {
    it("refuses with an unauthorized error", async () => {
      await expect(getUpcomingReleasesWorker(undefined)).rejects.toBeInstanceOf(
        UnauthorizedError
      );
    });
  });

  describe("given a signed-in user with no games", () => {
    it("returns an empty list of entries", async () => {
      const user = await createUser(db.prisma);

      expect(await getUpcomingReleasesWorker(user.id)).toEqual({
        entries: [],
      });
    });
  });

  describe.each([
    ["just after midnight", "2026-11-12T00:30:00.000Z"],
    ["late in the evening", "2026-11-12T23:30:00.000Z"],
  ])("given it is %s UTC on 12 Nov 2026", (_when, instant) => {
    let titles: string[];

    beforeEach(async () => {
      const user = await createUser(db.prisma);
      await actions.addExactDatedGame(user.id, "Two days ago", "2026-11-10");
      await actions.addExactDatedGame(user.id, "Yesterday", "2026-11-11");
      await actions.addExactDatedGame(user.id, "Today", "2026-11-12");
      await actions.addExactDatedGame(user.id, "Two years out", "2028-11-12");
      actions.setClock(instant);
      const { entries } = await getUpcomingReleasesWorker(user.id);
      titles = entries.map(({ game }) => game.title);
    });

    it("lists games from the day before the UTC day, in date order, with no end", () => {
      expect(titles).toEqual(["Yesterday", "Today", "Two years out"]);
    });
  });

  describe("given a game in the library", () => {
    it("returns the library item's id with it", async () => {
      const user = await createUser(db.prisma);
      const libraryItem = await actions.addExactDatedGame(
        user.id,
        "Signalis 2",
        "2027-03-12"
      );
      actions.setClock("2026-11-12T12:00:00.000Z");

      const { entries } = await getUpcomingReleasesWorker(user.id);

      expect(entries.map(({ id }) => id)).toEqual([libraryItem.id]);
    });
  });

  describe("given two users", () => {
    it("returns only the signed-in user's games", async () => {
      const ada = await createUser(db.prisma);
      const grace = await createUser(db.prisma);
      await actions.addExactDatedGame(ada.id, "Ada's own", "2027-03-12");
      await actions.addExactDatedGame(grace.id, "Grace's own", "2027-03-13");
      actions.setClock("2026-11-12T12:00:00.000Z");

      const { entries } = await getUpcomingReleasesWorker(ada.id);

      expect(entries.map(({ game }) => game.title)).toEqual(["Ada's own"]);
    });
  });
});
