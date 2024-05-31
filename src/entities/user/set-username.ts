"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/src/shared/api";
import { commonErrorHandler } from "@/src/shared/lib/error-handlers";

export async function setUserName(payload: Prisma.UserUpdateInput) {
  try {
    if (!payload || !payload.id) {
      commonErrorHandler("No user id provided");
      return;
    }
    await db.user.update({
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
  revalidatePath("/dashboard");
}
