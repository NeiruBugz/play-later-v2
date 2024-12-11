"use server";

import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";
import { revalidatePath } from "next/cache";

async function addIgnoredGame(payload: { name: string }) {
  try {
    const userId = await getServerUserId();

    if (!userId) {
      throw new Error("User is not authorized");
    }

    await prisma.ignoredImportedGames.create({
      data: {
        name: payload.name,
        User: {
          connect: {
            id: userId,
          },
        },
      },
    });

    revalidatePath("/import/steam");
  } catch (e) {
    console.error(e);
  }
}

export { addIgnoredGame };
