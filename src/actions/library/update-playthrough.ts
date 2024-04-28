"use server";

import { getServerUserId } from "@/auth";
import { getPlaythrough } from "@/src/actions/library/get-playthrough";
import { prisma } from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";

export const updatePlaythrough = async ({
  payload,
}: {
  payload: { finishedAt?: Date; id: string; label: string; startedAt: Date };
}) => {
  try {
    const session = await getServerUserId();

    if (!session) {
      throw new Error("");
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
      throw new Error(`Couldn't find playthrough`);
    }
  } catch (e) {
    console.error(e);
  }
};
