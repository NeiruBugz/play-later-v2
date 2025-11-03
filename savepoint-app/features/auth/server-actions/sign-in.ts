"use server";

import { signIn } from "@/auth";
import { z } from "zod";

import { SignInFormData, signInSchema } from "@/features/auth/lib/types";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import {
  isAuthenticationError,
  isNextAuthRedirect,
} from "@/shared/lib/auth/handle-next-auth-error";

/**
 * Sign in with email and password using NextAuth
 */
export async function signInAction(data: SignInFormData) {
  const logger = createLogger({
    [LOGGER_CONTEXT.SERVER_ACTION]: "signInAction",
  });
  try {
    // Validate input
    const validatedData = signInSchema.parse(data);

    // Sign in via NextAuth
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

    // NextAuth throws NEXT_REDIRECT on successful auth - re-throw to allow redirect
    if (isNextAuthRedirect(error)) {
      logger.debug("Redirecting after successful sign in");
      throw error;
    }

    // Actual authentication failure
    if (isAuthenticationError(error)) {
      logger.warn({ err: error }, "Invalid credentials during sign in");
      return {
        success: false as const,
        error: "Invalid email or password",
      };
    }

    // Unexpected error type
    logger.error({ err: error }, "Unexpected error during sign in");
    throw error;
  }
}
