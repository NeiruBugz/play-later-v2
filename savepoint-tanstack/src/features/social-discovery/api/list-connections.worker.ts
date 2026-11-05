import { z } from "zod";

import { getFollowers } from "@/entities/follow/api/get-followers.server";
import { getFollowing } from "@/entities/follow/api/get-following.server";
import type { PublicUserRef } from "@/entities/follow/model/types";
import { getPublicProfile } from "@/entities/profile/api/get-public-profile.server";
import type { Profile } from "@/entities/profile/model/types";

export const LIST_CONNECTIONS_INPUT = z.object({
  username: z.string().min(1),
  kind: z.enum(["followers", "following"]),
});

export type ListConnectionsResult = {
  profile: Profile;
  entries: PublicUserRef[];
  total: number;
};

/**
 * Anonymous-readable. The privacy-gated `getPublicProfile` resolves the
 * username (NotFoundError for missing or denied) and the entity list queries
 * keep excluding private accounts, so one call serves the whole page.
 */
export async function listConnectionsWorker(
  viewerId: string | undefined,
  data: unknown
): Promise<ListConnectionsResult> {
  const { username, kind } = LIST_CONNECTIONS_INPUT.parse(data);
  const profile = await getPublicProfile(username, viewerId);

  if (kind === "followers") {
    const { followers, total } = await getFollowers(profile.id);
    return { profile, entries: followers, total };
  }

  const { following, total } = await getFollowing(profile.id);
  return { profile, entries: following, total };
}
