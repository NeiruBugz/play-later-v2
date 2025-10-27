"use server";

import { getServerUserId } from "@/auth";
import { ProfileService } from "@/data-access-layer/services/profile/profile-service";
import { revalidatePath } from "next/cache";

import { UpdateProfileSchema } from "../schemas";

type UpdateProfileInput = {
  username: string;
  avatarUrl?: string;
};

type PerformUpdateProfileResult =
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

async function performUpdateProfile(
  data: UpdateProfileInput
): Promise<PerformUpdateProfileResult> {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return {
        success: false as const,
        error: "Unauthorized",
      };
    }

    const sanitizedData: UpdateProfileInput = {
      username: data.username.trim(),
      avatarUrl: data.avatarUrl,
    };

    const validationResult = UpdateProfileSchema.safeParse(sanitizedData);
    if (!validationResult.success) {
      return {
        success: false as const,
        error: validationResult.error.errors[0]?.message ?? "Validation error",
      };
    }

    const validatedData = validationResult.data;

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
  } catch {
    return {
      success: false as const,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Retains the original imperative API for programmatic updates.
 */
export async function updateProfile(data: UpdateProfileInput) {
  return performUpdateProfile(data);
}

export type UpdateProfileFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  submittedUsername?: string;
};

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
