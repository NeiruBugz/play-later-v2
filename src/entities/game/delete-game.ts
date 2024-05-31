"use server";

import type { Game } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerUserId } from "@/auth";
import { db } from "@/src/shared/api";

const LIBRARY_PATH = "/library";

export async function deleteGame(id: Game["id"]) {
  const userId = await getServerUserId();

  await db.game.update({
    data: {
      deletedAt: new Date(),
    },
    where: { id, userId },
  });

  revalidatePath(LIBRARY_PATH);
  redirect("/library");
}
