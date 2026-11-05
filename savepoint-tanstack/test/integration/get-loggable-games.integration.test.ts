/**
 * Integration tests for getLoggableGamesWorker (spec 026 slice 7, N6/N7).
 *
 * Imports the WORKER directly (FOOT-GUNS #8).
 *
 * Returns LoggableGame[] ({ gameId, slug, title, coverImage, status }): only
 * the requesting user's library items, PLAYING first, then by title.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getLoggableGamesWorker } from "@/features/compose-journal-entry/api/get-loggable-games.worker";
import { UnauthorizedError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-loggable-games");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const USER_ID = "glg-user-001";
const OTHER_USER_ID = "glg-user-002";

let _igdbCounter = 86_001;
let _itemCounter = 55_001;

beforeEach(async () => {
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.playthrough.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

function makeUser(id: string, suffix: string) {
  return {
    id,
    email: `glg-${suffix}@example.com`,
    name: `GLG User ${suffix}`,
    emailVerified: true,
    username: `glguser${suffix}`,
    usernameNormalized: `glguser${suffix}`,
    isPublicProfile: false,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string) {
  return {
    id: `glg-game-${suffix}`,
    igdbId: _igdbCounter++,
    title: `GLG Game ${suffix}`,
    slug: `glg-game-${suffix}`,
    coverImage: `/covers/glg-${suffix}.jpg`,
    releaseDate: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeLibraryItem(userId: string, gameId: string) {
  return {
    id: _itemCounter++,
    userId,
    gameId,
    status: "WANT" as const,
    acquisitionType: "DIGITAL" as const,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

describe("getLoggableGamesWorker", () => {
  describe("given userId is undefined (unauthenticated)", () => {
    it("throws UnauthorizedError", async () => {
      await expect(getLoggableGamesWorker(undefined)).rejects.toBeInstanceOf(
        UnauthorizedError
      );
    });
  });

  describe("given the user has an empty library", () => {
    it("returns an empty list", async () => {
      await db.prisma.user.create({ data: makeUser(USER_ID, "empty") });

      expect(await getLoggableGamesWorker(USER_ID)).toEqual([]);
    });
  });

  describe("given the user has library items in several statuses", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser(USER_ID, "owner") });
      await db.prisma.game.createMany({
        data: [makeGame("a"), makeGame("b"), makeGame("c"), makeGame("d")],
      });
      await db.prisma.libraryItem.createMany({
        data: [
          {
            ...makeLibraryItem(USER_ID, "glg-game-a"),
            status: "WANT" as const,
          },
          {
            ...makeLibraryItem(USER_ID, "glg-game-b"),
            status: "DONE" as const,
          },
          {
            ...makeLibraryItem(USER_ID, "glg-game-c"),
            status: "PLAYING" as const,
          },
          {
            ...makeLibraryItem(USER_ID, "glg-game-d"),
            status: "PLAYING" as const,
          },
        ],
      });
    });

    it("lists Playing first, then the rest by title", async () => {
      const result = await getLoggableGamesWorker(USER_ID);

      expect(result.map((game) => game.slug)).toEqual([
        "glg-game-c",
        "glg-game-d",
        "glg-game-a",
        "glg-game-b",
      ]);
    });

    it("returns gameId, slug, title, coverImage and status on each game", async () => {
      const [first] = await getLoggableGamesWorker(USER_ID);

      expect(first).toMatchObject({
        gameId: "glg-game-c",
        slug: "glg-game-c",
        title: "GLG Game c",
        coverImage: "/covers/glg-c.jpg",
        status: "PLAYING",
      });
    });
  });

  describe("given another user also has library items", () => {
    it("returns only the requesting user's games", async () => {
      await db.prisma.user.createMany({
        data: [makeUser(USER_ID, "iso1"), makeUser(OTHER_USER_ID, "iso2")],
      });
      await db.prisma.game.createMany({
        data: [makeGame("iso1"), makeGame("iso2")],
      });
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem(USER_ID, "glg-game-iso1"),
          makeLibraryItem(OTHER_USER_ID, "glg-game-iso2"),
        ],
      });

      const result = await getLoggableGamesWorker(USER_ID);

      expect(result.map((game) => game.gameId)).toEqual(["glg-game-iso1"]);
    });
  });
});
