"use server";

import { getServerUserId } from "@/auth";
import { getPlaythrough } from "@/src/actions/library/get-playthrough";
import { prisma } from "@/src/packages/prisma";
import { commonErrorHandler, sessionErrorHandler } from "@/src/packages/utils";
import { revalidatePath } from "next/cache";

export const updatePlaythrough = async ({
  payload,
}: {
  payload: { finishedAt?: Date; id: string; label: string; startedAt: Date };
}) => {
  try {
    const session = await getServerUserId();

    if (!session) {
      sessionErrorHandler();
      return;
    }

    const playthrough = await getPlaythrough({ id: payload.id });
    if (playthrough) {
      await prisma.playthrough.update({
        data: {
          finishedAt: payload.finishedAt ? payload.finishedAt : undefined,
          label: payload.label,
          startedAt: payload.startedAt,
        },
        where: {
          id: payload.id,
        },
      });
      revalidatePath(`/library/${playthrough.gameId}`);
    } else {
      commonErrorHandler("Playthrough not found");
      return;
    }
  } catch (e) {
    console.error(e);
  }
};
