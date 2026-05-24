import { z } from "zod";

import { updateProfile } from "@/entities/profile/api/update-profile.server";
import type { Profile } from "@/entities/profile/model/types";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/shared/lib/constants";
import { UnauthorizedError } from "@/shared/lib/errors";

export const UPDATE_PROFILE_INPUT = z.object({
  name: z.string().min(1).optional(),
  username: z
    .string()
    .min(USERNAME_MIN_LENGTH)
    .max(USERNAME_MAX_LENGTH)
    .optional(),
  image: z.url().optional(),
  isPublicProfile: z.boolean().optional(),
});

export async function updateProfileWorker(
  userId: string | undefined,
  data: unknown
): Promise<Profile> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  const parsed = UPDATE_PROFILE_INPUT.parse(data);

  // No pre-check on username uniqueness here — the database unique index
  // is the single enforcement seam, surfaced as ConflictError by
  // entities/profile/api/update-profile.server.ts. Pre-checking would
  // re-introduce a TOCTOU race the constraint already closes.
  return updateProfile(userId, parsed);
}
