import { getServerUserId } from "@/auth";
import { prisma } from "@/src/packages/prisma";
import { sessionErrorHandler } from "@/src/packages/utils";
import { Game } from "@prisma/client";

export const getPlaythroughList = async ({ id }: { id: Game["id"] }) => {
  try {
    const session = await getServerUserId();

    if (!session) {
      sessionErrorHandler();
      return;
    }

    return prisma.playthrough.findMany({
      orderBy: {
        startedAt: "desc",
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
