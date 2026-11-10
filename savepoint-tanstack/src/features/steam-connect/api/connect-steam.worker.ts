import { z } from "zod";

import { verifyOpenIdResponse } from "@/shared/api/steam";
import { prisma } from "@/shared/lib/db.server";
import { UnauthorizedError } from "@/shared/lib/errors";

/**
 * Worker for `connectSteamFn`.
 *
 * Flow:
 *   1. Auth gate (throws UnauthorizedError on unauthenticated caller).
 *   2. Zod-parse the input envelope (records of openid.* params).
 *   3. Delegate to `verifyOpenIdResponse` — it throws `ValidationError`
 *      on forged/missing params and `UpstreamError` on network failure.
 *   4. Write the verified steam64 onto `User.steamId64`.
 *
 * Idempotent — re-running with the same params is a no-op (the write is
 * value-equivalent).
 */
const MAX_OPENID_PARAMS = 40;
const MAX_OPENID_KEY_LENGTH = 128;
const MAX_OPENID_VALUE_LENGTH = 2048;

export const CONNECT_STEAM_INPUT = z.object({
  params: z
    .record(
      z.string().max(MAX_OPENID_KEY_LENGTH),
      z.string().max(MAX_OPENID_VALUE_LENGTH)
    )
    .refine((params) => Object.keys(params).length <= MAX_OPENID_PARAMS, {
      message: `At most ${MAX_OPENID_PARAMS} parameters`,
    }),
});

export async function connectSteamWorker(
  userId: string | undefined,
  data: unknown
): Promise<{ steamId: string }> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  const { params } = CONNECT_STEAM_INPUT.parse(data);

  const steamId = await verifyOpenIdResponse(params, { userId });

  await prisma.user.update({
    where: { id: userId },
    data: { steamId64: steamId },
  });

  return { steamId };
}
