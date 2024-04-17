"use server";

import { revalidatePath } from "next/cache";
import { getServerUserId } from "@/auth";

import { prisma } from "@/lib/prisma";

import { getPlaythrough } from "@/app/(protected)/library/lib/actions/get-playthrough";

export const updatePlaythrough = async ({
  payload,
}: {
  payload: { id: string; label: string; startedAt: Date; finishedAt?: Date };
}) => {
  try {
    const session = await getServerUserId();

    if (!session) {
      throw new Error("");
    }

    const playthrough = await getPlaythrough({ id: payload.id });
    if (playthrough) {
      await prisma.playthrough.update({
        where: {
          id: payload.id,
        },
        data: {
          label: payload.label,
          startedAt: payload.startedAt,
          finishedAt: payload.finishedAt ? payload.finishedAt : undefined,
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
