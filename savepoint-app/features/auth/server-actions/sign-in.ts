"use server";

import { signIn } from "@/auth";

import { SignInSchema, type SignInInput } from "@/features/auth/schemas";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import {
  isAuthenticationError,
  isNextAuthRedirect,
} from "@/shared/lib/auth/handle-next-auth-error";

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
    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirectTo: "/dashboard",
    });
    return {
      success: true as const,
      message: "Signed in successfully",
    };
  } catch (error) {
    if (isNextAuthRedirect(error)) {
      logger.debug("Redirecting after successful sign in");
      throw error;
    }
    if (isAuthenticationError(error)) {
      logger.warn({ err: error }, "Invalid credentials during sign in");
      return {
        success: false as const,
        error: "Invalid email or password",
      };
    }
    logger.error({ err: error }, "Unexpected error during sign in");
    throw error;
  }
}
