import { prisma } from "@/src/shared/api";

export async function updateUserName(payload: {
  id: string;
  username: string;
  steamProfileUrl?: string;
}) {
  try {
    await prisma.user.update({
      where: {
        id: payload.id,
      },
      data: {
        username: payload.username,
        steamProfileURL: payload.steamProfileUrl,
      },
    });
  } catch (e) {
    console.error(e);
  }
}
