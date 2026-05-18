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
 * `isPublicProfile === false`" — callers cannot distinguish the two cases.
 * Privacy is a property of the data, not of the surface that displays it,
 * so the gate lives here on the entity rather than on a feature handler or
 * a route guard. See CONTEXT.md "Privacy invariant".
 */
export async function getPublicProfile(username: string): Promise<Profile> {
  const profile = await prisma.user.findFirst({
    where: {
      usernameNormalized: username.toLowerCase().trim(),
      isPublicProfile: true,
    },
    select: PROFILE_SELECT,
  });

  if (!profile) {
    throw new NotFoundError("Profile not found", { username });
  }

  return profile;
}
