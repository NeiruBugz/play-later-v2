import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { auth } from "@/shared/lib/auth/auth.server";

export interface CurrentUser {
  id: string;
  name: string | null;
  image: string | null;
}

/**
 * Returns the current session user (id/name/image only) or null when
 * unauthenticated. Used by the root route loader to render the app header
 * in either anonymous or authenticated mode.
 */
export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ user: CurrentUser | null }> => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return { user: null };
    }

    return {
      user: {
        id: session.user.id,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      },
    };
  }
);
