"use server";

import { getServerUserId } from "@/auth";
import { ProfileService } from "@/data-access-layer/services/profile/profile-service";

import { createLogger } from "@/shared/lib";
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
  const logger = createLogger({ serverAction: "uploadAvatar" });
  try {
    // Check authentication
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn({ reason: "unauthorized" }, "Upload avatar denied");
      return {
        success: false as const,
        error: "Unauthorized",
      };
    }

    // Validate input
    const validationResult = UploadAvatarSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn(
        { userId, reason: "validation_error" },
        "Invalid upload avatar input"
      );
      return {
        success: false as const,
        error: validationResult.error.errors[0]?.message ?? "Validation error",
      };
    }

    const validatedData = validationResult.data;

    // Upload to S3
    logger.info({ userId }, "Uploading avatar to storage");
    const uploadResult = await AvatarStorageService.uploadAvatar(
      userId,
      validatedData.file
    );

    if (!uploadResult.ok) {
      logger.error(
        { userId, reason: uploadResult.error },
        "Avatar upload failed"
      );
      return {
        success: false as const,
        error: uploadResult.error,
      };
    }

    // Update user profile with avatar URL via service
    const profileService = new ProfileService();
    logger.debug({ userId }, "Saving avatar URL to profile");
    const updateResult = await profileService.updateAvatarUrl({
      userId,
      avatarUrl: uploadResult.data.url,
    });

    if (!updateResult.success) {
      logger.error(
        { userId, reason: "failed_to_save_avatar_url" },
        "Saving avatar URL failed"
      );
      return {
        success: false as const,
        error: "Failed to save avatar URL",
      };
    }

    logger.info({ userId }, "Avatar uploaded and profile updated");
    return {
      success: true as const,
      data: {
        url: uploadResult.data.url,
      },
    };
  } catch (err) {
    logger.error({ err }, "Unexpected error in uploadAvatar");
    return {
      success: false as const,
      error: "An unexpected error occurred",
    };
  }
}
