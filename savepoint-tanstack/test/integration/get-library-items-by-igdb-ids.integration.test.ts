import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getLibraryItemsByIgdbIds } from "@/entities/library-item/api/get-library-items-by-igdb-ids.server";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-library-by-igdb");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

const baseTimestamps = {
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

describe("getLibraryItemsByIgdbIds", () => {
  describe("given the viewer owns some of the requested games", () => {
    beforeEach(async () => {
      await db.prisma.user.create({
        data: {
          id: "viewer-1",
          email: "viewer-1@example.com",
          name: "Viewer One",
          emailVerified: true,
          ...baseTimestamps,
        },
      });
      await db.prisma.user.create({
        data: {
          id: "other-1",
          email: "other-1@example.com",
          name: "Other",
          emailVerified: true,
          ...baseTimestamps,
        },
      });
      await db.prisma.game.create({
        data: {
          id: "g-hades",
          igdbId: 7777,
          title: "Hades",
          slug: "hades",
          ...baseTimestamps,
        },
      });
      await db.prisma.game.create({
        data: {
          id: "g-celeste",
          igdbId: 8888,
          title: "Celeste",
          slug: "celeste",
          ...baseTimestamps,
        },
      });
      await db.prisma.libraryItem.create({
        data: {
          userId: "viewer-1",
          gameId: "g-hades",
          status: "PLAYED",
          rating: 9,
          acquisitionType: "DIGITAL",
          ...baseTimestamps,
        },
      });
      // Owned by a DIFFERENT user — must not leak into viewer-1's result.
      await db.prisma.libraryItem.create({
        data: {
          userId: "other-1",
          gameId: "g-celeste",
          status: "PLAYING",
          rating: null,
          acquisitionType: "DIGITAL",
          ...baseTimestamps,
        },
      });
    });

    it("returns library state only for games the viewer owns, keyed by igdbId", async () => {
      const result = await getLibraryItemsByIgdbIds("viewer-1", [7777, 8888]);

      expect(result.get(7777)).toEqual({ status: "PLAYED", rating: 9 });
      // Celeste belongs to another user — absent for this viewer.
      expect(result.has(8888)).toBe(false);
    });
  });

  describe("given an empty id list", () => {
    it("short-circuits to an empty Map without querying", async () => {
      const result = await getLibraryItemsByIgdbIds("viewer-1", []);
      expect(result.size).toBe(0);
    });
  });
});
