"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SignInSchema, type SignInInput } from "@/features/auth/schemas";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { auth } from "@/shared/lib/auth";

export async function signInAction(data: SignInInput) {
  const logger = createLogger({
    [LOGGER_CONTEXT.SERVER_ACTION]: "signInAction",
  });

  const validated = SignInSchema.safeParse(data);
  if (!validated.success) {
    logger.warn({ err: validated.error }, "Validation error during sign in");
    return {
      success: false as const,
      error: validated.error.issues[0]?.message ?? "Validation error",
    };
  }

  try {
    logger.info({ method: "credentials" }, "Signing in user");
    const result = await auth.api.signInEmail({
      body: {
        email: validated.data.email,
        password: validated.data.password,
      },
      headers: await headers(),
    });

    if (!result) {
      return {
        success: false as const,
        error: "Invalid email or password",
      };
    }

    logger.debug("Sign in successful, redirecting");
  } catch (error) {
    logger.warn({ err: error }, "Invalid credentials during sign in");
    return {
      success: false as const,
      error: "Invalid email or password",
    };
  }

  redirect("/dashboard");
}
