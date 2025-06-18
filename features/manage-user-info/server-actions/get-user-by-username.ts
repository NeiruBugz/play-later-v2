import { prisma } from "@/shared/lib/db";

export async function getUserByUsername(username: string) {
  try {
    return await prisma.user.findFirst({
      where: { username },
    });
  } catch (error) {
    console.error(error);
  }
}
