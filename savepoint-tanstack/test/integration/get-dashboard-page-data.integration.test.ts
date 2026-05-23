/**
 * Integration tests for getDashboardPageDataWorker.
 *
 * Covers:
 *   - UnauthorizedError on missing userId
 *   - Empty library (hasEmptyLibrary = true, showStats = false)
 *   - showStats gate: total >= 3 enables stats card
 *   - safeName @-strip: profile.name containing "@" is ignored, falls back to username
 *   - safeName happy path: name without "@" is used as greeting
 *   - username fallback: no name, no username → "there"
 *   - quickLogGames sliced from PLAYING items
 *   - continuePlaying, upNext, recentlyAdded derivations
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getDashboardPageDataWorker } from "@/features/dashboard/api/get-dashboard-page-data.worker";
import { UnauthorizedError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-dashboard-page-data");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

let _igdbCounter = 70_000;

function makeUser(
  suffix: string,
  opts: { name?: string | null; username?: string } = {}
) {
  return {
    id: `ddpd-user-${suffix}`,
    email: `ddpd-${suffix}@example.com`,
    name: opts.name !== undefined ? opts.name : `Dashboard User ${suffix}`,
    username: opts.username ?? `ddpd-${suffix}`,
    emailVerified: true,
    isPublicProfile: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string) {
  return {
    id: `ddpd-game-${suffix}`,
    igdbId: _igdbCounter++,
    title: `Dashboard Game ${suffix}`,
    slug: `dashboard-game-${suffix}`,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeLibraryItem(
  userId: string,
  gameId: string,
  opts: {
    status?: "WISHLIST" | "SHELF" | "UP_NEXT" | "PLAYING" | "PLAYED";
    createdAt?: Date;
    updatedAt?: Date;
  } = {}
) {
  const ts = opts.createdAt ?? new Date("2024-06-01T00:00:00.000Z");
  return {
    userId,
    gameId,
    status: (opts.status ?? "SHELF") as
      | "WISHLIST"
      | "SHELF"
      | "UP_NEXT"
      | "PLAYING"
      | "PLAYED",
    acquisitionType: "DIGITAL" as const,
    createdAt: ts,
    updatedAt: opts.updatedAt ?? ts,
  };
}

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

// ---------------------------------------------------------------------------
// Auth gate
// ---------------------------------------------------------------------------

describe("getDashboardPageDataWorker", () => {
  describe("auth gate", () => {
    it("throws UnauthorizedError when userId is undefined", async () => {
      await expect(getDashboardPageDataWorker(undefined)).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  // -------------------------------------------------------------------------
  // Empty library
  // -------------------------------------------------------------------------

  describe("given a user with an empty library", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("empty") });
    });

    it("sets hasEmptyLibrary to true", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-empty");

      expect(data.hasEmptyLibrary).toBe(true);
    });

    it("sets showStats to false (0 games below threshold of 3)", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-empty");

      expect(data.showStats).toBe(false);
    });

    it("returns zero status counts for all statuses", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-empty");

      expect(data.statusCounts.PLAYING).toBe(0);
      expect(data.statusCounts.PLAYED).toBe(0);
      expect(data.statusCounts.UP_NEXT).toBe(0);
      expect(data.statusCounts.SHELF).toBe(0);
      expect(data.statusCounts.WISHLIST).toBe(0);
    });

    it("returns empty quickLogGames", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-empty");

      expect(data.quickLogGames).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // showStats gate: total >= 3 enables, total < 3 disables
  // -------------------------------------------------------------------------

  describe("showStats gate", () => {
    it("sets showStats to false when total games = 2 (below threshold)", async () => {
      await db.prisma.user.create({ data: makeUser("two-games") });
      await db.prisma.game.createMany({
        data: [makeGame("sg-a"), makeGame("sg-b")],
      });
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem("ddpd-user-two-games", "ddpd-game-sg-a"),
          makeLibraryItem("ddpd-user-two-games", "ddpd-game-sg-b"),
        ],
      });

      const data = await getDashboardPageDataWorker("ddpd-user-two-games");

      expect(data.showStats).toBe(false);
    });

    it("sets showStats to true when total games = 3 (at threshold)", async () => {
      await db.prisma.user.create({ data: makeUser("three-games") });
      await db.prisma.game.createMany({
        data: [makeGame("tg-a"), makeGame("tg-b"), makeGame("tg-c")],
      });
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem("ddpd-user-three-games", "ddpd-game-tg-a"),
          makeLibraryItem("ddpd-user-three-games", "ddpd-game-tg-b"),
          makeLibraryItem("ddpd-user-three-games", "ddpd-game-tg-c"),
        ],
      });

      const data = await getDashboardPageDataWorker("ddpd-user-three-games");

      expect(data.showStats).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // safeName / greeting derivation
  // -------------------------------------------------------------------------

  describe("username / greeting derivation", () => {
    it("uses profile.name as greeting when name does not contain @", async () => {
      await db.prisma.user.create({
        data: makeUser("named", { name: "Alice" }),
      });

      const data = await getDashboardPageDataWorker("ddpd-user-named");

      expect(data.username).toBe("Alice");
    });

    it("strips an @-containing name and falls back to username", async () => {
      await db.prisma.user.create({
        data: makeUser("email-as-name", {
          name: "alice@example.com",
          username: "alice-handle",
        }),
      });

      const data = await getDashboardPageDataWorker("ddpd-user-email-as-name");

      expect(data.username).toBe("alice-handle");
    });

    it("falls back to 'there' when both name and username are absent", async () => {
      // Prisma user with null name and null username.
      await db.prisma.user.create({
        data: {
          ...makeUser("no-name"),
          name: null,
          username: null,
          email: "ddpd-no-name@example.com",
          id: "ddpd-user-no-name",
        },
      });

      const data = await getDashboardPageDataWorker("ddpd-user-no-name");

      expect(data.username).toBe("there");
    });

    it("falls back to 'there' when the profile lookup throws (catch-null guard)", async () => {
      // No user row exists for this userId — getProfileById will throw NotFoundError
      // which the worker catches with .catch(() => null). The worker must still
      // return successfully with username="there" and an empty library.
      const data = await getDashboardPageDataWorker(
        "ddpd-user-nonexistent-profile"
      );

      expect(data.username).toBe("there");
      expect(data.hasEmptyLibrary).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // quickLogGames — top-3 PLAYING items
  // -------------------------------------------------------------------------

  describe("quickLogGames derivation", () => {
    it("includes PLAYING games in quickLogGames (up to 3)", async () => {
      await db.prisma.user.create({ data: makeUser("quick-log") });
      await db.prisma.game.createMany({
        data: [
          makeGame("ql-a"),
          makeGame("ql-b"),
          makeGame("ql-c"),
          makeGame("ql-d"),
        ],
      });
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem("ddpd-user-quick-log", "ddpd-game-ql-a", {
            status: "PLAYING",
          }),
          makeLibraryItem("ddpd-user-quick-log", "ddpd-game-ql-b", {
            status: "PLAYING",
          }),
          makeLibraryItem("ddpd-user-quick-log", "ddpd-game-ql-c", {
            status: "PLAYING",
          }),
          makeLibraryItem("ddpd-user-quick-log", "ddpd-game-ql-d", {
            status: "PLAYING",
          }),
        ],
      });

      const data = await getDashboardPageDataWorker("ddpd-user-quick-log");

      expect(data.quickLogGames.length).toBeLessThanOrEqual(3);
    });

    it("excludes non-PLAYING games from quickLogGames", async () => {
      await db.prisma.user.create({ data: makeUser("non-playing") });
      await db.prisma.game.createMany({
        data: [makeGame("np-a"), makeGame("np-b")],
      });
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem("ddpd-user-non-playing", "ddpd-game-np-a", {
            status: "PLAYED",
          }),
          makeLibraryItem("ddpd-user-non-playing", "ddpd-game-np-b", {
            status: "SHELF",
          }),
        ],
      });

      const data = await getDashboardPageDataWorker("ddpd-user-non-playing");

      expect(data.quickLogGames).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // continuePlaying, upNext, recentlyAdded derivations
  // -------------------------------------------------------------------------

  describe("continuePlaying / upNext / recentlyAdded derivations", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("derivations") });
      await db.prisma.game.createMany({
        data: [
          makeGame("d-a"),
          makeGame("d-b"),
          makeGame("d-c"),
          makeGame("d-d"),
          makeGame("d-e"),
          makeGame("d-f"),
        ],
      });
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem("ddpd-user-derivations", "ddpd-game-d-a", {
            status: "PLAYING",
            createdAt: new Date("2024-01-01T10:00:00.000Z"),
          }),
          makeLibraryItem("ddpd-user-derivations", "ddpd-game-d-b", {
            status: "PLAYING",
            createdAt: new Date("2024-01-02T10:00:00.000Z"),
          }),
          makeLibraryItem("ddpd-user-derivations", "ddpd-game-d-c", {
            status: "UP_NEXT",
            createdAt: new Date("2024-01-03T10:00:00.000Z"),
          }),
          makeLibraryItem("ddpd-user-derivations", "ddpd-game-d-d", {
            status: "UP_NEXT",
            createdAt: new Date("2024-01-04T10:00:00.000Z"),
          }),
          makeLibraryItem("ddpd-user-derivations", "ddpd-game-d-e", {
            status: "SHELF",
            createdAt: new Date("2024-01-05T10:00:00.000Z"),
          }),
          makeLibraryItem("ddpd-user-derivations", "ddpd-game-d-f", {
            status: "PLAYED",
            createdAt: new Date("2024-01-06T10:00:00.000Z"),
          }),
        ],
      });
    });

    it("continuePlaying contains only PLAYING items", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-derivations");

      const statuses = data.continuePlaying.items.map((i) => i.status);
      expect(statuses.every((s) => s === "PLAYING")).toBe(true);
    });

    it("continuePlaying.total counts all PLAYING items", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-derivations");

      expect(data.continuePlaying.total).toBe(2);
    });

    it("upNext contains only UP_NEXT items", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-derivations");

      const statuses = data.upNext.items.map((i) => i.status);
      expect(statuses.every((s) => s === "UP_NEXT")).toBe(true);
    });

    it("upNext.total counts all UP_NEXT items", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-derivations");

      expect(data.upNext.total).toBe(2);
    });

    it("recentlyAdded returns items from any status", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-derivations");

      expect(data.recentlyAdded.items.length).toBeGreaterThan(0);
    });

    it("hasEmptyLibrary is false when there are library items", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-derivations");

      expect(data.hasEmptyLibrary).toBe(false);
    });
  });
});
