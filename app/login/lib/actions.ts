"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

import { GetUserData } from "@/app/(protected)/settings/actions/get-user-data";

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

export async function setUserName(payload: GetUserData | null | undefined) {
  try {
    if (!payload) {
      throw new Error("Empty payload");
    }
    await prisma.user.update({
      where: {
        id: payload.id,
      },
      data: {
        username: payload.username,
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
