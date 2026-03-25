import "server-only";

import {
  countJournalEntriesByUserId,
  countLibraryItemsByUserId,
  getOnboardingStatus,
  hasLibraryItemWithStatus,
  updateOnboardingDismissed,
} from "@/data-access-layer/repository";
import { LibraryItemStatus } from "@prisma/client";

import { serviceError, ServiceErrorCode, serviceSuccess } from "../types";
import type {
  DismissOnboardingInput,
  DismissOnboardingResult,
  GetOnboardingProgressInput,
  GetOnboardingProgressResult,
  OnboardingProgress,
  OnboardingStep,
} from "./types";

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

export class OnboardingService {
  async getProgress(
    input: GetOnboardingProgressInput
  ): Promise<GetOnboardingProgressResult> {
    const { userId } = input;

    const onboardingStatus = await getOnboardingStatus(userId);
    if (!onboardingStatus) {
      return serviceError("User not found", ServiceErrorCode.NOT_FOUND);
    }

    const isDismissed = onboardingStatus.onboardingDismissedAt !== null;
    const isProfileSetup = onboardingStatus.profileSetupCompletedAt !== null;

    const [libraryCount, hasPlaying, journalCount] = await Promise.all([
      countLibraryItemsByUserId(userId),
      hasLibraryItemWithStatus(userId, LibraryItemStatus.PLAYING),
      countJournalEntriesByUserId(userId),
    ]);

    const completionStatus: Record<string, boolean> = {
      "create-account": true,
      "setup-profile": isProfileSetup,
      "add-first-game": libraryCount > 0,
      "start-playing": hasPlaying,
      "write-journal": journalCount > 0,
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

    return serviceSuccess(progress);
  }

  async dismiss(
    input: DismissOnboardingInput
  ): Promise<DismissOnboardingResult> {
    const { userId } = input;

    await updateOnboardingDismissed(userId);

    return serviceSuccess(undefined);
  }
}
