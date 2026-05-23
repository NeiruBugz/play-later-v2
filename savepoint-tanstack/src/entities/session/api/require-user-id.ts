import { getRequest } from "@tanstack/react-start/server";

import { UnauthorizedError } from "@/shared/lib/errors";

import { getServerUserId } from "./get-session.server";

/**
 * Resolve the signed-in user inside a `createServerFn` handler.
 *
 * Reads the request from the TanStack Start server runtime, looks up the
 * Better Auth session, and throws `UnauthorizedError` if there is no user.
 * Authed feature handlers must use this helper — they must not call
 * `getServerUserId` directly. See {@link ./require-user-id-or-redirect.ts}
 * for the route-guard variant that redirects to /login instead of throwing.
 */
export async function requireUserId(): Promise<string> {
  const request = getRequest();
  const userId = await getServerUserId(request);

  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  return userId;
}
