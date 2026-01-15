"use server";

import { ProfileService } from "@/data-access-layer/services/profile/profile-service";
import { revalidatePath } from "next/cache";

import { createServerAction, type ActionResult } from "@/shared/lib";
import {
  CompleteProfileSetupSchema,
  type CompleteProfileSetupInput,
} from "@/shared/lib/profile";

type CompleteSetupData = {
  username: string | null;
  image: string | null;
};

const performCompleteSetup = createServerAction<
  CompleteProfileSetupInput,
  CompleteSetupData
>({
  actionName: "completeProfileSetup",
  schema: CompleteProfileSetupSchema,
  requireAuth: true,
  handler: async ({
    input,
    userId,
    logger,
  }): Promise<ActionResult<CompleteSetupData>> => {
    const sanitizedData: CompleteProfileSetupInput = {
      username: input.username?.trim(),
      avatarUrl: input.avatarUrl,
    };

    const profileService = new ProfileService();
    logger.info({ userId }, "Completing profile setup");

    const result = await profileService.completeSetup({
      userId: userId!,
      username: sanitizedData.username,
      avatarUrl: sanitizedData.avatarUrl,
    });

    if (!result.success) {
      logger.error({ userId, reason: result.error }, "Complete setup failed");
      return {
        success: false,
        error: result.error,
      };
    }

    logger.info({ userId }, "Profile setup completed");
    return {
      success: true,
      data: result.data,
    };
  },
});

export async function completeProfileSetup(
  data: CompleteProfileSetupInput
): Promise<ActionResult<CompleteSetupData>> {
  return performCompleteSetup(data);
}

export type CompleteProfileSetupFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  submittedUsername?: string;
};

export async function completeProfileSetupFormAction(
  _prevState: CompleteProfileSetupFormState,
  formData: FormData
): Promise<CompleteProfileSetupFormState> {
  const rawUsername = formData.get("username");
  const rawAvatar = formData.get("avatarUrl");

  const trimmedUsername =
    typeof rawUsername === "string" ? rawUsername.trim() : undefined;

  const result = await performCompleteSetup({
    username:
      trimmedUsername && trimmedUsername.length > 0
        ? trimmedUsername
        : undefined,
    avatarUrl:
      typeof rawAvatar === "string" && rawAvatar.trim().length > 0
        ? rawAvatar.trim()
        : undefined,
  });

  if (result.success) {
    revalidatePath("/dashboard");
    return {
      status: "success",
      message: "Profile setup complete!",
      submittedUsername: trimmedUsername,
    };
  }

  return {
    status: "error",
    message: result.error,
    submittedUsername: trimmedUsername,
  };
}
