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

export async function getProfileById(userId: string): Promise<Profile> {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: PROFILE_SELECT,
  });
  if (!profile) {
    throw new NotFoundError("Profile not found", { userId });
  }
  return profile;
}
