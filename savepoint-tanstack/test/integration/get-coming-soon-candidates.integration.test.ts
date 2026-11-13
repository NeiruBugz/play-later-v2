/**
 * Integration tests for getComingSoonCandidates.
 *
 * Contract: the user's library games (any status, owned or not) with an exact
 * release day from the day before `utcToday` through 31 days after it (one day of
 * slack each side so the client can apply the device's own day), ordered by
 * release date then title, at most 10, only this user's library.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getComingSoonCandidates } from "@/entities/library-item/api/get-coming-soon-candidates.server";

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
const TWO_DAYS_AGO = "2026-11-10";
const YESTERDAY = "2026-11-11";
const TOMORROW = "2026-11-13";
const IN_NINE_DAYS = "2026-11-21";
const IN_THIRTY_ONE_DAYS = "2026-12-13";
const IN_THIRTY_TWO_DAYS = "2026-12-14";

type ReleasePrecision = "DAY" | "MONTH" | "QUARTER" | "YEAR" | "TBA";

const midnightUtc = (day: string) => new Date(`${day}T00:00:00.000Z`);

let db: IsolatedDatabase;
let userId: string;
let otherUserId: string;

const actions = {
  addGameToLibrary: async (
    title: string,
    release: { day: string | null; precision: ReleasePrecision | null },
    library: {
      owner?: string;
      status?: "WANT" | "PLAYING" | "DONE";
      isOwned?: boolean;
    } = {}
  ) => {
    const game = await createGame(db.prisma, {
      title,
      slug: title.toLowerCase().replaceAll(" ", "-"),
      coverImage: `cover-of-${title}`,
      releaseDate: release.day === null ? null : midnightUtc(release.day),
      releaseDatePrecision: release.precision,
    });
    const libraryItem = await createLibraryItem(db.prisma, {
      userId: library.owner ?? userId,
      gameId: game.id,
      status: library.status ?? "WANT",
      isOwned: library.isOwned ?? true,
    });
    return libraryItem.id;
  },
  addExactDayGame: (title: string, day: string): Promise<number> =>
    actions.addGameToLibrary(title, { day, precision: "DAY" }),
};

const elements = {
  getCandidateTitles: async () =>
    (await getComingSoonCandidates(userId, UTC_TODAY)).map(
      ({ game }) => game.title
    ),
};

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-coming-soon-candidates");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
  userId = (await createUser(db.prisma)).id;
  otherUserId = (await createUser(db.prisma)).id;
});

describe("getComingSoonCandidates", () => {
  describe("given a library with no games", () => {
    it("returns nothing", async () => {
      expect(await elements.getCandidateTitles()).toEqual([]);
    });
  });

  describe("given an exact-day game in the library", () => {
    it("returns what the Coming soon entry needs", async () => {
      await actions.addExactDayGame("Hollow Knight", IN_NINE_DAYS);

      const candidates = await getComingSoonCandidates(userId, UTC_TODAY);

      expect(candidates).toHaveLength(1);
      expect(candidates[0].game).toEqual({
        slug: "hollow-knight",
        title: "Hollow Knight",
        coverImage: "cover-of-Hollow Knight",
        releaseDate: midnightUtc(IN_NINE_DAYS),
        releaseDatePrecision: "DAY",
      });
    });

    it("identifies each candidate by the id of its library item", async () => {
      const firstItemId = await actions.addExactDayGame("First", TOMORROW);
      const secondItemId = await actions.addExactDayGame(
        "Second",
        IN_NINE_DAYS
      );

      const ids = (await getComingSoonCandidates(userId, UTC_TODAY)).map(
        ({ id }) => id
      );

      expect(ids).toEqual([firstItemId, secondItemId]);
      expect(firstItemId).not.toBe(secondItemId);
    });
  });

  describe("given games around the edges of the window", () => {
    beforeEach(async () => {
      await actions.addExactDayGame("Two Days Ago", TWO_DAYS_AGO);
      await actions.addExactDayGame("Yesterday", YESTERDAY);
      await actions.addExactDayGame("Today", UTC_TODAY);
      await actions.addExactDayGame("Day Thirty One", IN_THIRTY_ONE_DAYS);
      await actions.addExactDayGame("Day Thirty Two", IN_THIRTY_TWO_DAYS);
    });

    it("keeps one day of slack before today and thirty-one days after it", async () => {
      expect(await elements.getCandidateTitles()).toEqual([
        "Yesterday",
        "Today",
        "Day Thirty One",
      ]);
    });
  });

  describe("given games whose release is only a month, a quarter, a year or TBA", () => {
    beforeEach(async () => {
      await actions.addGameToLibrary("Month Only", {
        day: "2026-12-01",
        precision: "MONTH",
      });
      await actions.addGameToLibrary("Quarter Only", {
        day: "2026-12-01",
        precision: "QUARTER",
      });
      await actions.addGameToLibrary("Year Only", {
        day: "2026-12-01",
        precision: "YEAR",
      });
      await actions.addGameToLibrary("To Be Announced", {
        day: null,
        precision: "TBA",
      });
      await actions.addGameToLibrary("Never Checked", {
        day: IN_NINE_DAYS,
        precision: null,
      });
      await actions.addGameToLibrary("No Date", { day: null, precision: null });
      await actions.addExactDayGame("Exact Day", IN_NINE_DAYS);
    });

    it("returns only the exact-day game", async () => {
      expect(await elements.getCandidateTitles()).toEqual(["Exact Day"]);
    });
  });

  describe("given games with any status and ownership", () => {
    beforeEach(async () => {
      await actions.addGameToLibrary(
        "Done Game",
        { day: TOMORROW, precision: "DAY" },
        { status: "DONE" }
      );
      await actions.addGameToLibrary(
        "Not Owned Want",
        { day: IN_NINE_DAYS, precision: "DAY" },
        { status: "WANT", isOwned: false }
      );
      await actions.addGameToLibrary(
        "Playing Game",
        { day: UTC_TODAY, precision: "DAY" },
        { status: "PLAYING" }
      );
    });

    it("returns all of them", async () => {
      expect(await elements.getCandidateTitles()).toEqual([
        "Playing Game",
        "Done Game",
        "Not Owned Want",
      ]);
    });
  });

  describe("given games handed in out of order, two on the same day", () => {
    beforeEach(async () => {
      await actions.addExactDayGame("Zelda", IN_NINE_DAYS);
      await actions.addExactDayGame("Later", IN_THIRTY_ONE_DAYS);
      await actions.addExactDayGame("Alan Wake", IN_NINE_DAYS);
      await actions.addExactDayGame("Sooner", TOMORROW);
    });

    it("orders them by release date, then title", async () => {
      expect(await elements.getCandidateTitles()).toEqual([
        "Sooner",
        "Alan Wake",
        "Zelda",
        "Later",
      ]);
    });
  });

  describe("given twelve exact-day games in the window", () => {
    beforeEach(async () => {
      for (let dayOffset = 1; dayOffset <= 12; dayOffset += 1) {
        const day = midnightUtc(UTC_TODAY);
        day.setUTCDate(day.getUTCDate() + dayOffset);
        await actions.addExactDayGame(
          `Game ${String(dayOffset).padStart(2, "0")}`,
          day.toISOString().slice(0, 10)
        );
      }
    });

    it("returns the ten nearest", async () => {
      const titles = await elements.getCandidateTitles();

      expect(titles).toHaveLength(10);
      expect(titles[0]).toBe("Game 01");
      expect(titles[9]).toBe("Game 10");
    });
  });

  describe("given another user's games in the window", () => {
    beforeEach(async () => {
      await actions.addGameToLibrary(
        "Someone Else's Game",
        { day: TOMORROW, precision: "DAY" },
        { owner: otherUserId }
      );
      await actions.addExactDayGame("My Game", IN_NINE_DAYS);
    });

    it("returns only the user's own games", async () => {
      expect(await elements.getCandidateTitles()).toEqual(["My Game"]);
    });

    it("returns the other user's game to its owner", async () => {
      const otherTitles = (
        await getComingSoonCandidates(otherUserId, UTC_TODAY)
      ).map(({ game }) => game.title);

      expect(otherTitles).toEqual(["Someone Else's Game"]);
    });
  });
});
