"use server";

import { signIn } from "@/auth";
import { AuthService } from "@/data-access-layer/services";
import z from "zod";

import { SignUpFormData, signUpSchema } from "@/features/auth/lib/types";

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

    return {
      success: true as const,
      message: result.data.message,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false as const,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }

    return {
      success: false as const,
      error: "An unexpected error occurred",
    };
  }
}
