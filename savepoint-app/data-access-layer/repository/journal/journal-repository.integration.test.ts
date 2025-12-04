import {
  cleanupDatabase,
  resetTestDatabase,
  setupDatabase,
} from "@/test/setup/database";

import { createLibraryItem } from "@/test/setup/db-factories";
import { createGameWithRelations } from "../game/game-repository";
import { upsertGenre } from "../genre/genre-repository";
import { upsertPlatform } from "../platform/platform-repository";
import {
  countJournalEntriesByGameId,
  createJournalEntry,
  findJournalEntriesByGameId,
  findJournalEntriesByUserId,
  findJournalEntryById,
} from "./journal-repository";

vi.mock("@/shared/lib/app/db", async () => {
  const { getTestDatabase } = await import("@/test/setup/database");

  return {
    get prisma() {
      return getTestDatabase();
    },
  };
});

describe("Journal Repository Integration Tests", () => {
  let testGameId: string;
  let testUserId: string;

  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();

    const { prisma } = await import("@/shared/lib/app/db");

    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        username: "testuser",
        usernameNormalized: "testuser",
      },
    });
    testUserId = user.id;

    const genreResult = await upsertGenre({
      id: 999,
      name: "Test Genre",
      slug: "test-genre",
    });
    const platformResult = await upsertPlatform({
      id: 999,
      name: "Test Platform",
      slug: "test-platform",
    });

    if (!genreResult.ok || !platformResult.ok) {
      throw new Error("Failed to set up test data");
    }

    const gameResult = await createGameWithRelations({
      igdbGame: {
        id: 12345,
        name: "Test Game",
        slug: "test-game",
      },
      genreIds: [genreResult.data.id],
      platformIds: [platformResult.data.id],
    });

    if (!gameResult.ok) {
      throw new Error("Failed to create test game");
    }

    testGameId = gameResult.data.id;
  });

  describe("findJournalEntriesByGameId", () => {
    it("should return empty array when no journal entries exist", async () => {
      const result = await findJournalEntriesByGameId({
        gameId: testGameId,
        userId: testUserId,
        limit: 3,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual([]);
      }
    });

    it("should return journal entries in reverse chronological order", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const entry1 = await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Entry 1",
          content: "First entry content",
          createdAt: new Date("2024-01-01"),
        },
      });

      const entry2 = await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Entry 2",
          content: "Second entry content",
          createdAt: new Date("2024-01-02"),
        },
      });

      const entry3 = await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Entry 3",
          content: "Third entry content",
          createdAt: new Date("2024-01-03"),
        },
      });

      const result = await findJournalEntriesByGameId({
        gameId: testGameId,
        userId: testUserId,
        limit: 3,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(3);

        expect(result.data[0].id).toBe(entry3.id);
        expect(result.data[1].id).toBe(entry2.id);
        expect(result.data[2].id).toBe(entry1.id);
      }
    });

    it("should limit results to specified number", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      for (let i = 0; i < 5; i++) {
        await prisma.journalEntry.create({
          data: {
            userId: testUserId,
            gameId: testGameId,
            title: `Entry ${i + 1}`,
            content: `Content for entry ${i + 1}`,
            createdAt: new Date(`2024-01-0${i + 1}`),
          },
        });
      }

      const result = await findJournalEntriesByGameId({
        gameId: testGameId,
        userId: testUserId,
        limit: 3,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(3);

        expect(result.data[0].title).toBe("Entry 5");
        expect(result.data[1].title).toBe("Entry 4");
        expect(result.data[2].title).toBe("Entry 3");
      }
    });

    it("should only return entries for the specified user", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const otherUser = await prisma.user.create({
        data: {
          email: "other@example.com",
          username: "otheruser",
          usernameNormalized: "otheruser",
        },
      });

      await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "User 1 Entry",
          content: "Content for user 1",
        },
      });

      await prisma.journalEntry.create({
        data: {
          userId: otherUser.id,
          gameId: testGameId,
          title: "User 2 Entry",
          content: "Content for user 2",
        },
      });

      const result = await findJournalEntriesByGameId({
        gameId: testGameId,
        userId: testUserId,
        limit: 3,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].title).toBe("User 1 Entry");
        expect(result.data[0].userId).toBe(testUserId);
      }
    });

    it("should only return entries for the specified game", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const otherGameResult = await createGameWithRelations({
        igdbGame: {
          id: 54321,
          name: "Other Game",
          slug: "other-game",
        },
        genreIds: [],
        platformIds: [],
      });

      if (!otherGameResult.ok) {
        throw new Error("Failed to create other game");
      }

      await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Game 1 Entry",
          content: "Content for game 1",
        },
      });

      await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: otherGameResult.data.id,
          title: "Game 2 Entry",
          content: "Content for game 2",
        },
      });

      const result = await findJournalEntriesByGameId({
        gameId: testGameId,
        userId: testUserId,
        limit: 3,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].title).toBe("Game 1 Entry");
        expect(result.data[0].gameId).toBe(testGameId);
      }
    });

    it("should use default limit of 3 when not specified", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      for (let i = 0; i < 5; i++) {
        await prisma.journalEntry.create({
          data: {
            userId: testUserId,
            gameId: testGameId,
            title: `Entry ${i + 1}`,
            content: `Content for entry ${i + 1}`,
            createdAt: new Date(`2024-01-0${i + 1}`),
          },
        });
      }

      const result = await findJournalEntriesByGameId({
        gameId: testGameId,
        userId: testUserId,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(3);
      }
    });
  });

  describe("countJournalEntriesByGameId", () => {
    it("should return 0 when no journal entries exist", async () => {
      const result = await countJournalEntriesByGameId({
        gameId: testGameId,
        userId: testUserId,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(0);
      }
    });

    it("should return correct count of journal entries", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      for (let i = 0; i < 5; i++) {
        await prisma.journalEntry.create({
          data: {
            userId: testUserId,
            gameId: testGameId,
            title: `Entry ${i + 1}`,
            content: `Content for entry ${i + 1}`,
          },
        });
      }

      const result = await countJournalEntriesByGameId({
        gameId: testGameId,
        userId: testUserId,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(5);
      }
    });

    it("should only count entries for the specified user", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const otherUser = await prisma.user.create({
        data: {
          email: "other@example.com",
          username: "otheruser",
          usernameNormalized: "otheruser",
        },
      });

      await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "User 1 Entry",
          content: "Content for user 1",
        },
      });

      await prisma.journalEntry.create({
        data: {
          userId: otherUser.id,
          gameId: testGameId,
          title: "User 2 Entry",
          content: "Content for user 2",
        },
      });

      const result = await countJournalEntriesByGameId({
        gameId: testGameId,
        userId: testUserId,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(1);
      }
    });

    it("should only count entries for the specified game", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const otherGameResult = await createGameWithRelations({
        igdbGame: {
          id: 54321,
          name: "Other Game",
          slug: "other-game",
        },
        genreIds: [],
        platformIds: [],
      });

      if (!otherGameResult.ok) {
        throw new Error("Failed to create other game");
      }

      await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Game 1 Entry",
          content: "Content for game 1",
        },
      });

      await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: otherGameResult.data.id,
          title: "Game 2 Entry",
          content: "Content for game 2",
        },
      });

      const result = await countJournalEntriesByGameId({
        gameId: testGameId,
        userId: testUserId,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(1);
      }
    });
  });

  describe("createJournalEntry", () => {
    it("should successfully create journal entry with all required fields", async () => {
      const result = await createJournalEntry({
        userId: testUserId,
        gameId: testGameId,
        title: "My First Entry",
        content: "This is my first journal entry about this game.",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toMatchObject({
          userId: testUserId,
          gameId: testGameId,
          title: "My First Entry",
          content: "This is my first journal entry about this game.",
          mood: null,
          playSession: null,
          libraryItemId: null,
        });
        expect(result.data.id).toBeDefined();
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should successfully create journal entry with optional fields", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUserId,
        gameId: testGameId,
        status: "CURRENTLY_EXPLORING",
      });

      const result = await createJournalEntry({
        userId: testUserId,
        gameId: testGameId,
        title: "Entry with Optional Fields",
        content: "This entry has mood, playSession, and libraryItemId.",
        mood: "EXCITED",
        playSession: 5,
        libraryItemId: libraryItem.id,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toMatchObject({
          userId: testUserId,
          gameId: testGameId,
          title: "Entry with Optional Fields",
          content: "This entry has mood, playSession, and libraryItemId.",
          mood: "EXCITED",
          playSession: 5,
          libraryItemId: libraryItem.id,
        });
      }
    });

    it("should set createdAt and updatedAt timestamps correctly", async () => {
      const beforeCreate = new Date();
      // Small delay to ensure timestamps are different
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await createJournalEntry({
        userId: testUserId,
        gameId: testGameId,
        title: "Timestamp Test",
        content: "Testing timestamp creation.",
      });

      const afterCreate = new Date();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.createdAt.getTime()).toBeGreaterThanOrEqual(
          beforeCreate.getTime()
        );
        expect(result.data.createdAt.getTime()).toBeLessThanOrEqual(
          afterCreate.getTime()
        );
        expect(result.data.updatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeCreate.getTime()
        );
        expect(result.data.updatedAt.getTime()).toBeLessThanOrEqual(
          afterCreate.getTime()
        );
        // createdAt and updatedAt should be equal on creation
        expect(result.data.createdAt.getTime()).toBe(
          result.data.updatedAt.getTime()
        );
      }
    });

    it("should return error when userId is invalid", async () => {
      const result = await createJournalEntry({
        userId: "invalid-user-id",
        gameId: testGameId,
        title: "Invalid User Test",
        content: "This should fail due to invalid userId.",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to create journal entry");
      }
    });

    it("should return error when gameId is invalid", async () => {
      const result = await createJournalEntry({
        userId: testUserId,
        gameId: "invalid-game-id",
        title: "Invalid Game Test",
        content: "This should fail due to invalid gameId.",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to create journal entry");
      }
    });

    it("should return error when libraryItemId is invalid", async () => {
      const result = await createJournalEntry({
        userId: testUserId,
        gameId: testGameId,
        title: "Invalid Library Item Test",
        content: "This should fail due to invalid libraryItemId.",
        libraryItemId: 99999, // Non-existent library item ID
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to create journal entry");
      }
    });
  });

  describe("findJournalEntryById", () => {
    it("should successfully retrieve entry when it exists and user owns it", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const entry = await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "My Entry",
          content: "This is my journal entry.",
          mood: "EXCITED",
          playSession: 5,
        },
      });

      const result = await findJournalEntryById({
        entryId: entry.id,
        userId: testUserId,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toMatchObject({
          id: entry.id,
          userId: testUserId,
          gameId: testGameId,
          title: "My Entry",
          content: "This is my journal entry.",
          mood: "EXCITED",
          playSession: 5,
        });
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should retrieve all fields correctly", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUserId,
        gameId: testGameId,
        status: "CURRENTLY_EXPLORING",
      });

      const { prisma } = await import("@/shared/lib/app/db");

      const entry = await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Complete Entry",
          content: "Entry with all fields",
          mood: "RELAXED",
          playSession: 10,
          libraryItemId: libraryItem.id,
        },
      });

      const result = await findJournalEntryById({
        entryId: entry.id,
        userId: testUserId,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.id).toBe(entry.id);
        expect(result.data.userId).toBe(testUserId);
        expect(result.data.gameId).toBe(testGameId);
        expect(result.data.title).toBe("Complete Entry");
        expect(result.data.content).toBe("Entry with all fields");
        expect(result.data.mood).toBe("RELAXED");
        expect(result.data.playSession).toBe(10);
        expect(result.data.libraryItemId).toBe(libraryItem.id);
        expect(result.data.visibility).toBe("PRIVATE");
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);
        expect(result.data.publishedAt).toBeNull();
      }
    });

    it("should return error when entry doesn't exist", async () => {
      const nonExistentId = "clxxxxxxxxxxxxxxxxxxxxxxxx";

      const result = await findJournalEntryById({
        entryId: nonExistentId,
        userId: testUserId,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NOT_FOUND");
        expect(result.error.message).toContain("Journal entry not found");
      }
    });

    it("should return error when entry exists but user doesn't own it", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const otherUser = await prisma.user.create({
        data: {
          email: "other@example.com",
          username: "otheruser",
          usernameNormalized: "otheruser",
        },
      });

      const entry = await prisma.journalEntry.create({
        data: {
          userId: otherUser.id,
          gameId: testGameId,
          title: "Other User's Entry",
          content: "This entry belongs to another user.",
        },
      });

      const result = await findJournalEntryById({
        entryId: entry.id,
        userId: testUserId,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NOT_FOUND");
        expect(result.error.message).toContain("Journal entry not found");
      }
    });
  });

  describe("findJournalEntriesByUserId", () => {
    it("should return empty array when user has no entries", async () => {
      const result = await findJournalEntriesByUserId({
        userId: testUserId,
        limit: 10,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual([]);
      }
    });

    it("should return entries ordered by updatedAt DESC (most recently updated first)", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const now = new Date();
      const entry1 = await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Entry 1",
          content: "First entry",
          createdAt: new Date(now.getTime() - 3000),
          updatedAt: new Date(now.getTime() - 3000),
        },
      });

      const entry2 = await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Entry 2",
          content: "Second entry",
          createdAt: new Date(now.getTime() - 2000),
          updatedAt: new Date(now.getTime() - 1000),
        },
      });

      const entry3 = await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Entry 3",
          content: "Third entry",
          createdAt: new Date(now.getTime() - 1000),
          updatedAt: new Date(now.getTime() - 2000),
        },
      });

      const result = await findJournalEntriesByUserId({
        userId: testUserId,
        limit: 10,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(3);
        expect(result.data[0].id).toBe(entry2.id);
        expect(result.data[1].id).toBe(entry3.id);
        expect(result.data[2].id).toBe(entry1.id);
      }
    });

    it("should handle cursor-based pagination (first page)", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const now = new Date();
      const entries = [];
      for (let i = 0; i < 5; i++) {
        const entry = await prisma.journalEntry.create({
          data: {
            userId: testUserId,
            gameId: testGameId,
            title: `Entry ${i + 1}`,
            content: `Content ${i + 1}`,
            updatedAt: new Date(now.getTime() - i * 1000),
          },
        });
        entries.push(entry);
      }

      const result = await findJournalEntriesByUserId({
        userId: testUserId,
        limit: 2,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].id).toBe(entries[0].id);
        expect(result.data[1].id).toBe(entries[1].id);
      }
    });

    it("should handle cursor-based pagination (subsequent pages)", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const now = new Date();
      const entries = [];
      for (let i = 0; i < 5; i++) {
        const entry = await prisma.journalEntry.create({
          data: {
            userId: testUserId,
            gameId: testGameId,
            title: `Entry ${i + 1}`,
            content: `Content ${i + 1}`,
            updatedAt: new Date(now.getTime() - i * 1000),
          },
        });
        entries.push(entry);
      }

      const firstPageResult = await findJournalEntriesByUserId({
        userId: testUserId,
        limit: 2,
      });

      expect(firstPageResult.ok).toBe(true);
      if (!firstPageResult.ok) return;

      const cursor = firstPageResult.data[firstPageResult.data.length - 1].id;

      const secondPageResult = await findJournalEntriesByUserId({
        userId: testUserId,
        limit: 2,
        cursor,
      });

      expect(secondPageResult.ok).toBe(true);
      if (secondPageResult.ok) {
        expect(secondPageResult.data).toHaveLength(2);
        expect(secondPageResult.data[0].id).toBe(entries[2].id);
        expect(secondPageResult.data[1].id).toBe(entries[3].id);
      }
    });

    it("should only return entries belonging to the specified user", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const otherUser = await prisma.user.create({
        data: {
          email: "other@example.com",
          username: "otheruser",
          usernameNormalized: "otheruser",
        },
      });

      await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "User 1 Entry 1",
          content: "Content for user 1",
        },
      });

      await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "User 1 Entry 2",
          content: "Another entry for user 1",
        },
      });

      await prisma.journalEntry.create({
        data: {
          userId: otherUser.id,
          gameId: testGameId,
          title: "User 2 Entry",
          content: "Content for user 2",
        },
      });

      const result = await findJournalEntriesByUserId({
        userId: testUserId,
        limit: 10,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(2);
        expect(
          result.data.every(
            (entry: { userId: string }) => entry.userId === testUserId
          )
        ).toBe(true);
      }
    });

    it("should return error when cursor points to non-existent entry", async () => {
      const nonExistentCursor = "clxxxxxxxxxxxxxxxxxxxxxxxx";

      const result = await findJournalEntriesByUserId({
        userId: testUserId,
        limit: 10,
        cursor: nonExistentCursor,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NOT_FOUND");
        expect(result.error.message).toContain("Cursor entry not found");
      }
    });

    it("should handle limit boundary case: limit = 0", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Test Entry",
          content: "Test content",
        },
      });

      const result = await findJournalEntriesByUserId({
        userId: testUserId,
        limit: 0,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual([]);
      }
    });

    it("should handle limit boundary case: limit = 1", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const now = new Date();
      await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Entry 1",
          content: "Content 1",
          updatedAt: new Date(now.getTime() - 2000),
        },
      });

      await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Entry 2",
          content: "Content 2",
          updatedAt: new Date(now.getTime() - 1000),
        },
      });

      const result = await findJournalEntriesByUserId({
        userId: testUserId,
        limit: 1,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].title).toBe("Entry 2");
      }
    });

    it("should handle limit boundary case: very high limit", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      for (let i = 0; i < 5; i++) {
        await prisma.journalEntry.create({
          data: {
            userId: testUserId,
            gameId: testGameId,
            title: `Entry ${i + 1}`,
            content: `Content ${i + 1}`,
          },
        });
      }

      const result = await findJournalEntriesByUserId({
        userId: testUserId,
        limit: 1000,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(5);
      }
    });

    it("should return empty array when cursor is last entry", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const now = new Date();
      await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Entry 1",
          content: "Content 1",
          updatedAt: new Date(now.getTime() - 2000),
        },
      });

      const lastEntry = await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Entry 2",
          content: "Content 2",
          updatedAt: new Date(now.getTime() - 3000),
        },
      });

      const result = await findJournalEntriesByUserId({
        userId: testUserId,
        limit: 10,
        cursor: lastEntry.id,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual([]);
      }
    });
  });
});
