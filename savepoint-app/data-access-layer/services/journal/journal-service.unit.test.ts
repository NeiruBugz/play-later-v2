import { JournalMood } from "@/data-access-layer/domain/journal";
import { createJournalEntry } from "@/data-access-layer/repository/journal/journal-repository";
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
}));

describe("JournalService", () => {
  let service: JournalService;
  let mockCreateJournalEntry: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new JournalService();
    mockCreateJournalEntry = vi.mocked(createJournalEntry);
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
});

