/**
 * Integration tests for getUpcomingReleases (spec 029, Upcoming releases page).
 *
 * Contract: the user's library games with an exact (DAY) release date on or
 * after the day before the UTC today (one day of slack for a device that is
 * still on yesterday), ordered by date then title A to Z, with no upper limit.
 * Month, quarter, year, TBA and never-checked dates never qualify, and one
 * person's library never leaks into another's.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getUpcomingReleases } from "@/entities/library-item/api/get-upcoming-releases.server";

import {
  createGame,
  createLibraryItem,
  createUser,
} from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

const UTC_TODAY = "2026-11-12";

const midnightUtc = (day: string) => new Date(`${day}T00:00:00.000Z`);

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-upcoming-releases");
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

const actions = {
  addGameWithExactDate: async (
    userId: string,
    title: string,
    day: string,
    libraryItem: {
      status?: "WANT" | "PLAYING" | "DONE";
      isOwned?: boolean;
    } = {}
  ) => {
    const game = await createGame(db.prisma, {
      title,
      slug: title.toLowerCase().replaceAll(" ", "-"),
      releaseDate: midnightUtc(day),
      releaseDatePrecision: "DAY",
    });
    await createLibraryItem(db.prisma, {
      userId,
      gameId: game.id,
      ...libraryItem,
    });
    return game;
  },
  addGameWithVagueDate: async (
    userId: string,
    title: string,
    release: {
      releaseDate: Date | null;
      releaseDatePrecision: "MONTH" | "QUARTER" | "YEAR" | "TBA" | null;
    }
  ) => {
    const game = await createGame(db.prisma, {
      title,
      slug: title.toLowerCase().replaceAll(" ", "-"),
      ...release,
    });
    await createLibraryItem(db.prisma, { userId, gameId: game.id });
    return game;
  },
};

const titlesOf = (releases: { game: { title: string } }[]) =>
  releases.map(({ game }) => game.title);

describe(getUpcomingReleases, () => {
  describe("given a user with no games", () => {
    it("returns nothing", async () => {
      const user = await createUser(db.prisma);

      expect(await getUpcomingReleases(user.id, UTC_TODAY)).toEqual([]);
    });
  });

  describe("given games on both sides of the day before the UTC today", () => {
    let titles: string[];

    beforeEach(async () => {
      const user = await createUser(db.prisma);
      await actions.addGameWithExactDate(user.id, "Two days ago", "2026-11-10");
      await actions.addGameWithExactDate(user.id, "Yesterday", "2026-11-11");
      await actions.addGameWithExactDate(user.id, "Today", "2026-11-12");
      await actions.addGameWithExactDate(user.id, "Tomorrow", "2026-11-13");
      titles = titlesOf(await getUpcomingReleases(user.id, UTC_TODAY));
    });

    it("keeps yesterday for a device that has not reached the UTC today", () => {
      expect(titles).toContain("Yesterday");
    });

    it("drops anything older than yesterday", () => {
      expect(titles).not.toContain("Two days ago");
    });

    it("keeps today and tomorrow", () => {
      expect(titles).toEqual(["Yesterday", "Today", "Tomorrow"]);
    });
  });

  describe("given a game that comes out two years from now", () => {
    it("still lists it, because there is no end limit", async () => {
      const user = await createUser(db.prisma);
      await actions.addGameWithExactDate(user.id, "Far away", "2028-11-12");
      await actions.addGameWithExactDate(user.id, "Even farther", "2031-06-30");

      const releases = await getUpcomingReleases(user.id, UTC_TODAY);

      expect(titlesOf(releases)).toEqual(["Far away", "Even farther"]);
    });
  });

  describe("given games added in no particular order", () => {
    let titles: string[];

    beforeEach(async () => {
      const user = await createUser(db.prisma);
      await actions.addGameWithExactDate(user.id, "Tunic 2", "2027-04-02");
      await actions.addGameWithExactDate(user.id, "Signalis 2", "2027-03-12");
      await actions.addGameWithExactDate(user.id, "Hades III", "2027-03-12");
      await actions.addGameWithExactDate(user.id, "Alan Wake 3", "2027-03-12");
      await actions.addGameWithExactDate(user.id, "Celeste 2", "2026-12-04");
      titles = titlesOf(await getUpcomingReleases(user.id, UTC_TODAY));
    });

    it("orders by release date first and by title A to Z within a day", () => {
      expect(titles).toEqual([
        "Celeste 2",
        "Alan Wake 3",
        "Hades III",
        "Signalis 2",
        "Tunic 2",
      ]);
    });
  });

  describe("given a game for every status and ownership", () => {
    let byTitle: Map<string, { status: string; isOwned: boolean }>;

    beforeEach(async () => {
      const user = await createUser(db.prisma);
      await actions.addGameWithExactDate(
        user.id,
        "Wanted owned",
        "2027-01-05",
        {
          status: "WANT",
          isOwned: true,
        }
      );
      await actions.addGameWithExactDate(
        user.id,
        "Wanted not owned",
        "2027-01-06",
        { status: "WANT", isOwned: false }
      );
      await actions.addGameWithExactDate(user.id, "Playing now", "2027-01-07", {
        status: "PLAYING",
      });
      await actions.addGameWithExactDate(
        user.id,
        "Done already",
        "2027-01-08",
        {
          status: "DONE",
          isOwned: false,
        }
      );
      const releases = await getUpcomingReleases(user.id, UTC_TODAY);
      byTitle = new Map(
        releases.map(({ game, status, isOwned }) => [
          game.title,
          { status, isOwned },
        ])
      );
    });

    it("lists all of them", () => {
      expect([...byTitle.keys()]).toEqual([
        "Wanted owned",
        "Wanted not owned",
        "Playing now",
        "Done already",
      ]);
    });

    it("tells each game's status and whether it is owned", () => {
      expect(Object.fromEntries(byTitle)).toEqual({
        "Wanted owned": { status: "WANT", isOwned: true },
        "Wanted not owned": { status: "WANT", isOwned: false },
        "Playing now": { status: "PLAYING", isOwned: true },
        "Done already": { status: "DONE", isOwned: false },
      });
    });
  });

  describe("given games whose date is not an exact day", () => {
    let titles: string[];

    beforeEach(async () => {
      const user = await createUser(db.prisma);
      await actions.addGameWithExactDate(user.id, "Exact day", "2027-03-14");
      await actions.addGameWithVagueDate(user.id, "Month only", {
        releaseDate: midnightUtc("2027-03-01"),
        releaseDatePrecision: "MONTH",
      });
      await actions.addGameWithVagueDate(user.id, "Quarter only", {
        releaseDate: midnightUtc("2027-04-01"),
        releaseDatePrecision: "QUARTER",
      });
      await actions.addGameWithVagueDate(user.id, "Year only", {
        releaseDate: midnightUtc("2027-01-01"),
        releaseDatePrecision: "YEAR",
      });
      await actions.addGameWithVagueDate(user.id, "To be announced", {
        releaseDate: null,
        releaseDatePrecision: "TBA",
      });
      await actions.addGameWithVagueDate(user.id, "Never checked", {
        releaseDate: midnightUtc("2027-05-20"),
        releaseDatePrecision: null,
      });
      await actions.addGameWithVagueDate(user.id, "No date at all", {
        releaseDate: null,
        releaseDatePrecision: null,
      });
      titles = titlesOf(await getUpcomingReleases(user.id, UTC_TODAY));
    });

    it("lists only the exact-day game", () => {
      expect(titles).toEqual(["Exact day"]);
    });
  });

  describe("given a game whose exact date was moved", () => {
    it("returns the library item with the old date and when the move was seen", async () => {
      const user = await createUser(db.prisma);
      const game = await createGame(db.prisma, {
        title: "Delayed game",
        slug: "delayed-game",
        releaseDate: midnightUtc("2027-06-03"),
        releaseDatePrecision: "DAY",
        releaseDateMovedFrom: midnightUtc("2027-03-14"),
        releaseDateMovedAt: new Date("2026-11-05T10:00:00.000Z"),
      });
      const libraryItem = await createLibraryItem(db.prisma, {
        userId: user.id,
        gameId: game.id,
        status: "DONE",
        isOwned: false,
      });

      expect(await getUpcomingReleases(user.id, UTC_TODAY)).toEqual([
        {
          id: libraryItem.id,
          status: "DONE",
          isOwned: false,
          game: {
            slug: "delayed-game",
            title: "Delayed game",
            coverImage: null,
            releaseDate: midnightUtc("2027-06-03"),
            releaseDatePrecision: "DAY",
            releaseDateMovedFrom: midnightUtc("2027-03-14"),
            releaseDateMovedAt: new Date("2026-11-05T10:00:00.000Z"),
          },
        },
      ]);
    });
  });

  describe("given a game with a cover", () => {
    it("returns the cover image id", async () => {
      const user = await createUser(db.prisma);
      const game = await createGame(db.prisma, {
        title: "Covered game",
        slug: "covered-game",
        coverImage: "co1abc",
        releaseDate: midnightUtc("2027-03-14"),
        releaseDatePrecision: "DAY",
      });
      await createLibraryItem(db.prisma, { userId: user.id, gameId: game.id });

      const [release] = await getUpcomingReleases(user.id, UTC_TODAY);

      expect(release.game.coverImage).toBe("co1abc");
    });
  });

  describe("given two users with different libraries", () => {
    let ada: string;
    let grace: string;
    let adaSharedItemId: number;
    let graceSharedItemId: number;

    beforeEach(async () => {
      ada = (await createUser(db.prisma)).id;
      grace = (await createUser(db.prisma)).id;
      await actions.addGameWithExactDate(ada, "Ada's own", "2027-03-12");
      await actions.addGameWithExactDate(grace, "Grace's own", "2027-03-13");
      const shared = await createGame(db.prisma, {
        title: "Shared game",
        slug: "shared-game",
        releaseDate: midnightUtc("2027-03-14"),
        releaseDatePrecision: "DAY",
      });
      adaSharedItemId = (
        await createLibraryItem(db.prisma, { userId: ada, gameId: shared.id })
      ).id;
      graceSharedItemId = (
        await createLibraryItem(db.prisma, { userId: grace, gameId: shared.id })
      ).id;
    });

    it("gives each user their own library item for a game they share", async () => {
      const idOf = async (userId: string) =>
        (await getUpcomingReleases(userId, UTC_TODAY)).find(
          ({ game }) => game.title === "Shared game"
        )?.id;

      expect([await idOf(ada), await idOf(grace)]).toEqual([
        adaSharedItemId,
        graceSharedItemId,
      ]);
    });

    it("lists only the first user's games for them", async () => {
      expect(titlesOf(await getUpcomingReleases(ada, UTC_TODAY))).toEqual([
        "Ada's own",
        "Shared game",
      ]);
    });

    it("lists only the second user's games for them", async () => {
      expect(titlesOf(await getUpcomingReleases(grace, UTC_TODAY))).toEqual([
        "Grace's own",
        "Shared game",
      ]);
    });
  });

  describe("given a game in nobody's library", () => {
    it("is not listed", async () => {
      const user = await createUser(db.prisma);
      await createGame(db.prisma, {
        title: "Nobody's game",
        slug: "nobodys-game",
        releaseDate: midnightUtc("2027-03-14"),
        releaseDatePrecision: "DAY",
      });

      expect(await getUpcomingReleases(user.id, UTC_TODAY)).toEqual([]);
    });
  });
});
