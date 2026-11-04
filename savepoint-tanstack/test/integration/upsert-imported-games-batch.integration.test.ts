/**
 * Integration tests for upsertImportedGamesBatch at library scale and under
 * concurrency. Backed by the partial unique index on
 * (userId, storefront, storefrontGameId) WHERE deletedAt IS NULL.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { upsertImportedGamesBatch } from "@/entities/imported-game/api/upsert-imported-games-batch.server";
import type { SteamImportedGameInput } from "@/entities/imported-game/model/types";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("upsert-imported-games-batch");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const ALICE_ID = "uigb-alice";

beforeEach(async () => {
  await db.prisma.importedGame.deleteMany();
  await db.prisma.user.deleteMany();
  await db.prisma.user.create({
    data: {
      id: ALICE_ID,
      email: "uigb-alice@example.com",
      name: "Alice",
      emailVerified: true,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
  });
});

function makeLibrary(size: number, playtime = 10): SteamImportedGameInput[] {
  return Array.from({ length: size }, (_, i) => ({
    storefrontGameId: String(1000 + i),
    name: `Game ${i}`,
    playtime,
    playtimeWindows: playtime,
    playtimeMac: 0,
    playtimeLinux: 0,
    lastPlayedAt: i % 2 === 0 ? new Date("2024-06-01T00:00:00.000Z") : null,
    imgIconUrl: i % 3 === 0 ? `icon-${i}` : null,
    imgLogoUrl: null,
  }));
}

describe("upsertImportedGamesBatch at scale", () => {
  describe("given a 1200-game library", () => {
    it("imports all of it in one call", async () => {
      const result = await upsertImportedGamesBatch(
        ALICE_ID,
        makeLibrary(1200)
      );

      expect(result).toEqual({ created: 1200, updated: 0 });
      expect(
        await db.prisma.importedGame.count({ where: { userId: ALICE_ID } })
      ).toBe(1200);
    }, 30_000);

    it("stores every field and defaults new rows to PENDING", async () => {
      await upsertImportedGamesBatch(ALICE_ID, makeLibrary(3, 42));

      const row = await db.prisma.importedGame.findFirstOrThrow({
        where: { userId: ALICE_ID, storefrontGameId: "1000" },
      });
      expect(row).toMatchObject({
        name: "Game 0",
        storefront: "STEAM",
        playtime: 42,
        playtimeWindows: 42,
        igdbMatchStatus: "PENDING",
        img_icon_url: "icon-0",
        lastPlayedAt: new Date("2024-06-01T00:00:00.000Z"),
      });
    });
  });

  describe("given the same library is imported twice", () => {
    it("updates the second time without duplicating", async () => {
      await upsertImportedGamesBatch(ALICE_ID, makeLibrary(700, 10));
      const second = await upsertImportedGamesBatch(
        ALICE_ID,
        makeLibrary(700, 99)
      );

      expect(second).toEqual({ created: 0, updated: 700 });
      expect(
        await db.prisma.importedGame.count({ where: { userId: ALICE_ID } })
      ).toBe(700);
      const sample = await db.prisma.importedGame.findFirstOrThrow({
        where: { userId: ALICE_ID, storefrontGameId: "1005" },
      });
      expect(sample.playtime).toBe(99);
    }, 30_000);

    it("preserves the match status of an already-triaged row", async () => {
      await upsertImportedGamesBatch(ALICE_ID, makeLibrary(2));
      await db.prisma.importedGame.updateMany({
        where: { userId: ALICE_ID, storefrontGameId: "1000" },
        data: { igdbMatchStatus: "IGNORED" },
      });

      await upsertImportedGamesBatch(ALICE_ID, makeLibrary(2, 50));

      const row = await db.prisma.importedGame.findFirstOrThrow({
        where: { userId: ALICE_ID, storefrontGameId: "1000" },
      });
      expect(row.igdbMatchStatus).toBe("IGNORED");
      expect(row.playtime).toBe(50);
    });
  });

  describe("given two imports of the same library run concurrently", () => {
    it("leaves exactly one live row per game", async () => {
      const library = makeLibrary(600);

      const [a, b] = await Promise.all([
        upsertImportedGamesBatch(ALICE_ID, library),
        upsertImportedGamesBatch(ALICE_ID, library),
      ]);

      const live = await db.prisma.importedGame.findMany({
        where: { userId: ALICE_ID, deletedAt: null },
        select: { storefrontGameId: true },
      });
      expect(live).toHaveLength(600);
      expect(new Set(live.map((r) => r.storefrontGameId)).size).toBe(600);
      expect(a.created + b.created).toBe(600);
      expect(a.updated + b.updated).toBe(600);
    }, 30_000);
  });

  describe("given a soft-deleted row exists for a game", () => {
    it("does not block re-import and leaves the deleted row untouched", async () => {
      const deletedAt = new Date("2024-02-01T00:00:00.000Z");
      const tombstone = await db.prisma.importedGame.create({
        data: {
          userId: ALICE_ID,
          name: "Old name",
          storefront: "STEAM",
          storefrontGameId: "1000",
          deletedAt,
        },
      });

      const result = await upsertImportedGamesBatch(ALICE_ID, makeLibrary(2));

      expect(result).toEqual({ created: 2, updated: 0 });
      const rows = await db.prisma.importedGame.findMany({
        where: { userId: ALICE_ID, storefrontGameId: "1000" },
      });
      expect(rows).toHaveLength(2);
      const stillDeleted = rows.find((r) => r.id === tombstone.id);
      expect(stillDeleted?.deletedAt).toEqual(deletedAt);
      expect(stillDeleted?.name).toBe("Old name");
    });
  });

  describe("given the payload repeats a storefrontGameId", () => {
    it("imports it once", async () => {
      const [first] = makeLibrary(1);
      const result = await upsertImportedGamesBatch(ALICE_ID, [
        first,
        { ...first, name: "Renamed" },
      ]);

      expect(result).toEqual({ created: 1, updated: 0 });
      const row = await db.prisma.importedGame.findFirstOrThrow({
        where: { userId: ALICE_ID },
      });
      expect(row.name).toBe("Renamed");
    });
  });
});
