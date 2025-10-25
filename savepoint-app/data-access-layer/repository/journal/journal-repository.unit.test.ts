import { prisma } from "@/shared/lib";

import {
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntriesByGame,
  getJournalEntriesForUser,
  getJournalEntryById,
  makeJournalEntryPublic,
  updateJournalEntry,
} from "./journal-repository";
import type { CreateJournalEntryInput, UpdateJournalEntryInput } from "./types";

vi.mock("@/shared/lib", () => ({
  prisma: {
    journalEntry: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("JournalRepository", () => {
  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    emailVerified: null,
    image: null,
    username: "testuser",
    steamProfileURL: null,
    steamId64: null,
    steamUsername: null,
    steamAvatar: null,
    steamConnectedAt: null,
  };

  const mockGame = {
    id: "game-1",
    igdbId: 123,
    hltbId: null,
    title: "Test Game",
    description: "A test game",
    coverImage: "cover.jpg",
    releaseDate: new Date("2024-01-01"),
    mainStory: 10,
    mainExtra: 15,
    completionist: 20,
    steamAppId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLibraryItem = {
    id: 1,
    userId: "user-1",
    gameId: "game-1",
    status: "CURRENTLY_EXPLORING" as const,
    platform: "PC",
    acquisitionType: "DIGITAL" as const,
    startedAt: new Date(),
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockJournalEntry = {
    id: "entry-1",
    userId: "user-1",
    gameId: "game-1",
    libraryItemId: 1,
    title: "Great gaming session!",
    content: "Today I played for 2 hours and had a blast.",
    mood: "EXCITED" as const,
    playSession: 1,
    visibility: "PRIVATE" as const,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
    game: mockGame,
    libraryItem: mockLibraryItem,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createJournalEntry", () => {
    it("should create a journal entry with default visibility PRIVATE", async () => {
      const input: CreateJournalEntryInput = {
        userId: "user-1",
        gameId: "game-1",
        libraryItemId: 1,
        title: "Great gaming session!",
        content: "Today I played for 2 hours and had a blast.",
        mood: "EXCITED",
        playSession: 1,
      };

      vi.mocked(prisma.journalEntry.create).mockResolvedValue(mockJournalEntry);

      const result = await createJournalEntry(input);

      expect(prisma.journalEntry.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          gameId: "game-1",
          libraryItemId: 1,
          title: "Great gaming session!",
          content: "Today I played for 2 hours and had a blast.",
          mood: "EXCITED",
          playSession: 1,
          visibility: "PRIVATE",
          publishedAt: null,
        },
        include: {
          game: true,
          libraryItem: true,
          user: true,
        },
      });
      expect(result).toEqual(mockJournalEntry);
    });

    it("should create a public journal entry with publishedAt set", async () => {
      const input: CreateJournalEntryInput = {
        userId: "user-1",
        gameId: "game-1",
        content: "Public entry content",
        visibility: "PUBLIC",
      };

      const publicEntry = {
        ...mockJournalEntry,
        visibility: "PUBLIC" as const,
        publishedAt: new Date(),
      };

      vi.mocked(prisma.journalEntry.create).mockResolvedValue(publicEntry);

      const result = await createJournalEntry(input);

      expect(prisma.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            visibility: "PUBLIC",
            publishedAt: expect.any(Date),
          }),
        })
      );
      expect(result.publishedAt).toBeDefined();
      expect(result.visibility).toBe("PUBLIC");
    });

    it("should create entry without optional fields", async () => {
      const input: CreateJournalEntryInput = {
        userId: "user-1",
        gameId: "game-1",
        content: "Minimal entry",
      };

      const minimalEntry = {
        ...mockJournalEntry,
        title: null,
        mood: null,
        playSession: null,
        libraryItemId: null,
        libraryItem: null,
      };

      vi.mocked(prisma.journalEntry.create).mockResolvedValue(minimalEntry);

      const result = await createJournalEntry(input);

      expect(prisma.journalEntry.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          gameId: "game-1",
          libraryItemId: undefined,
          title: undefined,
          content: "Minimal entry",
          mood: undefined,
          playSession: undefined,
          visibility: "PRIVATE",
          publishedAt: null,
        },
        include: {
          game: true,
          libraryItem: true,
          user: true,
        },
      });
      expect(result).toEqual(minimalEntry);
    });
  });

  describe("getJournalEntriesForUser", () => {
    it("should get all journal entries for a user", async () => {
      const entries = [mockJournalEntry];
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(entries);

      const result = await getJournalEntriesForUser("user-1");

      expect(prisma.journalEntry.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        include: {
          game: true,
          libraryItem: true,
          user: true,
        },
        orderBy: { createdAt: "desc" },
        take: undefined,
        skip: undefined,
      });
      expect(result).toEqual(entries);
    });

    it("should support pagination with limit and offset", async () => {
      const entries = [mockJournalEntry];
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(entries);

      const result = await getJournalEntriesForUser("user-1", {
        limit: 10,
        offset: 5,
      });

      expect(prisma.journalEntry.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        include: {
          game: true,
          libraryItem: true,
          user: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 5,
      });
      expect(result).toEqual(entries);
    });

    it("should return empty array when no entries found", async () => {
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([]);

      const result = await getJournalEntriesForUser("user-1");

      expect(result).toEqual([]);
    });
  });

  describe("getJournalEntriesByGame", () => {
    it("should get all journal entries for a game", async () => {
      const entries = [mockJournalEntry];
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(entries);

      const result = await getJournalEntriesByGame("game-1");

      expect(prisma.journalEntry.findMany).toHaveBeenCalledWith({
        where: { gameId: "game-1" },
        include: {
          game: true,
          libraryItem: true,
          user: true,
        },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(entries);
    });

    it("should filter by userId when provided", async () => {
      const entries = [mockJournalEntry];
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(entries);

      const result = await getJournalEntriesByGame("game-1", {
        userId: "user-1",
      });

      expect(prisma.journalEntry.findMany).toHaveBeenCalledWith({
        where: {
          gameId: "game-1",
          userId: "user-1",
        },
        include: {
          game: true,
          libraryItem: true,
          user: true,
        },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(entries);
    });

    it("should filter by visibility when provided", async () => {
      const entries = [mockJournalEntry];
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(entries);

      const result = await getJournalEntriesByGame("game-1", {
        visibility: "PUBLIC",
      });

      expect(prisma.journalEntry.findMany).toHaveBeenCalledWith({
        where: {
          gameId: "game-1",
          visibility: "PUBLIC",
        },
        include: {
          game: true,
          libraryItem: true,
          user: true,
        },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(entries);
    });

    it("should filter by both userId and visibility", async () => {
      const entries = [mockJournalEntry];
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(entries);

      const result = await getJournalEntriesByGame("game-1", {
        userId: "user-1",
        visibility: "PUBLIC",
      });

      expect(prisma.journalEntry.findMany).toHaveBeenCalledWith({
        where: {
          gameId: "game-1",
          userId: "user-1",
          visibility: "PUBLIC",
        },
        include: {
          game: true,
          libraryItem: true,
          user: true,
        },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(entries);
    });
  });

  describe("getJournalEntryById", () => {
    it("should get a journal entry by id without userId check", async () => {
      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(
        mockJournalEntry
      );

      const result = await getJournalEntryById("entry-1");

      expect(prisma.journalEntry.findUnique).toHaveBeenCalledWith({
        where: { id: "entry-1" },
        include: {
          game: true,
          libraryItem: true,
          user: true,
        },
      });
      expect(result).toEqual(mockJournalEntry);
    });

    it("should return entry when userId matches owner", async () => {
      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(
        mockJournalEntry
      );

      const result = await getJournalEntryById("entry-1", "user-1");

      expect(result).toEqual(mockJournalEntry);
    });

    it("should return null when entry is private and userId does not match", async () => {
      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(
        mockJournalEntry
      );

      const result = await getJournalEntryById("entry-1", "other-user");

      expect(result).toBeNull();
    });

    it("should return public entry even if userId does not match", async () => {
      const publicEntry = {
        ...mockJournalEntry,
        visibility: "PUBLIC" as const,
      };
      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(publicEntry);

      const result = await getJournalEntryById("entry-1", "other-user");

      expect(result).toEqual(publicEntry);
    });

    it("should return null when entry not found", async () => {
      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(null);

      const result = await getJournalEntryById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("updateJournalEntry", () => {
    it("should update journal entry successfully", async () => {
      const input: UpdateJournalEntryInput = {
        id: "entry-1",
        userId: "user-1",
        title: "Updated title",
        content: "Updated content",
        mood: "RELAXED",
      };

      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(
        mockJournalEntry
      );

      const updatedEntry = { ...mockJournalEntry, ...input };
      vi.mocked(prisma.journalEntry.update).mockResolvedValue(updatedEntry);

      const result = await updateJournalEntry(input);

      expect(prisma.journalEntry.findUnique).toHaveBeenCalledWith({
        where: { id: "entry-1" },
      });
      expect(prisma.journalEntry.update).toHaveBeenCalledWith({
        where: { id: "entry-1" },
        data: {
          title: "Updated title",
          content: "Updated content",
          mood: "RELAXED",
        },
        include: {
          game: true,
          libraryItem: true,
          user: true,
        },
      });
      expect(result).toEqual(updatedEntry);
    });

    it("should throw error when entry not found", async () => {
      const input: UpdateJournalEntryInput = {
        id: "non-existent",
        userId: "user-1",
        content: "Updated content",
      };

      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(null);

      await expect(updateJournalEntry(input)).rejects.toThrow(
        "Journal entry not found"
      );
    });

    it("should throw error when user is not the owner", async () => {
      const input: UpdateJournalEntryInput = {
        id: "entry-1",
        userId: "other-user",
        content: "Updated content",
      };

      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(
        mockJournalEntry
      );

      await expect(updateJournalEntry(input)).rejects.toThrow(
        "Unauthorized to modify this journal entry"
      );
    });

    it("should update visibility to PUBLIC and set publishedAt", async () => {
      const input: UpdateJournalEntryInput = {
        id: "entry-1",
        userId: "user-1",
        visibility: "PUBLIC",
      };

      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(
        mockJournalEntry
      );

      const updatedEntry = {
        ...mockJournalEntry,
        visibility: "PUBLIC" as const,
        publishedAt: new Date(),
      };
      vi.mocked(prisma.journalEntry.update).mockResolvedValue(updatedEntry);

      await updateJournalEntry(input);

      expect(prisma.journalEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            visibility: "PUBLIC",
            publishedAt: expect.any(Date),
          }),
        })
      );
    });

    it("should update visibility to PRIVATE and clear publishedAt", async () => {
      const input: UpdateJournalEntryInput = {
        id: "entry-1",
        userId: "user-1",
        visibility: "PRIVATE",
      };

      const publicEntry = {
        ...mockJournalEntry,
        visibility: "PUBLIC" as const,
        publishedAt: new Date(),
      };
      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(publicEntry);

      const updatedEntry = {
        ...publicEntry,
        visibility: "PRIVATE" as const,
        publishedAt: null,
      };
      vi.mocked(prisma.journalEntry.update).mockResolvedValue(updatedEntry);

      await updateJournalEntry(input);

      expect(prisma.journalEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            visibility: "PRIVATE",
            publishedAt: null,
          }),
        })
      );
    });

    it("should not override existing publishedAt when already public", async () => {
      const existingPublishedAt = new Date("2024-01-01");
      const publicEntry = {
        ...mockJournalEntry,
        visibility: "PUBLIC" as const,
        publishedAt: existingPublishedAt,
      };

      const input: UpdateJournalEntryInput = {
        id: "entry-1",
        userId: "user-1",
        visibility: "PUBLIC",
      };

      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(publicEntry);
      vi.mocked(prisma.journalEntry.update).mockResolvedValue(publicEntry);

      await updateJournalEntry(input);

      expect(prisma.journalEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            publishedAt: expect.any(Date),
          }),
        })
      );
    });
  });

  describe("deleteJournalEntry", () => {
    it("should delete journal entry successfully", async () => {
      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(
        mockJournalEntry
      );
      vi.mocked(prisma.journalEntry.delete).mockResolvedValue(mockJournalEntry);

      const result = await deleteJournalEntry("entry-1", "user-1");

      expect(prisma.journalEntry.findUnique).toHaveBeenCalledWith({
        where: { id: "entry-1" },
      });
      expect(prisma.journalEntry.delete).toHaveBeenCalledWith({
        where: { id: "entry-1" },
        include: {
          game: true,
          libraryItem: true,
          user: true,
        },
      });
      expect(result).toEqual(mockJournalEntry);
    });

    it("should throw error when entry not found", async () => {
      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(null);

      await expect(
        deleteJournalEntry("non-existent", "user-1")
      ).rejects.toThrow("Journal entry not found");
    });

    it("should throw error when user is not the owner", async () => {
      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(
        mockJournalEntry
      );

      await expect(deleteJournalEntry("entry-1", "other-user")).rejects.toThrow(
        "Unauthorized to delete this journal entry"
      );
    });
  });

  describe("makeJournalEntryPublic", () => {
    it("should make a private entry public", async () => {
      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(
        mockJournalEntry
      );

      const publicEntry = {
        ...mockJournalEntry,
        visibility: "PUBLIC" as const,
        publishedAt: new Date(),
      };
      vi.mocked(prisma.journalEntry.update).mockResolvedValue(publicEntry);

      const result = await makeJournalEntryPublic("entry-1", "user-1");

      expect(prisma.journalEntry.update).toHaveBeenCalledWith({
        where: { id: "entry-1" },
        data: {
          visibility: "PUBLIC",
          publishedAt: expect.any(Date),
        },
        include: {
          game: true,
          libraryItem: true,
          user: true,
        },
      });
      expect(result.visibility).toBe("PUBLIC");
    });

    it("should preserve existing publishedAt if already public", async () => {
      const existingPublishedAt = new Date("2024-01-01");
      const alreadyPublicEntry = {
        ...mockJournalEntry,
        visibility: "PUBLIC" as const,
        publishedAt: existingPublishedAt,
      };

      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(
        alreadyPublicEntry
      );
      vi.mocked(prisma.journalEntry.update).mockResolvedValue(
        alreadyPublicEntry
      );

      await makeJournalEntryPublic("entry-1", "user-1");

      expect(prisma.journalEntry.update).toHaveBeenCalledWith({
        where: { id: "entry-1" },
        data: {
          visibility: "PUBLIC",
          publishedAt: existingPublishedAt,
        },
        include: {
          game: true,
          libraryItem: true,
          user: true,
        },
      });
    });

    it("should throw error when entry not found", async () => {
      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(null);

      await expect(
        makeJournalEntryPublic("non-existent", "user-1")
      ).rejects.toThrow("Journal entry not found");
    });

    it("should throw error when user is not the owner", async () => {
      vi.mocked(prisma.journalEntry.findUnique).mockResolvedValue(
        mockJournalEntry
      );

      await expect(
        makeJournalEntryPublic("entry-1", "other-user")
      ).rejects.toThrow("Unauthorized to modify this journal entry");
    });
  });
});
