import { z } from "zod";

import { verifyOpenIdResponse } from "@/shared/api/steam";
import { prisma } from "@/shared/lib/db.server";
import { UnauthorizedError } from "@/shared/lib/errors";

/**
 * Worker for `connectSteamFn` (Slice 21 Phase B — Steam connect/disconnect).
 *
 * Plain async function — owns the auth gate, input validation, OpenID
 * verification, and the user-row write. Split from the server-fn wrapper
 * so integration tests can drive it without the TanStack Start runtime
 * (foot-gun #8).
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
export const CONNECT_STEAM_INPUT = z.object({
  params: z.record(z.string(), z.string()),
});

export async function connectSteamWorker(
  userId: string | undefined,
  data: unknown
): Promise<{ steamId: string }> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  const { params } = CONNECT_STEAM_INPUT.parse(data);

  // Throws ValidationError on forged params / bad shape; UpstreamError on
  // network failure. Both bubble up to the route boundary unchanged.
  const steamId = await verifyOpenIdResponse(params);

  await prisma.user.update({
    where: { id: userId },
    data: { steamId64: steamId },
  });

  return { steamId };
}
