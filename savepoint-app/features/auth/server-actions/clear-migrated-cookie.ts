"use server";

import { cookies } from "next/headers";

export async function clearMigratedCookieAction(): Promise<void> {
  const store = await cookies();
  store.set("auth_migrated", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
}
