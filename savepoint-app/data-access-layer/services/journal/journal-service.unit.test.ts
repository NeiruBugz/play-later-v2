import {
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntriesByGame,
  getJournalEntriesForUser,
  updateJournalEntry,
} from "@/data-access-layer/repository/journal/journal-repository";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceErrorCode } from "../types";
import { JournalService } from "./journal-service";

vi.mock("@/data-access-layer/repository/journal/journal-repository", () => ({
  createJournalEntry: vi.fn(),
  deleteJournalEntry: vi.fn(),
  getJournalEntriesByGame: vi.fn(),
  getJournalEntriesForUser: vi.fn(),
  getJournalEntryById: vi.fn(),
  updateJournalEntry: vi.fn(),
}));

describe("JournalService", () => {
  let service: JournalService;
  let mockCreateJournalEntry: ReturnType<typeof vi.fn>;
  let mockDeleteJournalEntry: ReturnType<typeof vi.fn>;
  let mockGetJournalEntriesByGame: ReturnType<typeof vi.fn>;
  let mockGetJournalEntriesForUser: ReturnType<typeof vi.fn>;
  let mockUpdateJournalEntry: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new JournalService();
    mockCreateJournalEntry = vi.mocked(createJournalEntry);
    mockDeleteJournalEntry = vi.mocked(deleteJournalEntry);
    mockGetJournalEntriesByGame = vi.mocked(getJournalEntriesByGame);
    mockGetJournalEntriesForUser = vi.mocked(getJournalEntriesForUser);
    mockUpdateJournalEntry = vi.mocked(updateJournalEntry);
  });

  describe("getJournalEntries", () => {
    it("should return all entries for a user", async () => {
      const mockEntries = [
        {
          id: "entry-1",
          userId: "user-123",
          gameId: "game-456",
          libraryItemId: null,
          title: "First Session",
          content: "Had fun!",
          mood: "EXCITED" as const,
          playSession: 120,
          visibility: "PRIVATE" as const,
          publishedAt: null,
          createdAt: new Date("2024-03-01"),
          updatedAt: new Date("2024-03-01"),
          game: {
            id: "game-456",
            title: "Test Game",
            coverImage: null,
          },
          libraryItem: null,
          user: {
            id: "user-123",
            username: "johndoe",
            name: "John Doe",
          },
        },
      ];

      mockGetJournalEntriesForUser.mockResolvedValue(mockEntries);

      const result = await service.getJournalEntries({
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entries).toHaveLength(1);
        expect(result.data.total).toBe(1);
        expect(result.data.entries).toEqual(mockEntries);
      }

      expect(mockGetJournalEntriesForUser).toHaveBeenCalledWith("user-123", {
        limit: undefined,
        offset: undefined,
      });
    });

    it("should return entries for a specific game", async () => {
      const mockEntries = [
        {
          id: "entry-1",
          userId: "user-123",
          gameId: "game-456",
          libraryItemId: null,
          title: "Session 1",
          content: "First impression",
          mood: "EXCITED" as const,
          playSession: 60,
          visibility: "PRIVATE" as const,
          publishedAt: null,
          createdAt: new Date("2024-03-01"),
          updatedAt: new Date("2024-03-01"),
          game: {
            id: "game-456",
            title: "Test Game",
            coverImage: null,
          },
          libraryItem: null,
          user: {
            id: "user-123",
            username: "johndoe",
            name: "John Doe",
          },
        },
      ];

      mockGetJournalEntriesByGame.mockResolvedValue(mockEntries);

      const result = await service.getJournalEntries({
        userId: "user-123",
        gameId: "game-456",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entries).toHaveLength(1);
        expect(result.data.total).toBe(1);
      }

      expect(mockGetJournalEntriesByGame).toHaveBeenCalledWith("game-456", {
        userId: "user-123",
        visibility: undefined,
      });
    });

    it("should filter entries by libraryItemId", async () => {
      const mockEntries = [
        {
          id: "entry-1",
          userId: "user-123",
          gameId: "game-456",
          libraryItemId: 789,
          title: "Session 1",
          content: "Content 1",
          mood: "EXCITED" as const,
          playSession: 60,
          visibility: "PRIVATE" as const,
          publishedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          game: {
            id: "game-456",
            title: "Test Game",
            coverImage: null,
          },
          libraryItem: {
            id: 789,
            status: "CURRENTLY_EXPLORING",
          },
          user: {
            id: "user-123",
            username: "johndoe",
            name: "John Doe",
          },
        },
        {
          id: "entry-2",
          userId: "user-123",
          gameId: "game-456",
          libraryItemId: 999,
          title: "Session 2",
          content: "Content 2",
          mood: "EXCITED" as const,
          playSession: 90,
          visibility: "PRIVATE" as const,
          publishedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          game: {
            id: "game-456",
            title: "Test Game",
            coverImage: null,
          },
          libraryItem: {
            id: 999,
            status: "CURRENTLY_EXPLORING",
          },
          user: {
            id: "user-123",
            username: "johndoe",
            name: "John Doe",
          },
        },
      ];

      mockGetJournalEntriesForUser.mockResolvedValue(mockEntries);

      const result = await service.getJournalEntries({
        userId: "user-123",
        libraryItemId: 789,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entries).toHaveLength(1);
        expect(result.data.entries[0].libraryItemId).toBe(789);
        expect(result.data.total).toBe(1);
      }
    });

    it("should return empty array when no entries found", async () => {
      mockGetJournalEntriesForUser.mockResolvedValue([]);

      const result = await service.getJournalEntries({
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entries).toHaveLength(0);
        expect(result.data.total).toBe(0);
      }
    });

    it("should handle repository errors", async () => {
      mockGetJournalEntriesForUser.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.getJournalEntries({
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("createJournalEntry", () => {
    it("should create entry with all fields", async () => {
      const mockEntry = {
        id: "entry-1",
        userId: "user-123",
        gameId: "game-456",
        libraryItemId: 789,
        title: "Great Session",
        content: "Had an amazing time!",
        mood: "EXCITED" as const,
        playSession: 120,
        visibility: "PUBLIC" as const,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        game: {
          id: "game-456",
          title: "Test Game",
          coverImage: null,
        },
        libraryItem: {
          id: 789,
          status: "CURRENTLY_EXPLORING",
        },
        user: {
          id: "user-123",
          username: "johndoe",
          name: "John Doe",
        },
      };

      mockCreateJournalEntry.mockResolvedValue(mockEntry);

      const result = await service.createJournalEntry({
        userId: "user-123",
        gameId: "game-456",
        libraryItemId: 789,
        title: "Great Session",
        content: "Had an amazing time!",
        mood: "EXCITED",
        playSession: 120,
        visibility: "PUBLIC",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entry).toEqual(mockEntry);
        expect(result.data.message).toBe("Journal entry created successfully");
      }

      expect(mockCreateJournalEntry).toHaveBeenCalledWith({
        userId: "user-123",
        gameId: "game-456",
        libraryItemId: 789,
        title: "Great Session",
        content: "Had an amazing time!",
        mood: "EXCITED",
        playSession: 120,
        visibility: "PUBLIC",
      });
    });

    it("should create entry with minimal fields", async () => {
      const mockEntry = {
        id: "entry-1",
        userId: "user-123",
        gameId: "game-456",
        libraryItemId: null,
        title: null,
        content: "Quick note",
        mood: null,
        playSession: null,
        visibility: "PRIVATE" as const,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        game: {
          id: "game-456",
          title: "Test Game",
          coverImage: null,
        },
        libraryItem: null,
        user: {
          id: "user-123",
          username: "johndoe",
          name: "John Doe",
        },
      };

      mockCreateJournalEntry.mockResolvedValue(mockEntry);

      const result = await service.createJournalEntry({
        userId: "user-123",
        gameId: "game-456",
        content: "Quick note",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entry).toEqual(mockEntry);
      }
    });

    it("should handle repository errors", async () => {
      mockCreateJournalEntry.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.createJournalEntry({
        userId: "user-123",
        gameId: "game-456",
        content: "Test content",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("updateJournalEntry", () => {
    it("should update entry successfully", async () => {
      const mockEntry = {
        id: "entry-1",
        userId: "user-123",
        gameId: "game-456",
        libraryItemId: null,
        title: "Updated Title",
        content: "Updated content",
        mood: "RELAXED" as const,
        playSession: 90,
        visibility: "PRIVATE" as const,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        game: {
          id: "game-456",
          title: "Test Game",
          coverImage: null,
        },
        libraryItem: null,
        user: {
          id: "user-123",
          username: "johndoe",
          name: "John Doe",
        },
      };

      mockUpdateJournalEntry.mockResolvedValue(mockEntry);

      const result = await service.updateJournalEntry({
        userId: "user-123",
        id: "entry-1",
        title: "Updated Title",
        content: "Updated content",
        mood: "RELAXED",
        playSession: 90,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entry).toEqual(mockEntry);
        expect(result.data.message).toBe("Journal entry updated successfully");
      }
    });

    it("should handle unauthorized update", async () => {
      mockUpdateJournalEntry.mockRejectedValue(
        new Error("Unauthorized to modify this journal entry")
      );

      const result = await service.updateJournalEntry({
        userId: "user-123",
        id: "entry-1",
        content: "Hacked content",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          "Journal entry not found or you do not have permission to update it"
        );
        expect(result.code).toBe(ServiceErrorCode.UNAUTHORIZED);
      }
    });

    it("should handle entry not found", async () => {
      mockUpdateJournalEntry.mockRejectedValue(
        new Error("Journal entry not found")
      );

      const result = await service.updateJournalEntry({
        userId: "user-123",
        id: "nonexistent",
        content: "Updated content",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          "Journal entry not found or you do not have permission to update it"
        );
        expect(result.code).toBe(ServiceErrorCode.UNAUTHORIZED);
      }
    });

    it("should handle repository errors", async () => {
      mockUpdateJournalEntry.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.updateJournalEntry({
        userId: "user-123",
        id: "entry-1",
        content: "Updated content",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("deleteJournalEntry", () => {
    it("should delete entry successfully", async () => {
      const mockEntry = {
        id: "entry-1",
        userId: "user-123",
        gameId: "game-456",
        libraryItemId: null,
        title: "Entry to delete",
        content: "Content",
        mood: null,
        playSession: null,
        visibility: "PRIVATE" as const,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        game: {
          id: "game-456",
          title: "Test Game",
          coverImage: null,
        },
        libraryItem: null,
        user: {
          id: "user-123",
          username: "johndoe",
          name: "John Doe",
        },
      };

      mockDeleteJournalEntry.mockResolvedValue(mockEntry);

      const result = await service.deleteJournalEntry({
        id: "entry-1",
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe("Journal entry deleted successfully");
      }

      expect(mockDeleteJournalEntry).toHaveBeenCalledWith(
        "entry-1",
        "user-123"
      );
    });

    it("should handle unauthorized delete", async () => {
      mockDeleteJournalEntry.mockRejectedValue(
        new Error("Unauthorized to delete this journal entry")
      );

      const result = await service.deleteJournalEntry({
        id: "entry-1",
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          "Journal entry not found or you do not have permission to delete it"
        );
        expect(result.code).toBe(ServiceErrorCode.UNAUTHORIZED);
      }
    });

    it("should handle entry not found", async () => {
      mockDeleteJournalEntry.mockRejectedValue(
        new Error("Journal entry not found")
      );

      const result = await service.deleteJournalEntry({
        id: "nonexistent",
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          "Journal entry not found or you do not have permission to delete it"
        );
        expect(result.code).toBe(ServiceErrorCode.UNAUTHORIZED);
      }
    });

    it("should handle repository errors", async () => {
      mockDeleteJournalEntry.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.deleteJournalEntry({
        id: "entry-1",
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("getJournalStats", () => {
    it("should calculate statistics correctly", async () => {
      const now = new Date();
      const tenDaysAgo = new Date(now);
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      const twentyDaysAgo = new Date(now);
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
      const fortyDaysAgo = new Date(now);
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

      const mockEntries = [
        {
          id: "entry-1",
          userId: "user-123",
          gameId: "game-456",
          libraryItemId: null,
          title: "Entry 1",
          content: "Content 1",
          mood: "EXCITED" as const,
          playSession: 120,
          visibility: "PRIVATE" as const,
          publishedAt: null,
          createdAt: tenDaysAgo,
          updatedAt: tenDaysAgo,
          game: {
            id: "game-456",
            title: "Test Game",
            coverImage: null,
          },
          libraryItem: null,
          user: {
            id: "user-123",
            username: "johndoe",
            name: "John Doe",
          },
        },
        {
          id: "entry-2",
          userId: "user-123",
          gameId: "game-789",
          libraryItemId: null,
          title: "Entry 2",
          content: "Content 2",
          mood: "EXCITED" as const,
          playSession: 90,
          visibility: "PRIVATE" as const,
          publishedAt: null,
          createdAt: twentyDaysAgo,
          updatedAt: twentyDaysAgo,
          game: {
            id: "game-789",
            title: "Test Game 2",
            coverImage: null,
          },
          libraryItem: null,
          user: {
            id: "user-123",
            username: "johndoe",
            name: "John Doe",
          },
        },
        {
          id: "entry-3",
          userId: "user-123",
          gameId: "game-456",
          libraryItemId: null,
          title: "Entry 3",
          content: "Content 3",
          mood: "FRUSTRATED" as const,
          playSession: 60,
          visibility: "PRIVATE" as const,
          publishedAt: null,
          createdAt: fortyDaysAgo,
          updatedAt: fortyDaysAgo,
          game: {
            id: "game-456",
            title: "Test Game",
            coverImage: null,
          },
          libraryItem: null,
          user: {
            id: "user-123",
            username: "johndoe",
            name: "John Doe",
          },
        },
      ];

      mockGetJournalEntriesForUser.mockResolvedValue(mockEntries);

      const result = await service.getJournalStats({
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stats.totalEntries).toBe(3);
        expect(result.data.stats.totalPlayTime).toBe(270);
        expect(result.data.stats.moodDistribution).toEqual([
          { mood: "EXCITED", count: 2 },
          { mood: "FRUSTRATED", count: 1 },
        ]);
        expect(result.data.stats.recentEntries).toBe(2);
      }
    });

    it("should return zeros for user with no entries", async () => {
      mockGetJournalEntriesForUser.mockResolvedValue([]);

      const result = await service.getJournalStats({
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stats.totalEntries).toBe(0);
        expect(result.data.stats.totalPlayTime).toBe(0);
        expect(result.data.stats.moodDistribution).toEqual([]);
        expect(result.data.stats.recentEntries).toBe(0);
      }
    });

    it("should handle entries without mood", async () => {
      const mockEntries = [
        {
          id: "entry-1",
          userId: "user-123",
          gameId: "game-456",
          libraryItemId: null,
          title: "Entry 1",
          content: "Content 1",
          mood: null,
          playSession: 120,
          visibility: "PRIVATE" as const,
          publishedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          game: {
            id: "game-456",
            title: "Test Game",
            coverImage: null,
          },
          libraryItem: null,
          user: {
            id: "user-123",
            username: "johndoe",
            name: "John Doe",
          },
        },
      ];

      mockGetJournalEntriesForUser.mockResolvedValue(mockEntries);

      const result = await service.getJournalStats({
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stats.totalEntries).toBe(1);
        expect(result.data.stats.moodDistribution).toEqual([]);
      }
    });

    it("should handle repository errors", async () => {
      mockGetJournalEntriesForUser.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.getJournalStats({
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });
});
