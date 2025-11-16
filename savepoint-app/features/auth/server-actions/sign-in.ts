"use server";

import { signIn } from "@/auth";
import { z } from "zod";

import { SignInFormData, signInSchema } from "@/features/auth/lib/types";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import {
  isAuthenticationError,
  isNextAuthRedirect,
} from "@/shared/lib/auth/handle-next-auth-error";

export async function signInAction(data: SignInFormData) {
  const logger = createLogger({
    [LOGGER_CONTEXT.SERVER_ACTION]: "signInAction",
  });
  try {
    const validatedData = signInSchema.parse(data);

    logger.info({ method: "credentials" }, "Signing in user");
    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirectTo: "/dashboard",
    });

    return {
      success: true as const,
      message: "Signed in successfully",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn({ err: error }, "Validation error during sign in");
      return {
        success: false as const,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }

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
