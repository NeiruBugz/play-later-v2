"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerUserId } from "@/auth";
import { Game } from "@prisma/client";

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
  redirect("/library");
}
