import "server-only";

import { getServerUserId } from "@/auth";
import { redirect } from "next/navigation";
import { cache } from "react";

export const requireServerUserId = cache(async () => {
  const userId = await getServerUserId();
  if (!userId) redirect("/login");
  return userId;
});

/**
 * Get the current user's ID without requiring authentication.
 * Returns null if user is not authenticated.
 * Use this for pages that support both authenticated and unauthenticated access.
 */
export const getOptionalServerUserId = cache(
  async (): Promise<string | null> => {
    const userId = await getServerUserId();
    return userId ?? null;
  }
);
