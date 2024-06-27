import { prisma } from "@/src/shared/api";

export async function getUserInfo(userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error("No user with this id");
    }

    return user;
  } catch (error) {
    console.error(error);
  }
}
