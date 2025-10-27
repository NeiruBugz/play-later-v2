"use server";

import { getServerUserId } from "@/auth";
import { ProfileService } from "@/data-access-layer/services/profile/profile-service";

import { AvatarStorageService } from "@/shared/lib/storage/avatar-storage";

import { UploadAvatarSchema } from "../schemas";

type UploadAvatarInput = {
  file: File;
};

type UploadAvatarResult =
  | {
      success: true;
      data: {
        url: string;
      };
    }
  | {
      success: false;
      error: string;
    };

/**
 * Server action to upload user avatar
 * Handles file upload to S3 and updates user profile with avatar URL
 */
export async function uploadAvatar(
  data: UploadAvatarInput
): Promise<UploadAvatarResult> {
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
    const validationResult = UploadAvatarSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false as const,
        error: validationResult.error.errors[0]?.message ?? "Validation error",
      };
    }

    const validatedData = validationResult.data;

    // Upload to S3
    const uploadResult = await AvatarStorageService.uploadAvatar(
      userId,
      validatedData.file
    );

    if (!uploadResult.ok) {
      return {
        success: false as const,
        error: uploadResult.error,
      };
    }

    // Update user profile with avatar URL via service
    const profileService = new ProfileService();
    const updateResult = await profileService.updateAvatarUrl({
      userId,
      avatarUrl: uploadResult.data.url,
    });

    if (!updateResult.success) {
      return {
        success: false as const,
        error: "Failed to save avatar URL",
      };
    }

    return {
      success: true as const,
      data: {
        url: uploadResult.data.url,
      },
    };
  } catch {
    return {
      success: false as const,
      error: "An unexpected error occurred",
    };
  }
}
