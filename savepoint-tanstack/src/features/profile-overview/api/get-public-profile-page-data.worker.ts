import { z } from "zod";

import {
  getActivityFeedForViewer,
  getActivityForUser,
} from "@/entities/activity-feed/api";
import type { ActivityFeedResult } from "@/entities/activity-feed/model";
import { countFollowers } from "@/entities/follow/api/count-followers.server";
import { countFollowing } from "@/entities/follow/api/count-following.server";
import { isFollowing } from "@/entities/follow/api/is-following.server";
import {
  getLibraryStats,
  type LibraryStats,
} from "@/entities/library-item/api/get-library-stats.server";
import { getLibrary } from "@/entities/library-item/api/get-library.server";
import { getPublicProfile } from "@/entities/profile/api/get-public-profile.server";
import type { Profile } from "@/entities/profile/model/types";

export const GET_PUBLIC_PROFILE_PAGE_DATA_INPUT = z.object({
  username: z.string().min(1),
});

/**
 * Read-only library cell for the profile Library tab. Matches the
 * `LibraryGridGame` shape consumed by `entities/library-item`'s `LibraryGrid`
 * (defined inline so this server fn doesn't pull entity UI into the bundle).
 */
export type PublicLibraryGridItem = {
  gameId: string;
  title: string;
  coverImage: string | null;
};

export type PublicProfilePageView = {
  profile: Profile;
  stats: LibraryStats;
  followerCount: number;
  followingCount: number;
  /** `null` for anonymous viewers (no follow relation possible). */
  isFollowing: boolean | null;
  /** The signed-in viewer, resolved server-side; `null` when anonymous. */
  viewerId: string | null;
  /**
   * Activity tab seed: the viewer's follow-graph feed on their own profile,
   * the target's public stream otherwise. `null` for anonymous viewers (the
   * tab is hidden for them).
   */
  activity: ActivityFeedResult | null;
  libraryItems: PublicLibraryGridItem[];
};

export async function getPublicProfilePageDataWorker(
  viewerId: string | undefined,
  data: unknown
): Promise<PublicProfilePageView> {
  const { username } = GET_PUBLIC_PROFILE_PAGE_DATA_INPUT.parse(data);
  const profile = await getPublicProfile(username, viewerId);
  const isOwnProfile = viewerId !== undefined && viewerId === profile.id;

  const [
    stats,
    library,
    followerCount,
    followingCount,
    followingFlag,
    activity,
  ] = await Promise.all([
    getLibraryStats(profile.id),
    // `getPublicProfile` already enforced the privacy invariant, so reading
    // the owner's library here is safe.
    getLibrary(profile.id, {}),
    countFollowers(profile.id),
    countFollowing(profile.id),
    viewerId && !isOwnProfile
      ? isFollowing(viewerId, profile.id)
      : Promise.resolve(false),
    readActivity(viewerId, profile.id, isOwnProfile),
  ]);

  return {
    profile,
    stats,
    followerCount,
    followingCount,
    isFollowing: viewerId ? followingFlag : null,
    viewerId: viewerId ?? null,
    activity,
    libraryItems: library.items.map((item) => ({
      gameId: item.game.slug,
      title: item.game.title,
      coverImage: item.game.coverImage,
    })),
  };
}

function readActivity(
  viewerId: string | undefined,
  profileId: string,
  isOwnProfile: boolean
): Promise<ActivityFeedResult | null> {
  if (!viewerId) return Promise.resolve(null);
  return isOwnProfile
    ? getActivityFeedForViewer(viewerId, {})
    : getActivityForUser(profileId, viewerId, {});
}
