"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { createServerAction } from "@/shared/lib";

export const clearMigratedCookieAction = createServerAction({
  actionName: "clearMigratedCookieAction",
  schema: z.undefined(),
  requireAuth: false,
  handler: async () => {
    const store = await cookies();
    store.set("auth_migrated", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
    return { success: true, data: undefined };
  },
});
