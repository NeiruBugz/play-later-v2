import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getJournalEntryById } from "@/entities/journal-entry/api/get-journal-entry-by-id.server";
import { NotFoundError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("journal-entry-by-id");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

function makeUser(suffix: string) {
  return {
    id: `jebi-user-${suffix}`,
    email: `jebi-${suffix}@example.com`,
    name: `JEBI User ${suffix}`,
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string, igdbId: number) {
  return {
    id: `jebi-game-${suffix}`,
    igdbId,
    title: `JEBI Game ${suffix}`,
    slug: `jebi-game-${suffix}`,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeJournalEntry(
  id: string,
  userId: string,
  opts: { content?: string; gameId?: string } = {}
) {
  return {
    id,
    userId,
    content: opts.content ?? "Test journal entry content",
    kind: "QUICK" as const,
    gameId: opts.gameId ?? null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

describe("getJournalEntryById", () => {
  describe("given the entry exists and belongs to the requesting user", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("001") });
      await db.prisma.game.create({ data: makeGame("001-a", 70001) });
      await db.prisma.journalEntry.create({
        data: makeJournalEntry("jebi-entry-001", "jebi-user-001", {
          content: "My own entry",
          gameId: "jebi-game-001-a",
        }),
      });
    });

    it("returns the entry with its related game projected", async () => {
      const result = await getJournalEntryById(
        "jebi-user-001",
        "jebi-entry-001"
      );

      expect(result.id).toBe("jebi-entry-001");
      expect(result.content).toBe("My own entry");
      expect(result.game).toEqual({
        id: "jebi-game-001-a",
        title: "JEBI Game 001-a",
        slug: "jebi-game-001-a",
        coverImage: null,
      });
    });
  });

  describe("given the entry exists but belongs to another user", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("002") });
      await db.prisma.user.create({ data: makeUser("003") });
      await db.prisma.journalEntry.create({
        data: makeJournalEntry("jebi-entry-002", "jebi-user-002", {
          content: "Owned by user 002",
        }),
      });
    });

    it("throws NotFoundError (does not leak cross-user existence)", async () => {
      await expect(
        getJournalEntryById("jebi-user-003", "jebi-entry-002")
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("given the entry does not exist", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("004") });
    });

    it("throws NotFoundError", async () => {
      await expect(
        getJournalEntryById("jebi-user-004", "jebi-entry-missing")
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
