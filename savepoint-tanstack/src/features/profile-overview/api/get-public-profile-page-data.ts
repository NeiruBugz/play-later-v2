import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import {
  countFollowers,
  countFollowing,
  isFollowing,
} from "@/entities/follow/api";
import {
  getLibraryStats,
  type LibraryStats,
} from "@/entities/library-item/api";
import { getPublicProfile } from "@/entities/profile/api";
import type { Profile } from "@/entities/profile/model/types";
import { getServerUserId } from "@/entities/session/api/get-session.server";

const inputSchema = z.object({
  username: z.string().min(1),
});

export type PublicProfilePageView = {
  profile: Profile;
  stats: LibraryStats;
  followerCount: number;
  followingCount: number;
  /**
   * Whether the signed-in viewer is currently following the profile owner.
   * `null` for anonymous viewers (no follow relation possible).
   */
  isFollowing: boolean | null;
};

export const getPublicProfilePageDataFn = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => inputSchema.parse(value))
  .handler(async ({ data }): Promise<PublicProfilePageView> => {
    const { username } = inputSchema.parse(data);
    const viewerId = await getServerUserId(getRequest());
    const profile = await getPublicProfile(username, viewerId ?? undefined);
    const [stats, followerCount, followingCount, followingFlag] =
      await Promise.all([
        getLibraryStats(profile.id),
        countFollowers(profile.id),
        countFollowing(profile.id),
        viewerId && viewerId !== profile.id
          ? isFollowing(viewerId, profile.id)
          : Promise.resolve(false),
      ]);

    return {
      profile,
      stats,
      followerCount,
      followingCount,
      isFollowing: viewerId ? followingFlag : null,
    };
  });
