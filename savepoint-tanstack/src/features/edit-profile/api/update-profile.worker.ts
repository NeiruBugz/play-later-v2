import { z } from "zod";

import { updateProfile } from "@/entities/profile/api";
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

/**
 * Plain async worker for the update-profile flow.
 *
 * Pulled out of the `createServerFn` wrapper so integration tests can
 * exercise the full auth + parse + delegate path without booting the
 * TanStack Start server runtime — `@tanstack/react-start@>=1.168`'s
 * `getRequest()` is strict about `AsyncLocalStorage` context and refuses
 * programmatic invocation. See `savepoint-tanstack/CLAUDE.md` foot-gun #8.
 *
 * Accepts `userId | undefined` so the auth gate is the worker's own
 * responsibility — keeps the unauthorized-rejection branch reachable from
 * tests that don't go through `requireUserId()`.
 */
export async function updateProfileWorker(
  userId: string | undefined,
  data: unknown,
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
