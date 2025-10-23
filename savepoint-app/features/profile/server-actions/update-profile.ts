"use server";

import { getServerUserId } from "@/auth";
import { ProfileService } from "@/data-access-layer/services/profile/profile-service";
import { z } from "zod";

import { UpdateProfileSchema } from "../schemas";

/**
 * Server action to update user profile
 * Requires authentication - uses session userId
 */
export async function updateProfile(data: {
  username: string;
  avatarUrl?: string;
}) {
  try {
    // Check authentication
    const userId = await getServerUserId();
    if (!userId) {
      return {
        success: false as const,
        error: "Unauthorized",
      };
    }

    // Validate input
    const validatedData = UpdateProfileSchema.parse(data);

    // Update profile via service
    const profileService = new ProfileService();
    const result = await profileService.updateProfile({
      userId,
      username: validatedData.username,
      avatarUrl: validatedData.avatarUrl,
    });

    if (!result.success) {
      return {
        success: false as const,
        error: result.error,
      };
    }

    return {
      success: true as const,
      data: result.data,
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
