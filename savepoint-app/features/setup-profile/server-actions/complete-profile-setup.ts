"use server";

import { getServerUserId } from "@/auth";
import { ProfileService } from "@/data-access-layer/services/profile/profile-service";
import { revalidatePath } from "next/cache";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import {
  CompleteProfileSetupSchema,
  type CompleteProfileSetupInput,
} from "@/shared/lib/profile";

type PerformCompleteSetupResult =
  | {
      success: true;
      data: {
        username: string | null;
        image: string | null;
      };
    }
  | {
      success: false;
      error: string;
    };
async function performCompleteSetup(
  data: CompleteProfileSetupInput
): Promise<PerformCompleteSetupResult> {
  const logger = createLogger({
    [LOGGER_CONTEXT.SERVER_ACTION]: "completeProfileSetup",
  });
  try {
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn({ reason: "unauthorized" }, "Complete profile setup denied");
      return {
        success: false as const,
        error: "Unauthorized",
      };
    }
    const sanitizedData: CompleteProfileSetupInput = {
      username: data.username?.trim(),
      avatarUrl: data.avatarUrl,
    };
    const validationResult =
      CompleteProfileSetupSchema.safeParse(sanitizedData);
    if (!validationResult.success) {
      logger.warn(
        { userId, reason: "validation_error" },
        "Invalid complete setup input"
      );
      return {
        success: false as const,
        error: validationResult.error.errors[0]?.message ?? "Validation error",
      };
    }
    const validatedData = validationResult.data;
    const profileService = new ProfileService();
    logger.info({ userId }, "Completing profile setup");
    const result = await profileService.completeSetup({
      userId,
      username: validatedData.username,
      avatarUrl: validatedData.avatarUrl,
    });
    if (!result.success) {
      logger.error({ userId, reason: result.error }, "Complete setup failed");
      return {
        success: false as const,
        error: result.error,
      };
    }
    logger.info({ userId }, "Profile setup completed");
    return {
      success: true as const,
      data: result.data,
    };
  } catch (err) {
    logger.error({ err }, "Unexpected error in completeProfileSetup");
    return {
      success: false as const,
      error: "An unexpected error occurred",
    };
  }
}
export async function completeProfileSetup(
  data: CompleteProfileSetupInput
): Promise<PerformCompleteSetupResult> {
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
