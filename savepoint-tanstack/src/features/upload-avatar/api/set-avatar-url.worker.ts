import { z } from "zod";

import {
  buildAvatarPublicUrl,
  isAvatarKeyOwnedBy,
} from "@/shared/api/s3.server";
import { prisma } from "@/shared/lib/db.server";
import { UnauthorizedError, ValidationError } from "@/shared/lib/errors";

export const SET_AVATAR_URL_INPUT = z.object({
  key: z.string().min(1).max(512),
});

export async function setAvatarUrlWorker(
  userId: string | undefined,
  data: unknown
): Promise<{ ok: true }> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  const { key } = SET_AVATAR_URL_INPUT.parse(data);
  if (!isAvatarKeyOwnedBy(userId, key)) {
    throw new ValidationError("Invalid avatar key", { userId, key });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { image: buildAvatarPublicUrl(key) },
  });

  return { ok: true } as const;
}
