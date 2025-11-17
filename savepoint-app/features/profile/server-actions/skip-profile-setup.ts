"use server";

import { getServerUserId } from "@/auth";
import { ProfileService } from "@/data-access-layer/services/profile/profile-service";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

export async function skipProfileSetup(): Promise<{
  success: boolean;
  error?: string;
}> {
  const logger = createLogger({
    [LOGGER_CONTEXT.SERVER_ACTION]: "skipProfileSetup",
  });
  try {
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn({ reason: "unauthorized" }, "Skip profile setup denied");
      return { success: false, error: "Unauthorized" };
    }
    const service = new ProfileService();
    logger.info({ userId }, "Marking profile setup as complete (skip)");
    const result = await service.completeSetup({ userId });
    if (!result.success) {
      logger.error({ userId, reason: result.error }, "Skip setup failed");
      return { success: false, error: result.error };
    }
    logger.info({ userId }, "Profile setup marked as complete (skipped)");
    return { success: true };
  } catch (err) {
    logger.error({ err }, "Unexpected error in skipProfileSetup");
    return { success: false, error: "Failed to skip setup" };
  }
}
