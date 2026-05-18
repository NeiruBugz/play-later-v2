import { z } from "zod";

import { prisma } from "@/shared/lib/db.server";
import { UnauthorizedError } from "@/shared/lib/errors";

export const SET_AVATAR_URL_INPUT = z.object({
  url: z.url(),
});

/**
 * Plain async worker for the set-avatar-url flow.
 *
 * Split out of the `createServerFn` wrapper so integration tests can call
 * the auth + parse + persist path without the TanStack Start server runtime
 * (`getRequest()` is strict about `AsyncLocalStorage` context under
 * `@tanstack/react-start@>=1.168`). See `savepoint-tanstack/CLAUDE.md`
 * foot-gun #8.
 *
 * Accepts `userId | undefined` so the worker owns its own auth gate — the
 * unauthorized branch stays reachable from tests that don't go through
 * `requireUserId()`.
 */
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
