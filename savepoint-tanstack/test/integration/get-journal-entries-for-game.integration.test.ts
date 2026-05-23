import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getJournalEntriesForGame } from "@/entities/journal-entry/api/get-journal.server";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-journal-entries-for-game");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

function makeUser(suffix: string) {
  return {
    id: `jefg-user-${suffix}`,
    email: `jefg-${suffix}@example.com`,
    name: `JEFG User ${suffix}`,
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string, igdbId: number) {
  return {
    id: `jefg-game-${suffix}`,
    igdbId,
    title: `JEFG Game ${suffix}`,
    slug: `jefg-game-${suffix}`,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeJournalEntry(
  id: string,
  userId: string,
  opts: {
    content?: string;
    gameId?: string;
    kind?: "QUICK" | "REFLECTION";
    createdAt?: Date;
    updatedAt?: Date;
  } = {}
) {
  return {
    id,
    userId,
    content: opts.content ?? "Test journal entry content",
    kind: opts.kind ?? ("QUICK" as const),
    gameId: opts.gameId ?? null,
    createdAt: opts.createdAt ?? new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: opts.updatedAt ?? new Date("2024-01-01T00:00:00.000Z"),
  };
}

describe("getJournalEntriesForGame", () => {
  describe("given the user has no entries for the game", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("001") });
      await db.prisma.game.create({ data: makeGame("001-a", 60001) });
    });

    it("returns an empty array", async () => {
      const result = await getJournalEntriesForGame(
        "jefg-user-001",
        "jefg-game-001-a"
      );

      expect(result).toEqual([]);
    });
  });

  describe("given the user has 2 entries for the game", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("002") });
      await db.prisma.game.create({ data: makeGame("002-a", 60002) });
      await db.prisma.journalEntry.createMany({
        data: [
          makeJournalEntry("jefg-entry-002-a", "jefg-user-002", {
            content: "Older entry for game",
            gameId: "jefg-game-002-a",
            createdAt: new Date("2024-01-01T10:00:00.000Z"),
            updatedAt: new Date("2024-01-01T10:00:00.000Z"),
          }),
          makeJournalEntry("jefg-entry-002-b", "jefg-user-002", {
            content: "Newer entry for game",
            gameId: "jefg-game-002-a",
            createdAt: new Date("2024-01-01T10:00:00.000Z"),
            updatedAt: new Date("2024-01-02T10:00:00.000Z"),
          }),
        ],
      });
    });

    it("returns both entries ordered by updatedAt descending", async () => {
      const result = await getJournalEntriesForGame(
        "jefg-user-002",
        "jefg-game-002-a"
      );

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("jefg-entry-002-b");
      expect(result[1].id).toBe("jefg-entry-002-a");
    });
  });

  describe("given another user also has entries for the same game", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("003") });
      await db.prisma.user.create({ data: makeUser("004") });
      await db.prisma.game.create({ data: makeGame("003-a", 60003) });
      await db.prisma.journalEntry.createMany({
        data: [
          makeJournalEntry("jefg-entry-003-user003", "jefg-user-003", {
            content: "User 003 entry for shared game",
            gameId: "jefg-game-003-a",
          }),
          makeJournalEntry("jefg-entry-003-user004", "jefg-user-004", {
            content: "User 004 entry for shared game",
            gameId: "jefg-game-003-a",
          }),
        ],
      });
    });

    it("returns only the requested user's entries (ownership isolation)", async () => {
      const result = await getJournalEntriesForGame(
        "jefg-user-003",
        "jefg-game-003-a"
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("jefg-entry-003-user003");
    });
  });

  describe("given the user has entries for other games too", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("005") });
      await db.prisma.game.create({ data: makeGame("005-a", 60004) });
      await db.prisma.game.create({ data: makeGame("005-b", 60005) });
      await db.prisma.journalEntry.createMany({
        data: [
          makeJournalEntry("jefg-entry-005-target", "jefg-user-005", {
            content: "Entry for target game",
            gameId: "jefg-game-005-a",
          }),
          makeJournalEntry("jefg-entry-005-other", "jefg-user-005", {
            content: "Entry for a different game",
            gameId: "jefg-game-005-b",
          }),
        ],
      });
    });

    it("returns only entries matching the specified gameId", async () => {
      const result = await getJournalEntriesForGame(
        "jefg-user-005",
        "jefg-game-005-a"
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("jefg-entry-005-target");
    });
  });

  describe("given the game does not exist", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("006") });
    });

    it("returns an empty array without throwing", async () => {
      const result = await getJournalEntriesForGame(
        "jefg-user-006",
        "jefg-game-nonexistent"
      );

      expect(result).toEqual([]);
    });
  });
});
