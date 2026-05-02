import { getServerUserId } from "@/auth";
import { JournalService } from "@/data-access-layer/services";
import { revalidatePath, updateTag } from "next/cache";

import type { JournalEntryDomain } from "@/features/journal/types";
import { userTags } from "@/shared/lib";
import { NotFoundError } from "@/shared/lib/errors";
import { JournalMood, JournalVisibility } from "@/shared/types/journal";

import { updateJournalEntryAction } from "./update-journal-entry";

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

describe("updateJournalEntryAction server action", () => {
  let mockUpdateJournalEntry: ReturnType<typeof vi.fn>;

  const validInput = {
    entryId: "entry-456",
    title: "Updated Title",
    content: "Updated content for the journal entry.",
  };

  const mockJournalEntryDomain: JournalEntryDomain = {
    id: "entry-456",
    userId: "user-789",
    gameId: "game-123",
    kind: "REFLECTION",
    title: "Updated Title",
    content: "Updated content for the journal entry.",
    playedMinutes: null,
    tags: [],
    mood: null,
    playSession: null,
    libraryItemId: null,
    visibility: JournalVisibility.PRIVATE,
    createdAt: new Date("2024-01-01T10:00:00Z"),
    updatedAt: new Date("2024-01-02T11:00:00Z"),
    publishedAt: null,
  };

  beforeEach(() => {
    vi.resetAllMocks();

    mockUpdateJournalEntry = vi.fn();
    MockJournalService.mockImplementation(function () {
      return {
        updateJournalEntry: mockUpdateJournalEntry,
      } as any;
    });

    mockGetServerUserId.mockResolvedValue("user-789");
  });

  describe("Success Path", () => {
    it("should successfully update journal entry when service succeeds", async () => {
      mockUpdateJournalEntry.mockResolvedValue(mockJournalEntryDomain);

      const result = await updateJournalEntryAction(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockJournalEntryDomain);
      }

      expect(mockUpdateJournalEntry).toHaveBeenCalledWith({
        userId: "user-789",
        entryId: "entry-456",
        updates: {
          title: "Updated Title",
          content: "Updated content for the journal entry.",
        },
      });
    });

    it("should successfully update journal entry with optional fields", async () => {
      const inputWithOptionalFields = {
        entryId: "entry-456",
        title: "New Title",
        content: "New content",
        mood: JournalMood.RELAXED,
        playSession: 10,
        libraryItemId: 999,
      };

      const entryWithOptionalFields: JournalEntryDomain = {
        ...mockJournalEntryDomain,
        title: "New Title",
        content: "New content",
        mood: JournalMood.RELAXED,
        playSession: 10,
        libraryItemId: 999,
      };

      mockUpdateJournalEntry.mockResolvedValue(entryWithOptionalFields);

      const result = await updateJournalEntryAction(inputWithOptionalFields);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(entryWithOptionalFields);
      }

      expect(mockUpdateJournalEntry).toHaveBeenCalledWith({
        userId: "user-789",
        entryId: "entry-456",
        updates: {
          title: "New Title",
          content: "New content",
          mood: "RELAXED",
          playSession: 10,
          libraryItemId: 999,
        },
      });
    });

    it("should successfully update journal entry with only title", async () => {
      const inputTitleOnly = {
        entryId: "entry-456",
        title: "Only Title Updated",
      };

      const entryWithTitleUpdated: JournalEntryDomain = {
        ...mockJournalEntryDomain,
        title: "Only Title Updated",
      };

      mockUpdateJournalEntry.mockResolvedValue(entryWithTitleUpdated);

      const result = await updateJournalEntryAction(inputTitleOnly);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Only Title Updated");
      }

      expect(mockUpdateJournalEntry).toHaveBeenCalledWith({
        userId: "user-789",
        entryId: "entry-456",
        updates: {
          title: "Only Title Updated",
        },
      });
    });

    it("should successfully update journal entry with only content", async () => {
      const inputContentOnly = {
        entryId: "entry-456",
        content: "Only content updated here.",
      };

      const entryWithContentUpdated: JournalEntryDomain = {
        ...mockJournalEntryDomain,
        content: "Only content updated here.",
      };

      mockUpdateJournalEntry.mockResolvedValue(entryWithContentUpdated);

      const result = await updateJournalEntryAction(inputContentOnly);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe("Only content updated here.");
      }

      expect(mockUpdateJournalEntry).toHaveBeenCalledWith({
        userId: "user-789",
        entryId: "entry-456",
        updates: {
          content: "Only content updated here.",
        },
      });
    });

    it("should successfully set optional fields to null", async () => {
      const inputWithNulls = {
        entryId: "entry-456",
        title: "Updated",
        mood: null,
        playSession: null,
        libraryItemId: null,
      };

      const entryWithNulls: JournalEntryDomain = {
        ...mockJournalEntryDomain,
        title: "Updated",
        mood: null,
        playSession: null,
        libraryItemId: null,
      };

      mockUpdateJournalEntry.mockResolvedValue(entryWithNulls);

      const result = await updateJournalEntryAction(inputWithNulls);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mood).toBeNull();
        expect(result.data.playSession).toBeNull();
        expect(result.data.libraryItemId).toBeNull();
      }
    });

    it("should revalidate journal detail page after successful update", async () => {
      mockUpdateJournalEntry.mockResolvedValue(mockJournalEntryDomain);

      await updateJournalEntryAction(validInput);

      expect(mockRevalidatePath).toHaveBeenCalledWith("/journal/[id]", "page");
    });

    it("should revalidate journal list page after successful update", async () => {
      mockUpdateJournalEntry.mockResolvedValue(mockJournalEntryDomain);

      await updateJournalEntryAction(validInput);

      expect(mockRevalidatePath).toHaveBeenCalledWith("/journal");
    });

    it("should revalidate game detail pages after successful update", async () => {
      mockUpdateJournalEntry.mockResolvedValue(mockJournalEntryDomain);

      await updateJournalEntryAction(validInput);

      expect(mockRevalidatePath).toHaveBeenCalledWith("/games/[slug]", "page");
    });

    it("should call revalidatePath exactly three times on success", async () => {
      mockUpdateJournalEntry.mockResolvedValue(mockJournalEntryDomain);

      await updateJournalEntryAction(validInput);

      expect(mockRevalidatePath).toHaveBeenCalledTimes(3);
    });
  });

  describe("Authentication Errors", () => {
    it("should return error when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await updateJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("logged in");
      }

      expect(mockUpdateJournalEntry).not.toHaveBeenCalled();
    });

    it("should not revalidate paths when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      await updateJournalEntryAction(validInput);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("Validation Errors", () => {
    it("should return error for missing entryId", async () => {
      const result = await updateJournalEntryAction({
        entryId: "",
        title: "Valid Title",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input data");
      }

      expect(mockUpdateJournalEntry).not.toHaveBeenCalled();
    });

    it("should return error for empty content when provided", async () => {
      const result = await updateJournalEntryAction({
        entryId: "entry-456",
        content: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input data");
      }

      expect(mockUpdateJournalEntry).not.toHaveBeenCalled();
    });

    it("should return error for negative playSession", async () => {
      const result = await updateJournalEntryAction({
        entryId: "entry-456",
        title: "Valid",
        playSession: -1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input data");
      }

      expect(mockUpdateJournalEntry).not.toHaveBeenCalled();
    });

    it("should return error for zero playSession", async () => {
      const result = await updateJournalEntryAction({
        entryId: "entry-456",
        title: "Valid",
        playSession: 0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input data");
      }

      expect(mockUpdateJournalEntry).not.toHaveBeenCalled();
    });

    it("should return error for negative libraryItemId", async () => {
      const result = await updateJournalEntryAction({
        entryId: "entry-456",
        title: "Valid",
        libraryItemId: -1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input data");
      }

      expect(mockUpdateJournalEntry).not.toHaveBeenCalled();
    });

    it("should not revalidate paths when validation fails", async () => {
      await updateJournalEntryAction({
        entryId: "",
        title: "Valid Title",
      });

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("Service Errors", () => {
    it("should return error when journal entry is not found", async () => {
      mockUpdateJournalEntry.mockRejectedValue(
        new NotFoundError("Journal entry not found")
      );

      const result = await updateJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Journal entry not found");
      }
    });

    it("should return error when user does not own the journal entry", async () => {
      mockUpdateJournalEntry.mockRejectedValue(
        new NotFoundError("Journal entry not found")
      );

      const result = await updateJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Journal entry not found");
      }
    });

    it("should return error when service throws on update", async () => {
      mockUpdateJournalEntry.mockRejectedValue(
        new Error("Failed to update journal entry")
      );

      const result = await updateJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to update journal entry");
      }
    });

    it("should not revalidate paths when service throws", async () => {
      mockUpdateJournalEntry.mockRejectedValue(new Error("Database error"));

      await updateJournalEntryAction(validInput);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("Unexpected Errors", () => {
    it("should handle unexpected errors gracefully", async () => {
      mockUpdateJournalEntry.mockRejectedValue(
        new Error("Database connection lost")
      );

      const result = await updateJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection lost");
      }
    });

    it("should handle non-Error exceptions", async () => {
      mockUpdateJournalEntry.mockRejectedValue("Unknown error");

      const result = await updateJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("An unexpected error occurred");
      }
    });

    it("should not revalidate paths when unexpected error occurs", async () => {
      mockUpdateJournalEntry.mockRejectedValue(new Error("Network error"));

      await updateJournalEntryAction(validInput);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("Service Integration", () => {
    it("should instantiate JournalService correctly", async () => {
      mockUpdateJournalEntry.mockResolvedValue(mockJournalEntryDomain);

      await updateJournalEntryAction(validInput);

      expect(MockJournalService).toHaveBeenCalledTimes(1);
    });

    it("should call updateJournalEntry with userId from authentication", async () => {
      mockUpdateJournalEntry.mockResolvedValue(mockJournalEntryDomain);

      mockGetServerUserId.mockResolvedValue("custom-user-id");

      await updateJournalEntryAction(validInput);

      expect(mockUpdateJournalEntry).toHaveBeenCalledWith({
        userId: "custom-user-id",
        entryId: "entry-456",
        updates: {
          title: "Updated Title",
          content: "Updated content for the journal entry.",
        },
      });
    });

    it("should pass only provided fields to service", async () => {
      mockUpdateJournalEntry.mockResolvedValue(mockJournalEntryDomain);

      const partialInput = {
        entryId: "entry-456",
        mood: JournalMood.EXCITED,
      };

      await updateJournalEntryAction(partialInput);

      expect(mockUpdateJournalEntry).toHaveBeenCalledWith({
        userId: "user-789",
        entryId: "entry-456",
        updates: {
          mood: "EXCITED",
        },
      });
    });
  });

  describe("updateTag wiring", () => {
    it("should call updateTag with profileStats on success", async () => {
      mockUpdateJournalEntry.mockResolvedValue(mockJournalEntryDomain);

      await updateJournalEntryAction(validInput);

      expect(mockUpdateTag).toHaveBeenCalledWith(
        userTags("user-789").profileStats
      );
    });

    it("should NOT call updateTag when service throws", async () => {
      mockUpdateJournalEntry.mockRejectedValue(
        new NotFoundError("Entry not found", { entryId: "entry-456" })
      );

      const result = await updateJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      expect(mockUpdateTag).not.toHaveBeenCalled();
    });

    it("should NOT call updateTag when unauthenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      await updateJournalEntryAction(validInput);

      expect(mockUpdateTag).not.toHaveBeenCalled();
    });

    it("should NOT call updateTag on validation error", async () => {
      await updateJournalEntryAction({ entryId: "", title: "Valid" });

      expect(mockUpdateTag).not.toHaveBeenCalled();
    });
  });
});
