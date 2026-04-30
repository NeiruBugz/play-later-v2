import {
  countJournalEntriesByUserId,
  countLibraryItemsByUserId,
  getOnboardingStatus,
  hasLibraryItemWithStatus,
  updateOnboardingDismissed,
} from "@/data-access-layer/repository";
import { LibraryItemStatus } from "@prisma/client";

import { NotFoundError } from "@/shared/lib/errors";

import { OnboardingService } from "./onboarding-service";

vi.mock("@/data-access-layer/repository", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/data-access-layer/repository")>();
  return {
    ...actual,
    countLibraryItemsByUserId: vi.fn(),
    hasLibraryItemWithStatus: vi.fn(),
    countJournalEntriesByUserId: vi.fn(),
    getOnboardingStatus: vi.fn(),
    updateOnboardingDismissed: vi.fn(),
  };
});

describe("OnboardingService", () => {
  let service: OnboardingService;
  let mockGetOnboardingStatus: ReturnType<typeof vi.fn>;
  let mockCountLibraryItems: ReturnType<typeof vi.fn>;
  let mockHasPlayingItem: ReturnType<typeof vi.fn>;
  let mockCountJournalEntries: ReturnType<typeof vi.fn>;
  let mockUpdateOnboardingDismissed: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new OnboardingService();
    mockGetOnboardingStatus = vi.mocked(getOnboardingStatus);
    mockCountLibraryItems = vi.mocked(countLibraryItemsByUserId);
    mockHasPlayingItem = vi.mocked(hasLibraryItemWithStatus);
    mockCountJournalEntries = vi.mocked(countJournalEntriesByUserId);
    mockUpdateOnboardingDismissed = vi.mocked(updateOnboardingDismissed);
  });

  describe("getProgress", () => {
    const userId = "user-123";

    describe("success scenarios", () => {
      it("should return progress with all steps incomplete for new user", async () => {
        mockGetOnboardingStatus.mockResolvedValue({
          profileSetupCompletedAt: null,
          onboardingDismissedAt: null,
        });
        mockCountLibraryItems.mockResolvedValue(0);
        mockHasPlayingItem.mockResolvedValue(false);
        mockCountJournalEntries.mockResolvedValue(0);

        const progress = await service.getProgress({ userId });

        expect(progress.completedCount).toBe(1);
        expect(progress.totalCount).toBe(5);
        expect(progress.isDismissed).toBe(false);
        expect(progress.isComplete).toBe(false);

        const stepMap = Object.fromEntries(
          progress.steps.map((s) => [s.id, s.isComplete])
        );
        expect(stepMap["create-account"]).toBe(true);
        expect(stepMap["setup-profile"]).toBe(false);
        expect(stepMap["add-first-game"]).toBe(false);
        expect(stepMap["start-playing"]).toBe(false);
        expect(stepMap["write-journal"]).toBe(false);

        expect(mockGetOnboardingStatus).toHaveBeenCalledWith(userId);
        expect(mockCountLibraryItems).toHaveBeenCalledWith(userId);
        expect(mockHasPlayingItem).toHaveBeenCalledWith(
          userId,
          LibraryItemStatus.PLAYING
        );
        expect(mockCountJournalEntries).toHaveBeenCalledWith(userId);
      });

      it("should return progress with some steps complete", async () => {
        mockGetOnboardingStatus.mockResolvedValue({
          profileSetupCompletedAt: new Date(),
          onboardingDismissedAt: null,
        });
        mockCountLibraryItems.mockResolvedValue(3);
        mockHasPlayingItem.mockResolvedValue(false);
        mockCountJournalEntries.mockResolvedValue(0);

        const progress = await service.getProgress({ userId });

        expect(progress.completedCount).toBe(3);
        expect(progress.totalCount).toBe(5);
        expect(progress.isComplete).toBe(false);

        const stepMap = Object.fromEntries(
          progress.steps.map((s) => [s.id, s.isComplete])
        );
        expect(stepMap["create-account"]).toBe(true);
        expect(stepMap["setup-profile"]).toBe(true);
        expect(stepMap["add-first-game"]).toBe(true);
        expect(stepMap["start-playing"]).toBe(false);
        expect(stepMap["write-journal"]).toBe(false);
      });

      it("should return progress with all steps complete", async () => {
        mockGetOnboardingStatus.mockResolvedValue({
          profileSetupCompletedAt: new Date(),
          onboardingDismissedAt: null,
        });
        mockCountLibraryItems.mockResolvedValue(5);
        mockHasPlayingItem.mockResolvedValue(true);
        mockCountJournalEntries.mockResolvedValue(2);

        const progress = await service.getProgress({ userId });

        expect(progress.completedCount).toBe(5);
        expect(progress.totalCount).toBe(5);
        expect(progress.isComplete).toBe(true);
        expect(progress.isDismissed).toBe(true);

        const allComplete = progress.steps.every((s) => s.isComplete);
        expect(allComplete).toBe(true);
      });

      it("should return isDismissed true when user has explicitly dismissed", async () => {
        mockGetOnboardingStatus.mockResolvedValue({
          profileSetupCompletedAt: null,
          onboardingDismissedAt: new Date(),
        });
        mockCountLibraryItems.mockResolvedValue(0);
        mockHasPlayingItem.mockResolvedValue(false);
        mockCountJournalEntries.mockResolvedValue(0);

        const progress = await service.getProgress({ userId });

        expect(progress.isDismissed).toBe(true);
        expect(progress.isComplete).toBe(false);
      });

      it("should include step metadata with action URLs and labels", async () => {
        mockGetOnboardingStatus.mockResolvedValue({
          profileSetupCompletedAt: null,
          onboardingDismissedAt: null,
        });
        mockCountLibraryItems.mockResolvedValue(0);
        mockHasPlayingItem.mockResolvedValue(false);
        mockCountJournalEntries.mockResolvedValue(0);

        const progress = await service.getProgress({ userId });

        const setupProfile = progress.steps.find(
          (s) => s.id === "setup-profile"
        );
        expect(setupProfile?.actionUrl).toBe("/settings/profile");
        expect(setupProfile?.actionLabel).toBe("Edit profile");

        const addGame = progress.steps.find((s) => s.id === "add-first-game");
        expect(addGame?.actionUrl).toBe("/games/search");
        expect(addGame?.actionLabel).toBe("Browse games");

        const createAccount = progress.steps.find(
          (s) => s.id === "create-account"
        );
        expect(createAccount?.actionUrl).toBeNull();
        expect(createAccount?.actionLabel).toBeNull();
      });
    });

    describe("error scenarios", () => {
      it("should throw NotFoundError when user does not exist", async () => {
        mockGetOnboardingStatus.mockResolvedValue(null);

        await expect(service.getProgress({ userId })).rejects.toThrow(
          NotFoundError
        );
      });

      it("should throw NotFoundError with userId context when user not found", async () => {
        mockGetOnboardingStatus.mockResolvedValue(null);

        await expect(service.getProgress({ userId })).rejects.toThrow(
          "User not found"
        );
      });

      it("should propagate error when getOnboardingStatus rejects", async () => {
        const dbError = new Error("Database connection failed");
        mockGetOnboardingStatus.mockRejectedValue(dbError);

        await expect(service.getProgress({ userId })).rejects.toThrow(
          "Database connection failed"
        );
      });

      it("should propagate error when countLibraryItems rejects", async () => {
        mockGetOnboardingStatus.mockResolvedValue({
          profileSetupCompletedAt: null,
          onboardingDismissedAt: null,
        });
        mockCountLibraryItems.mockRejectedValue(
          new Error("Failed to count library items")
        );
        mockHasPlayingItem.mockResolvedValue(false);
        mockCountJournalEntries.mockResolvedValue(0);

        await expect(service.getProgress({ userId })).rejects.toThrow(
          "Failed to count library items"
        );
      });

      it("should propagate error when hasLibraryItemWithStatus rejects", async () => {
        mockGetOnboardingStatus.mockResolvedValue({
          profileSetupCompletedAt: null,
          onboardingDismissedAt: null,
        });
        mockCountLibraryItems.mockResolvedValue(1);
        mockHasPlayingItem.mockRejectedValue(
          new Error("Failed to check playing status")
        );
        mockCountJournalEntries.mockResolvedValue(0);

        await expect(service.getProgress({ userId })).rejects.toThrow(
          "Failed to check playing status"
        );
      });

      it("should propagate error when countJournalEntries rejects", async () => {
        mockGetOnboardingStatus.mockResolvedValue({
          profileSetupCompletedAt: null,
          onboardingDismissedAt: null,
        });
        mockCountLibraryItems.mockResolvedValue(1);
        mockHasPlayingItem.mockResolvedValue(true);
        mockCountJournalEntries.mockRejectedValue(
          new Error("Failed to count journal entries")
        );

        await expect(service.getProgress({ userId })).rejects.toThrow(
          "Failed to count journal entries"
        );
      });
    });
  });

  describe("dismiss", () => {
    const userId = "user-123";

    describe("success scenarios", () => {
      it("should dismiss onboarding successfully and return void", async () => {
        mockUpdateOnboardingDismissed.mockResolvedValue(undefined);

        const result = await service.dismiss({ userId });

        expect(result).toBeUndefined();
        expect(mockUpdateOnboardingDismissed).toHaveBeenCalledWith(userId);
      });
    });

    describe("error scenarios", () => {
      it("should propagate error when updateOnboardingDismissed rejects", async () => {
        mockUpdateOnboardingDismissed.mockRejectedValue(
          new Error("Database connection failed")
        );

        await expect(service.dismiss({ userId })).rejects.toThrow(
          "Database connection failed"
        );
      });

      it("should propagate NotFoundError when user not found during dismiss", async () => {
        mockUpdateOnboardingDismissed.mockRejectedValue(
          new NotFoundError("User not found")
        );

        await expect(
          service.dismiss({ userId: "nonexistent" })
        ).rejects.toThrow(NotFoundError);
      });
    });
  });
});
