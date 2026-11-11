import { z } from "zod";

import { updateProfile } from "@/entities/profile/api/update-profile.server";
import { UnauthorizedError } from "@/shared/lib/errors";
import { EVENING_MINUTES_CHOICES } from "@/shared/lib/evenings";

const [first, second, ...rest] = EVENING_MINUTES_CHOICES.map((minutes) =>
  z.literal(minutes)
);

export const SET_EVENING_LENGTH_INPUT = z.object({
  eveningMinutes: z.union([first, second, ...rest]),
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
