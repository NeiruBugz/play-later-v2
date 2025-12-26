"use server";

import { getServerUserId } from "@/auth";
import { OnboardingService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

export async function dismissOnboarding(): Promise<{
  success: boolean;
  error?: string;
}> {
  const logger = createLogger({
    [LOGGER_CONTEXT.SERVER_ACTION]: "dismissOnboarding",
  });

  try {
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn({ reason: "unauthorized" }, "Dismiss onboarding denied");
      return { success: false, error: "Unauthorized" };
    }

    const service = new OnboardingService();
    logger.info({ userId }, "Dismissing onboarding");

    const result = await service.dismiss({ userId });
    if (!result.success) {
      logger.error(
        { userId, reason: result.error },
        "Dismiss onboarding failed"
      );
      return { success: false, error: result.error };
    }

    revalidatePath("/dashboard");
    logger.info({ userId }, "Onboarding dismissed successfully");
    return { success: true };
  } catch (err) {
    logger.error({ err }, "Unexpected error in dismissOnboarding");
    return { success: false, error: "Failed to dismiss onboarding" };
  }
}
