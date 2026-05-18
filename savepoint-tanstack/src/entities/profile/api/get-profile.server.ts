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

export async function getProfileByUsername(username: string): Promise<Profile> {
  const profile = await prisma.user.findUnique({
    where: { usernameNormalized: username.toLowerCase().trim() },
    select: PROFILE_SELECT,
  });
  if (!profile) {
    throw new NotFoundError("Profile not found", { username });
  }
  return profile;
}
