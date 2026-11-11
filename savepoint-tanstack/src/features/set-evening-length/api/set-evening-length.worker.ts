import { z } from "zod";

import { updateProfile } from "@/entities/profile/api/update-profile.server";
import { UnauthorizedError } from "@/shared/lib/errors";

export const MIN_EVENING_MINUTES = 30;
export const MAX_EVENING_MINUTES = 360;

export const SET_EVENING_LENGTH_INPUT = z.object({
  eveningMinutes: z
    .number()
    .int()
    .min(MIN_EVENING_MINUTES)
    .max(MAX_EVENING_MINUTES),
});

export async function setEveningLengthWorker(
  userId: string | undefined,
  data: unknown
): Promise<void> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  const { eveningMinutes } = SET_EVENING_LENGTH_INPUT.parse(data);
  await updateProfile(userId, { eveningMinutes });
}
