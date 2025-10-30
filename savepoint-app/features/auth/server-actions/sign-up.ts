"use server";

import { signIn } from "@/auth";
import { AuthService } from "@/data-access-layer/services";
import z from "zod";

import { SignUpFormData, signUpSchema } from "@/features/auth/lib/types";
import { createLogger } from "@/shared/lib";

const logger = createLogger({ serverAction: "signUpAction" });

/**
 * Sign up a new user with email and password
 */
export async function signUpAction(data: SignUpFormData) {
  try {
    // Validate input
    const validatedData = signUpSchema.parse(data);

    // Create user via service
    const authService = new AuthService();
    const result = await authService.signUp(validatedData);

    if (!result.success) {
      logger.error({ err: result.error }, "Failed to sign up user");
      return {
        success: false as const,
        error: result.error,
      };
    }

    // Automatically sign in the user after successful registration
    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirectTo: "/dashboard",
    });
    logger.info({}, "User signed up successfully");

    return {
      success: true as const,
      message: result.data.message,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn({ err: error }, "Validation error during sign up");
      return {
        success: false as const,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }

    // NextAuth throws NEXT_REDIRECT on successful auth - this is expected behavior
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      logger.debug("Redirecting user to dashboard after successful sign up");
      throw error; // Re-throw to allow Next.js to handle the redirect
    }

    // Log actual unexpected errors
    logger.error({ err: error }, "Unexpected error occurred during sign up");
    return {
      success: false as const,
      error: "An unexpected error occurred",
    };
  }
}
