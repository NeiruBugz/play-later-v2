"use server";

import { revalidatePath } from "next/cache";

import { getServerUserId } from "@/auth";

import { db } from "@/src/shared/api";
import {
  commonErrorHandler,
  sessionErrorHandler,
} from "@/src/shared/lib/error-handlers";

import { getPlaythrough } from "./get-playthrough";

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
      await db.playthrough.update({
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
