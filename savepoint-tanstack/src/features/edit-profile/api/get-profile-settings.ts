import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { getProfileById } from "@/entities/profile/api";
import type { Profile } from "@/entities/profile/model/types";
import { getServerUserId } from "@/entities/session/api/get-session.server";
import { UnauthorizedError } from "@/shared/lib/errors";

export type ProfileSettingsView = {
  profile: Profile;
};

export const getProfileSettingsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProfileSettingsView> => {
    const userId = await getServerUserId(getRequest());
    if (!userId) {
      throw new UnauthorizedError("Not signed in");
    }
    const profile = await getProfileById(userId);
    return { profile };
  }
);
