import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "./auth-server";

export const getServerUserId = async (): Promise<string | undefined> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return undefined;
    }
    return session.user.id;
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

export const requireServerUserId = cache(async () => {
  const userId = await getServerUserId();
  if (!userId) redirect("/login");
  return userId;
});

export const getOptionalServerUserId = cache(
  async (): Promise<string | null> => {
    const userId = await getServerUserId();
    return userId ?? null;
  }
);
