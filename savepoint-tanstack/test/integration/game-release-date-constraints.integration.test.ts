/**
 * Integration tests for the release-date CHECK constraints on the Game table.
 *
 * Contract: a moved marker is a pair (both set or both empty), a TBA game never
 * carries a date, and every stored release date is a calendar day at UTC midnight.
 * Prisma ignores CHECKs, so the rows are written with raw SQL.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

type ReleaseColumns = {
  releaseDate?: Date | null;
  releaseDatePrecision?: "DAY" | "MONTH" | "QUARTER" | "YEAR" | "TBA" | null;
  releaseDateMovedFrom?: Date | null;
  releaseDateMovedAt?: Date | null;
};

const CHECK_VIOLATION = "violates check constraint";

const MIDNIGHT_14_MARCH = new Date("2027-03-14T00:00:00.000Z");
const MIDNIGHT_3_JUNE = new Date("2027-06-03T00:00:00.000Z");
const HALF_PAST_NOON_14_MARCH = new Date("2027-03-14T12:30:00.000Z");
const JUST_AFTER_MIDNIGHT_14_MARCH = new Date("2027-03-14T00:00:00.001Z");
const OBSERVED_AT = new Date("2026-11-12T10:00:00.000Z");

let db: IsolatedDatabase;
let gameNumber = 0;
let storedIgdbId: number;
let rejection: unknown;

const actions = {
  insertGame: async (columns: ReleaseColumns) => {
    gameNumber += 1;
    storedIgdbId = 900_000 + gameNumber;
    const releaseDate = columns.releaseDate ?? null;
    const precision = columns.releaseDatePrecision ?? null;
    const movedFrom = columns.releaseDateMovedFrom ?? null;
    const movedAt = columns.releaseDateMovedAt ?? null;
    try {
      await db.prisma.$executeRaw`
        INSERT INTO "Game" (
          "id", "igdbId", "title", "slug", "updatedAt",
          "releaseDate", "releaseDatePrecision",
          "releaseDateMovedFrom", "releaseDateMovedAt"
        ) VALUES (
          ${`game-${gameNumber}`}, ${storedIgdbId}, ${`Game ${gameNumber}`},
          ${`game-${gameNumber}`}, now(),
          ${releaseDate}, ${precision}::"ReleaseDatePrecision",
          ${movedFrom}, ${movedAt}
        )
      `;
      rejection = null;
    } catch (error) {
      rejection = error;
    }
  },
};

const elements = {
  countStoredGames: async () => {
    const rows = await db.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT count(*) AS count FROM "Game" WHERE "igdbId" = ${storedIgdbId}
    `;
    return Number(rows[0]?.count ?? 0);
  },
};

beforeAll(async () => {
  db = await setupIsolatedDatabase("game-release-date-constraints");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

describe("given the migrated Game table", () => {
  describe("when a game has a moved-from date but no moved-at time", () => {
    beforeEach(async () => {
      await actions.insertGame({
        releaseDate: MIDNIGHT_3_JUNE,
        releaseDatePrecision: "DAY",
        releaseDateMovedFrom: MIDNIGHT_14_MARCH,
        releaseDateMovedAt: null,
      });
    });

    it("rejects the row with a check constraint violation", () => {
      expect(String(rejection)).toContain(CHECK_VIOLATION);
    });
  });

  describe("when a game has a moved-at time but no moved-from date", () => {
    beforeEach(async () => {
      await actions.insertGame({
        releaseDate: MIDNIGHT_3_JUNE,
        releaseDatePrecision: "DAY",
        releaseDateMovedFrom: null,
        releaseDateMovedAt: OBSERVED_AT,
      });
    });

    it("rejects the row with a check constraint violation", () => {
      expect(String(rejection)).toContain(CHECK_VIOLATION);
    });
  });

  describe("when a game with a date still to be announced carries a date", () => {
    beforeEach(async () => {
      await actions.insertGame({
        releaseDate: MIDNIGHT_14_MARCH,
        releaseDatePrecision: "TBA",
      });
    });

    it("rejects the row with a check constraint violation", () => {
      expect(String(rejection)).toContain(CHECK_VIOLATION);
    });
  });

  describe.each([
    ["half past noon", HALF_PAST_NOON_14_MARCH],
    ["a millisecond after midnight", JUST_AFTER_MIDNIGHT_14_MARCH],
  ])("when a game has a release date at %s", (_description, releaseDate) => {
    beforeEach(async () => {
      await actions.insertGame({
        releaseDate,
        releaseDatePrecision: "DAY",
      });
    });

    it("rejects the row with a check constraint violation", () => {
      expect(String(rejection)).toContain(CHECK_VIOLATION);
    });
  });

  describe("when a game has an exact day at UTC midnight", () => {
    beforeEach(async () => {
      await actions.insertGame({
        releaseDate: MIDNIGHT_14_MARCH,
        releaseDatePrecision: "DAY",
      });
    });

    it("accepts the row", () => {
      expect(rejection).toBeNull();
    });

    it("stores the game", async () => {
      expect(await elements.countStoredGames()).toBe(1);
    });
  });

  describe("when a game has a date still to be announced and no date", () => {
    beforeEach(async () => {
      await actions.insertGame({
        releaseDate: null,
        releaseDatePrecision: "TBA",
      });
    });

    it("accepts the row", () => {
      expect(rejection).toBeNull();
    });

    it("stores the game", async () => {
      expect(await elements.countStoredGames()).toBe(1);
    });
  });

  describe("when a game has no date and no precision", () => {
    beforeEach(async () => {
      await actions.insertGame({});
    });

    it("accepts the row", () => {
      expect(rejection).toBeNull();
    });
  });

  describe("when a game has a full moved pair", () => {
    beforeEach(async () => {
      await actions.insertGame({
        releaseDate: MIDNIGHT_3_JUNE,
        releaseDatePrecision: "DAY",
        releaseDateMovedFrom: MIDNIGHT_14_MARCH,
        releaseDateMovedAt: OBSERVED_AT,
      });
    });

    it("accepts the row", () => {
      expect(rejection).toBeNull();
    });

    it("stores the game", async () => {
      expect(await elements.countStoredGames()).toBe(1);
    });
  });
});
