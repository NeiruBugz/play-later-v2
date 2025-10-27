import "server-only";

import { getServerUserId } from "@/auth";
import { redirect } from "next/navigation";
import { cache } from "react";

export const requireServerUserId = cache(async () => {
  const userId = await getServerUserId();
  if (!userId) redirect("/login");
  return userId;
});
