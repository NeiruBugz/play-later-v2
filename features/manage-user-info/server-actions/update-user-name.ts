import { prisma } from "@/shared/lib/db";

export async function updateUserName(payload: {
  id: string;
  username?: string;
  steamProfileUrl?: string;
}) {
  try {
    const resultUser = await prisma.user.update({
      where: {
        id: payload.id,
      },
      data: {
        username: payload.username,
        steamProfileURL: payload.steamProfileUrl,
      },
    });

    if (!resultUser) {
      throw new Error("Could not update user");
    }

    return {
      success: true,
      message: "User updated",
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: "Could not update user",
    };
  }
}
