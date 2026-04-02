"use server";

import { ProfileService } from "@/data-access-layer/services/profile/profile-service";
import { revalidatePath } from "next/cache";

import {
  UpdateProfileSchema,
  type UpdateProfileInput,
} from "@/features/profile/lib";
import type { UpdateProfileFormState } from "@/features/profile/types";
import { createServerAction, type ActionResult } from "@/shared/lib";

type UpdateProfileData = {
  username: string | null;
  image: string | null;
};

const performUpdateProfile = createServerAction<
  UpdateProfileInput,
  UpdateProfileData
>({
  actionName: "updateProfile",
  schema: UpdateProfileSchema,
  requireAuth: true,
  handler: async ({
    input,
    userId,
    logger,
  }): Promise<ActionResult<UpdateProfileData>> => {
    const sanitizedData: UpdateProfileInput = {
      username: input.username.trim(),
      avatarUrl: input.avatarUrl,
      isPublicProfile: input.isPublicProfile,
    };

    const profileService = new ProfileService();
    logger.info({ userId }, "Updating user profile");

    const result = await profileService.updateProfile({
      userId: userId!,
      username: sanitizedData.username,
      avatarUrl: sanitizedData.avatarUrl,
      isPublicProfile: sanitizedData.isPublicProfile,
    });

    if (!result.success) {
      logger.error({ userId, reason: result.error }, "Profile update failed");
      return {
        success: false,
        error: result.error,
      };
    }

    logger.info({ userId }, "Profile updated successfully");
    return {
      success: true,
      data: result.data,
    };
  },
});

export async function updateProfile(
  data: UpdateProfileInput
): Promise<ActionResult<UpdateProfileData>> {
  return performUpdateProfile(data);
}

export async function updateProfileFormAction(
  _prevState: UpdateProfileFormState,
  formData: FormData
): Promise<UpdateProfileFormState> {
  const rawUsername = formData.get("username");
  const rawAvatar = formData.get("avatarUrl");

  if (typeof rawUsername !== "string") {
    return {
      status: "error",
      message: "Username is required",
      submittedUsername: undefined,
    };
  }

  const trimmedUsername = rawUsername.trim();
  if (!trimmedUsername) {
    return {
      status: "error",
      message: "Username is required",
      submittedUsername: undefined,
    };
  }

  const result = await performUpdateProfile({
    username: trimmedUsername,
    avatarUrl:
      typeof rawAvatar === "string" && rawAvatar.trim().length > 0
        ? rawAvatar.trim()
        : undefined,
  });

  if (result.success) {
    revalidatePath("/profile");
    return {
      status: "success",
      message: "Profile updated successfully!",
      submittedUsername: trimmedUsername,
    };
  }

  return {
    status: "error",
    message: result.error,
    submittedUsername: trimmedUsername,
  };
}
