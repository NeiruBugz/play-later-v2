import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { getServerUserId } from "./get-session.server";

/**
 * Route-guard server fn for `beforeLoad` of guarded route groups.
 *
 * Throws a TanStack Router `redirect` to /login on missing session — distinct
 * from the {@link ./require-user-id.ts} handler helper, which throws
 * `UnauthorizedError` and is meant for use inside other server fn handlers.
 */
export const requireUserIdOrRedirectFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<{ userId: string }> => {
  const request = getRequest();
  const userId = await getServerUserId(request);

  if (!userId) {
    throw redirect({ to: "/login" });
  }

  return { userId };
});
