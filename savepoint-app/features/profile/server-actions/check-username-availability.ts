"use server";

import { ProfileService } from "@/data-access-layer/services/profile/profile-service";
import { z } from "zod";

import { CheckUsernameSchema } from "../schemas";

/**
 * Server action to check if a username is available
 * This is a public endpoint (no auth required) for real-time validation
 */
export async function checkUsernameAvailability(data: { username: string }) {
  try {
    // Validate input
    const validatedData = CheckUsernameSchema.parse(data);

    // Check availability via service
    const profileService = new ProfileService();
    const result = await profileService.checkUsernameAvailability({
      username: validatedData.username,
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false as const,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }

    return {
      success: false as const,
      error: "An unexpected error occurred",
    };
  }
}
