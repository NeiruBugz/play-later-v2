"use server";

import { ProfileService } from "@/data-access-layer/services/profile/profile-service";

import { validateUsername } from "../lib/validation";
import { CheckUsernameSchema } from "../schemas";

/**
 * Server action to check if a username is available
 * This is a public endpoint (no auth required) for real-time validation
 */
export async function checkUsernameAvailability(data: { username: string }) {
  try {
    // Validate input shape
    const parsedInput = CheckUsernameSchema.safeParse(data);

    if (!parsedInput.success) {
      return {
        success: false as const,
        error: parsedInput.error.errors[0]?.message ?? "Validation error",
      };
    }

    const username = parsedInput.data.username;
    const validation = validateUsername(username);

    if (!validation.valid) {
      return {
        success: false as const,
        error: validation.error,
      };
    }

    // Check availability via service
    const profileService = new ProfileService();
    const result = await profileService.checkUsernameAvailability({
      username,
    });

    if (!result.success) {
      return {
        success: false as const,
        error: result.error,
      };
    }

    return {
      success: true as const,
      available: result.data.available,
    };
  } catch {
    return {
      success: false as const,
      error: "An unexpected error occurred",
    };
  }
}
