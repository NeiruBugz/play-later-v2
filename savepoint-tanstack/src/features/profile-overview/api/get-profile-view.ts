import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import {
  getLibraryStats,
  type LibraryStats,
} from "@/entities/library-item/api/get-library-stats.server";
import { getProfileById } from "@/entities/profile/api/get-profile.server";
import type { Profile } from "@/entities/profile/model/types";
import { getServerUserId } from "@/entities/session/api/get-session.server";
import { UnauthorizedError } from "@/shared/lib/errors";

export type ProfileView = {
  profile: Profile;
  stats: LibraryStats;
};

export const getProfileViewFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProfileView> => {
    const request = getRequest();
    const userId = await getServerUserId(request);

    if (!userId) {
      throw new UnauthorizedError("Not signed in");
    }

    const [profile, stats] = await Promise.all([
      getProfileById(userId),
      getLibraryStats(userId),
    ]);

    return { profile, stats };
  }
);
