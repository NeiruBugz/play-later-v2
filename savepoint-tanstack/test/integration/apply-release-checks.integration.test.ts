import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { applyReleaseChecks } from "@/entities/game/api/apply-release-checks.server";

import { createGame } from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("apply-release-checks");
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

const storedExactDay = (day: string) => ({
  releaseDate: utcMidnight(day),
  releaseDatePrecision: "DAY" as const,
});

const moveTo = (newDay: string, oldDay: string, movedAt = NOW) => ({
  releaseDateCheckedAt: NOW,
  releaseDate: utcMidnight(newDay),
  releaseDatePrecision: "DAY" as const,
  releaseDateMovedFrom: utcMidnight(oldDay),
  releaseDateMovedAt: movedAt,
});

const readGame = (id: string) =>
  db.prisma.game.findUniqueOrThrow({ where: { id } });

describe("applyReleaseChecks", () => {
  describe("given a game whose stored release still matches what the check saw", () => {
    let gameId: string;
    let updatedRows: number;

    beforeEach(async () => {
      const game = await createGame(db.prisma, storedExactDay("2026-12-10"));
      gameId = game.id;

      updatedRows = await applyReleaseChecks([
        {
          gameId,
          stored: storedExactDay("2026-12-10"),
          data: moveTo("2027-01-21", "2026-12-10"),
        },
      ]);
    });

    it("reports one updated game", () => {
      expect(updatedRows).toBe(1);
    });

    it("writes the new date, the check time and the moved marker", async () => {
      expect(await readGame(gameId)).toMatchObject({
        releaseDate: utcMidnight("2027-01-21"),
        releaseDatePrecision: "DAY",
        releaseDateCheckedAt: NOW,
        releaseDateMovedFrom: utcMidnight("2026-12-10"),
        releaseDateMovedAt: NOW,
      });
    });
  });

  describe("given a check that only stamps the time", () => {
    let gameId: string;

    beforeEach(async () => {
      const game = await createGame(db.prisma, storedExactDay("2026-12-10"));
      gameId = game.id;

      await applyReleaseChecks([
        {
          gameId,
          stored: storedExactDay("2026-12-10"),
          data: { releaseDateCheckedAt: NOW },
        },
      ]);
    });

    it("leaves the stored release untouched", async () => {
      expect(await readGame(gameId)).toMatchObject({
        releaseDate: utcMidnight("2026-12-10"),
        releaseDatePrecision: "DAY",
        releaseDateCheckedAt: NOW,
        releaseDateMovedFrom: null,
        releaseDateMovedAt: null,
      });
    });
  });

  describe("given a legacy game with no release precision and no date", () => {
    let gameId: string;
    let updatedRows: number;

    beforeEach(async () => {
      const game = await createGame(db.prisma, {
        releaseDate: null,
        releaseDatePrecision: null,
      });
      gameId = game.id;

      updatedRows = await applyReleaseChecks([
        {
          gameId,
          stored: { releaseDate: null, releaseDatePrecision: null },
          data: {
            releaseDateCheckedAt: NOW,
            releaseDate: utcMidnight("2027-03-14"),
            releaseDatePrecision: "DAY",
          },
        },
      ]);
    });

    it("matches the empty stored values and updates the row", async () => {
      expect(updatedRows).toBe(1);
      expect(await readGame(gameId)).toMatchObject({
        releaseDate: utcMidnight("2027-03-14"),
        releaseDatePrecision: "DAY",
      });
    });
  });

  describe("given a game that changed after the check read it", () => {
    let gameId: string;
    let updatedRows: number;

    beforeEach(async () => {
      const game = await createGame(db.prisma, storedExactDay("2027-02-02"));
      gameId = game.id;

      updatedRows = await applyReleaseChecks([
        {
          gameId,
          stored: storedExactDay("2026-12-10"),
          data: moveTo("2027-01-21", "2026-12-10"),
        },
      ]);
    });

    it("updates nothing", () => {
      expect(updatedRows).toBe(0);
    });

    it("leaves the newer stored release alone, with no marker", async () => {
      expect(await readGame(gameId)).toMatchObject({
        releaseDate: utcMidnight("2027-02-02"),
        releaseDateCheckedAt: null,
        releaseDateMovedFrom: null,
        releaseDateMovedAt: null,
      });
    });
  });

  describe("given a game whose precision changed after the check read it", () => {
    it("updates nothing even though the date is the same", async () => {
      const game = await createGame(db.prisma, {
        releaseDate: utcMidnight("2027-01-01"),
        releaseDatePrecision: "YEAR",
      });

      const updatedRows = await applyReleaseChecks([
        {
          gameId: game.id,
          stored: storedExactDay("2027-01-01"),
          data: { releaseDateCheckedAt: NOW },
        },
      ]);

      expect(updatedRows).toBe(0);
    });
  });

  describe("given updates for several games, one of them stale", () => {
    let freshGameId: string;
    let staleGameId: string;
    let updatedRows: number;

    beforeEach(async () => {
      freshGameId = (await createGame(db.prisma, storedExactDay("2026-12-10")))
        .id;
      staleGameId = (await createGame(db.prisma, storedExactDay("2027-02-02")))
        .id;

      updatedRows = await applyReleaseChecks([
        {
          gameId: freshGameId,
          stored: storedExactDay("2026-12-10"),
          data: { releaseDateCheckedAt: NOW },
        },
        {
          gameId: staleGameId,
          stored: storedExactDay("2026-12-10"),
          data: { releaseDateCheckedAt: NOW },
        },
      ]);
    });

    it("counts only the games that were updated", () => {
      expect(updatedRows).toBe(1);
    });

    it("updates the matching game and not the stale one", async () => {
      expect((await readGame(freshGameId)).releaseDateCheckedAt).toEqual(NOW);
      expect((await readGame(staleGameId)).releaseDateCheckedAt).toBeNull();
    });
  });

  describe("given no updates", () => {
    it("updates nothing", async () => {
      expect(await applyReleaseChecks([])).toBe(0);
    });
  });

  describe("given two visits that both read the same stored release", () => {
    let gameId: string;
    let updatedRowsPerVisit: number[];

    beforeEach(async () => {
      const game = await createGame(db.prisma, storedExactDay("2026-12-10"));
      gameId = game.id;
      const laterVisit = new Date("2026-11-12T12:00:05Z");

      updatedRowsPerVisit = await Promise.all([
        applyReleaseChecks([
          {
            gameId,
            stored: storedExactDay("2026-12-10"),
            data: moveTo("2027-01-21", "2026-12-10", NOW),
          },
        ]),
        applyReleaseChecks([
          {
            gameId,
            stored: storedExactDay("2026-12-10"),
            data: moveTo("2027-01-21", "2026-12-10", laterVisit),
          },
        ]),
      ]);
    });

    it("lets exactly one of them update the game", () => {
      expect([...updatedRowsPerVisit].sort()).toEqual([0, 1]);
    });

    it("records the move once, from the original date", async () => {
      expect(await readGame(gameId)).toMatchObject({
        releaseDate: utcMidnight("2027-01-21"),
        releaseDateMovedFrom: utcMidnight("2026-12-10"),
      });
    });
  });
});
