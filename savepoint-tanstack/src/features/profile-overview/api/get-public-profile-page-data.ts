import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

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
import { getServerUserId } from "@/entities/session/api/get-session.server";

const inputSchema = z.object({
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
  /**
   * Whether the signed-in viewer is currently following the profile owner.
   * `null` for anonymous viewers (no follow relation possible).
   */
  isFollowing: boolean | null;
  /**
   * The profile owner's full public library, mapped for the read-only
   * `LibraryGrid` rendered in the profile Library tab. Mirrors canonical's
   * `/u/[username]/library` page, which feeds `LibraryGrid` from the owner's
   * library items. Empty array when the owner has no games.
   */
  libraryItems: PublicLibraryGridItem[];
};

export const getPublicProfilePageDataFn = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => inputSchema.parse(value))
  .handler(async ({ data }): Promise<PublicProfilePageView> => {
    const { username } = inputSchema.parse(data);
    const viewerId = await getServerUserId(getRequest());
    const profile = await getPublicProfile(username, viewerId ?? undefined);
    const [stats, library, followerCount, followingCount, followingFlag] =
      await Promise.all([
        getLibraryStats(profile.id),
        // `getPublicProfile` already enforced the public-profile privacy
        // invariant (throws NotFound for missing/private), so reading the
        // owner's library here is safe.
        getLibrary(profile.id, {}),
        countFollowers(profile.id),
        countFollowing(profile.id),
        viewerId && viewerId !== profile.id
          ? isFollowing(viewerId, profile.id)
          : Promise.resolve(false),
      ]);

    const libraryItems: PublicLibraryGridItem[] = library.items.map((item) => ({
      gameId: item.game.slug,
      title: item.game.title,
      coverImage: item.game.coverImage,
    }));

    return {
      profile,
      stats,
      followerCount,
      followingCount,
      isFollowing: viewerId ? followingFlag : null,
      libraryItems,
    };
  });
