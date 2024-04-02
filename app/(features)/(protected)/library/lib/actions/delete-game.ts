"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Game } from "@prisma/client";

import { getServerUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const LIBRARY_PATH = "/library";

export async function deleteGame(id: Game["id"]) {
  const userId = await getServerUserId();

  await prisma.game.update({
    data: {
      deletedAt: new Date(),
    },
    where: { id, userId },
  });

  revalidatePath(LIBRARY_PATH);
  redirect(LIBRARY_PATH);
}
