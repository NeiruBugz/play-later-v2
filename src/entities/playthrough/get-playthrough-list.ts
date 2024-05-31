import type { Game } from "@prisma/client";
import { getServerUserId } from "@/auth";

import { db } from "@/src/shared/api";
import { sessionErrorHandler } from "@/src/shared/lib/error-handlers";

export const getPlaythroughList = async ({ id }: { id: Game["id"] }) => {
  try {
    const session = await getServerUserId();

    if (!session) {
      sessionErrorHandler();
      return;
    }

    return db.playthrough.findMany({
      orderBy: {
        startedAt: "desc",
      },
      select: {
        id: true,
        label: true,
        platform: true,
      },
      where: {
        gameId: id,
        userId: session,
      },
    });
  } catch (e) {
    console.error(e);
  }
};
