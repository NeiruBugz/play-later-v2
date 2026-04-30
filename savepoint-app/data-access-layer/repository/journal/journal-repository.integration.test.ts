import { resetTestDatabase, setupDatabase } from "@/test/setup/database";
import { createLibraryItem } from "@/test/setup/db-factories";

import { NotFoundError } from "@/shared/lib/errors";

import { createGameWithRelations } from "../game/game-repository";
import { upsertGenre } from "../genre/genre-repository";
import { upsertPlatform } from "../platform/platform-repository";
import {
  countJournalEntriesByGameId,
  createJournalEntry,
  deleteJournalEntry,
  findJournalEntriesByGameId,
  findJournalEntriesByUserId,
  findJournalEntryById,
  findLatestJournalDateByGameId,
  updateJournalEntry,
} from "./journal-repository";

describe("Journal Repository Integration Tests", () => {
  let testGameId: string;
  let testUserId: string;

  beforeAll(async () => {
    await setupDatabase();
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

    const genre = await upsertGenre({
      id: 999,
      name: "Test Genre",
      slug: "test-genre",
    });
    const platform = await upsertPlatform({
      id: 999,
      name: "Test Platform",
      slug: "test-platform",
    });

    const game = await createGameWithRelations({
      igdbGame: {
        id: 12345,
        name: "Test Game",
        slug: "test-game",
      },
      genreIds: [genre.id],
      platformIds: [platform.id],
    });

    testGameId = game.id;
  });

  describe("findJournalEntriesByGameId", () => {
    it("should return empty array when no journal entries exist", async () => {
      const result = await findJournalEntriesByGameId({
        gameId: testGameId,
        userId: testUserId,
        limit: 3,
      });

      expect(result).toEqual([]);
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

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(entry3.id);
      expect(result[1].id).toBe(entry2.id);
      expect(result[2].id).toBe(entry1.id);
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

      expect(result).toHaveLength(3);
      expect(result[0].title).toBe("Entry 5");
      expect(result[1].title).toBe("Entry 4");
      expect(result[2].title).toBe("Entry 3");
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

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("User 1 Entry");
      expect(result[0].userId).toBe(testUserId);
    });

    it("should only return entries for the specified game", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const otherGame = await createGameWithRelations({
        igdbGame: {
          id: 54321,
          name: "Other Game",
          slug: "other-game",
        },
        genreIds: [],
        platformIds: [],
      });

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
          gameId: otherGame.id,
          title: "Game 2 Entry",
          content: "Content for game 2",
        },
      });

      const result = await findJournalEntriesByGameId({
        gameId: testGameId,
        userId: testUserId,
        limit: 3,
      });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Game 1 Entry");
      expect(result[0].gameId).toBe(testGameId);
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

      expect(result).toHaveLength(3);
    });
  });

  describe("countJournalEntriesByGameId", () => {
    it("should return 0 when no journal entries exist", async () => {
      const count = await countJournalEntriesByGameId({
        gameId: testGameId,
        userId: testUserId,
      });

      expect(count).toBe(0);
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

      const count = await countJournalEntriesByGameId({
        gameId: testGameId,
        userId: testUserId,
      });

      expect(count).toBe(5);
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

      const count = await countJournalEntriesByGameId({
        gameId: testGameId,
        userId: testUserId,
      });

      expect(count).toBe(1);
    });

    it("should only count entries for the specified game", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const otherGame = await createGameWithRelations({
        igdbGame: {
          id: 54321,
          name: "Other Game",
          slug: "other-game",
        },
        genreIds: [],
        platformIds: [],
      });

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
          gameId: otherGame.id,
          title: "Game 2 Entry",
          content: "Content for game 2",
        },
      });

      const count = await countJournalEntriesByGameId({
        gameId: testGameId,
        userId: testUserId,
      });

      expect(count).toBe(1);
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

      expect(result).toMatchObject({
        userId: testUserId,
        gameId: testGameId,
        title: "My First Entry",
        content: "This is my first journal entry about this game.",
        mood: null,
        playSession: null,
        libraryItemId: null,
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should successfully create journal entry with optional fields", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUserId,
        gameId: testGameId,
        status: "PLAYING",
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

      expect(result).toMatchObject({
        userId: testUserId,
        gameId: testGameId,
        title: "Entry with Optional Fields",
        content: "This entry has mood, playSession, and libraryItemId.",
        mood: "EXCITED",
        playSession: 5,
        libraryItemId: libraryItem.id,
      });
    });

    it("should set createdAt and updatedAt timestamps correctly", async () => {
      const beforeCreate = new Date();
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await createJournalEntry({
        userId: testUserId,
        gameId: testGameId,
        title: "Timestamp Test",
        content: "Testing timestamp creation.",
      });

      const afterCreate = new Date();

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime()
      );
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime()
      );
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime()
      );
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime()
      );
      expect(result.createdAt.getTime()).toBe(result.updatedAt.getTime());
    });

    it("should throw error when userId is invalid", async () => {
      await expect(
        createJournalEntry({
          userId: "invalid-user-id",
          gameId: testGameId,
          title: "Invalid User Test",
          content: "This should fail due to invalid userId.",
        })
      ).rejects.toThrow();
    });

    it("should throw error when gameId is invalid", async () => {
      await expect(
        createJournalEntry({
          userId: testUserId,
          gameId: "invalid-game-id",
          title: "Invalid Game Test",
          content: "This should fail due to invalid gameId.",
        })
      ).rejects.toThrow();
    });

    it("should throw error when libraryItemId is invalid", async () => {
      await expect(
        createJournalEntry({
          userId: testUserId,
          gameId: testGameId,
          title: "Invalid Library Item Test",
          content: "This should fail due to invalid libraryItemId.",
          libraryItemId: 99999,
        })
      ).rejects.toThrow();
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

      expect(result).toMatchObject({
        id: entry.id,
        userId: testUserId,
        gameId: testGameId,
        title: "My Entry",
        content: "This is my journal entry.",
        mood: "EXCITED",
        playSession: 5,
      });
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should retrieve all fields correctly", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUserId,
        gameId: testGameId,
        status: "PLAYING",
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

      expect(result.id).toBe(entry.id);
      expect(result.userId).toBe(testUserId);
      expect(result.gameId).toBe(testGameId);
      expect(result.title).toBe("Complete Entry");
      expect(result.content).toBe("Entry with all fields");
      expect(result.mood).toBe("RELAXED");
      expect(result.playSession).toBe(10);
      expect(result.libraryItemId).toBe(libraryItem.id);
      expect(result.visibility).toBe("PRIVATE");
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.publishedAt).toBeNull();
    });

    it("should throw NotFoundError when entry doesn't exist", async () => {
      const nonExistentId = "clxxxxxxxxxxxxxxxxxxxxxxxx";

      await expect(
        findJournalEntryById({
          entryId: nonExistentId,
          userId: testUserId,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when entry exists but user doesn't own it", async () => {
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

      await expect(
        findJournalEntryById({
          entryId: entry.id,
          userId: testUserId,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("findJournalEntriesByUserId", () => {
    it("should return empty array when user has no entries", async () => {
      const result = await findJournalEntriesByUserId({
        userId: testUserId,
        limit: 10,
      });

      expect(result).toEqual([]);
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

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(entry2.id);
      expect(result[1].id).toBe(entry3.id);
      expect(result[2].id).toBe(entry1.id);
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

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(entries[0].id);
      expect(result[1].id).toBe(entries[1].id);
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

      const cursor = firstPageResult[firstPageResult.length - 1].id;

      const secondPageResult = await findJournalEntriesByUserId({
        userId: testUserId,
        limit: 2,
        cursor,
      });

      expect(secondPageResult).toHaveLength(2);
      expect(secondPageResult[0].id).toBe(entries[2].id);
      expect(secondPageResult[1].id).toBe(entries[3].id);
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

      expect(result).toHaveLength(2);
      expect(
        result.every((entry: { userId: string }) => entry.userId === testUserId)
      ).toBe(true);
    });

    it("should throw NotFoundError when cursor points to non-existent entry", async () => {
      const nonExistentCursor = "clxxxxxxxxxxxxxxxxxxxxxxxx";

      await expect(
        findJournalEntriesByUserId({
          userId: testUserId,
          limit: 10,
          cursor: nonExistentCursor,
        })
      ).rejects.toThrow(NotFoundError);
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

      expect(result).toEqual([]);
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

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Entry 2");
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

      expect(result).toHaveLength(5);
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

      expect(result).toEqual([]);
    });
  });

  describe("deleteJournalEntry", () => {
    it("should successfully delete entry when entry exists and user owns it", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const entry = await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Entry to Delete",
          content: "This entry will be deleted",
        },
      });

      await deleteJournalEntry({
        entryId: entry.id,
        userId: testUserId,
      });
    });

    it("should throw NotFoundError when entry doesn't exist", async () => {
      const nonExistentId = "clxxxxxxxxxxxxxxxxxxxxxxxx";

      await expect(
        deleteJournalEntry({
          entryId: nonExistentId,
          userId: testUserId,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when entry exists but user doesn't own it", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const otherUser = await prisma.user.create({
        data: {
          email: "otheruser@example.com",
          username: "otheruser",
          usernameNormalized: "otheruser",
        },
      });

      const entry = await prisma.journalEntry.create({
        data: {
          userId: otherUser.id,
          gameId: testGameId,
          title: "Other User's Entry",
          content: "This belongs to another user",
        },
      });

      await expect(
        deleteJournalEntry({
          entryId: entry.id,
          userId: testUserId,
        })
      ).rejects.toThrow(NotFoundError);

      const dbEntry = await prisma.journalEntry.findUnique({
        where: { id: entry.id },
      });
      expect(dbEntry).not.toBeNull();
      expect(dbEntry?.userId).toBe(otherUser.id);
    });

    it("should permanently delete entry from database", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const entry = await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Entry to Permanently Delete",
          content: "This entry will be gone forever",
        },
      });

      await deleteJournalEntry({
        entryId: entry.id,
        userId: testUserId,
      });

      const dbEntry = await prisma.journalEntry.findUnique({
        where: { id: entry.id },
      });
      expect(dbEntry).toBeNull();

      await expect(
        findJournalEntryById({
          entryId: entry.id,
          userId: testUserId,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateJournalEntry", () => {
    it("should successfully update all fields (title, content, mood, playSession, libraryItemId)", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const libraryItem = await createLibraryItem({
        userId: testUserId,
        gameId: testGameId,
        status: "PLAYING",
      });

      const entry = await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Original Title",
          content: "Original content",
          mood: "EXCITED",
          playSession: 5,
          libraryItemId: null,
        },
      });

      const result = await updateJournalEntry({
        entryId: entry.id,
        userId: testUserId,
        updates: {
          title: "Updated Title",
          content: "Updated content",
          mood: "RELAXED",
          playSession: 10,
          libraryItemId: libraryItem.id,
        },
      });

      expect(result).toMatchObject({
        id: entry.id,
        userId: testUserId,
        gameId: testGameId,
        title: "Updated Title",
        content: "Updated content",
        mood: "RELAXED",
        playSession: 10,
        libraryItemId: libraryItem.id,
      });
    });

    it("should successfully perform partial update (only title)", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const entry = await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Original Title",
          content: "Original content",
          mood: "EXCITED",
          playSession: 5,
        },
      });

      const result = await updateJournalEntry({
        entryId: entry.id,
        userId: testUserId,
        updates: {
          title: "New Title Only",
        },
      });

      expect(result.title).toBe("New Title Only");
      expect(result.content).toBe("Original content");
      expect(result.mood).toBe("EXCITED");
      expect(result.playSession).toBe(5);
    });

    it("should successfully perform partial update (only content)", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const entry = await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Original Title",
          content: "Original content",
          mood: "FRUSTRATED",
        },
      });

      const result = await updateJournalEntry({
        entryId: entry.id,
        userId: testUserId,
        updates: {
          content: "Only the content changed",
        },
      });

      expect(result.title).toBe("Original Title");
      expect(result.content).toBe("Only the content changed");
      expect(result.mood).toBe("FRUSTRATED");
    });

    it("should automatically update the updatedAt timestamp", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const now = new Date();
      const entry = await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Original Title",
          content: "Original content",
          createdAt: now,
          updatedAt: now,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const result = await updateJournalEntry({
        entryId: entry.id,
        userId: testUserId,
        updates: {
          title: "Updated Title",
        },
      });

      expect(result.updatedAt.getTime()).toBeGreaterThan(now.getTime());
      expect(result.createdAt.getTime()).toBe(now.getTime());
    });

    it("should throw NotFoundError when user doesn't own the entry", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const otherUser = await prisma.user.create({
        data: {
          email: "otheruser@example.com",
          username: "otheruser",
          usernameNormalized: "otheruser",
        },
      });

      const entry = await prisma.journalEntry.create({
        data: {
          userId: otherUser.id,
          gameId: testGameId,
          title: "Other User's Entry",
          content: "This belongs to another user",
        },
      });

      await expect(
        updateJournalEntry({
          entryId: entry.id,
          userId: testUserId,
          updates: {
            title: "Trying to update",
          },
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when entry doesn't exist", async () => {
      const nonExistentId = "clxxxxxxxxxxxxxxxxxxxxxxxx";

      await expect(
        updateJournalEntry({
          entryId: nonExistentId,
          userId: testUserId,
          updates: {
            title: "Trying to update non-existent entry",
          },
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("should successfully set optional fields to null", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const libraryItem = await createLibraryItem({
        userId: testUserId,
        gameId: testGameId,
        status: "PLAYING",
      });

      const entry = await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Entry with Optional Fields",
          content: "Content",
          mood: "EXCITED",
          playSession: 10,
          libraryItemId: libraryItem.id,
        },
      });

      const result = await updateJournalEntry({
        entryId: entry.id,
        userId: testUserId,
        updates: {
          mood: null,
          playSession: null,
          libraryItemId: null,
        },
      });

      expect(result.mood).toBeNull();
      expect(result.playSession).toBeNull();
      expect(result.libraryItemId).toBeNull();
      expect(result.title).toBe("Entry with Optional Fields");
      expect(result.content).toBe("Content");
    });

    it("should verify changes persist in database", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const entry = await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          title: "Original Title",
          content: "Original content",
        },
      });

      await updateJournalEntry({
        entryId: entry.id,
        userId: testUserId,
        updates: {
          title: "Persisted Title",
          content: "Persisted content",
          mood: "ACCOMPLISHED",
        },
      });

      const dbEntry = await prisma.journalEntry.findUnique({
        where: { id: entry.id },
      });

      expect(dbEntry).not.toBeNull();
      expect(dbEntry?.title).toBe("Persisted Title");
      expect(dbEntry?.content).toBe("Persisted content");
      expect(dbEntry?.mood).toBe("ACCOMPLISHED");
    });
  });

  describe("findLatestJournalDateByGameId", () => {
    it("returns an empty Map when gameIds is empty", async () => {
      const result = await findLatestJournalDateByGameId({
        userId: testUserId,
        gameIds: [],
      });

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it("returns an empty Map when no entries exist for the given gameIds", async () => {
      const result = await findLatestJournalDateByGameId({
        userId: testUserId,
        gameIds: [testGameId],
      });

      expect(result.size).toBe(0);
    });

    it("returns the latest createdAt for a single game with multiple entries", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const older = new Date("2024-01-01T10:00:00Z");
      const newer = new Date("2024-06-01T10:00:00Z");

      await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          content: "old entry",
          createdAt: older,
        },
      });

      await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          content: "new entry",
          createdAt: newer,
        },
      });

      const result = await findLatestJournalDateByGameId({
        userId: testUserId,
        gameIds: [testGameId],
      });

      expect(result.size).toBe(1);
      expect(result.get(testGameId)?.toISOString()).toBe(newer.toISOString());
    });

    it("returns the correct latest dates for multiple games independently", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const otherGame = await createGameWithRelations({
        igdbGame: { id: 99999, name: "Other Game", slug: "other-game" },
        genreIds: [],
        platformIds: [],
      });

      const dateA = new Date("2024-03-01T00:00:00Z");
      const dateB = new Date("2024-09-01T00:00:00Z");

      await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: testGameId,
          content: "entry for game A",
          createdAt: dateA,
        },
      });

      await prisma.journalEntry.create({
        data: {
          userId: testUserId,
          gameId: otherGame.id,
          content: "entry for game B",
          createdAt: dateB,
        },
      });

      const result = await findLatestJournalDateByGameId({
        userId: testUserId,
        gameIds: [testGameId, otherGame.id],
      });

      expect(result.size).toBe(2);
      expect(result.get(testGameId)?.toISOString()).toBe(dateA.toISOString());
      expect(result.get(otherGame.id)?.toISOString()).toBe(dateB.toISOString());
    });

    it("only returns dates for the querying user, not other users", async () => {
      const { prisma } = await import("@/shared/lib/app/db");

      const otherUser = await prisma.user.create({
        data: {
          email: "other2@example.com",
          username: "otheruser2",
          usernameNormalized: "otheruser2",
        },
      });

      await prisma.journalEntry.create({
        data: {
          userId: otherUser.id,
          gameId: testGameId,
          content: "another user's entry",
          createdAt: new Date("2024-12-01"),
        },
      });

      const result = await findLatestJournalDateByGameId({
        userId: testUserId,
        gameIds: [testGameId],
      });

      expect(result.size).toBe(0);
    });
  });
});
