"use server";

import { redirect } from "next/navigation";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

export async function signInWithGoogleAction() {
  const logger = createLogger({
    [LOGGER_CONTEXT.SERVER_ACTION]: "signInWithGoogleAction",
  });
  logger.info({ method: "cognito" }, "Starting Google sign in");
  redirect("/api/auth/sign-in/social?provider=cognito&callbackURL=/dashboard");
}
