"use server";

import { signIn } from "@/auth";

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogleAction() {
  // Google is federated via Cognito Hosted UI
  await signIn("cognito", { redirectTo: "/dashboard" });
}
