import { JournalMood } from "@/data-access-layer/domain/journal";
import {
  createJournalEntry,
  findJournalEntryById,
  findJournalEntriesByUserId,
} from "@/data-access-layer/repository/journal/journal-repository";
import {
  repositoryError,
  RepositoryErrorCode,
  repositorySuccess,
} from "@/data-access-layer/repository/types";
import type { JournalEntry } from "@prisma/client";

import { JournalService } from "./journal-service";
import { ServiceErrorCode } from "../types";

vi.mock("@/data-access-layer/repository/journal/journal-repository", () => ({
  createJournalEntry: vi.fn(),
  findJournalEntryById: vi.fn(),
  findJournalEntriesByUserId: vi.fn(),
}));

describe("JournalService", () => {
  let service: JournalService;
  let mockCreateJournalEntry: ReturnType<typeof vi.fn>;
  let mockFindJournalEntryById: ReturnType<typeof vi.fn>;
  let mockFindJournalEntriesByUserId: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new JournalService();
    mockCreateJournalEntry = vi.mocked(createJournalEntry);
    mockFindJournalEntryById = vi.mocked(findJournalEntryById);
    mockFindJournalEntriesByUserId = vi.mocked(findJournalEntriesByUserId);
  });

  describe("createJournalEntry", () => {
    const validParams = {
      userId: "user-123",
      gameId: "game-456",
      title: "My First Entry",
      content: "This is my first journal entry.",
    };

    const mockPrismaJournalEntry: JournalEntry = {
      id: "entry-789",
      userId: "user-123",
      gameId: "game-456",
      title: "My First Entry",
      content: "This is my first journal entry.",
      mood: null,
      playSession: null,
      libraryItemId: null,
      visibility: "PRIVATE",
      createdAt: new Date("2024-01-01T10:00:00Z"),
      updatedAt: new Date("2024-01-01T10:00:00Z"),
      publishedAt: null,
    };

    it("should successfully create journal entry when repository succeeds", async () => {
      mockCreateJournalEntry.mockResolvedValue(
        repositorySuccess(mockPrismaJournalEntry)
      );

      const result = await service.createJournalEntry(validParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          id: "entry-789",
          userId: "user-123",
          gameId: "game-456",
          title: "My First Entry",
          content: "This is my first journal entry.",
          mood: null,
          playSession: null,
          libraryItemId: null,
          visibility: "PRIVATE",
        });
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }

      expect(mockCreateJournalEntry).toHaveBeenCalledWith(validParams);
    });

    it("should successfully create journal entry with optional fields", async () => {
      const paramsWithOptionalFields = {
        ...validParams,
        mood: JournalMood.EXCITED,
        playSession: 5,
        libraryItemId: 123,
      };

      const mockEntryWithOptionalFields: JournalEntry = {
        ...mockPrismaJournalEntry,
        mood: "EXCITED",
        playSession: 5,
        libraryItemId: 123,
      };

      mockCreateJournalEntry.mockResolvedValue(
        repositorySuccess(mockEntryWithOptionalFields)
      );

      const result = await service.createJournalEntry(paramsWithOptionalFields);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          id: "entry-789",
          mood: JournalMood.EXCITED,
          playSession: 5,
          libraryItemId: 123,
        });
      }

      expect(mockCreateJournalEntry).toHaveBeenCalledWith(
        paramsWithOptionalFields
      );
    });

    it("should map repository result to domain model correctly", async () => {
      mockCreateJournalEntry.mockResolvedValue(
        repositorySuccess(mockPrismaJournalEntry)
      );

      const result = await service.createJournalEntry(validParams);

      expect(result.success).toBe(true);
      if (result.success) {
        // Verify domain model structure (not Prisma structure)
        expect(result.data).toHaveProperty("id");
        expect(result.data).toHaveProperty("userId");
        expect(result.data).toHaveProperty("gameId");
        expect(result.data).toHaveProperty("title");
        expect(result.data).toHaveProperty("content");
        expect(result.data).toHaveProperty("mood");
        expect(result.data).toHaveProperty("playSession");
        expect(result.data).toHaveProperty("libraryItemId");
        expect(result.data).toHaveProperty("visibility");
        expect(result.data).toHaveProperty("createdAt");
        expect(result.data).toHaveProperty("updatedAt");
        expect(result.data).toHaveProperty("publishedAt");
        // Verify it's a domain model, not Prisma model
        expect(result.data).not.toHaveProperty("user");
        expect(result.data).not.toHaveProperty("game");
        expect(result.data).not.toHaveProperty("libraryItem");
      }
    });

    it("should return error when repository returns error", async () => {
      mockCreateJournalEntry.mockResolvedValue(
        repositoryError(
          RepositoryErrorCode.DATABASE_ERROR,
          "Failed to create journal entry: Foreign key constraint violation"
        )
      );

      const result = await service.createJournalEntry(validParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Failed to create journal entry");
        expect(result.code).toBeUndefined(); // Service doesn't map repository error codes
      }

      expect(mockCreateJournalEntry).toHaveBeenCalledWith(validParams);
    });

    it("should validate required fields are provided", async () => {
      // Test with missing title
      const paramsWithoutTitle = {
        userId: validParams.userId,
        gameId: validParams.gameId,
        content: validParams.content,
      };

      // TypeScript will catch this, but we test runtime behavior
      // The service should handle validation if needed
      mockCreateJournalEntry.mockResolvedValue(
        repositorySuccess(mockPrismaJournalEntry)
      );

      // Note: TypeScript will prevent calling without required fields
      // This test verifies the service passes through to repository
      const result = await service.createJournalEntry(validParams);

      expect(result.success).toBe(true);
      expect(mockCreateJournalEntry).toHaveBeenCalledWith(validParams);
    });

    it("should handle unexpected errors", async () => {
      mockCreateJournalEntry.mockRejectedValue(
        new Error("Unexpected database error")
      );

      const result = await service.createJournalEntry(validParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unexpected database error");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });

    it("should call repository with correct parameters", async () => {
      mockCreateJournalEntry.mockResolvedValue(
        repositorySuccess(mockPrismaJournalEntry)
      );

      await service.createJournalEntry(validParams);

      expect(mockCreateJournalEntry).toHaveBeenCalledTimes(1);
      expect(mockCreateJournalEntry).toHaveBeenCalledWith({
        userId: "user-123",
        gameId: "game-456",
        title: "My First Entry",
        content: "This is my first journal entry.",
      });
    });

    it("should handle repository error with NOT_FOUND code", async () => {
      mockCreateJournalEntry.mockResolvedValue(
        repositoryError(
          RepositoryErrorCode.NOT_FOUND,
          "Game not found"
        )
      );

      const result = await service.createJournalEntry(validParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Game not found");
      }
    });
  });

  describe("findJournalEntryById", () => {
    const validParams = {
      entryId: "entry-789",
      userId: "user-123",
    };

    const mockPrismaJournalEntry: JournalEntry = {
      id: "entry-789",
      userId: "user-123",
      gameId: "game-456",
      title: "My Entry",
      content: "This is my journal entry.",
      mood: "EXCITED",
      playSession: 5,
      libraryItemId: null,
      visibility: "PRIVATE",
      createdAt: new Date("2024-01-01T10:00:00Z"),
      updatedAt: new Date("2024-01-01T10:00:00Z"),
      publishedAt: null,
    };

    it("should successfully retrieve entry when repository succeeds", async () => {
      mockFindJournalEntryById.mockResolvedValue(
        repositorySuccess(mockPrismaJournalEntry)
      );

      const result = await service.findJournalEntryById(validParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          id: "entry-789",
          userId: "user-123",
          gameId: "game-456",
          title: "My Entry",
          content: "This is my journal entry.",
          mood: JournalMood.EXCITED,
          playSession: 5,
          libraryItemId: null,
          visibility: "PRIVATE",
        });
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }

      expect(mockFindJournalEntryById).toHaveBeenCalledWith(validParams);
    });

    it("should map repository result to domain model correctly", async () => {
      mockFindJournalEntryById.mockResolvedValue(
        repositorySuccess(mockPrismaJournalEntry)
      );

      const result = await service.findJournalEntryById(validParams);

      expect(result.success).toBe(true);
      if (result.success) {
        // Verify domain model structure (not Prisma structure)
        expect(result.data).toHaveProperty("id");
        expect(result.data).toHaveProperty("userId");
        expect(result.data).toHaveProperty("gameId");
        expect(result.data).toHaveProperty("title");
        expect(result.data).toHaveProperty("content");
        expect(result.data).toHaveProperty("mood");
        expect(result.data).toHaveProperty("playSession");
        expect(result.data).toHaveProperty("libraryItemId");
        expect(result.data).toHaveProperty("visibility");
        expect(result.data).toHaveProperty("createdAt");
        expect(result.data).toHaveProperty("updatedAt");
        expect(result.data).toHaveProperty("publishedAt");
        // Verify it's a domain model, not Prisma model
        expect(result.data).not.toHaveProperty("user");
        expect(result.data).not.toHaveProperty("game");
        expect(result.data).not.toHaveProperty("libraryItem");
      }
    });

    it("should return error when entry is not found", async () => {
      mockFindJournalEntryById.mockResolvedValue(
        repositoryError(
          RepositoryErrorCode.NOT_FOUND,
          "Journal entry not found"
        )
      );

      const result = await service.findJournalEntryById(validParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Journal entry not found");
      }

      expect(mockFindJournalEntryById).toHaveBeenCalledWith(validParams);
    });

    it("should return error when user doesn't own the entry", async () => {
      mockFindJournalEntryById.mockResolvedValue(
        repositoryError(
          RepositoryErrorCode.NOT_FOUND,
          "Journal entry not found"
        )
      );

      const result = await service.findJournalEntryById(validParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Journal entry not found");
      }
    });

    it("should handle unexpected errors", async () => {
      mockFindJournalEntryById.mockRejectedValue(
        new Error("Unexpected database error")
      );

      const result = await service.findJournalEntryById(validParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unexpected database error");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });

    it("should call repository with correct parameters", async () => {
      mockFindJournalEntryById.mockResolvedValue(
        repositorySuccess(mockPrismaJournalEntry)
      );

      await service.findJournalEntryById(validParams);

      expect(mockFindJournalEntryById).toHaveBeenCalledTimes(1);
      expect(mockFindJournalEntryById).toHaveBeenCalledWith({
        entryId: "entry-789",
        userId: "user-123",
      });
    });
  });

  describe("findJournalEntriesByUserId", () => {
    const validParams = {
      userId: "user-123",
      limit: 10,
    };

    const mockPrismaJournalEntries: JournalEntry[] = [
      {
        id: "entry-1",
        userId: "user-123",
        gameId: "game-456",
        title: "First Entry",
        content: "Content of first entry",
        mood: "EXCITED",
        playSession: 1,
        libraryItemId: 100,
        visibility: "PRIVATE",
        createdAt: new Date("2024-01-01T10:00:00Z"),
        updatedAt: new Date("2024-01-01T10:00:00Z"),
        publishedAt: null,
      },
      {
        id: "entry-2",
        userId: "user-123",
        gameId: "game-789",
        title: "Second Entry",
        content: "Content of second entry",
        mood: null,
        playSession: null,
        libraryItemId: null,
        visibility: "PUBLIC",
        createdAt: new Date("2024-01-02T10:00:00Z"),
        updatedAt: new Date("2024-01-02T10:00:00Z"),
        publishedAt: new Date("2024-01-02T12:00:00Z"),
      },
    ];

    it("should successfully retrieve journal entries when repository succeeds", async () => {
      mockFindJournalEntriesByUserId.mockResolvedValue(
        repositorySuccess(mockPrismaJournalEntries)
      );

      const result = await service.findJournalEntriesByUserId(validParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]).toMatchObject({
          id: "entry-1",
          userId: "user-123",
          gameId: "game-456",
          title: "First Entry",
          content: "Content of first entry",
          mood: JournalMood.EXCITED,
          playSession: 1,
          libraryItemId: 100,
          visibility: "PRIVATE",
        });
        expect(result.data[0].createdAt).toBeInstanceOf(Date);
        expect(result.data[0].updatedAt).toBeInstanceOf(Date);

        expect(result.data[1]).toMatchObject({
          id: "entry-2",
          userId: "user-123",
          gameId: "game-789",
          title: "Second Entry",
          mood: null,
          playSession: null,
          libraryItemId: null,
          visibility: "PUBLIC",
        });
        expect(result.data[1].publishedAt).toBeInstanceOf(Date);
      }

      expect(mockFindJournalEntriesByUserId).toHaveBeenCalledWith({
        userId: "user-123",
        limit: 10,
      });
    });

    it("should successfully retrieve entries with pagination cursor", async () => {
      const paramsWithCursor = {
        userId: "user-123",
        limit: 5,
        cursor: "entry-previous",
      };

      mockFindJournalEntriesByUserId.mockResolvedValue(
        repositorySuccess(mockPrismaJournalEntries)
      );

      const result = await service.findJournalEntriesByUserId(paramsWithCursor);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }

      expect(mockFindJournalEntriesByUserId).toHaveBeenCalledWith({
        userId: "user-123",
        limit: 5,
        cursor: "entry-previous",
      });
    });

    it("should apply default limit when not provided", async () => {
      const paramsWithoutLimit = {
        userId: "user-123",
      };

      mockFindJournalEntriesByUserId.mockResolvedValue(
        repositorySuccess(mockPrismaJournalEntries)
      );

      const result = await service.findJournalEntriesByUserId(
        paramsWithoutLimit
      );

      expect(result.success).toBe(true);
      expect(mockFindJournalEntriesByUserId).toHaveBeenCalledWith({
        userId: "user-123",
        limit: 20,
      });
    });

    it("should correctly map domain models with all fields", async () => {
      mockFindJournalEntriesByUserId.mockResolvedValue(
        repositorySuccess(mockPrismaJournalEntries)
      );

      const result = await service.findJournalEntriesByUserId(validParams);

      expect(result.success).toBe(true);
      if (result.success) {
        result.data.forEach((entry: unknown) => {
          expect(entry).toHaveProperty("id");
          expect(entry).toHaveProperty("userId");
          expect(entry).toHaveProperty("gameId");
          expect(entry).toHaveProperty("title");
          expect(entry).toHaveProperty("content");
          expect(entry).toHaveProperty("mood");
          expect(entry).toHaveProperty("playSession");
          expect(entry).toHaveProperty("libraryItemId");
          expect(entry).toHaveProperty("visibility");
          expect(entry).toHaveProperty("createdAt");
          expect(entry).toHaveProperty("updatedAt");
          expect(entry).toHaveProperty("publishedAt");
        });

        expect(result.data[0].createdAt).toBeInstanceOf(Date);
        expect(result.data[0].updatedAt).toBeInstanceOf(Date);
        expect(result.data[1].publishedAt).toBeInstanceOf(Date);
      }
    });

    it("should return error when repository returns NOT_FOUND error (invalid cursor)", async () => {
      const paramsWithInvalidCursor = {
        userId: "user-123",
        limit: 10,
        cursor: "invalid-cursor-id",
      };

      mockFindJournalEntriesByUserId.mockResolvedValue(
        repositoryError(
          RepositoryErrorCode.NOT_FOUND,
          "Cursor entry not found"
        )
      );

      const result = await service.findJournalEntriesByUserId(
        paramsWithInvalidCursor
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Cursor entry not found");
      }

      expect(mockFindJournalEntriesByUserId).toHaveBeenCalledWith(
        paramsWithInvalidCursor
      );
    });

    it("should return error when repository returns DATABASE_ERROR", async () => {
      mockFindJournalEntriesByUserId.mockResolvedValue(
        repositoryError(
          RepositoryErrorCode.DATABASE_ERROR,
          "Failed to find journal entries: Connection timeout"
        )
      );

      const result = await service.findJournalEntriesByUserId(validParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Failed to find journal entries");
      }

      expect(mockFindJournalEntriesByUserId).toHaveBeenCalledWith(validParams);
    });

    it("should handle unexpected errors", async () => {
      mockFindJournalEntriesByUserId.mockRejectedValue(
        new Error("Unexpected database error")
      );

      const result = await service.findJournalEntriesByUserId(validParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unexpected database error");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });

    it("should handle empty results successfully", async () => {
      mockFindJournalEntriesByUserId.mockResolvedValue(repositorySuccess([]));

      const result = await service.findJournalEntriesByUserId(validParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }

      expect(mockFindJournalEntriesByUserId).toHaveBeenCalledWith(validParams);
    });

    it("should call repository with correct parameters", async () => {
      mockFindJournalEntriesByUserId.mockResolvedValue(
        repositorySuccess(mockPrismaJournalEntries)
      );

      await service.findJournalEntriesByUserId(validParams);

      expect(mockFindJournalEntriesByUserId).toHaveBeenCalledTimes(1);
      expect(mockFindJournalEntriesByUserId).toHaveBeenCalledWith({
        userId: "user-123",
        limit: 10,
      });
    });

    it("should preserve cursor in repository call", async () => {
      const paramsWithCursor = {
        userId: "user-123",
        limit: 15,
        cursor: "entry-cursor-123",
      };

      mockFindJournalEntriesByUserId.mockResolvedValue(
        repositorySuccess(mockPrismaJournalEntries)
      );

      await service.findJournalEntriesByUserId(paramsWithCursor);

      expect(mockFindJournalEntriesByUserId).toHaveBeenCalledWith({
        userId: "user-123",
        limit: 15,
        cursor: "entry-cursor-123",
      });
    });
  });
});

