"use server";

import { getServerUserId } from "@/auth";
import { ProfileService } from "@/data-access-layer/services/profile/profile-service";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
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

export async function uploadAvatar(
  data: UploadAvatarInput
): Promise<UploadAvatarResult> {
  const logger = createLogger({
    [LOGGER_CONTEXT.SERVER_ACTION]: "uploadAvatar",
  });
  try {
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn({ reason: "unauthorized" }, "Upload avatar denied");
      return {
        success: false as const,
        error: "Unauthorized",
      };
    }

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
