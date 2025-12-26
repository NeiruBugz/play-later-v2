import "server-only";

import { LibraryItemStatus } from "@/data-access-layer/domain/library";
import {
  countJournalEntriesByUserId,
  countLibraryItemsByUserId,
  getOnboardingStatus,
  hasLibraryItemWithStatus,
  isRepositorySuccess,
  updateOnboardingDismissed,
} from "@/data-access-layer/repository";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { BaseService, ServiceErrorCode } from "../types";
import type {
  DismissOnboardingInput,
  DismissOnboardingResult,
  GetOnboardingProgressInput,
  GetOnboardingProgressResult,
  OnboardingProgress,
  OnboardingStep,
} from "./types";

const logger = createLogger({
  [LOGGER_CONTEXT.SERVICE]: "OnboardingService",
});

const ONBOARDING_STEPS = [
  {
    id: "create-account",
    title: "Create your account",
    description: "Welcome to SavePoint!",
    actionUrl: null,
    actionLabel: null,
  },
  {
    id: "setup-profile",
    title: "Set up your profile",
    description: "Add a username and profile picture",
    actionUrl: "/profile/settings",
    actionLabel: "Edit profile",
  },
  {
    id: "add-first-game",
    title: "Add your first game",
    description: "Search for games and add them to your library",
    actionUrl: "/games/search",
    actionLabel: "Browse games",
  },
  {
    id: "start-playing",
    title: "Start playing a game",
    description: "Change a game's status to Playing",
    actionUrl: "/library",
    actionLabel: "View library",
  },
  {
    id: "write-journal",
    title: "Write a journal entry",
    description: "Record your gaming thoughts and memories",
    actionUrl: "/journal",
    actionLabel: "Write entry",
  },
] as const;

export class OnboardingService extends BaseService {
  async getProgress(
    input: GetOnboardingProgressInput
  ): Promise<GetOnboardingProgressResult> {
    const { userId } = input;

    logger.info({ userId }, "Fetching onboarding progress");

    const onboardingStatusResult = await getOnboardingStatus(userId);
    if (!isRepositorySuccess(onboardingStatusResult)) {
      logger.error(
        { error: onboardingStatusResult.error, userId },
        "Failed to get onboarding status"
      );
      return this.error(
        "Failed to get onboarding status",
        ServiceErrorCode.INTERNAL_ERROR
      );
    }

    const onboardingStatus = onboardingStatusResult.data;
    if (!onboardingStatus) {
      return this.error("User not found", ServiceErrorCode.NOT_FOUND);
    }

    const isDismissed = onboardingStatus.onboardingDismissedAt !== null;
    const isProfileSetup = onboardingStatus.profileSetupCompletedAt !== null;

    const [libraryCountResult, hasPlayingResult, journalCountResult] =
      await Promise.all([
        countLibraryItemsByUserId(userId),
        hasLibraryItemWithStatus(userId, LibraryItemStatus.PLAYING),
        countJournalEntriesByUserId(userId),
      ]);

    if (!isRepositorySuccess(libraryCountResult)) {
      logger.error(
        { error: libraryCountResult.error, userId },
        "Failed to count library items"
      );
      return this.error(
        "Failed to get onboarding progress",
        ServiceErrorCode.INTERNAL_ERROR
      );
    }

    if (!isRepositorySuccess(hasPlayingResult)) {
      logger.error(
        { error: hasPlayingResult.error, userId },
        "Failed to check playing status"
      );
      return this.error(
        "Failed to get onboarding progress",
        ServiceErrorCode.INTERNAL_ERROR
      );
    }

    if (!isRepositorySuccess(journalCountResult)) {
      logger.error(
        { error: journalCountResult.error, userId },
        "Failed to count journal entries"
      );
      return this.error(
        "Failed to get onboarding progress",
        ServiceErrorCode.INTERNAL_ERROR
      );
    }

    const completionStatus: Record<string, boolean> = {
      "create-account": true,
      "setup-profile": isProfileSetup,
      "add-first-game": libraryCountResult.data > 0,
      "start-playing": hasPlayingResult.data,
      "write-journal": journalCountResult.data > 0,
    };

    const steps: OnboardingStep[] = ONBOARDING_STEPS.map((step) => ({
      ...step,
      isComplete: completionStatus[step.id] ?? false,
    }));

    const completedCount = steps.filter((s) => s.isComplete).length;
    const totalCount = steps.length;
    const isComplete = completedCount === totalCount;

    const progress: OnboardingProgress = {
      steps,
      completedCount,
      totalCount,
      isDismissed: isDismissed || isComplete,
      isComplete,
    };

    logger.info(
      { userId, completedCount, totalCount, isDismissed: progress.isDismissed },
      "Onboarding progress fetched"
    );

    return this.success(progress);
  }

  async dismiss(
    input: DismissOnboardingInput
  ): Promise<DismissOnboardingResult> {
    const { userId } = input;

    logger.info({ userId }, "Dismissing onboarding");

    const result = await updateOnboardingDismissed(userId);
    if (!isRepositorySuccess(result)) {
      logger.error(
        { error: result.error, userId },
        "Failed to dismiss onboarding"
      );
      return this.error(
        "Failed to dismiss onboarding",
        ServiceErrorCode.INTERNAL_ERROR
      );
    }

    logger.info({ userId }, "Onboarding dismissed");
    return this.success(undefined);
  }
}
