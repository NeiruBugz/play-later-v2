import "server-only";

import { ProfileService } from "@/data-access-layer/services";

const FALLBACK_USERNAME = "there";

export async function getGreetingUsername({
  userId,
}: {
  userId: string;
}): Promise<string> {
  const service = new ProfileService();
  try {
    const profile = await service.getProfile({ userId });
    return profile.username ?? FALLBACK_USERNAME;
  } catch {
    return FALLBACK_USERNAME;
  }
}
