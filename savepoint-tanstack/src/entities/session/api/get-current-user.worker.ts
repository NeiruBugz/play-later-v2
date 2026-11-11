import { prisma } from "@/shared/lib/db.server";
import { createLogger } from "@/shared/lib/logger";

const log = createLogger({ scope: "get-current-user" });

export const DEFAULT_EVENING_MINUTES = 105;

export interface CurrentUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

export interface CurrentUserResult {
  user: CurrentUser | null;
  statusModelNoticePending: boolean;
  eveningMinutes: number;
}

export interface SessionUser {
  id: string;
  name: string | null;
  image?: string | null;
}

export async function getCurrentUserWorker(
  sessionUser: SessionUser | null
): Promise<CurrentUserResult> {
  if (!sessionUser) {
    log.info({ authed: false }, "current user resolved");
    return {
      user: null,
      statusModelNoticePending: false,
      eveningMinutes: DEFAULT_EVENING_MINUTES,
    };
  }

  const row = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      username: true,
      statusModelNoticePending: true,
      eveningMinutes: true,
    },
  });

  log.info({ authed: true, userId: sessionUser.id }, "current user resolved");
  return {
    user: {
      id: sessionUser.id,
      name: sessionUser.name ?? null,
      username: row?.username ?? null,
      image: sessionUser.image ?? null,
    },
    statusModelNoticePending: row?.statusModelNoticePending ?? false,
    eveningMinutes: row?.eveningMinutes ?? DEFAULT_EVENING_MINUTES,
  };
}
