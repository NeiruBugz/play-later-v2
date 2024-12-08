"use server";

import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";
import { sessionErrorHandler } from "@/src/shared/lib";

async function getIgnoredGames() {
  try {
    const userId = await getServerUserId();

    if (!userId) {
      sessionErrorHandler();
    }

    return await prisma.ignoredImportedGames.findMany({
      where: {
        userId,
      },
    });
  } catch (e) {
    console.error(e);
  }
}

export { getIgnoredGames };
