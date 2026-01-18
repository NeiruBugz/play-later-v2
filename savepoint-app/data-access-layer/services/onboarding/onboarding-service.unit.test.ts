import { LibraryItemStatus } from "@/data-access-layer/domain/library";
import {
  countJournalEntriesByUserId,
  countLibraryItemsByUserId,
  getOnboardingStatus,
  hasLibraryItemWithStatus,
  updateOnboardingDismissed,
} from "@/data-access-layer/repository";
import {
  repositoryError,
  RepositoryErrorCode,
  repositorySuccess,
} from "@/data-access-layer/repository/types";

import { ServiceErrorCode } from "../types";
import { OnboardingService } from "./onboarding-service";

vi.mock("@/data-access-layer/repository", () => ({
  countLibraryItemsByUserId: vi.fn(),
  hasLibraryItemWithStatus: vi.fn(),
  countJournalEntriesByUserId: vi.fn(),
  getOnboardingStatus: vi.fn(),
  updateOnboardingDismissed: vi.fn(),
  isRepositorySuccess: <TData>(result: {
    success: boolean;
  }): result is { success: true; data: TData } => result.success === true,
}));

describe("OnboardingService", () => {
  let service: OnboardingService;
  let mockGetOnboardingStatus: ReturnType<typeof vi.fn>;
  let mockCountLibraryItems: ReturnType<typeof vi.fn>;
  let mockHasPlayingItem: ReturnType<typeof vi.fn>;
  let mockCountJournalEntries: ReturnType<typeof vi.fn>;
  let mockUpdateOnboardingDismissed: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
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
        mockGetOnboardingStatus.mockResolvedValue(
          repositorySuccess({
            profileSetupCompletedAt: null,
            onboardingDismissedAt: null,
          })
        );
        mockCountLibraryItems.mockResolvedValue(repositorySuccess(0));
        mockHasPlayingItem.mockResolvedValue(repositorySuccess(false));
        mockCountJournalEntries.mockResolvedValue(repositorySuccess(0));

        const result = await service.getProgress({ userId });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.completedCount).toBe(1);
          expect(result.data.totalCount).toBe(5);
          expect(result.data.isDismissed).toBe(false);
          expect(result.data.isComplete).toBe(false);

          const stepMap = Object.fromEntries(
            result.data.steps.map((s) => [s.id, s.isComplete])
          );
          expect(stepMap["create-account"]).toBe(true);
          expect(stepMap["setup-profile"]).toBe(false);
          expect(stepMap["add-first-game"]).toBe(false);
          expect(stepMap["start-playing"]).toBe(false);
          expect(stepMap["write-journal"]).toBe(false);
        }

        expect(mockGetOnboardingStatus).toHaveBeenCalledWith(userId);
        expect(mockCountLibraryItems).toHaveBeenCalledWith(userId);
        expect(mockHasPlayingItem).toHaveBeenCalledWith(
          userId,
          LibraryItemStatus.PLAYING
        );
        expect(mockCountJournalEntries).toHaveBeenCalledWith(userId);
      });

      it("should return progress with some steps complete", async () => {
        mockGetOnboardingStatus.mockResolvedValue(
          repositorySuccess({
            profileSetupCompletedAt: new Date(),
            onboardingDismissedAt: null,
          })
        );
        mockCountLibraryItems.mockResolvedValue(repositorySuccess(3));
        mockHasPlayingItem.mockResolvedValue(repositorySuccess(false));
        mockCountJournalEntries.mockResolvedValue(repositorySuccess(0));

        const result = await service.getProgress({ userId });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.completedCount).toBe(3);
          expect(result.data.totalCount).toBe(5);
          expect(result.data.isComplete).toBe(false);

          const stepMap = Object.fromEntries(
            result.data.steps.map((s) => [s.id, s.isComplete])
          );
          expect(stepMap["create-account"]).toBe(true);
          expect(stepMap["setup-profile"]).toBe(true);
          expect(stepMap["add-first-game"]).toBe(true);
          expect(stepMap["start-playing"]).toBe(false);
          expect(stepMap["write-journal"]).toBe(false);
        }
      });

      it("should return progress with all steps complete", async () => {
        mockGetOnboardingStatus.mockResolvedValue(
          repositorySuccess({
            profileSetupCompletedAt: new Date(),
            onboardingDismissedAt: null,
          })
        );
        mockCountLibraryItems.mockResolvedValue(repositorySuccess(5));
        mockHasPlayingItem.mockResolvedValue(repositorySuccess(true));
        mockCountJournalEntries.mockResolvedValue(repositorySuccess(2));

        const result = await service.getProgress({ userId });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.completedCount).toBe(5);
          expect(result.data.totalCount).toBe(5);
          expect(result.data.isComplete).toBe(true);
          expect(result.data.isDismissed).toBe(true);

          const allComplete = result.data.steps.every((s) => s.isComplete);
          expect(allComplete).toBe(true);
        }
      });

      it("should return isDismissed true when user has dismissed", async () => {
        mockGetOnboardingStatus.mockResolvedValue(
          repositorySuccess({
            profileSetupCompletedAt: null,
            onboardingDismissedAt: new Date(),
          })
        );
        mockCountLibraryItems.mockResolvedValue(repositorySuccess(0));
        mockHasPlayingItem.mockResolvedValue(repositorySuccess(false));
        mockCountJournalEntries.mockResolvedValue(repositorySuccess(0));

        const result = await service.getProgress({ userId });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.isDismissed).toBe(true);
          expect(result.data.isComplete).toBe(false);
        }
      });

      it("should include step metadata with action URLs and labels", async () => {
        mockGetOnboardingStatus.mockResolvedValue(
          repositorySuccess({
            profileSetupCompletedAt: null,
            onboardingDismissedAt: null,
          })
        );
        mockCountLibraryItems.mockResolvedValue(repositorySuccess(0));
        mockHasPlayingItem.mockResolvedValue(repositorySuccess(false));
        mockCountJournalEntries.mockResolvedValue(repositorySuccess(0));

        const result = await service.getProgress({ userId });

        expect(result.success).toBe(true);
        if (result.success) {
          const setupProfile = result.data.steps.find(
            (s) => s.id === "setup-profile"
          );
          expect(setupProfile?.actionUrl).toBe("/profile/settings");
          expect(setupProfile?.actionLabel).toBe("Edit profile");

          const addGame = result.data.steps.find(
            (s) => s.id === "add-first-game"
          );
          expect(addGame?.actionUrl).toBe("/games/search");
          expect(addGame?.actionLabel).toBe("Browse games");

          const createAccount = result.data.steps.find(
            (s) => s.id === "create-account"
          );
          expect(createAccount?.actionUrl).toBeNull();
          expect(createAccount?.actionLabel).toBeNull();
        }
      });
    });

    describe("error scenarios", () => {
      it("should return NOT_FOUND when user does not exist", async () => {
        mockGetOnboardingStatus.mockResolvedValue(repositorySuccess(null));

        const result = await service.getProgress({ userId });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("User not found");
          expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
        }
      });

      it("should return error when getOnboardingStatus fails", async () => {
        mockGetOnboardingStatus.mockResolvedValue(
          repositoryError(
            RepositoryErrorCode.DATABASE_ERROR,
            "Database connection failed"
          )
        );

        const result = await service.getProgress({ userId });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Failed to get onboarding status");
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });

      it("should return error when countLibraryItems fails", async () => {
        mockGetOnboardingStatus.mockResolvedValue(
          repositorySuccess({
            profileSetupCompletedAt: null,
            onboardingDismissedAt: null,
          })
        );
        mockCountLibraryItems.mockResolvedValue(
          repositoryError(
            RepositoryErrorCode.DATABASE_ERROR,
            "Failed to count library items"
          )
        );
        mockHasPlayingItem.mockResolvedValue(repositorySuccess(false));
        mockCountJournalEntries.mockResolvedValue(repositorySuccess(0));

        const result = await service.getProgress({ userId });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Failed to get onboarding progress");
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });

      it("should return error when hasLibraryItemWithStatus fails", async () => {
        mockGetOnboardingStatus.mockResolvedValue(
          repositorySuccess({
            profileSetupCompletedAt: null,
            onboardingDismissedAt: null,
          })
        );
        mockCountLibraryItems.mockResolvedValue(repositorySuccess(1));
        mockHasPlayingItem.mockResolvedValue(
          repositoryError(
            RepositoryErrorCode.DATABASE_ERROR,
            "Failed to check playing status"
          )
        );
        mockCountJournalEntries.mockResolvedValue(repositorySuccess(0));

        const result = await service.getProgress({ userId });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Failed to get onboarding progress");
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });

      it("should return error when countJournalEntries fails", async () => {
        mockGetOnboardingStatus.mockResolvedValue(
          repositorySuccess({
            profileSetupCompletedAt: null,
            onboardingDismissedAt: null,
          })
        );
        mockCountLibraryItems.mockResolvedValue(repositorySuccess(1));
        mockHasPlayingItem.mockResolvedValue(repositorySuccess(true));
        mockCountJournalEntries.mockResolvedValue(
          repositoryError(
            RepositoryErrorCode.DATABASE_ERROR,
            "Failed to count journal entries"
          )
        );

        const result = await service.getProgress({ userId });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Failed to get onboarding progress");
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });
    });
  });

  describe("dismiss", () => {
    const userId = "user-123";

    describe("success scenarios", () => {
      it("should dismiss onboarding successfully", async () => {
        mockUpdateOnboardingDismissed.mockResolvedValue(
          repositorySuccess(undefined)
        );

        const result = await service.dismiss({ userId });

        expect(result.success).toBe(true);
        expect(mockUpdateOnboardingDismissed).toHaveBeenCalledWith(userId);
      });
    });

    describe("error scenarios", () => {
      it("should return error when updateOnboardingDismissed fails", async () => {
        mockUpdateOnboardingDismissed.mockResolvedValue(
          repositoryError(
            RepositoryErrorCode.DATABASE_ERROR,
            "Database connection failed"
          )
        );

        const result = await service.dismiss({ userId });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Failed to dismiss onboarding");
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });

      it("should return error when user not found", async () => {
        mockUpdateOnboardingDismissed.mockResolvedValue(
          repositoryError(RepositoryErrorCode.NOT_FOUND, "User not found")
        );

        const result = await service.dismiss({ userId: "nonexistent" });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Failed to dismiss onboarding");
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });
    });
  });
});
