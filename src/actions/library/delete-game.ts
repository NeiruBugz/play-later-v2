"use server";

import type { Game } from "@prisma/client";

import { getServerUserId } from "@/auth";
import { prisma } from "@/src/packages/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  redirect("/library");
}
