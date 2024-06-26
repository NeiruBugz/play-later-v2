import type { Playthrough } from "@prisma/client";

import { getServerUserId } from "@/auth";
import { prisma } from "@/src/packages/prisma";
import { sessionErrorHandler } from "@/src/packages/utils";

export const getPlaythrough = async ({ id }: { id: Playthrough["id"] }) => {
  try {
    const session = await getServerUserId();

    if (!session) {
      sessionErrorHandler();
      return;
    }

    return prisma.playthrough.findUnique({
      where: {
        id,
        userId: session,
      },
    });
  } catch (e) {
    console.error(e);
  }
};
