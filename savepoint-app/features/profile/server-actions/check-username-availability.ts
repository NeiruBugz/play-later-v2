"use server";

import { ProfileService } from "@/data-access-layer/services/profile/profile-service";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { validateUsername } from "../lib/validation";
import { CheckUsernameSchema } from "../schemas";

export async function checkUsernameAvailability(data: { username: string }) {
  const logger = createLogger({
    [LOGGER_CONTEXT.SERVER_ACTION]: "checkUsernameAvailability",
  });
  try {
    const parsedInput = CheckUsernameSchema.safeParse(data);

    if (!parsedInput.success) {
      logger.warn(
        { reason: "validation_error" },
        "Invalid input for username availability"
      );
      return {
        success: false as const,
        error: parsedInput.error.errors[0]?.message ?? "Validation error",
      };
    }

    const username = parsedInput.data.username;
    const validation = validateUsername(username);

    if (!validation.valid) {
      logger.warn(
        { username, reason: validation.error },
        "Username validation failed"
      );
      return {
        success: false as const,
        error: validation.error,
      };
    }

    const profileService = new ProfileService();
    logger.info({ username }, "Checking username availability");
    const result = await profileService.checkUsernameAvailability({
      username,
    });

    if (!result.success) {
      logger.error(
        { username, reason: result.error },
        "Check availability failed"
      );
      return {
        success: false as const,
        error: result.error,
      };
    }

    logger.info(
      { username, available: result.data.available },
      "Username availability checked"
    );
    return {
      success: true as const,
      available: result.data.available,
    };
  } catch (err) {
    logger.error({ err }, "Unexpected error in checkUsernameAvailability");
    return {
      success: false as const,
      error: "An unexpected error occurred",
    };
  }
}
