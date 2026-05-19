import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getJournalTimeline } from "@/entities/journal-entry/api/get-journal.server";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-journal-timeline");
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
    id: `jt-user-${suffix}`,
    email: `jt-${suffix}@example.com`,
    name: `JT User ${suffix}`,
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string, igdbId: number, coverImage?: string) {
  return {
    id: `jt-game-${suffix}`,
    igdbId,
    title: `JT Game ${suffix}`,
    slug: `jt-game-${suffix}`,
    coverImage: coverImage ?? null,
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

describe("getJournalTimeline", () => {
  describe("given the user has no journal entries", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("001") });
    });

    it("returns an empty array", async () => {
      const result = await getJournalTimeline("jt-user-001");

      expect(result).toEqual([]);
    });
  });

  describe("given the user has 3 entries with different updatedAt timestamps", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("002") });
      await db.prisma.journalEntry.createMany({
        data: [
          makeJournalEntry("jt-entry-002-a", "jt-user-002", {
            content: "Oldest entry",
            createdAt: new Date("2024-01-01T10:00:00.000Z"),
            updatedAt: new Date("2024-01-01T10:00:00.000Z"),
          }),
          makeJournalEntry("jt-entry-002-b", "jt-user-002", {
            content: "Middle entry",
            createdAt: new Date("2024-01-01T10:00:00.000Z"),
            updatedAt: new Date("2024-01-02T10:00:00.000Z"),
          }),
          makeJournalEntry("jt-entry-002-c", "jt-user-002", {
            content: "Newest entry",
            createdAt: new Date("2024-01-01T10:00:00.000Z"),
            updatedAt: new Date("2024-01-03T10:00:00.000Z"),
          }),
        ],
      });
    });

    it("returns entries ordered by updatedAt descending", async () => {
      const result = await getJournalTimeline("jt-user-002");

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe("jt-entry-002-c");
      expect(result[1].id).toBe("jt-entry-002-b");
      expect(result[2].id).toBe("jt-entry-002-a");
    });
  });

  describe("given an entry was edited (updatedAt newer than createdAt)", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("008") });
      await db.prisma.journalEntry.createMany({
        data: [
          // Edited older entry — created first, but edited later
          makeJournalEntry("jt-entry-008-edited", "jt-user-008", {
            content: "Old entry, recently edited",
            createdAt: new Date("2024-01-01T10:00:00.000Z"),
            updatedAt: new Date("2024-01-05T10:00:00.000Z"),
          }),
          // Newer un-edited entry — created after, never edited
          makeJournalEntry("jt-entry-008-fresh", "jt-user-008", {
            content: "Newer entry, never edited",
            createdAt: new Date("2024-01-03T10:00:00.000Z"),
            updatedAt: new Date("2024-01-03T10:00:00.000Z"),
          }),
        ],
      });
    });

    it("surfaces the edited entry before the older un-edited entry (ordered by updatedAt desc)", async () => {
      const result = await getJournalTimeline("jt-user-008");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("jt-entry-008-edited");
      expect(result[1].id).toBe("jt-entry-008-fresh");
    });
  });

  describe("given two users each have entries", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("003") });
      await db.prisma.user.create({ data: makeUser("004") });
      await db.prisma.journalEntry.createMany({
        data: [
          makeJournalEntry("jt-entry-003-a", "jt-user-003", {
            content: "User 003 entry",
          }),
          makeJournalEntry("jt-entry-004-a", "jt-user-004", {
            content: "User 004 entry",
          }),
        ],
      });
    });

    it("returns only the requested user's entries", async () => {
      const result = await getJournalTimeline("jt-user-003");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("jt-entry-003-a");
    });
  });

  describe("given an entry has a related gameId", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("005") });
      await db.prisma.game.create({
        data: makeGame("005-a", 50001, "https://cdn.example.com/cover.jpg"),
      });
      await db.prisma.journalEntry.create({
        data: makeJournalEntry("jt-entry-005-a", "jt-user-005", {
          content: "Entry with game",
          gameId: "jt-game-005-a",
        }),
      });
    });

    it("returns the related game's id, title, slug, and coverImage", async () => {
      const result = await getJournalTimeline("jt-user-005");

      expect(result).toHaveLength(1);
      expect(result[0].game?.id).toBe("jt-game-005-a");
      expect(result[0].game?.title).toBe("JT Game 005-a");
      expect(result[0].game?.slug).toBe("jt-game-005-a");
      expect(result[0].game?.coverImage).toBe(
        "https://cdn.example.com/cover.jpg"
      );
    });
  });

  describe("given an entry has no gameId", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("006") });
      await db.prisma.journalEntry.create({
        data: makeJournalEntry("jt-entry-006-a", "jt-user-006", {
          content: "Entry without game",
        }),
      });
    });

    it("returns the entry with game as null", async () => {
      const result = await getJournalTimeline("jt-user-006");

      expect(result).toHaveLength(1);
      expect(result[0].game).toBeNull();
    });
  });

  describe("given the user has entries of mixed kind", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("007") });
      await db.prisma.journalEntry.createMany({
        data: [
          makeJournalEntry("jt-entry-007-a", "jt-user-007", {
            content: "Quick entry",
            kind: "QUICK",
          }),
          makeJournalEntry("jt-entry-007-b", "jt-user-007", {
            content: "Long-form entry",
            kind: "REFLECTION",
          }),
        ],
      });
    });

    it("returns all entries regardless of kind", async () => {
      const result = await getJournalTimeline("jt-user-007");

      expect(result).toHaveLength(2);
      const kinds = result.map((e) => e.kind);
      expect(kinds).toContain("QUICK");
      expect(kinds).toContain("REFLECTION");
    });
  });

  describe("given the user does not exist", () => {
    it("returns an empty array without throwing", async () => {
      const result = await getJournalTimeline("jt-user-nonexistent");

      expect(result).toEqual([]);
    });
  });
});
