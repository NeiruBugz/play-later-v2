"use server";

import { signIn } from "@/auth";
import { z } from "zod";

import { SignInFormData, signInSchema } from "@/features/auth/lib/types";

/**
 * Sign in with email and password using NextAuth
 */
export async function signInAction(data: SignInFormData) {
  try {
    // Validate input
    const validatedData = signInSchema.parse(data);

    // Sign in via NextAuth
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
      return {
        success: false as const,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }

    // NextAuth throws NEXT_REDIRECT on successful auth, catch other errors
    if (error instanceof Error && error.message !== "NEXT_REDIRECT") {
      return {
        success: false as const,
        error: "Invalid email or password",
      };
    }

    // Re-throw redirect errors
    throw error;
  }
}
