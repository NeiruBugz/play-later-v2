import "server-only";

import { OnboardingService } from "@/data-access-layer/services";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { GettingStarted } from "./getting-started";

interface GettingStartedChecklistProps {
  userId: string;
}

export async function GettingStartedChecklist({
  userId,
}: GettingStartedChecklistProps) {
  const logger = createLogger({
    [LOGGER_CONTEXT.PAGE]: "GettingStartedChecklist",
  });

  const service = new OnboardingService();

  let progress;
  try {
    progress = await service.getProgress({ userId });
  } catch (error) {
    logger.error({ error, userId }, "Failed to get onboarding progress");
    return null;
  }

  const { isDismissed, isComplete } = progress;

  if (isDismissed || isComplete) {
    return null;
  }

  return <GettingStarted progress={progress} />;
}
