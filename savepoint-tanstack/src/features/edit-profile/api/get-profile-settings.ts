import { createServerFn } from "@tanstack/react-start";

import { getProfileById } from "@/entities/profile/api/get-profile.server";
import type { Profile } from "@/entities/profile/model/types";
import { requireUserId } from "@/entities/session/api/require-user-id";

export type ProfileSettingsView = {
  profile: Profile;
};

export const getProfileSettingsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProfileSettingsView> => {
    const userId = await requireUserId();
    const profile = await getProfileById(userId);
    return { profile };
  }
);
