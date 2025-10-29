"use server";

import { signIn } from "@/auth";

import { createLogger } from "@/shared/lib";

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogleAction() {
  // Google is federated via Cognito Hosted UI
  const logger = createLogger({ serverAction: "signInWithGoogleAction" });
  logger.info({ method: "cognito" }, "Starting Google sign in");
  await signIn("cognito", { redirectTo: "/dashboard" });
}
