import { prisma } from "@/shared/lib/db.server";
import { UnauthorizedError } from "@/shared/lib/errors";

/**
 * Worker for `disconnectSteamFn` (Slice 21 Phase B).
 *
 * Plain async function — clears `User.steamId64`. Idempotent: a second call
 * is a no-op since the write is value-equivalent (`null`).
 *
 * No input shape — the operation is pure. The authed userId IS the input.
 */
export async function disconnectSteamWorker(
  userId: string | undefined
): Promise<void> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { steamId64: null },
  });
}
