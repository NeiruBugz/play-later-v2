"use server";

import { getServerUserId } from "@/auth";
import { prisma } from "@/src/packages/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });
    return user?.username || user?.name;
  } catch (error) {
    redirect("/");
  }
}

export async function getUserData() {
  try {
    const session = await getServerUserId();

    if (!session) {
      throw new Error("No session");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session,
      },
    });

    if (user) {
      return user as {
        email: string | undefined;
        id: string;
        name: string | undefined;
        username: string | undefined;
      };
    }

    return null;
  } catch (error) {
    console.log(error);
  }
}

export async function setUserName(payload: Prisma.UserUpdateInput) {
  try {
    if (!payload || !payload.id) {
      throw new Error("Empty payload");
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
