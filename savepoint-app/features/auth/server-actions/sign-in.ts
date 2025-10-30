"use server";

import { signIn } from "@/auth";
import { z } from "zod";

import { SignInFormData, signInSchema } from "@/features/auth/lib/types";
import { createLogger } from "@/shared/lib";

/**
 * Sign in with email and password using NextAuth
 */
export async function signInAction(data: SignInFormData) {
  const logger = createLogger({ serverAction: "signInAction" });
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

    // NextAuth throws NEXT_REDIRECT on successful auth, catch other errors
    if (error instanceof Error && error.message !== "NEXT_REDIRECT") {
      logger.warn({ err: error }, "Invalid credentials during sign in");
      return {
        success: false as const,
        error: "Invalid email or password",
      };
    }

    // Re-throw redirect errors
    logger.debug("Redirecting after successful sign in");
    throw error;
  }
}
