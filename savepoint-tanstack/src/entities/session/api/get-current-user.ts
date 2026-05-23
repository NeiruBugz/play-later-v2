import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { auth } from "@/shared/lib/auth/auth.server";
import { prisma } from "@/shared/lib/db.server";
import { createLogger } from "@/shared/lib/logger";

const log = createLogger({ scope: "get-current-user" });

export interface CurrentUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

/**
 * Returns the current session user (id/name/username/image) or null when
 * unauthenticated. Better Auth's session only carries id/name/email/image —
 * `username` lives on the User table, so we co-fetch it for use by display
 * surfaces (sidebar footer, etc.) that must avoid exposing the email.
 */
export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ user: CurrentUser | null }> => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      log.info({ authed: false }, "current user resolved");
      return { user: null };
    }

    const row = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true },
    });

    log.info(
      { authed: true, userId: session.user.id },
      "current user resolved"
    );
    return {
      user: {
        id: session.user.id,
        name: session.user.name ?? null,
        username: row?.username ?? null,
        image: session.user.image ?? null,
      },
    };
  }
);
