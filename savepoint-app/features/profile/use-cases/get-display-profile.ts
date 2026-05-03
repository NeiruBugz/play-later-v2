import "server-only";

import { ProfileService } from "@/data-access-layer/services";

const DEFAULT_DISPLAY_NAME = "User";

export type DisplayProfile = {
  displayName: string;
  avatarUrl: string | null;
};

export async function getDisplayProfile({
  userId,
}: {
  userId: string;
}): Promise<DisplayProfile> {
  const service = new ProfileService();
  try {
    const profile = await service.getProfile({ userId });
    return {
      displayName: profile.username ?? DEFAULT_DISPLAY_NAME,
      avatarUrl: profile.image ?? null,
    };
  } catch {
    return { displayName: DEFAULT_DISPLAY_NAME, avatarUrl: null };
  }
}
