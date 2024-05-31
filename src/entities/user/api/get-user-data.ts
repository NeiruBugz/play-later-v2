import { getServerUserId } from "@/auth";

import { db } from "@/src/shared/api";
import { sessionErrorHandler } from "@/src/shared/lib/error-handlers";

export async function getUserData() {
  try {
    const session = await getServerUserId();

    if (!session) {
      sessionErrorHandler();
      return;
    }

    const user = await db.user.findUnique({
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
