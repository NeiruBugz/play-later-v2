import { getServerUserId } from "@/auth";
import { JournalService } from "@/data-access-layer/services";
import { revalidatePath, updateTag } from "next/cache";

import type { JournalEntryDomain } from "@/features/journal/types";
import { userTags } from "@/shared/lib";
import { NotFoundError } from "@/shared/lib/errors";
import { JournalMood, JournalVisibility } from "@/shared/types/journal";

import { createJournalEntryAction } from "./create-journal-entry";

vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

vi.mock("@/data-access-layer/services", () => ({
  JournalService: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

vi.unmock("@/shared/lib");

const mockGetServerUserId = vi.mocked(getServerUserId);
const mockRevalidatePath = vi.mocked(revalidatePath);
const mockUpdateTag = vi.mocked(updateTag);
const MockJournalService = vi.mocked(JournalService);

describe("createJournalEntryAction server action", () => {
  let mockCreateJournalEntry: ReturnType<typeof vi.fn>;

  const validInput = {
    gameId: "game-123",
    title: "My First Entry",
    content: "This is my first journal entry about this game.",
  };

  const mockJournalEntryDomain: JournalEntryDomain = {
    id: "entry-456",
    userId: "user-789",
    gameId: "game-123",
    kind: "REFLECTION",
    title: "My First Entry",
    content: "This is my first journal entry about this game.",
    playedMinutes: null,
    tags: [],
    mood: null,
    playSession: null,
    libraryItemId: null,
    visibility: JournalVisibility.PRIVATE,
    createdAt: new Date("2024-01-01T10:00:00Z"),
    updatedAt: new Date("2024-01-01T10:00:00Z"),
    publishedAt: null,
  };

  beforeEach(() => {
    vi.resetAllMocks();

    mockCreateJournalEntry = vi.fn();
    MockJournalService.mockImplementation(function () {
      return {
        createJournalEntry: mockCreateJournalEntry,
      } as any;
    });

    mockGetServerUserId.mockResolvedValue("user-789");
  });

  describe("Success Path", () => {
    it("should successfully create journal entry when service succeeds", async () => {
      mockCreateJournalEntry.mockResolvedValue(mockJournalEntryDomain);

      const result = await createJournalEntryAction(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockJournalEntryDomain);
      }

      expect(mockCreateJournalEntry).toHaveBeenCalledWith({
        userId: "user-789",
        gameId: "game-123",
        title: "My First Entry",
        content: "This is my first journal entry about this game.",
      });
    });

    it("should successfully create journal entry with optional fields", async () => {
      const inputWithOptionalFields = {
        ...validInput,
        mood: JournalMood.EXCITED,
        playSession: 5,
        libraryItemId: 123,
      };

      const entryWithOptionalFields: JournalEntryDomain = {
        ...mockJournalEntryDomain,
        mood: JournalMood.EXCITED,
        playSession: 5,
        libraryItemId: 123,
      };

      mockCreateJournalEntry.mockResolvedValue(entryWithOptionalFields);

      const result = await createJournalEntryAction(inputWithOptionalFields);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(entryWithOptionalFields);
      }

      expect(mockCreateJournalEntry).toHaveBeenCalledWith({
        userId: "user-789",
        gameId: "game-123",
        title: "My First Entry",
        content: "This is my first journal entry about this game.",
        mood: "EXCITED",
        playSession: 5,
        libraryItemId: 123,
      });
    });

    it("should revalidate journal page after successful creation", async () => {
      mockCreateJournalEntry.mockResolvedValue(mockJournalEntryDomain);

      await createJournalEntryAction(validInput);

      expect(mockRevalidatePath).toHaveBeenCalledWith("/journal");
    });

    it("should revalidate game detail pages after successful creation", async () => {
      mockCreateJournalEntry.mockResolvedValue(mockJournalEntryDomain);

      await createJournalEntryAction(validInput);

      expect(mockRevalidatePath).toHaveBeenCalledWith("/games/[slug]", "page");
    });

    it("should call revalidatePath exactly twice on success", async () => {
      mockCreateJournalEntry.mockResolvedValue(mockJournalEntryDomain);

      await createJournalEntryAction(validInput);

      expect(mockRevalidatePath).toHaveBeenCalledTimes(2);
    });

    it("should update profileStats tag on success", async () => {
      mockCreateJournalEntry.mockResolvedValue(mockJournalEntryDomain);

      await createJournalEntryAction(validInput);

      expect(mockUpdateTag).toHaveBeenCalledWith(
        userTags("user-789").profileStats
      );
    });
  });

  describe("updateTag wiring", () => {
    it("should NOT call updateTag when service throws", async () => {
      mockCreateJournalEntry.mockRejectedValue(new Error("DB failure"));

      const result = await createJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      expect(mockUpdateTag).not.toHaveBeenCalled();
    });

    it("should NOT call updateTag on validation error", async () => {
      const result = await createJournalEntryAction({
        gameId: "",
      } as never);

      expect(result.success).toBe(false);
      expect(mockUpdateTag).not.toHaveBeenCalled();
    });
  });

  describe("Authentication Errors", () => {
    it("should return error when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await createJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("logged in");
      }

      expect(mockCreateJournalEntry).not.toHaveBeenCalled();
    });

    it("should not revalidate paths when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      await createJournalEntryAction(validInput);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("Validation Errors", () => {
    it("should return error for empty content", async () => {
      const result = await createJournalEntryAction({
        ...validInput,
        content: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input data");
      }

      expect(mockCreateJournalEntry).not.toHaveBeenCalled();
    });

    it("should return error for missing gameId", async () => {
      const result = await createJournalEntryAction({
        ...validInput,
        gameId: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input data");
      }

      expect(mockCreateJournalEntry).not.toHaveBeenCalled();
    });

    it("should return error for negative playSession", async () => {
      const result = await createJournalEntryAction({
        ...validInput,
        playSession: -1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input data");
      }

      expect(mockCreateJournalEntry).not.toHaveBeenCalled();
    });

    it("should return error for zero playSession", async () => {
      const result = await createJournalEntryAction({
        ...validInput,
        playSession: 0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input data");
      }

      expect(mockCreateJournalEntry).not.toHaveBeenCalled();
    });

    it("should return error for negative libraryItemId", async () => {
      const result = await createJournalEntryAction({
        ...validInput,
        libraryItemId: -1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input data");
      }

      expect(mockCreateJournalEntry).not.toHaveBeenCalled();
    });

    it("should not revalidate paths when validation fails", async () => {
      await createJournalEntryAction({
        ...validInput,
        content: "",
      });

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("Service Errors", () => {
    it("should return error when service throws on create", async () => {
      mockCreateJournalEntry.mockRejectedValue(
        new Error("Failed to create journal entry")
      );

      const result = await createJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to create journal entry");
      }
    });

    it("should not revalidate paths when service throws", async () => {
      mockCreateJournalEntry.mockRejectedValue(new Error("Database error"));

      await createJournalEntryAction(validInput);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("should return error when game does not exist", async () => {
      mockCreateJournalEntry.mockRejectedValue(
        new NotFoundError("Game not found")
      );

      const result = await createJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Game not found");
      }
    });
  });

  describe("Unexpected Errors", () => {
    it("should handle unexpected errors gracefully", async () => {
      mockCreateJournalEntry.mockRejectedValue(
        new Error("Database connection lost")
      );

      const result = await createJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection lost");
      }
    });

    it("should handle non-Error exceptions", async () => {
      mockCreateJournalEntry.mockRejectedValue("Unknown error");

      const result = await createJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("An unexpected error occurred");
      }
    });

    it("should not revalidate paths when unexpected error occurs", async () => {
      mockCreateJournalEntry.mockRejectedValue(new Error("Network error"));

      await createJournalEntryAction(validInput);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("Service Integration", () => {
    it("should instantiate JournalService correctly", async () => {
      mockCreateJournalEntry.mockResolvedValue(mockJournalEntryDomain);

      await createJournalEntryAction(validInput);

      expect(MockJournalService).toHaveBeenCalledTimes(1);
    });

    it("should call createJournalEntry with userId from authentication", async () => {
      mockCreateJournalEntry.mockResolvedValue(mockJournalEntryDomain);

      mockGetServerUserId.mockResolvedValue("custom-user-id");

      await createJournalEntryAction(validInput);

      expect(mockCreateJournalEntry).toHaveBeenCalledWith({
        userId: "custom-user-id",
        gameId: "game-123",
        title: "My First Entry",
        content: "This is my first journal entry about this game.",
      });
    });
  });
});
