import { getServerUserId } from "@/auth";
import { JournalService } from "@/data-access-layer/services";
import { revalidatePath, revalidateTag } from "next/cache";

import { NotFoundError } from "@/shared/lib/errors";

import { deleteJournalEntryAction } from "./delete-journal-entry";

vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

vi.mock("@/data-access-layer/services", () => ({
  JournalService: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.unmock("@/shared/lib");

const mockGetServerUserId = vi.mocked(getServerUserId);
const mockRevalidatePath = vi.mocked(revalidatePath);
const mockRevalidateTag = vi.mocked(revalidateTag);
const MockJournalService = vi.mocked(JournalService);

describe("deleteJournalEntryAction server action", () => {
  let mockDeleteJournalEntry: ReturnType<typeof vi.fn>;

  const validInput = {
    entryId: "entry-456",
  };

  beforeEach(() => {
    vi.resetAllMocks();

    mockDeleteJournalEntry = vi.fn();
    MockJournalService.mockImplementation(function () {
      return {
        deleteJournalEntry: mockDeleteJournalEntry,
      } as any;
    });

    mockGetServerUserId.mockResolvedValue("user-789");
  });

  describe("Success Path", () => {
    it("should successfully delete journal entry when service succeeds", async () => {
      mockDeleteJournalEntry.mockResolvedValue(undefined);

      const result = await deleteJournalEntryAction(validInput);

      expect(result.success).toBe(true);

      expect(mockDeleteJournalEntry).toHaveBeenCalledWith({
        userId: "user-789",
        entryId: "entry-456",
      });
    });

    it("should revalidate journal page after successful deletion", async () => {
      mockDeleteJournalEntry.mockResolvedValue(undefined);

      await deleteJournalEntryAction(validInput);

      expect(mockRevalidatePath).toHaveBeenCalledWith("/journal");
    });

    it("should revalidate game detail pages after successful deletion", async () => {
      mockDeleteJournalEntry.mockResolvedValue(undefined);

      await deleteJournalEntryAction(validInput);

      expect(mockRevalidatePath).toHaveBeenCalledWith("/games/[slug]", "page");
    });

    it("should call revalidatePath exactly twice on success", async () => {
      mockDeleteJournalEntry.mockResolvedValue(undefined);

      await deleteJournalEntryAction(validInput);

      expect(mockRevalidatePath).toHaveBeenCalledTimes(2);
    });
  });

  describe("Authentication Errors", () => {
    it("should return error when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await deleteJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("logged in");
      }

      expect(mockDeleteJournalEntry).not.toHaveBeenCalled();
    });

    it("should not revalidate paths when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      await deleteJournalEntryAction(validInput);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("Validation Errors", () => {
    it("should return error for empty entryId", async () => {
      const result = await deleteJournalEntryAction({
        entryId: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input data");
      }

      expect(mockDeleteJournalEntry).not.toHaveBeenCalled();
    });

    it("should not call service when validation fails", async () => {
      await deleteJournalEntryAction({
        entryId: "",
      });

      expect(mockDeleteJournalEntry).not.toHaveBeenCalled();
    });

    it("should not revalidate paths when validation fails", async () => {
      await deleteJournalEntryAction({
        entryId: "",
      });

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("Service Errors", () => {
    it("should return error when journal entry is not found", async () => {
      mockDeleteJournalEntry.mockRejectedValue(
        new NotFoundError("Journal entry not found")
      );

      const result = await deleteJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Journal entry not found");
      }
    });

    it("should return error when user does not own the journal entry", async () => {
      mockDeleteJournalEntry.mockRejectedValue(
        new NotFoundError("Journal entry not found")
      );

      const result = await deleteJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Journal entry not found");
      }
    });

    it("should return error when service throws on delete", async () => {
      mockDeleteJournalEntry.mockRejectedValue(
        new Error("Failed to delete journal entry")
      );

      const result = await deleteJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to delete journal entry");
      }
    });

    it("should not revalidate paths when service throws", async () => {
      mockDeleteJournalEntry.mockRejectedValue(new Error("Database error"));

      await deleteJournalEntryAction(validInput);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("Unexpected Errors", () => {
    it("should handle unexpected errors gracefully", async () => {
      mockDeleteJournalEntry.mockRejectedValue(
        new Error("Database connection lost")
      );

      const result = await deleteJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection lost");
      }
    });

    it("should handle non-Error exceptions", async () => {
      mockDeleteJournalEntry.mockRejectedValue("Unknown error");

      const result = await deleteJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("An unexpected error occurred");
      }
    });

    it("should not revalidate paths when unexpected error occurs", async () => {
      mockDeleteJournalEntry.mockRejectedValue(new Error("Network error"));

      await deleteJournalEntryAction(validInput);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("Service Integration", () => {
    it("should instantiate JournalService correctly", async () => {
      mockDeleteJournalEntry.mockResolvedValue(undefined);

      await deleteJournalEntryAction(validInput);

      expect(MockJournalService).toHaveBeenCalledTimes(1);
    });

    it("should call deleteJournalEntry with userId from authentication", async () => {
      mockDeleteJournalEntry.mockResolvedValue(undefined);

      mockGetServerUserId.mockResolvedValue("custom-user-id");

      await deleteJournalEntryAction(validInput);

      expect(mockDeleteJournalEntry).toHaveBeenCalledWith({
        userId: "custom-user-id",
        entryId: "entry-456",
      });
    });

    it("should pass correct entryId to service", async () => {
      mockDeleteJournalEntry.mockResolvedValue(undefined);

      const customInput = {
        entryId: "entry-custom-999",
      };

      await deleteJournalEntryAction(customInput);

      expect(mockDeleteJournalEntry).toHaveBeenCalledWith({
        userId: "user-789",
        entryId: "entry-custom-999",
      });
    });
  });

  describe("revalidateTag wiring", () => {
    it("should call revalidateTag with profileStats on success", async () => {
      mockDeleteJournalEntry.mockResolvedValue(undefined);

      await deleteJournalEntryAction(validInput);

      expect(mockRevalidateTag).toHaveBeenCalledWith(
        "user:user-789:profile-stats",
        "max"
      );
    });

    it("should NOT call revalidateTag when service throws", async () => {
      mockDeleteJournalEntry.mockRejectedValue(
        new NotFoundError("Entry not found", { entryId: "entry-456" })
      );

      const result = await deleteJournalEntryAction(validInput);

      expect(result.success).toBe(false);
      expect(mockRevalidateTag).not.toHaveBeenCalled();
    });
  });
});
