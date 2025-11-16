"use server";

import { signIn } from "@/auth";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

export async function signInWithGoogleAction() {
  const logger = createLogger({
    [LOGGER_CONTEXT.SERVER_ACTION]: "signInWithGoogleAction",
  });
  logger.info({ method: "cognito" }, "Starting Google sign in");
  await signIn("cognito", { redirectTo: "/dashboard" });
}
