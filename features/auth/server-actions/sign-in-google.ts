"use server";

import { signIn } from "@/auth";

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogleAction() {
  await signIn("google", { redirectTo: "/dashboard" });
}
