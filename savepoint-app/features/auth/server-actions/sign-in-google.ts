"use server";

import { signIn } from "@/auth";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogleAction() {
  // Google is federated via Cognito Hosted UI
  const logger = createLogger({
    [LOGGER_CONTEXT.SERVER_ACTION]: "signInWithGoogleAction",
  });
  logger.info({ method: "cognito" }, "Starting Google sign in");
  await signIn("cognito", { redirectTo: "/dashboard" });
}
