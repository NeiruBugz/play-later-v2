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
  const result = await service.getProgress({ userId });

  if (!result.success) {
    logger.error(
      { error: result.error, userId },
      "Failed to get onboarding progress"
    );
    return null;
  }

  const { isDismissed, isComplete } = result.data;

  if (isDismissed || isComplete) {
    return null;
  }

  return <GettingStarted progress={result.data} />;
}
