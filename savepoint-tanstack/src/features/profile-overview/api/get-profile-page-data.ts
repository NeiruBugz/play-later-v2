import { createServerFn } from "@tanstack/react-start";

import {
  getLibraryStats,
  type LibraryStats,
} from "@/entities/library-item/api/get-library-stats.server";
import { getProfileById } from "@/entities/profile/api/get-profile.server";
import type { Profile } from "@/entities/profile/model/types";
import { requireUserId } from "@/entities/session/api/require-user-id";

export type ProfilePageView = {
  profile: Profile;
  stats: LibraryStats;
};

export const getProfilePageDataFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProfilePageView> => {
    const userId = await requireUserId();
    const [profile, stats] = await Promise.all([
      getProfileById(userId),
      getLibraryStats(userId),
    ]);
    return { profile, stats };
  }
);
