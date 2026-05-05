import { prisma } from "@/shared/lib/db";
import { ConflictError, NotFoundError } from "@/shared/lib/errors";

import { Prisma } from "../../../../shared/lib/prisma/client.ts";
import type { Profile } from "../model/types";

export interface UpdateProfileInput {
  name?: string;
  username?: string;
  image?: string;
  isPublicProfile?: boolean;
}

const PROFILE_SELECT = {
  id: true,
  name: true,
  username: true,
  image: true,
  isPublicProfile: true,
} as const;

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<Profile> {
  const data: Prisma.userUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name;
  }
  if (input.username !== undefined) {
    const trimmed = input.username.trim();
    data.username = trimmed;
    data.usernameNormalized = trimmed.toLowerCase();
  }
  if (input.image !== undefined) {
    data.image = input.image;
  }
  if (input.isPublicProfile !== undefined) {
    data.isPublicProfile = input.isPublicProfile;
  }

  try {
    return await prisma.user.update({
      where: { id: userId },
      data,
      select: PROFILE_SELECT,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new NotFoundError("User not found while updating profile", {
          userId,
        });
      }
      if (error.code === "P2002") {
        throw new ConflictError("Username already taken", {
          userId,
          username: input.username,
        });
      }
    }
    throw error;
  }
}
