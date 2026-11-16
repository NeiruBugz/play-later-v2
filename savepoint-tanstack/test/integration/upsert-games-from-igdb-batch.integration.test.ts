import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { upsertGameFromIgdbPayload } from "@/entities/game/api/upsert-game.server";
import { upsertGamesFromIgdbBatch } from "@/entities/game/api/upsert-games-from-igdb-batch.server";
import releaseDatesFixture from "@/shared/api/igdb/__fixtures__/release-dates-live-2026-11-12.json";

import { createGame } from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("upsert-games-from-igdb-batch");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.game.deleteMany();
});

const payload = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  name: `Game ${id}`,
  slug: `game-${id}`,
  ...overrides,
});

describe("upsertGamesFromIgdbBatch", () => {
  describe("given payloads for games not in the catalogue yet", () => {
    it("creates them and maps each igdbId to its Game id", async () => {
      const ids = await upsertGamesFromIgdbBatch([
        payload(1, { cover: { image_id: "co1" } }),
        payload(2),
      ]);

      const stored = await db.prisma.game.findMany({
        orderBy: { igdbId: "asc" },
      });
      expect(stored.map((g) => g.igdbId)).toEqual([1, 2]);
      expect(ids).toEqual(
        new Map([
          [1, stored[0]!.id],
          [2, stored[1]!.id],
        ])
      );
      expect(stored[0]).toMatchObject({
        title: "Game 1",
        slug: "game-1",
        coverImage:
          "https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg",
      });
    });
  });

  describe("given a payload for a game that already exists", () => {
    it("returns the existing id and leaves the row alone", async () => {
      const existing = await createGame(db.prisma, {
        igdbId: 7,
        slug: "game-7",
        title: "Curated title",
      });

      const ids = await upsertGamesFromIgdbBatch([payload(7)]);

      expect(ids.get(7)).toBe(existing.id);
      expect(
        (await db.prisma.game.findUniqueOrThrow({ where: { id: existing.id } }))
          .title
      ).toBe("Curated title");
    });
  });

  describe("given the same game twice in one batch", () => {
    it("creates it once", async () => {
      const ids = await upsertGamesFromIgdbBatch([payload(3), payload(3)]);

      expect(ids.size).toBe(1);
      expect(await db.prisma.game.count()).toBe(1);
    });
  });

  describe("given a new game whose slug belongs to another game", () => {
    it("leaves it out of the result and still creates the others", async () => {
      await createGame(db.prisma, { igdbId: 50, slug: "taken-slug" });

      const ids = await upsertGamesFromIgdbBatch([
        payload(51, { slug: "taken-slug" }),
        payload(52),
      ]);

      expect(ids.has(51)).toBe(false);
      expect(ids.has(52)).toBe(true);
    });
  });

  describe("given an empty batch", () => {
    it("returns an empty map", async () => {
      expect(await upsertGamesFromIgdbBatch([])).toEqual(new Map());
    });
  });

  describe("given payloads with release dates", () => {
    it("stores the same date, precision and check stamp as the single-game upsert", async () => {
      const { day, month } = releaseDatesFixture.games;
      const batchDay = { ...day, slug: `live-${day.id}` };
      const batchMonth = { ...month, slug: `live-${month.id}` };

      const ids = await upsertGamesFromIgdbBatch([batchDay, batchMonth]);
      const single = await upsertGameFromIgdbPayload({
        ...day,
        id: day.id + 1_000_000,
        slug: "single-day",
      });

      const batchStored = await db.prisma.game.findUniqueOrThrow({
        where: { id: ids.get(day.id)! },
      });
      const monthStored = await db.prisma.game.findUniqueOrThrow({
        where: { id: ids.get(month.id)! },
      });
      expect(batchStored.releaseDate).toEqual(single.releaseDate);
      expect(batchStored.releaseDatePrecision).toBe(
        single.releaseDatePrecision
      );
      expect(batchStored.releaseDateCheckedAt).toBeInstanceOf(Date);
      expect(monthStored.releaseDatePrecision).toBe("MONTH");
    });

    it("falls back to the legacy first release date with no precision", async () => {
      const ids = await upsertGamesFromIgdbBatch([
        payload(9, { first_release_date: 1645747200 }),
      ]);

      const stored = await db.prisma.game.findUniqueOrThrow({
        where: { id: ids.get(9)! },
      });
      expect(stored.releaseDate).toEqual(new Date("2022-02-25T00:00:00.000Z"));
      expect(stored.releaseDatePrecision).toBeNull();
      expect(stored.releaseDateCheckedAt).toBeNull();
    });
  });
});
