"use server";
import { ProfileService } from "@/data-access-layer/services/profile/profile-service";
import { createServerAction } from "@/shared/lib";
import { AvatarStorageService } from "@/shared/lib/storage/avatar-storage";
import { UploadAvatarSchema } from "../schemas";
type UploadAvatarInput = {
  file: File;
};
type UploadAvatarData = {
  url: string;
};
export const uploadAvatar = createServerAction<
  UploadAvatarInput,
  UploadAvatarData
>({
  actionName: "uploadAvatar",
  schema: UploadAvatarSchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    logger.info({ userId }, "Uploading avatar to storage");
    const uploadResult = await AvatarStorageService.uploadAvatar(
      userId!,
      input.file
    );
    if (!uploadResult.ok) {
      logger.error(
        { userId, reason: uploadResult.error },
        "Avatar upload failed"
      );
      return {
        success: false,
        error: uploadResult.error,
      };
    }
    const profileService = new ProfileService();
    logger.debug({ userId }, "Saving avatar URL to profile");
    const updateResult = await profileService.updateAvatarUrl({
      userId: userId!,
      avatarUrl: uploadResult.data.url,
    });
    if (!updateResult.success) {
      logger.error(
        { userId, reason: "failed_to_save_avatar_url" },
        "Saving avatar URL failed"
      );
      return {
        success: false,
        error: "Failed to save avatar URL",
      };
    }
    logger.info({ userId }, "Avatar uploaded and profile updated");
    return {
      success: true,
      data: {
        url: uploadResult.data.url,
      },
    };
  },
});
