import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import type { Profile } from "../model/types";

const PROFILE_SELECT = {
  id: true,
  name: true,
  username: true,
  image: true,
  isPublicProfile: true,
} as const;

/**
 * Public-profile read that owns the privacy invariant.
 *
 * Throws `NotFoundError` for both "row missing" and "row exists but
 * `isPublicProfile === false` AND viewer is not the owner" — non-owner
 * callers cannot distinguish the two cases. The owner-bypass exists because
 * a signed-in user must always be able to view their own profile regardless
 * of the public flag (mirrors canonical `getProfilePageData`'s owner branch).
 *
 * Privacy is a property of the data, not of the surface that displays it,
 * so the gate lives here on the entity rather than on a feature handler or
 * a route guard. See CONTEXT.md "Privacy invariant".
 */
export async function getPublicProfile(
  username: string,
  viewerId?: string
): Promise<Profile> {
  const profile = await prisma.user.findFirst({
    where: { usernameNormalized: username.toLowerCase().trim() },
    select: PROFILE_SELECT,
  });

  if (!profile) {
    throw new NotFoundError("Profile not found", { username });
  }

  const isOwner = viewerId !== undefined && viewerId === profile.id;
  if (!profile.isPublicProfile && !isOwner) {
    throw new NotFoundError("Profile not found", { username });
  }

  return profile;
}
