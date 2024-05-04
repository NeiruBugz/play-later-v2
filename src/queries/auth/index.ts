import { getServerUserId } from "@/auth";
import { prisma } from "@/src/packages/prisma";
import { sessionErrorHandler } from "@/src/packages/utils";
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
      sessionErrorHandler();
      return;
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
