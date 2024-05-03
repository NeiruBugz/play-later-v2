"use server";

import { prisma } from "@/src/packages/prisma";
import { commonErrorHandler } from "@/src/packages/utils";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function setUserName(payload: Prisma.UserUpdateInput) {
  try {
    if (!payload || !payload.id) {
      commonErrorHandler("No user id provided");
      return;
    }
    await prisma.user.update({
      data: {
        username: payload.username,
      },
      where: {
        id: payload.id as string,
      },
    });
  } catch (error) {
    console.log(error);
  }
  revalidatePath("/");
  revalidatePath("/library");
  revalidatePath("/backlogs");
  revalidatePath("/wishlist");
}
