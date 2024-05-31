import type { Playthrough } from "@prisma/client";

import { getServerUserId } from "@/auth";

import { db } from "@/src/shared/api";
import { sessionErrorHandler } from "@/src/shared/lib/error-handlers";

export const getPlaythrough = async ({ id }: { id: Playthrough["id"] }) => {
  try {
    const session = await getServerUserId();

    if (!session) {
      sessionErrorHandler();
      return;
    }

    return db.playthrough.findUnique({
      where: {
        id,
        userId: session,
      },
    });
  } catch (e) {
    console.error(e);
  }
};
