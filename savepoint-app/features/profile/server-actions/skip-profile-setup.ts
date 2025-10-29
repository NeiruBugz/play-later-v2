"use server";

import { getServerUserId } from "@/auth";
import { ProfileService } from "@/data-access-layer/services/profile/profile-service";

export async function skipProfileSetup(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const service = new ProfileService();
    const result = await service.completeSetup({ userId });
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to skip setup" };
  }
}

