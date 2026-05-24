import { z } from "zod";

import { prisma } from "@/shared/lib/db.server";
import { UnauthorizedError } from "@/shared/lib/errors";

export const SET_AVATAR_URL_INPUT = z.object({
  url: z.url(),
});

export async function setAvatarUrlWorker(
  userId: string | undefined,
  data: unknown
): Promise<{ ok: true }> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  const parsed = SET_AVATAR_URL_INPUT.parse(data);

  await prisma.user.update({
    where: { id: userId },
    data: { image: parsed.url },
  });

  return { ok: true } as const;
}
